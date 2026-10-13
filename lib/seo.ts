import type { Metadata } from "next";
import { DEFAULT_LOCALE, localePath } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";

// Canonical URL and language alternates (hreflang) for a page, so search
// engines treat /en/... and /zh/... as translations of each other.
// `path` is the page path without the locale, e.g. "/rank".
export function languageAlternates(path: string): Record<string, string> {
  return {
    en: localePath("en", path),
    "zh-Hans": localePath("zh", path),
    "x-default": localePath(DEFAULT_LOCALE, path),
  };
}

export async function pageAlternates(path: string): Promise<Metadata["alternates"]> {
  return { canonical: localePath(await getLocale(), path), languages: languageAlternates(path) };
}
