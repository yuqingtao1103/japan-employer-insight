"use client";

import { MAX_COMPARE } from "@/lib/compare";
import { addToCompare, removeFromCompare, useCompareList } from "@/lib/compare-store";

export function CompareButton({ code, name }: { code: string; name: string }) {
  const items = useCompareList();
  const selected = items.some((i) => i.code === code);
  const full = !selected && items.length >= MAX_COMPARE;

  return (
    <button
      type="button"
      onClick={() => (selected ? removeFromCompare(code) : addToCompare({ code, name }))}
      disabled={full}
      title={full ? `You can compare up to ${MAX_COMPARE} companies` : undefined}
      aria-pressed={selected}
      className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-black/20 hover:border-black/60 dark:border-white/25 dark:hover:border-white/60"
      }`}
    >
      {selected ? "✓ Comparing" : "+ Compare"}
    </button>
  );
}
