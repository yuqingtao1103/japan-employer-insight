import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { CompareButton } from "@/components/compare-button";
import { DataError } from "@/components/data-error";
import { MetricValue } from "@/components/metric-value";
import { FEATURED_COMPANIES } from "@/lib/companies";
import { searchCompanies } from "@/lib/edinetdb";
import { CORE_METRICS, METRICS } from "@/lib/metrics";
import { getEmployerProfile } from "@/lib/profile";

const MAX_QUERY_LENGTH = 50;

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Find a Japanese employer
        </h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          See the workplace figures listed companies must disclose in their
          annual securities reports: female manager ratio, male parental leave
          uptake, and the gender pay gap. Pick up to 4 companies to compare
          side by side.
        </p>
      </section>

      <div className="space-y-4">
        <Suspense fallback={<SearchForm />}>
          <SearchSection searchParams={searchParams} />
        </Suspense>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Featured employers</h2>
        <Suspense fallback={<p className="text-sm text-black/60 dark:text-white/60">Loading…</p>}>
          <FeaturedCompanies />
        </Suspense>
        <p className="text-xs text-black/60 dark:text-white/60">
          Latest fiscal year with workplace data. Figures tagged MHLW fill gaps
          in the securities report from the government&apos;s women&apos;s
          advancement database. ⚠ marks an unusual value: check the source.
        </p>
      </section>
    </div>
  );
}

async function SearchSection({
  searchParams,
}: Pick<PageProps<"/">, "searchParams">) {
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, MAX_QUERY_LENGTH);

  return (
    <>
      <SearchForm defaultValue={query} />
      {query && (
        <Suspense
          key={query}
          fallback={<p className="text-sm text-black/60 dark:text-white/60">Searching…</p>}
        >
          <SearchResults query={query} />
        </Suspense>
      )}
    </>
  );
}

function SearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <Form action="/" className="flex gap-2">
      <input
        name="q"
        defaultValue={defaultValue}
        maxLength={MAX_QUERY_LENGTH}
        placeholder="Company name, e.g. Toyota or トヨタ"
        aria-label="Company name"
        className="flex-1 rounded-md border border-black/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/60 dark:border-white/25 dark:focus:border-white/60"
      />
      <button
        type="submit"
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Search
      </button>
    </Form>
  );
}

async function SearchResults({ query }: { query: string }) {
  let results;
  try {
    results = await searchCompanies(query);
  } catch (error) {
    return <DataError error={error} fallback="Could not load search results. Please try again later." />;
  }

  if (results.length === 0) {
    return (
      <p className="text-sm text-black/70 dark:text-white/70">
        No listed companies found for “{query}”. Try the Japanese name or a
        shorter keyword.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-black/10 rounded-md border border-black/10 dark:divide-white/15 dark:border-white/15">
      {results.map((company) => {
        const displayName = company.name_en || company.name;
        return (
          <li key={company.edinet_code} className="flex items-center gap-3 pr-3">
            <Link
              href={`/company/${company.edinet_code}`}
              className="block flex-1 px-4 py-3 hover:bg-black/[.03] dark:hover:bg-white/[.06]"
            >
              <div className="font-medium">{displayName}</div>
              <div className="text-sm text-black/60 dark:text-white/60">
                {[company.name_ja, company.industry, company.is_delisted ? "Delisted" : null]
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
  const cards = await Promise.all(
    FEATURED_COMPANIES.map(async (company) => {
      try {
        return { company, profile: await getEmployerProfile(company.code, company.corporateNumber) };
      } catch {
        return { company, profile: undefined };
      }
    }),
  );

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {cards.map(({ company, profile }) => (
        <li
          key={company.code}
          className="flex flex-col gap-3 rounded-md border border-black/10 p-4 dark:border-white/15"
        >
          <div className="flex items-start justify-between gap-3">
            <Link href={`/company/${company.code}`} className="hover:underline">
              <div className="font-medium">{company.name}</div>
              <div className="text-xs text-black/60 dark:text-white/60">
                {company.nameJa} · {company.industry}
                {profile?.latestFiling && ` · FY${profile.latestFiling.fiscal_year}`}
              </div>
            </Link>
            <CompareButton code={company.code} name={company.name} />
          </div>
          <dl className="grid grid-cols-3 gap-2 text-xs">
            {CORE_METRICS.map((key) => (
              <div key={key}>
                <dt className="text-black/60 dark:text-white/60">{METRICS[key].label}</dt>
                <dd className="mt-0.5 text-base font-semibold tabular-nums">
                  <MetricValue metric={key} value={profile?.values[key]} />
                </dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  );
}
