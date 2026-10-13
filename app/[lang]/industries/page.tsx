import type { Metadata } from "next";
import Link from "next/link";
import { fmt, localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { industrySummaries } from "@/lib/industry-data";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getDictionary()).industryPages.metaTitle,
    alternates: await pageAlternates("/industries"),
  };
}

export default async function IndustriesPage() {
  const locale = await getLocale();
  const t = await getDictionary();
  const industries = industrySummaries().filter((i) => i.count > 0);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t.industryPages.title}</h1>
        <p className="text-sm text-black/70 dark:text-white/70">{t.industryPages.intro}</p>
      </section>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {industries.map(({ industry, slug, count }) => (
          <li key={slug}>
            <Link
              href={localePath(locale, `/industries/${slug}`)}
              className="flex items-baseline justify-between gap-3 rounded-md border border-black/10 px-4 py-3 hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.06]"
            >
              <span>
                <span className="font-medium">{t.industries[industry] ?? industry}</span>
                {locale !== "zh" && (
                  <span className="ml-2 text-xs text-black/50 dark:text-white/50">{industry}</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-black/60 dark:text-white/60">
                {fmt(t.industryPages.companiesWithData, { count })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
