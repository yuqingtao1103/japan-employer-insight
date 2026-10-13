import { describe, expect, it } from "vitest";
import type { FinancialYear } from "@/lib/edinetdb";
import { buildProfile, isPlausible, latestWorkplaceYear } from "@/lib/metrics";
import type { MhlwRecord } from "@/lib/mhlw";

const rows: FinancialYear[] = [
  { fiscal_year: 2023, doc_id: "D2023", revenue: 100, avg_annual_salary: 8_000_000 },
  { fiscal_year: 2024, doc_id: "D2024", revenue: 110, female_manager_ratio: 0.1 },
  { fiscal_year: 2025, doc_id: "D2025", revenue: 120, female_manager_ratio: 0.12 },
  {
    fiscal_year: 2026,
    doc_id: "D2026",
    revenue: 133.1,
    female_manager_ratio: 0.15,
    gender_pay_gap_all: 0.29, // reported as a gap, not a ratio
    avg_annual_salary: 9_000_000,
  },
];

const mhlw: MhlwRecord = {
  maleParentalLeave: 0.8,
  femaleManagers: 0.2,
  payAll: 0.68,
  overtimeHours: 12,
  payPeriod: "2025-04/2026-03",
  telework: true,
};

describe("isPlausible", () => {
  it("flags values outside each metric's range", () => {
    expect(isPlausible("female_manager_ratio", 0.5)).toBe(true);
    expect(isPlausible("female_manager_ratio", 1.2)).toBe(false);
    expect(isPlausible("male_parental_leave_ratio", 1.5)).toBe(true); // can exceed 100%
    expect(isPlausible("male_parental_leave_ratio", 100)).toBe(false); // 10,000%
    expect(isPlausible("gender_pay_gap_all", 0.29)).toBe(false); // likely a gap
    expect(isPlausible("overtime_hours", 0)).toBe(false); // usually "not measured"
  });
});

describe("latestWorkplaceYear", () => {
  it("returns the latest year with any core workplace figure", () => {
    expect(latestWorkplaceYear(rows)?.fiscal_year).toBe(2026);
    expect(latestWorkplaceYear(rows.slice(0, 1))).toBeUndefined();
  });
});

describe("buildProfile", () => {
  it("uses the securities report when its value is plausible", () => {
    const profile = buildProfile(rows, mhlw);
    expect(profile.values.female_manager_ratio).toEqual({
      value: 0.15,
      source: "edinet",
      fiscalYear: 2026,
      docId: "D2026",
    });
  });

  it("fills a missing value from MHLW data", () => {
    const profile = buildProfile(rows, mhlw);
    expect(profile.values.male_parental_leave_ratio).toMatchObject({ value: 0.8, source: "mhlw" });
    expect(profile.values.overtime_hours).toMatchObject({ value: 12, source: "mhlw" });
  });

  it("replaces an implausible value with MHLW data", () => {
    const profile = buildProfile(rows, mhlw);
    expect(profile.values.gender_pay_gap_all).toMatchObject({ value: 0.68, source: "mhlw" });
  });

  it("prefers a manual correction over MHLW data", () => {
    const profile = buildProfile(rows, mhlw, [
      { metric: "gender_pay_gap_all", value: 0.7074, fiscalYear: 2026, docId: "D2026" },
    ]);
    expect(profile.values.gender_pay_gap_all).toMatchObject({ value: 0.7074, corrected: true });
  });

  it("keeps an implausible value when nothing better exists, so it can be flagged", () => {
    const profile = buildProfile(rows, undefined);
    expect(profile.values.gender_pay_gap_all?.value).toBe(0.29);
  });

  it("leaves a value out entirely when no source has it", () => {
    const profile = buildProfile(rows, undefined);
    expect(profile.values.paid_leave_ratio).toBeUndefined();
    expect(profile.values.male_parental_leave_ratio).toBeUndefined();
  });

  it("uses the latest year that reports non-workplace fields", () => {
    const profile = buildProfile(rows, undefined);
    expect(profile.values.avg_annual_salary).toMatchObject({ value: 9_000_000, fiscalYear: 2026 });
  });

  it("computes average yearly revenue growth over 3 years", () => {
    const growth = buildProfile(rows, undefined).values.revenue_growth?.value;
    expect(growth).toBeCloseTo(0.1, 5); // 100 -> 133.1 is +10% a year
  });

  it("copies flexible work flags and notes whether MHLW data exists", () => {
    expect(buildProfile(rows, mhlw)).toMatchObject({ telework: true, hasMhlw: true });
    expect(buildProfile(rows, undefined).hasMhlw).toBe(false);
  });
});
