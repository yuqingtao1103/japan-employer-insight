import "server-only";
import { listedCompanies } from "@/lib/company-index";
import { isPlausible, METRICS, type MetricKey } from "@/lib/metrics";
import { getMhlwRecord } from "@/lib/mhlw";

// Industry medians for workplace metrics, computed from MHLW data of all
// listed companies in the same Tokyo Stock Exchange sector. No API requests.
// Medians are used instead of averages so a few extreme values (e.g. a
// 10,000% parental leave rate) don't distort the comparison.

export const BENCHMARK_METRICS: MetricKey[] = [
  "female_manager_ratio",
  "male_parental_leave_ratio",
  "gender_pay_gap_all",
  "female_director_ratio",
  "overtime_hours",
  "paid_leave_ratio",
];

// Below this many companies, a median says little about the industry.
export const MIN_BENCHMARK_COUNT = 5;

export type Benchmark = { median: number; count: number };

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const BENCHMARKS = (() => {
  const values = new Map<string, Map<MetricKey, number[]>>();
  for (const { industry, corporateNumber } of listedCompanies()) {
    const record = getMhlwRecord(corporateNumber);
    if (!record || !industry) continue;
    for (const key of BENCHMARK_METRICS) {
      const field = METRICS[key].mhlw;
      const value = field ? record[field] : undefined;
      if (value == null || !isPlausible(key, value)) continue;
      if (!values.has(industry)) values.set(industry, new Map());
      const list = values.get(industry)!.get(key) ?? [];
      list.push(value);
      values.get(industry)!.set(key, list);
    }
  }
  const result = new Map<string, Map<MetricKey, Benchmark>>();
  for (const [industry, byMetric] of values) {
    const benchmarks = new Map<MetricKey, Benchmark>();
    for (const [key, list] of byMetric) {
      if (list.length >= MIN_BENCHMARK_COUNT) benchmarks.set(key, { median: median(list), count: list.length });
    }
    result.set(industry, benchmarks);
  }
  return result;
})();

export function getIndustryBenchmark(
  industry: string | null | undefined,
  metric: MetricKey,
): Benchmark | undefined {
  return industry ? BENCHMARKS.get(industry)?.get(metric) : undefined;
}
