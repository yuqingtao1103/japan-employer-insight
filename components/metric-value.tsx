import { isPlausible, METRICS, type MetricKey, type SourcedValue } from "@/lib/metrics";

// Renders a metric value, "—" when there is no data, a warning when the value
// falls outside the plausible range, and a small tag when it comes from MHLW
// data or was corrected by hand instead of coming straight from the
// securities report data.
export function MetricValue({
  metric,
  value,
  emptyLabel = "—",
}: {
  metric: MetricKey;
  value: SourcedValue | undefined;
  emptyLabel?: string;
}) {
  const formatted = value ? METRICS[metric].format(value.value) : null;
  if (!value || formatted == null) {
    return (
      <span
        className="text-black/40 dark:text-white/40"
        title="No data found in the securities report or the MHLW database."
      >
        {emptyLabel}
      </span>
    );
  }

  const tag =
    value.source === "mhlw" ? (
      <SourceTag period={value.period} />
    ) : value.corrected ? (
      <CorrectedTag fiscalYear={value.fiscalYear} />
    ) : null;
  if (!isPlausible(metric, value.value)) {
    return (
      <span
        className="text-amber-700 dark:text-amber-400"
        title="Unusual value: it may be a data error or reported in a different format. Check the source filing."
      >
        {formatted} ⚠{tag}
      </span>
    );
  }
  return (
    <>
      {formatted}
      {tag}
    </>
  );
}

export function SourceTag({ period }: { period?: string }) {
  return (
    <sup
      className="ml-0.5 text-[0.6rem] font-normal text-sky-700 dark:text-sky-400"
      title={`From the MHLW women's advancement database${period ? ` (period ${period})` : ""}`}
    >
      MHLW
    </sup>
  );
}

export function CorrectedTag({ fiscalYear }: { fiscalYear?: number }) {
  return (
    <sup
      className="ml-0.5 text-[0.6rem] font-normal text-violet-700 dark:text-violet-400"
      title={`Read by hand from the${fiscalYear ? ` FY${fiscalYear}` : ""} securities report because the automated data was missing or wrong.`}
    >
      checked
    </sup>
  );
}
