import type { FinancialYear } from "@/lib/edinetdb";
import { formatNumber, formatPercent, formatYen } from "@/lib/format";
import type { MhlwRecord } from "@/lib/mhlw";

export type MetricKey =
  | "female_manager_ratio"
  | "male_parental_leave_ratio"
  | "gender_pay_gap_all"
  | "gender_pay_gap_regular"
  | "gender_pay_gap_nonregular"
  | "female_director_ratio"
  | "overtime_hours"
  | "paid_leave_ratio"
  | "avg_annual_salary"
  | "avg_tenure_years"
  | "revenue_growth"
  | "num_employees";

type MhlwNumberKey = {
  [K in keyof MhlwRecord]-?: NonNullable<MhlwRecord[K]> extends number ? K : never;
}[keyof MhlwRecord];

type FinancialNumberKey = {
  [K in keyof FinancialYear]-?: NonNullable<FinancialYear[K]> extends number ? K : never;
}[keyof FinancialYear];

export type Metric = {
  key: MetricKey;
  label: string;
  help?: string;
  format: (value: number | null | undefined) => string | null;
  // Values outside this range are likely extraction errors (e.g. a parental
  // leave rate of 10,000%) or reported in a different format (e.g. Mercari
  // files the pay gap as a difference, 29%, rather than a ratio). They are
  // shown with a warning and excluded from highest/lowest comparisons.
  plausible?: [min: number, max: number];
  // Where the value comes from. When both are set, the securities report
  // (EDINET) is used first and MHLW data fills the gap if it is missing or
  // implausible.
  edinet?: FinancialNumberKey;
  mhlw?: MhlwNumberKey;
  // Used to mark highest/lowest and to score rankings. Omitted when a higher
  // value is neither better nor worse (e.g. headcount).
  higherIsBetter?: boolean;
};

const formatHours = (v: number | null | undefined) => (v == null ? null : `${v.toFixed(1)} h/month`);
const formatYears = (v: number | null | undefined) => (v == null ? null : `${v.toFixed(1)} years`);
const formatGrowth = (v: number | null | undefined) =>
  v == null ? null : `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}% / year`;

export const METRICS: Record<MetricKey, Metric> = {
  female_manager_ratio: {
    key: "female_manager_ratio",
    label: "Female managers",
    help: "Share of managers who are women.",
    format: formatPercent,
    plausible: [0, 1],
    edinet: "female_manager_ratio",
    mhlw: "femaleManagers",
    higherIsBetter: true,
  },
  male_parental_leave_ratio: {
    key: "male_parental_leave_ratio",
    label: "Male parental leave uptake",
    help: "Men who took parental leave, relative to men whose child was born that year. Can exceed 100%.",
    format: formatPercent,
    plausible: [0, 5],
    edinet: "male_parental_leave_ratio",
    mhlw: "maleParentalLeave",
    higherIsBetter: true,
  },
  gender_pay_gap_all: {
    key: "gender_pay_gap_all",
    label: "Women's pay vs. men's",
    help: "Women's average pay as a share of men's, all employees. 100% means equal pay.",
    format: formatPercent,
    plausible: [0.35, 1.5],
    edinet: "gender_pay_gap_all",
    mhlw: "payAll",
    higherIsBetter: true,
  },
  gender_pay_gap_regular: {
    key: "gender_pay_gap_regular",
    label: "Women's pay vs. men's (regular)",
    format: formatPercent,
    plausible: [0.35, 1.5],
    edinet: "gender_pay_gap_regular",
    mhlw: "payRegular",
    higherIsBetter: true,
  },
  gender_pay_gap_nonregular: {
    key: "gender_pay_gap_nonregular",
    label: "Women's pay vs. men's (non-regular)",
    format: formatPercent,
    plausible: [0.35, 1.5],
    edinet: "gender_pay_gap_nonregular",
    mhlw: "payNonregular",
    higherIsBetter: true,
  },
  female_director_ratio: {
    key: "female_director_ratio",
    label: "Female board members",
    format: formatPercent,
    plausible: [0, 1],
    edinet: "female_director_ratio",
    mhlw: "femaleBoard",
    higherIsBetter: true,
  },
  overtime_hours: {
    key: "overtime_hours",
    label: "Average overtime",
    help: "Average overtime per employee per month.",
    format: formatHours,
    plausible: [0, 150],
    mhlw: "overtimeHours",
    higherIsBetter: false,
  },
  paid_leave_ratio: {
    key: "paid_leave_ratio",
    label: "Paid leave taken",
    help: "Share of annual paid leave days that employees actually took.",
    format: formatPercent,
    plausible: [0, 1],
    mhlw: "paidLeave",
    higherIsBetter: true,
  },
  avg_annual_salary: {
    key: "avg_annual_salary",
    label: "Average annual salary",
    help: "Includes bonuses. Filing company only.",
    format: formatYen,
    edinet: "avg_annual_salary",
    higherIsBetter: true,
  },
  avg_tenure_years: {
    key: "avg_tenure_years",
    label: "Average tenure",
    help: "How long employees have stayed on average. A rough sign of retention.",
    format: formatYears,
    edinet: "avg_tenure_years",
    higherIsBetter: true,
  },
  revenue_growth: {
    key: "revenue_growth",
    label: "Revenue growth",
    help: "Average yearly revenue growth over the last 3 fiscal years (group).",
    format: formatGrowth,
    plausible: [-0.9, 3],
    higherIsBetter: true,
  },
  num_employees: {
    key: "num_employees",
    label: "Employees (group)",
    format: formatNumber,
    edinet: "num_employees",
  },
};

