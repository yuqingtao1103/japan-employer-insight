import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { DataError } from "@/components/data-error";
import { searchCompanies } from "@/lib/edinetdb";

const MAX_QUERY_LENGTH = 50;

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Find a Japanese employer
        </h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          See the workplace figures listed companies must disclose in their
          annual securities reports: female manager ratio, male parental leave
          uptake, and the gender pay gap.
        </p>
      </section>

      <Suspense fallback={<SearchForm />}>
        <SearchSection searchParams={searchParams} />
      </Suspense>
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
      {results.map((company) => (
        <li key={company.edinet_code}>
          <Link
            href={`/company/${company.edinet_code}`}
            className="block px-4 py-3 hover:bg-black/[.03] dark:hover:bg-white/[.06]"
          >
            <div className="font-medium">{company.name_en || company.name}</div>
            <div className="text-sm text-black/60 dark:text-white/60">
              {[company.name_ja, company.industry, company.is_delisted ? "Delisted" : null]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
