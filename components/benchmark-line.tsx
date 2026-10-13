import { getIndustryBenchmark } from "@/lib/benchmarks";
import { fmt } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { isPlausible, METRICS, type MetricKey, type SourcedValue } from "@/lib/metrics";

// "Transportation equipment median: 3.2% · 59 listed companies", plus how far
// the company is above or below it.
export async function BenchmarkLine({
  metric,
  value,
  industry,
}: {
  metric: MetricKey;
  value: SourcedValue | undefined;
  industry: string | null | undefined;
}) {
  const benchmark = getIndustryBenchmark(industry, metric);
  if (!benchmark || !industry) return null;
  const t = await getDictionary();

  const industryName = t.industries[industry] ?? industry;
  const medianText = METRICS[metric].format(benchmark.median, t.units);

  let comparison: { text: string; good?: boolean } | null = null;
  if (value && isPlausible(metric, value.value)) {
    const isHours = metric === "overtime_hours";
    const diff = isHours ? value.value - benchmark.median : (value.value - benchmark.median) * 100;
    const size = Math.abs(diff).toFixed(1);
    if (Number(size) === 0) {
      comparison = { text: t.company.benchmarkSame };
    } else {
      const amount = fmt(isHours ? t.units.hoursDiff : t.units.pointDiff, { value: size });
      const higherIsBetter = METRICS[metric].higherIsBetter;
      comparison = {
        text: fmt(diff > 0 ? t.company.benchmarkAbove : t.company.benchmarkBelow, { diff: amount }),
        good: higherIsBetter === undefined ? undefined : diff > 0 === higherIsBetter,
      };
    }
  }

  return (
    <div className="mt-2 space-y-0.5 border-t border-black/5 pt-2 text-xs dark:border-white/10">
      <div className="text-black/60 dark:text-white/60">
        {fmt(t.company.benchmarkMedian, { industry: industryName, value: medianText })}
        <span className="text-black/40 dark:text-white/40">
          {" · "}
          {fmt(t.company.benchmarkCount, { count: benchmark.count })}
        </span>
      </div>
      {comparison && (
        <div
          className={
            comparison.good === undefined
              ? "text-black/70 dark:text-white/70"
              : comparison.good
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-amber-700 dark:text-amber-400"
          }
        >
          {comparison.text}
        </div>
      )}
    </div>
  );
}
