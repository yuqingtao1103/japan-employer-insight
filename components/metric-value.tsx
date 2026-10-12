import { isPlausible, METRICS, type MetricKey } from "@/lib/metrics";

// Renders a metric value, "—" when not disclosed, or a warning when the value
// falls outside the plausible range.
export function MetricValue({
  metric,
  value,
  emptyLabel = "—",
}: {
  metric: MetricKey;
  value: number | null | undefined;
  emptyLabel?: string;
}) {
  const formatted = METRICS[metric].format(value);
  if (value == null || formatted == null) {
    return <span className="text-black/40 dark:text-white/40">{emptyLabel}</span>;
  }
  if (!isPlausible(metric, value)) {
    return (
      <span
        className="text-amber-700 dark:text-amber-400"
        title="Unusual value: it may be a data error or reported in a different format. Check the source filing."
      >
        {formatted} ⚠
      </span>
    );
  }
  return <>{formatted}</>;
}
