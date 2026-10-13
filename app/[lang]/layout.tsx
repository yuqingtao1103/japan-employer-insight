import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { CompareTray } from "@/components/compare-tray";
import { I18nProvider } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { fmt, HTML_LANG, LOCALES, localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { COMPANY_LIST_SOURCE } from "@/lib/company-index";
import { MHLW_SOURCE } from "@/lib/mhlw";
import { siteUrl } from "@/lib/site";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t.site.name, template: `%s | ${t.site.name}` },
    description: t.site.description,
    openGraph: { siteName: t.site.name, type: "website" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const t = await getDictionary();
  const other = locale === "en" ? "zh" : "en";

  return (
    <html
      lang={HTML_LANG[locale]}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale} t={t.client}>
          <header className="border-b border-black/10 dark:border-white/15">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4">
              <Link href={localePath(locale, "/")} className="font-semibold tracking-tight">
                {t.site.name}
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href={localePath(locale, "/")} className="hover:underline">
                  {t.nav.search}
                </Link>
                <Link href={localePath(locale, "/compare")} className="hover:underline">
                  {t.nav.compare}
                </Link>
                <Link href={localePath(locale, "/rank")} className="hover:underline">
                  {t.nav.rank}
                </Link>
                <Link href={localePath(locale, "/industries")} className="hover:underline">
                  {t.nav.industries}
                </Link>
                <Link href={localePath(locale, "/guide")} className="hover:underline">
                  {t.nav.guide}
                </Link>
                <Suspense>
                  <LanguageSwitcher
                    target={other}
                    label={t.nav.switchLanguage}
                    title={t.nav.switchLanguageLabel}
                  />
                </Suspense>
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>

          <footer className="border-t border-black/10 dark:border-white/15">
            <div className="mx-auto max-w-4xl space-y-2 px-4 py-6 text-xs text-black/60 dark:text-white/60">
              <p>
                {t.footer.poweredBy}{" "}
                <a
                  href="https://edinetdb.jp"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  EDINET DB
                </a>
                {t.footer.edinetSource}
              </p>
              <p>
                {t.footer.mhlwPrefix}{" "}
                <a
                  href={MHLW_SOURCE.url}
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {MHLW_SOURCE.name}
                </a>{" "}
                {fmt(t.footer.mhlwSuffix, { date: MHLW_SOURCE.asOf })}
              </p>
              <p>
                {t.footer.companyListPrefix}{" "}
                <a
                  href={COMPANY_LIST_SOURCE.url}
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {COMPANY_LIST_SOURCE.name}
                </a>{" "}
                {fmt(t.footer.companyListSuffix, { date: COMPANY_LIST_SOURCE.asOf ?? "" })}
              </p>
              <p>{t.footer.disclaimer}</p>
            </div>
          </footer>

          <Suspense>
            <CompareTray />
          </Suspense>
        </I18nProvider>
      </body>
    </html>
  );
}
