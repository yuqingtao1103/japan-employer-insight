import "server-only";
import { listedCompanies } from "@/lib/company-index";
import { INDUSTRY_SLUGS } from "@/lib/industries";
import { isPlausible, METRICS, type MetricKey, type SourcedValue } from "@/lib/metrics";
import { getMhlwRecord, type MhlwRecord } from "@/lib/mhlw";

// Companies in one sector with their MHLW figures, for the industry pages.
// Uses only local data files, so it costs no API requests.

export const INDUSTRY_METRICS: MetricKey[] = [
  "female_manager_ratio",
  "male_parental_leave_ratio",
  "gender_pay_gap_all",
  "overtime_hours",
  "paid_leave_ratio",
];

export type IndustryRow = {
  code: string;
  name: string;
  nameEn: string;
  values: Partial<Record<MetricKey, SourcedValue>>;
  telework?: boolean;
  eruboshi?: MhlwRecord["eruboshi"];
  kurumin?: MhlwRecord["kurumin"];
};

function toRow(company: ReturnType<typeof listedCompanies>[number], record: MhlwRecord): IndustryRow {
  const values: IndustryRow["values"] = {};
  for (const key of INDUSTRY_METRICS) {
    const field = METRICS[key].mhlw;
    const value = field ? record[field] : undefined;
    if (value != null) values[key] = { value, source: "mhlw", period: record.payPeriod ?? record.dataAsOf };
  }
  return {
    code: company.code,
    name: company.name,
    nameEn: company.nameEn,
    values,
    telework: record.telework,
    eruboshi: record.eruboshi,
    kurumin: record.kurumin,
  };
}

const ROWS_BY_INDUSTRY = (() => {
  const byIndustry = new Map<string, IndustryRow[]>();
  for (const company of listedCompanies()) {
    if (!INDUSTRY_SLUGS[company.industry]) continue;
    const record = getMhlwRecord(company.corporateNumber);
    if (!record) continue;
    const row = toRow(company, record);
    if (Object.keys(row.values).length === 0) continue;
    byIndustry.set(company.industry, [...(byIndustry.get(company.industry) ?? []), row]);
  }
  return byIndustry;
})();

export function industryRows(industry: string): IndustryRow[] {
  return ROWS_BY_INDUSTRY.get(industry) ?? [];
}

export function industrySummaries(): { industry: string; slug: string; count: number }[] {
  return Object.entries(INDUSTRY_SLUGS)
    .map(([industry, slug]) => ({ industry, slug, count: industryRows(industry).length }))
    .sort((a, b) => b.count - a.count);
}

export type SortDirection = "asc" | "desc";

// Sorts by one metric, best first by default (lower is better for overtime).
// Missing and implausible values always go last.
export function sortRows(rows: IndustryRow[], key: MetricKey, direction?: SortDirection): IndustryRow[] {
  const dir = direction ?? (METRICS[key].higherIsBetter === false ? "asc" : "desc");
  const usable = (row: IndustryRow) => {
    const value = row.values[key]?.value;
    return value != null && isPlausible(key, value) ? value : undefined;
  };
  return [...rows].sort((a, b) => {
    const va = usable(a);
    const vb = usable(b);
    if (va === undefined && vb === undefined) return a.name.localeCompare(b.name, "ja");
    if (va === undefined) return 1;
    if (vb === undefined) return -1;
    return dir === "asc" ? va - vb : vb - va;
  });
}
