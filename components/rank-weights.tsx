"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { METRICS } from "@/lib/metrics";
import { defaultWeights, FACTORS, WEIGHT_LABELS, weightsQuery, type Weight, type Weights } from "@/lib/ranking";

// Lets the visitor set how much each factor matters. Weights live in the URL
// so a ranking can be shared as a link.
export function RankWeights({ weights }: { weights: Weights }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function update(next: Weights) {
    startTransition(() => {
      router.replace(`/rank?${weightsQuery(next)}`, { scroll: false });
    });
  }

  return (
    <fieldset className="space-y-3 rounded-md border border-black/10 p-4 dark:border-white/15">
      <legend className="px-1 text-sm font-semibold">How much does each factor matter to you?</legend>
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {FACTORS.map((factor) => (
          <label key={factor.id} className="flex items-center justify-between gap-3 text-sm">
            <span title={METRICS[factor.metric].help}>{METRICS[factor.metric].label}</span>
            <select
              value={weights[factor.id]}
              onChange={(e) => update({ ...weights, [factor.id]: Number(e.target.value) as Weight })}
              className="rounded-md border border-black/20 bg-background px-2 py-1 text-sm dark:border-white/25"
            >
              {([0, 1, 2, 3] as Weight[]).map((w) => (
                <option key={w} value={w}>
                  {WEIGHT_LABELS[w]}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <button type="button" onClick={() => update(defaultWeights())} className="underline">
          Reset to defaults
        </button>
        {pending && <span className="text-black/60 dark:text-white/60">Updating…</span>}
      </div>
    </fieldset>
  );
}
