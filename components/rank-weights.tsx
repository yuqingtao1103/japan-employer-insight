"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useI18n } from "@/components/i18n-provider";
import { localePath } from "@/lib/i18n/config";
import { defaultWeights, FACTORS, weightsQuery, type Weight, type Weights } from "@/lib/ranking";

// Lets the visitor set how much each factor matters. Weights live in the URL
// so a ranking can be shared as a link.
export function RankWeights({
  weights,
  labels,
}: {
  weights: Weights;
  labels: Record<string, { label: string; help: string }>;
}) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const weightLabels: Record<Weight, string> = { 0: t.weight0, 1: t.weight1, 2: t.weight2, 3: t.weight3 };

  function update(next: Weights) {
    startTransition(() => {
      router.replace(`${localePath(locale, "/rank")}?${weightsQuery(next)}`, { scroll: false });
    });
  }

  return (
    <fieldset className="space-y-3 rounded-md border border-black/10 p-4 dark:border-white/15">
      <legend className="px-1 text-sm font-semibold">{t.weightsLegend}</legend>
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {FACTORS.map((factor) => (
          <label key={factor.id} className="flex items-center justify-between gap-3 text-sm">
            <span title={labels[factor.id]?.help || undefined}>{labels[factor.id]?.label}</span>
            <select
              value={weights[factor.id]}
              onChange={(e) => update({ ...weights, [factor.id]: Number(e.target.value) as Weight })}
              className="rounded-md border border-black/20 bg-background px-2 py-1 text-sm dark:border-white/25"
            >
              {([0, 1, 2, 3] as Weight[]).map((w) => (
                <option key={w} value={w}>
                  {weightLabels[w]}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <button type="button" onClick={() => update(defaultWeights())} className="underline">
          {t.weightsReset}
        </button>
        {pending && <span className="text-black/60 dark:text-white/60">{t.weightsUpdating}</span>}
      </div>
    </fieldset>
  );
}
