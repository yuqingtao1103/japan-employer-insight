import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { CompareButton } from "@/components/compare-button";
import { DataError } from "@/components/data-error";
import { MetricValue } from "@/components/metric-value";
import { FEATURED_COMPANIES } from "@/lib/companies";
import { searchListedCompanies } from "@/lib/company-index";
import { fmt, localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { CORE_METRICS } from "@/lib/metrics";
import { getEmployerProfile } from "@/lib/profile";

const MAX_QUERY_LENGTH = 50;

export default async function Home({ searchParams }: PageProps<"/[lang]">) {
  const t = await getDictionary();
  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t.home.title}</h1>
        <p className="text-sm text-black/70 dark:text-white/70">{t.home.intro}</p>
      </section>

      <div className="space-y-4">
        <Suspense fallback={<SearchForm />}>
          <SearchSection searchParams={searchParams} />
        </Suspense>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.home.featuredTitle}</h2>
        <Suspense fallback={<p className="text-sm text-black/60 dark:text-white/60">{t.common.loading}</p>}>
          <FeaturedCompanies />
        </Suspense>
        <p className="text-xs text-black/60 dark:text-white/60">{t.home.featuredNote}</p>
      </section>
    </div>
  );
}

async function SearchSection({ searchParams }: Pick<PageProps<"/[lang]">, "searchParams">) {
  const t = await getDictionary();
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, MAX_QUERY_LENGTH);

  return (
    <>
      <SearchForm defaultValue={query} />
      {query && (
        <Suspense
          key={query}
          fallback={<p className="text-sm text-black/60 dark:text-white/60">{t.home.searching}</p>}
        >
          <SearchResults query={query} />
        </Suspense>
      )}
    </>
  );
}

async function SearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  const locale = await getLocale();
  const t = await getDictionary();
  return (
    <Form action={localePath(locale, "/")} className="flex gap-2">
      <input
        name="q"
        defaultValue={defaultValue}
        maxLength={MAX_QUERY_LENGTH}
        placeholder={t.home.searchPlaceholder}
        aria-label={t.home.searchLabel}
        className="min-w-0 flex-1 rounded-md border border-black/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/60 dark:border-white/25 dark:focus:border-white/60"
      />
      <button
        type="submit"
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        {t.home.searchButton}
      </button>
    </Form>
  );
}

async function SearchResults({ query }: { query: string }) {
  const locale = await getLocale();
  const t = await getDictionary();
  // Local search over the EDINET code list: no API requests.
  const results = searchListedCompanies(query);

  if (results.length === 0) {
    return <p className="text-sm text-black/70 dark:text-white/70">{fmt(t.home.noResults, { query })}</p>;
  }

  return (
    <ul className="divide-y divide-black/10 rounded-md border border-black/10 dark:divide-white/15 dark:border-white/15">
      {results.map((company) => {
        const displayName = company.name_en || company.name;
        const industry = company.industry ? (t.industries[company.industry] ?? company.industry) : null;
        return (
          <li key={company.edinet_code} className="flex items-center gap-3 pr-3">
            <Link
              href={localePath(locale, `/company/${company.edinet_code}`)}
              className="block min-w-0 flex-1 px-4 py-3 hover:bg-black/[.03] dark:hover:bg-white/[.06]"
            >
              <div className="font-medium">{displayName}</div>
              <div className="text-sm text-black/60 dark:text-white/60">
                {[company.name_ja, industry, company.is_delisted ? t.home.delisted : null]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </Link>
            <CompareButton code={company.edinet_code} name={displayName} />
          </li>
        );
      })}
    </ul>
  );
}

async function FeaturedCompanies() {
  const locale = await getLocale();
  const t = await getDictionary();
  const cards = await Promise.all(
    FEATURED_COMPANIES.map(async (company) => {
      try {
        return { company, profile: await getEmployerProfile(company.code, company.corporateNumber) };
      } catch (error) {
        return { company, profile: undefined, error };
      }
    }),
  );
  const failed = cards.find((card) => card.error !== undefined);

  return (
    <>
    {/* DataError also stops a page with missing cards from being cached as static. */}
    {failed && <DataError error={failed.error} fallback={t.errors.featured} />}
    <ul className="grid gap-3 sm:grid-cols-2">
      {cards.map(({ company, profile }) => (
        <li
          key={company.code}
          className="flex flex-col gap-3 rounded-md border border-black/10 p-4 dark:border-white/15"
        >
          <div className="flex items-start justify-between gap-3">
            <Link href={localePath(locale, `/company/${company.code}`)} className="hover:underline">
              <div className="font-medium">{company.name}</div>
              <div className="text-xs text-black/60 dark:text-white/60">
                {company.nameJa} · {t.industries[company.industry]}
                {profile?.latestFiling && ` · ${fmt(t.common.fy, { year: profile.latestFiling.fiscal_year })}`}
              </div>
            </Link>
            <CompareButton code={company.code} name={company.name} />
          </div>
          <dl className="grid grid-cols-3 gap-2 text-xs">
            {CORE_METRICS.map((key) => (
              <div key={key}>
                <dt className="text-black/60 dark:text-white/60">{t.metrics[key].label}</dt>
                <dd className="mt-0.5 text-base font-semibold tabular-nums">
                  <MetricValue metric={key} value={profile?.values[key]} />
                </dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
    </>
  );
}
