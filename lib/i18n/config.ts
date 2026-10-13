// Supported UI languages. URLs are prefixed with the locale: /en/..., /zh/...
export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

// Value for <html lang>. Chinese is Simplified Chinese.
export const HTML_LANG: Record<Locale, string> = { en: "en", zh: "zh-Hans" };

// Remembers the visitor's language choice (set by the language switcher).
export const LOCALE_COOKIE = "jei-lang";

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

// Prefixes a path with the locale: localePath("zh", "/rank") -> "/zh/rank".
export function localePath(locale: Locale, path: string): string {
  return `/${locale}${path === "/" ? "" : path}`;
}

// Replaces {name} placeholders: fmt("Hi {name}", { name: "Yuqing" }).
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}
