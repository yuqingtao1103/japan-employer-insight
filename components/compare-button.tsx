"use client";

import { useI18n } from "@/components/i18n-provider";
import { MAX_COMPARE } from "@/lib/compare";
import { addToCompare, removeFromCompare, useCompareList } from "@/lib/compare-store";
import { fmt } from "@/lib/i18n/config";

export function CompareButton({ code, name }: { code: string; name: string }) {
  const { t } = useI18n();
  const items = useCompareList();
  const selected = items.some((i) => i.code === code);
  const full = !selected && items.length >= MAX_COMPARE;

  return (
    <button
      type="button"
      onClick={() => (selected ? removeFromCompare(code) : addToCompare({ code, name }))}
      disabled={full}
      title={full ? fmt(t.compareFull, { max: MAX_COMPARE }) : undefined}
      aria-pressed={selected}
      className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-black/20 hover:border-black/60 dark:border-white/25 dark:hover:border-white/60"
      }`}
    >
      {selected ? t.compareAdded : t.compareAdd}
    </button>
  );
}
