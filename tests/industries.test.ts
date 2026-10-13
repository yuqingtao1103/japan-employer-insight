import { describe, expect, it } from "vitest";
import { listedCompanies } from "@/lib/company-index";
import { INDUSTRY_SLUGS, industryFromSlug, industrySlug } from "@/lib/industries";
import { industryRows, industrySummaries, sortRows, type IndustryRow } from "@/lib/industry-data";
import { en } from "@/lib/i18n/dictionaries/en";
import { zh } from "@/lib/i18n/dictionaries/zh";

const row = (code: string, values: Record<string, number>): IndustryRow => ({
  code,
  name: code,
  nameEn: code,
  values: Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, { value, source: "mhlw" as const }]),
  ),
});

describe("industry slugs", () => {
  it("cover every sector in the company list and round-trip", () => {
    const sectors = new Set(listedCompanies().map((c) => c.industry));
    sectors.delete("外国法人・組合"); // foreign companies have no TSE sector
    for (const sector of sectors) {
      const slug = industrySlug(sector);
      expect(slug, sector).toBeDefined();
      expect(industryFromSlug(slug!)).toBe(sector);
    }
    expect(Object.keys(INDUSTRY_SLUGS)).toHaveLength(33);
  });

  it("have translated names in both languages", () => {
    for (const sector of Object.keys(INDUSTRY_SLUGS)) {
      expect(en.industries[sector], sector).toBeTruthy();
      expect(zh.industries[sector], sector).toBeTruthy();
    }
  });
});

describe("industry data", () => {
  it("lists companies with MHLW figures for large sectors", () => {
    const rows = industryRows("情報・通信業");
    expect(rows.length).toBeGreaterThan(50);
    expect(rows.every((r) => Object.keys(r.values).length > 0)).toBe(true);
    expect(industrySummaries()[0].count).toBeGreaterThanOrEqual(rows.length);
  });

  it("returns no rows for unknown sectors", () => {
    expect(industryRows("存在しない業種")).toEqual([]);
  });
});

describe("sortRows", () => {
  const rows = [
    row("missing", {}),
    row("low", { female_manager_ratio: 0.05, overtime_hours: 30 }),
    row("high", { female_manager_ratio: 0.3, overtime_hours: 10 }),
    row("unusual", { female_manager_ratio: 1.5, overtime_hours: 0 }),
  ];

  it("puts the best values first by default", () => {
    expect(sortRows(rows, "female_manager_ratio").map((r) => r.code)).toEqual([
      "high",
      "low",
      "missing",
      "unusual",
    ]);
  });

  it("treats lower overtime as better", () => {
    expect(sortRows(rows, "overtime_hours").slice(0, 2).map((r) => r.code)).toEqual(["high", "low"]);
  });

  it("can reverse the order but keeps missing and unusual values last", () => {
    const codes = sortRows(rows, "female_manager_ratio", "asc").map((r) => r.code);
    expect(codes.slice(0, 2)).toEqual(["low", "high"]);
    expect(codes.slice(2).sort()).toEqual(["missing", "unusual"]);
  });
});
