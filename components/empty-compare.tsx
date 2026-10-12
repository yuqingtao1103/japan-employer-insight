"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { compareHref, MAX_COMPARE } from "@/lib/compare";
import { useCompareList } from "@/lib/compare-store";

// Shown on /compare without companies in the URL. If the visitor already
// picked companies, open the comparison for them.
export function EmptyCompare() {
  const items = useCompareList();
  const router = useRouter();
  const href = items.length ? compareHref(items.map((i) => i.code)) : null;

  useEffect(() => {
    if (href) router.replace(href);
  }, [href, router]);

  if (href) return null;

  return (
    <p className="text-sm text-black/70 dark:text-white/70">
      No companies selected yet. Use{" "}
      <span className="rounded border border-black/20 px-1.5 text-xs dark:border-white/25">+ Compare</span>{" "}
      on the{" "}
      <Link href="/" className="underline">
        search page
      </Link>{" "}
      to add up to {MAX_COMPARE} companies.
    </p>
  );
}