// The three figures every listed company with 301+ employees must disclose.
export const CORE_METRICS: MetricKey[] = [
  "female_manager_ratio",
  "male_parental_leave_ratio",
  "gender_pay_gap_all",
];

export const METRIC_GROUPS: { title: string; keys: MetricKey[] }[] = [
  {
    title: "Diversity",
    keys: [
      "female_manager_ratio",
      "male_parental_leave_ratio",
      "gender_pay_gap_all",
      "gender_pay_gap_regular",
      "gender_pay_gap_nonregular",
      "female_director_ratio",
    ],
  },
  { title: "Work-life balance", keys: ["overtime_hours", "paid_leave_ratio"] },
  { title: "Pay, retention and growth", keys: ["avg_annual_salary", "avg_tenure_years", "revenue_growth", "num_employees"] },
];

export function isPlausible(key: MetricKey, value: number): boolean {
  const range = METRICS[key].plausible;
  return !range || (value >= range[0] && value <= range[1]);
}

export function hasWorkplaceData(row: FinancialYear): boolean {
  return CORE_METRICS.some((key) => {
    const field = METRICS[key].edinet;
    return field != null && row[field] != null;
  });
}

// Most recent fiscal year that reports at least one core workplace metric.
export function latestWorkplaceYear(rows: FinancialYear[]): FinancialYear | undefined {
  return rows.filter(hasWorkplaceData).at(-1);
}

export type SourcedValue =
  // `corrected`: read by hand from the filing because the automated data was missing or wrong.
  | { value: number; source: "edinet"; fiscalYear: number; docId?: string; corrected?: boolean }
  | { value: number; source: "mhlw"; period?: string };

export type ManualCorrection = { metric: MetricKey; value: number; fiscalYear: number; docId: string };

export type EmployerProfile = {
  values: Partial<Record<MetricKey, SourcedValue>>;
  // Latest filing with workplace data, used for the FY label and source link.
  latestFiling?: FinancialYear;
  telework?: boolean;
  flextime?: boolean;
  eruboshi?: MhlwRecord["eruboshi"];
  kurumin?: MhlwRecord["kurumin"];
  hasMhlw: boolean;
};

// Average yearly growth between the latest revenue and the one 3 years earlier.
function revenueGrowth(rows: FinancialYear[]): SourcedValue | undefined {
  const withRevenue = rows.filter((r) => r.revenue != null && r.revenue > 0);
  const latest = withRevenue.at(-1);
  const base = withRevenue.find((r) => latest && r.fiscal_year === latest.fiscal_year - 3);
  if (!latest || !base) return undefined;
  const value = (latest.revenue! / base.revenue!) ** (1 / 3) - 1;
  return { value, source: "edinet", fiscalYear: latest.fiscal_year, docId: latest.doc_id };
}

// Combines the securities report figures with MHLW data, one value per metric.
// Order of preference: securities report (EDINET DB) > manual correction from
// the securities report > MHLW data > an implausible securities report value.
export function buildProfile(
  rows: FinancialYear[],
  mhlw: MhlwRecord | undefined,
  corrections: ManualCorrection[] = [],
): EmployerProfile {
  const latestFiling = latestWorkplaceYear(rows) ?? rows.at(-1);
  const values: EmployerProfile["values"] = {};

  for (const metric of Object.values(METRICS)) {
    let edinetValue: SourcedValue | undefined;
    if (metric.edinet) {
      const field = metric.edinet;
      // Workplace metrics come from the latest workplace filing so they share
      // one fiscal year; other fields use the latest year that reports them.
      const row = CORE_METRICS.includes(metric.key) || metric.mhlw
        ? latestFiling
        : rows.filter((r) => r[field] != null).at(-1);
      const value = row?.[field];
      if (row && value != null) {
        edinetValue = { value, source: "edinet", fiscalYear: row.fiscal_year, docId: row.doc_id };
      }
    }

    const mhlwRaw = metric.mhlw ? mhlw?.[metric.mhlw] : undefined;
    const mhlwValue: SourcedValue | undefined =
      mhlwRaw != null ? { value: mhlwRaw, source: "mhlw", period: mhlw?.payPeriod ?? mhlw?.dataAsOf } : undefined;

    const correction = corrections.find((c) => c.metric === metric.key);
    const correctedValue: SourcedValue | undefined = correction && {
      value: correction.value,
      source: "edinet",
      fiscalYear: correction.fiscalYear,
      docId: correction.docId,
      corrected: true,
    };

    const edinetOk = edinetValue && isPlausible(metric.key, edinetValue.value);
    const mhlwOk = mhlwValue && isPlausible(metric.key, mhlwValue.value);
    const chosen = edinetOk
      ? edinetValue
      : (correctedValue ?? (mhlwOk ? mhlwValue : (edinetValue ?? mhlwValue)));
    if (chosen) values[metric.key] = chosen;
  }

  const growth = revenueGrowth(rows);
  if (growth) values.revenue_growth = growth;

  return {
    values,
    latestFiling,
    telework: mhlw?.telework,
    flextime: mhlw?.flextime,
    eruboshi: mhlw?.eruboshi,
    kurumin: mhlw?.kurumin,
    hasMhlw: mhlw != null,
  };
}
