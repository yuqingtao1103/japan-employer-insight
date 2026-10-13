"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { ClientDictionary } from "@/lib/i18n/dictionaries/en";

// Gives client components the current locale and their UI strings.
const I18nContext = createContext<{ locale: Locale; t: ClientDictionary } | null>(null);

export function I18nProvider({
  locale,
  t,
  children,
}: {
  locale: Locale;
  t: ClientDictionary;
  children: ReactNode;
}) {
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
