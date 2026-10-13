"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useI18n } from "@/components/i18n-provider";
import { compareHref, MAX_COMPARE } from "@/lib/compare";
import { useCompareList } from "@/lib/compare-store";
import { localePath } from "@/lib/i18n/config";
import { renderTemplate } from "@/lib/i18n/template";

// Shown on /compare without companies in the URL. If the visitor already
// picked companies, open the comparison for them.
export function EmptyCompare() {
  const { locale, t } = useI18n();
  const items = useCompareList();
  const router = useRouter();
  const href = items.length ? compareHref(locale, items.map((i) => i.code)) : null;

  useEffect(() => {
    if (href) router.replace(href);
  }, [href, router]);

  if (href) return null;

  return (
    <p className="text-sm text-black/70 dark:text-white/70">
      {renderTemplate(t.emptyCompare, {
        button: (
          <span className="rounded border border-black/20 px-1.5 text-xs dark:border-white/25">{t.compareAdd}</span>
        ),
        link: (
          <Link href={localePath(locale, "/")} className="underline">
            {t.emptyCompareLink}
          </Link>
        ),
        max: MAX_COMPARE,
      })}
    </p>
  );
}
