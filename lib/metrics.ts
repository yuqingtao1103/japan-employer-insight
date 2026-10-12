import type { FinancialYear } from "@/lib/edinetdb";
import { formatNumber, formatPercent, formatYen } from "@/lib/format";

export type MetricKey =
  | "female_manager_ratio"
  | "male_parental_leave_ratio"
  | "gender_pay_gap_all"
  | "gender_pay_gap_regular"
  | "gender_pay_gap_nonregular"
  | "female_director_ratio"
  | "avg_annual_salary"
  | "num_employees";

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
};

export const METRICS: Record<MetricKey, Metric> = {
  female_manager_ratio: {
    key: "female_manager_ratio",
    label: "Female managers",
    help: "Share of managers who are women.",
    format: formatPercent,
    plausible: [0, 1],
  },
  male_parental_leave_ratio: {
    key: "male_parental_leave_ratio",
    label: "Male parental leave uptake",
    help: "Men who took parental leave, relative to men whose child was born that year. Can exceed 100%.",
    format: formatPercent,
    plausible: [0, 5],
  },
  gender_pay_gap_all: {
    key: "gender_pay_gap_all",
    label: "Women's pay vs. men's",
    help: "Women's average pay as a share of men's, all employees. 100% means equal pay.",
    format: formatPercent,
    plausible: [0.35, 1.5],
  },
  gender_pay_gap_regular: {
    key: "gender_pay_gap_regular",
    label: "Women's pay vs. men's (regular)",
    format: formatPercent,
    plausible: [0.35, 1.5],
  },
  gender_pay_gap_nonregular: {
    key: "gender_pay_gap_nonregular",
    label: "Women's pay vs. men's (non-regular)",
    format: formatPercent,
    plausible: [0.35, 1.5],
  },
  female_director_ratio: {
    key: "female_director_ratio",
    label: "Female board members",
    format: formatPercent,
    plausible: [0, 1],
  },
  avg_annual_salary: {
    key: "avg_annual_salary",
    label: "Average annual salary",
    format: formatYen,
  },
  num_employees: {
    key: "num_employees",
    label: "Employees (group)",
    format: formatNumber,
  },
};

// The three figures every listed company with 301+ employees must disclose.
export const CORE_METRICS: MetricKey[] = [
  "female_manager_ratio",
  "male_parental_leave_ratio",
  "gender_pay_gap_all",
];

export const ALL_METRICS = Object.keys(METRICS) as MetricKey[];

export function isPlausible(key: MetricKey, value: number): boolean {
  const range = METRICS[key].plausible;
  return !range || (value >= range[0] && value <= range[1]);
}

export function hasWorkplaceData(row: FinancialYear): boolean {
  return CORE_METRICS.some((key) => row[key] != null);
}

// Most recent fiscal year that reports at least one core workplace metric.
export function latestWorkplaceYear(rows: FinancialYear[]): FinancialYear | undefined {
  return rows.filter(hasWorkplaceData).at(-1);
}
