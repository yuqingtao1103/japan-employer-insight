"use client";

import { useEffect } from "react";
import { setCompare, type CompareItem } from "@/lib/compare-store";

// Makes the saved selection match the companies on the compare page,
// so opening a shared link lets the visitor keep editing that comparison.
export function SyncCompareSelection({ items }: { items: CompareItem[] }) {
  const key = items.map((i) => i.code).join(",");
  useEffect(() => {
    setCompare(items);
    // Only re-sync when the set of companies changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
