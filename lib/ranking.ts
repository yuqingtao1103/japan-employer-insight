import { isPlausible, METRICS, type EmployerProfile, type MetricKey, type SourcedValue } from "@/lib/metrics";

// Factors a visitor can weigh. `id` is used in the URL (?salary=3).
export const FACTORS: { id: string; metric: MetricKey; defaultWeight: Weight }[] = [
  { id: "salary", metric: "avg_annual_salary", defaultWeight: 2 },
  { id: "overtime", metric: "overtime_hours", defaultWeight: 2 },
  { id: "leave", metric: "paid_leave_ratio", defaultWeight: 2 },
  { id: "tenure", metric: "avg_tenure_years", defaultWeight: 1 },
  { id: "growth", metric: "revenue_growth", defaultWeight: 1 },
  { id: "managers", metric: "female_manager_ratio", defaultWeight: 1 },
  { id: "paternity", metric: "male_parental_leave_ratio", defaultWeight: 1 },
  { id: "paygap", metric: "gender_pay_gap_all", defaultWeight: 1 },
  { id: "board", metric: "female_director_ratio", defaultWeight: 0 },
];

export type Weight = 0 | 1 | 2 | 3;
export type Weights = Record<string, Weight>;


// A company needs data for at least this share of the total weight to be ranked.
export const MIN_COVERAGE = 0.6;

export function defaultWeights(): Weights {
  return Object.fromEntries(FACTORS.map((f) => [f.id, f.defaultWeight]));
}

export function parseWeights(params: Record<string, string | string[] | undefined>): Weights {
  const weights = defaultWeights();
  for (const factor of FACTORS) {
    const raw = params[factor.id];
    const value = Number(Array.isArray(raw) ? raw[0] : raw);
    if (raw !== undefined && [0, 1, 2, 3].includes(value)) weights[factor.id] = value as Weight;
  }
  return weights;
}

export function weightsQuery(weights: Weights): string {
  return new URLSearchParams(
    FACTORS.map((f) => [f.id, String(weights[f.id] ?? f.defaultWeight)]),
  ).toString();
}

export type FactorScore = {
  factorId: string;
  metric: MetricKey;
  weight: Weight;
  value?: SourcedValue;
  // 0–100: share of other ranked companies this one beats on the factor.
  percentile?: number;
};

export type RankedEmployer<T> = {
  item: T;
  score: number; // 0–100 weighted average of percentiles
  coverage: number; // share of total weight with data
  factors: FactorScore[];
};

// Percentile of each company's value among all plausible values (ties share
// the average position). Lower is better for factors like overtime.
function percentiles(values: (number | undefined)[], higherIsBetter: boolean): (number | undefined)[] {
  const present = values.filter((v): v is number => v !== undefined);
  if (present.length === 0) return values.map(() => undefined);
  if (present.length === 1) return values.map((v) => (v === undefined ? undefined : 50));
  return values.map((v) => {
    if (v === undefined) return undefined;
    const worse = present.filter((p) => (higherIsBetter ? p < v : p > v)).length;
    const ties = present.filter((p) => p === v).length - 1;
    return ((worse + ties / 2) / (present.length - 1)) * 100;
  });
}

export function rankEmployers<T>(
  items: { item: T; profile: EmployerProfile }[],
  weights: Weights,
): { ranked: RankedEmployer<T>[]; insufficient: RankedEmployer<T>[] } {
  const factorPercentiles = FACTORS.map((factor) => {
    const values = items.map(({ profile }) => {
      const v = profile.values[factor.metric];
      return v && isPlausible(factor.metric, v.value) ? v.value : undefined;
    });
    return percentiles(values, METRICS[factor.metric].higherIsBetter ?? true);
  });

  const totalWeight = FACTORS.reduce((sum, f) => sum + (weights[f.id] ?? 0), 0);

  const results = items.map(({ item, profile }, i): RankedEmployer<T> => {
    const factors = FACTORS.map((factor, f): FactorScore => ({
      factorId: factor.id,
      metric: factor.metric,
      weight: weights[factor.id] ?? 0,
      value: profile.values[factor.metric],
      percentile: factorPercentiles[f][i],
    }));
    const scored = factors.filter((f) => f.weight > 0 && f.percentile !== undefined);
    const usedWeight = scored.reduce((sum, f) => sum + f.weight, 0);
    const score = usedWeight ? scored.reduce((sum, f) => sum + f.weight * f.percentile!, 0) / usedWeight : 0;
    return { item, score, coverage: totalWeight ? usedWeight / totalWeight : 0, factors };
  });

  const byScore = (a: RankedEmployer<T>, b: RankedEmployer<T>) => b.score - a.score;
  return {
    ranked: results.filter((r) => r.coverage >= MIN_COVERAGE).sort(byScore),
    insufficient: results.filter((r) => r.coverage < MIN_COVERAGE).sort(byScore),
  };
}
