import { fmt } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { isPlausible, METRICS, type MetricKey, type SourcedValue } from "@/lib/metrics";

// Renders a metric value, "—" when there is no data, a warning when the value
// falls outside the plausible range, and a small tag when it comes from MHLW
// data or was corrected by hand instead of coming straight from the
// securities report data.
export async function MetricValue({
  metric,
  value,
  emptyLabel = "—",
  hideSource = false,
}: {
  metric: MetricKey;
  value: SourcedValue | undefined;
  emptyLabel?: string;
  // For pages where every value has the same source and the note says so.
  hideSource?: boolean;
}) {
  const t = await getDictionary();
  if (!value) {
    return (
      <span className="text-black/40 dark:text-white/40" title={t.sources.noDataTitle}>
        {emptyLabel}
      </span>
    );
  }

  const formatted = METRICS[metric].format(value.value, t.units);
  const tag = hideSource ? null : value.source === "mhlw" ? (
    <SourceTag period={value.period} />
  ) : value.corrected ? (
    <CorrectedTag />
  ) : null;
  if (!isPlausible(metric, value.value)) {
    return (
      <span className="text-amber-700 dark:text-amber-400" title={t.sources.unusualTitle}>
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

export async function SourceTag({ period }: { period?: string }) {
  const t = await getDictionary();
  return (
    <sup
      className="ml-0.5 text-[0.6rem] font-normal text-sky-700 dark:text-sky-400"
      title={period ? fmt(t.sources.mhlwTitlePeriod, { period }) : t.sources.mhlwTitle}
    >
      {t.sources.mhlwTag}
    </sup>
  );
}

export async function CorrectedTag() {
  const t = await getDictionary();
  return (
    <sup
      className="ml-0.5 text-[0.6rem] font-normal text-violet-700 dark:text-violet-400"
      title={t.sources.checkedTitle}
    >
      {t.sources.checkedTag}
    </sup>
  );
}
