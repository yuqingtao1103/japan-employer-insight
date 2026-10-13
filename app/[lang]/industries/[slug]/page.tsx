import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompareButton } from "@/components/compare-button";
import { MetricValue } from "@/components/metric-value";
import { getIndustryBenchmark } from "@/lib/benchmarks";
import { fmt, localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { INDUSTRY_SLUGS, industryFromSlug } from "@/lib/industries";
import {
  INDUSTRY_METRICS,
  industryRows,
  sortRows,
  type SortDirection,
} from "@/lib/industry-data";
import { METRICS, type MetricKey } from "@/lib/metrics";
import { reportIssueUrl } from "@/lib/site";
import { pageAlternates } from "@/lib/seo";

const DEFAULT_SORT: MetricKey = "female_manager_ratio";

export async function generateStaticParams() {
  return Object.values(INDUSTRY_SLUGS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/industries/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const industry = industryFromSlug(slug);
  if (!industry) return {};
  const t = await getDictionary();
  return { title: t.industries[industry] ?? industry, alternates: await pageAlternates(`/industries/${slug}`) };
}

export default async function IndustryPage({ params, searchParams }: PageProps<"/[lang]/industries/[slug]">) {
  const locale = await getLocale();
  const t = await getDictionary();
  const industry = industryFromSlug((await params).slug);
  if (!industry) notFound();
  const rows = industryRows(industry);

  return (
    <div className="space-y-6">
      <Link href={localePath(locale, "/industries")} className="text-sm underline">
        {t.industryPages.back}
      </Link>
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.industries[industry] ?? industry}
          {locale !== "zh" && (
            <span className="ml-2 text-base font-normal text-black/50 dark:text-white/50">{industry}</span>
          )}
        </h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          {fmt(t.industryPages.pageIntro, { count: rows.length })}
        </p>
      </section>

      <Suspense fallback={<p className="text-sm text-black/60 dark:text-white/60">{t.common.loading}</p>}>
        <IndustryTable industry={industry} slug={(await params).slug} searchParams={searchParams} />
      </Suspense>

      <div className="space-y-1 text-xs text-black/60 dark:text-white/60">
        <p>{t.industryPages.note}</p>
        <p>
          <a
            href={reportIssueUrl({ path: localePath(locale, `/industries/${(await params).slug}`) })}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {t.company.reportError}
          </a>
        </p>
      </div>
    </div>
  );
}

async function IndustryTable({
  industry,
  slug,
  searchParams,
}: {
  industry: string;
  slug: string;
  searchParams: PageProps<"/[lang]/industries/[slug]">["searchParams"];
}) {
  const locale = await getLocale();
  const t = await getDictionary();
  const query = await searchParams;
  const sort = INDUSTRY_METRICS.includes(query.sort as MetricKey) ? (query.sort as MetricKey) : DEFAULT_SORT;
  const dir: SortDirection | undefined = query.dir === "asc" || query.dir === "desc" ? query.dir : undefined;
  const bestFirst: SortDirection = METRICS[sort].higherIsBetter === false ? "asc" : "desc";
  const currentDir = dir ?? bestFirst;
  const rows = sortRows(industryRows(industry), sort, currentDir);

  const sortHref = (key: MetricKey) => {
    const keyBestFirst: SortDirection = METRICS[key].higherIsBetter === false ? "asc" : "desc";
    const next = key === sort ? (currentDir === "asc" ? "desc" : "asc") : keyBestFirst;
    return localePath(locale, `/industries/${slug}?sort=${key}&dir=${next}`);
  };

  return (
    <div className="overflow-x-auto rounded-md border border-black/10 dark:border-white/15">
      <table className="w-full min-w-[52rem] text-sm">
        <thead>
          <tr className="border-b border-black/10 align-bottom dark:border-white/15">
            <th className="sticky left-0 bg-background px-3 py-2 text-left font-medium">
              {t.industryPages.company}
            </th>
            {INDUSTRY_METRICS.map((key) => (
              <th key={key} className="max-w-28 px-3 py-2 text-right font-medium">
                <Link
                  href={sortHref(key)}
                  scroll={false}
                  className="hover:underline"
                  title={
                    key === sort && currentDir === "desc"
                      ? t.industryPages.sortAscending
                      : t.industryPages.sortDescending
                  }
                >
                  {t.metrics[key].label}
                  {key === sort && <span className="ml-1">{currentDir === "desc" ? "▼" : "▲"}</span>}
                </Link>
              </th>
            ))}
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-black/10 bg-black/[.03] text-black/70 dark:border-white/15 dark:bg-white/[.04] dark:text-white/70">
            <td className="sticky left-0 bg-inherit px-3 py-2 font-medium">{t.industryPages.medianRow}</td>
            {INDUSTRY_METRICS.map((key) => {
              const benchmark = getIndustryBenchmark(industry, key);
              return (
                <td key={key} className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                  {benchmark ? METRICS[key].format(benchmark.median, t.units) : "—"}
                </td>
              );
            })}
            <td />
          </tr>
          {rows.map((row, i) => {
            const displayName = row.nameEn || row.name;
            return (
              <tr key={row.code} className="border-b border-black/5 last:border-0 dark:border-white/10">
                <td className="sticky left-0 bg-background px-3 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="w-6 shrink-0 text-right text-xs tabular-nums text-black/40 dark:text-white/40">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <Link
                        href={localePath(locale, `/company/${row.code}`)}
                        className="font-medium hover:underline"
                      >
                        {displayName}
                      </Link>
                      {row.nameEn && (
                        <span className="block text-xs text-black/50 dark:text-white/50">{row.name}</span>
                      )}
                    </span>
                  </div>
                </td>
                {INDUSTRY_METRICS.map((key) => (
                  <td key={key} className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                    <MetricValue metric={key} value={row.values[key]} hideSource />
                  </td>
                ))}
                <td className="px-3 py-2 text-right">
                  <CompareButton code={row.code} name={displayName} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
