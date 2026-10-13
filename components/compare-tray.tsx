"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { compareHref, MAX_COMPARE } from "@/lib/compare";
import { clearCompare, removeFromCompare, useCompareList } from "@/lib/compare-store";
import { fmt, localePath } from "@/lib/i18n/config";

// Bottom bar listing the companies picked for comparison.
export function CompareTray() {
  const { locale, t } = useI18n();
  const items = useCompareList();
  const pathname = usePathname();
  if (items.length === 0 || pathname === localePath(locale, "/compare")) return null;

  return (
    <>
      {/* Spacer so the fixed bar never covers the footer. */}
      <div aria-hidden className="h-24 sm:h-16" />
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-black/10 bg-background/95 backdrop-blur dark:border-white/15">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
          <span className="text-xs text-black/60 dark:text-white/60">
            {fmt(t.trayLabel, { count: items.length, max: MAX_COMPARE })}
          </span>
          {items.map((item) => (
            <span
              key={item.code}
              className="flex items-center gap-1 rounded-full border border-black/15 py-0.5 pl-3 pr-1 text-xs dark:border-white/20"
            >
              <span className="max-w-40 truncate">{item.name}</span>
              <button
                type="button"
                onClick={() => removeFromCompare(item.code)}
                aria-label={fmt(t.trayRemove, { name: item.name })}
                className="rounded-full px-1.5 hover:bg-black/10 dark:hover:bg-white/15"
              >
                ×
              </button>
            </span>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <button type="button" onClick={clearCompare} className="text-xs underline">
              {t.trayClear}
            </button>
            <Link
              href={compareHref(locale, items.map((i) => i.code))}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              {t.trayGo}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
