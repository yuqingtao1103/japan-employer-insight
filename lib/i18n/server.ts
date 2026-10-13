import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { en, type Dictionary } from "@/lib/i18n/dictionaries/en";
import { zh } from "@/lib/i18n/dictionaries/zh";

// Server-side access to the current locale (from the /[lang] URL segment)
// and its dictionary, without passing them through props.

const DICTIONARIES: Record<Locale, Dictionary> = { en, zh };

export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getDictionary(): Promise<Dictionary> {
  return DICTIONARIES[await getLocale()];
}
