import { describe, expect, it } from "vitest";
import type { EmployerProfile, MetricKey } from "@/lib/metrics";
import { defaultWeights, MIN_COVERAGE, parseWeights, rankEmployers, weightsQuery, type Weights } from "@/lib/ranking";

function profile(values: Partial<Record<MetricKey, number>>): EmployerProfile {
  return {
    values: Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, { value, source: "edinet", fiscalYear: 2026 }]),
    ),
    hasMhlw: false,
  };
}

// Only the named factors count.
function only(weights: Partial<Weights>): Weights {
  return { ...Object.fromEntries(Object.keys(defaultWeights()).map((id) => [id, 0])), ...weights } as Weights;
}

describe("rankEmployers", () => {
  it("scores each factor by the share of other companies beaten", () => {
    const { ranked } = rankEmployers(
      [
        { item: "low", profile: profile({ avg_annual_salary: 5 }) },
        { item: "mid", profile: profile({ avg_annual_salary: 7 }) },
        { item: "high", profile: profile({ avg_annual_salary: 9 }) },
      ],
      only({ salary: 1 }),
    );
    expect(ranked.map((r) => [r.item, r.score])).toEqual([
      ["high", 100],
      ["mid", 50],
      ["low", 0],
    ]);
  });

  it("treats lower overtime as better", () => {
    const { ranked } = rankEmployers(
      [
        { item: "long hours", profile: profile({ overtime_hours: 30 }) },
        { item: "short hours", profile: profile({ overtime_hours: 10 }) },
      ],
      only({ overtime: 1 }),
    );
    expect(ranked[0].item).toBe("short hours");
  });

  it("skips missing data instead of counting it as zero", () => {
    const { ranked } = rankEmployers(
      [
        { item: "a", profile: profile({ avg_annual_salary: 9, overtime_hours: 30, paid_leave_ratio: 0.6 }) },
        { item: "b", profile: profile({ avg_annual_salary: 5, overtime_hours: 10, paid_leave_ratio: 0.7 }) },
        { item: "no overtime data", profile: profile({ avg_annual_salary: 10, paid_leave_ratio: 0.9 }) },
      ],
      only({ salary: 1, overtime: 1, leave: 1 }),
    );
    const partial = ranked.find((r) => r.item === "no overtime data")!;
    // Best salary and best paid leave; the missing overtime is not a zero.
    expect(partial.score).toBe(100);
    expect(partial.coverage).toBeCloseTo(2 / 3);
    expect(partial.factors.find((f) => f.factorId === "overtime")?.percentile).toBeUndefined();
    expect(ranked[0].item).toBe("no overtime data");
  });

  it("lists companies with too little data separately", () => {
    const { ranked, insufficient } = rankEmployers(
      [
        { item: "full", profile: profile({ avg_annual_salary: 9, overtime_hours: 10, paid_leave_ratio: 0.8 }) },
        { item: "sparse", profile: profile({ avg_annual_salary: 5 }) },
      ],
      only({ salary: 1, overtime: 1, leave: 1 }),
    );
    expect(MIN_COVERAGE).toBeGreaterThan(1 / 3);
    expect(ranked.map((r) => r.item)).toEqual(["full"]);
    expect(insufficient.map((r) => r.item)).toEqual(["sparse"]);
  });

  it("ignores implausible values", () => {
    const { ranked } = rankEmployers(
      [
        { item: "error", profile: profile({ male_parental_leave_ratio: 100 }) },
        { item: "real", profile: profile({ male_parental_leave_ratio: 0.8 }) },
      ],
      only({ paternity: 1 }),
    );
    expect(ranked.map((r) => r.item)).toEqual(["real"]);
  });

  it("weights factors by importance", () => {
    const items = [
      { item: "high salary", profile: profile({ avg_annual_salary: 9, overtime_hours: 30 }) },
      { item: "short hours", profile: profile({ avg_annual_salary: 5, overtime_hours: 10 }) },
    ];
    expect(rankEmployers(items, only({ salary: 3, overtime: 1 })).ranked[0].item).toBe("high salary");
    expect(rankEmployers(items, only({ salary: 1, overtime: 3 })).ranked[0].item).toBe("short hours");
  });
});

describe("weights in the URL", () => {
  it("keeps valid values and falls back to defaults for invalid ones", () => {
    const weights = parseWeights({ salary: "3", overtime: "9", leave: ["0", "2"], tenure: "abc" });
    expect(weights.salary).toBe(3);
    expect(weights.overtime).toBe(defaultWeights().overtime);
    expect(weights.leave).toBe(0);
    expect(weights.tenure).toBe(defaultWeights().tenure);
  });

  it("round-trips through the query string", () => {
    const weights = { ...defaultWeights(), salary: 3 as const, board: 2 as const };
    const params = Object.fromEntries(new URLSearchParams(weightsQuery(weights)));
    expect(parseWeights(params)).toEqual(weights);
  });
});
