import { describe, expect, it } from "vitest";
import { getIndustryBenchmark, MIN_BENCHMARK_COUNT } from "@/lib/benchmarks";

describe("getIndustryBenchmark", () => {
  it("returns a median and company count for large sectors", () => {
    const benchmark = getIndustryBenchmark("輸送用機器", "female_manager_ratio");
    expect(benchmark).toBeDefined();
    expect(benchmark!.count).toBeGreaterThanOrEqual(MIN_BENCHMARK_COUNT);
    expect(benchmark!.median).toBeGreaterThan(0);
    expect(benchmark!.median).toBeLessThan(1);
  });

  it("returns overtime medians in hours", () => {
    const benchmark = getIndustryBenchmark("建設業", "overtime_hours");
    expect(benchmark!.median).toBeGreaterThan(1);
    expect(benchmark!.median).toBeLessThan(100);
  });

  it("hides medians for sectors with too few companies", () => {
    expect(getIndustryBenchmark("空運業", "female_manager_ratio")).toBeUndefined();
  });

  it("has no median for unknown sectors or metrics without MHLW data", () => {
    expect(getIndustryBenchmark("存在しない業種", "female_manager_ratio")).toBeUndefined();
    expect(getIndustryBenchmark(null, "female_manager_ratio")).toBeUndefined();
    expect(getIndustryBenchmark("輸送用機器", "avg_annual_salary")).toBeUndefined();
  });
});
