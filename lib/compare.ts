import { isEdinetCode } from "@/lib/edinet-code";

export const MAX_COMPARE = 4;

export function compareHref(codes: string[]): string {
  return codes.length ? `/compare?c=${codes.join(",")}` : "/compare";
}

// Parses `?c=E02144,E01777` into at most MAX_COMPARE unique, valid codes.
export function parseCompareParam(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "");
  const codes = raw
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(isEdinetCode);
  return [...new Set(codes)].slice(0, MAX_COMPARE);
}
