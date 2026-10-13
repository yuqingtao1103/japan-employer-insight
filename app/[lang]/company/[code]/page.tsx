import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BenchmarkLine } from "@/components/benchmark-line";
import { CompareButton } from "@/components/compare-button";
import { DataError } from "@/components/data-error";
import { MetricValue } from "@/components/metric-value";
import { WorkplaceBadges } from "@/components/workplace-badges";
import { getCorrections } from "@/lib/corrections";
import { edinetDocumentUrl, isEdinetCode } from "@/lib/edinet-code";
import { getCompanyInfo } from "@/lib/company-index";
import { getFinancials, type FinancialYear } from "@/lib/edinetdb";
import { fmt, localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import {
  buildProfile,
  CORE_METRICS,
  hasWorkplaceData,
  METRIC_GROUPS,
  METRICS,
  type EmployerProfile,
  type MetricKey,
} from "@/lib/metrics";
import { getMhlwRecord } from "@/lib/mhlw";

// Number of most recent fiscal years shown in the history table.
const YEARS_SHOWN = 3;

// Extra figures shown below the core three.
const MORE_METRICS: MetricKey[] = [
  "overtime_hours",
  "paid_leave_ratio",
  "avg_annual_salary",
  "avg_tenure_years",
  "revenue_growth",
  "female_director_ratio",
];

// Cache Components requires at least one prerendered param; other companies
// render on first visit and are then cached.
export async function generateStaticParams() {
  return [{ code: "E02144" }]; // Toyota Motor
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/company/[code]">): Promise<Metadata> {
  const { code } = await params;
  if (!isEdinetCode(code)) return {};
  try {
    const company = await getCompanyInfo(code);
    return company ? { title: company.name_en || company.name } : {};
  } catch {
    // The page itself shows the error (e.g. daily API limit); keep the default title.
    return {};
  }
}

export default async function CompanyPage({ params }: PageProps<"/[lang]/company/[code]">) {
  const locale = await getLocale();
  const t = await getDictionary();
  return (
    <div className="space-y-8">
      <Link href={localePath(locale, "/")} className="text-sm underline">
        {t.common.backToSearch}
      </Link>
      <Suspense fallback={<p className="text-sm text-black/60 dark:text-white/60">{t.common.loading}</p>}>
        <CompanyDetails params={params} />
      </Suspense>
    </div>
  );
}

async function CompanyDetails({ params }: Pick<PageProps<"/[lang]/company/[code]">, "params">) {
  const locale = await getLocale();
  const t = await getDictionary();
  const { code } = await params;
  if (!isEdinetCode(code)) notFound();

  let company, financials;
  try {
    [company, financials] = await Promise.all([getCompanyInfo(code), getFinancials(code)]);
  } catch (error) {
    return <DataError error={error} fallback={t.errors.company} />;
  }
  if (!company) notFound();

  const displayName = company.name_en || company.name;
  const profile = buildProfile(financials, getMhlwRecord(company.corporate_number), getCorrections(code));
  const hasCore = CORE_METRICS.some((key) => profile.values[key]);
  const filing = profile.latestFiling;
  const history = financials.filter(hasWorkplaceData).slice(-YEARS_SHOWN);
  const industry = company.industry ? (t.industries[company.industry] ?? company.industry) : null;

  return (
    <>
      <section className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {[company.name_ja, industry, company.sec_code && fmt(t.company.securitiesCode, { code: company.sec_code.slice(0, 4) })]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <CompareButton code={company.edinet_code} name={displayName} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {t.company.mandatoryTitle}{" "}
          {filing && hasWorkplaceData(filing) && (
            <span className="font-normal text-black/60 dark:text-white/60">
              ({fmt(t.common.fy, { year: filing.fiscal_year })})
            </span>
          )}
        </h2>
        {hasCore ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {CORE_METRICS.map((key) => (
              <MetricCard key={key} metric={key} profile={profile} industry={company.industry} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-black/70 dark:text-white/70">{t.company.noCoreData}</p>
        )}
        {filing?.doc_id && (
          <a
            href={edinetDocumentUrl(filing.doc_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm underline"
          >
            {fmt(t.company.viewReport, { year: filing.fiscal_year })}
          </a>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.company.moreTitle}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {MORE_METRICS.map((key) => (
            <MetricCard key={key} metric={key} profile={profile} industry={company.industry} small />
          ))}
        </div>
        <WorkplaceBadges profile={profile} />
      </section>

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t.company.historyTitle}</h2>
          <HistoryTable years={history} />
        </section>
      )}

      <div className="space-y-1 text-xs text-black/60 dark:text-white/60">
        <p>{t.company.scopeNote}</p>
        <p>{t.company.benchmarkNote}</p>
        <p>
          {t.sources.note}{" "}
          <Link href={localePath(locale, "/guide#sources")} className="underline">
            {t.common.learnMore}
          </Link>
        </p>
      </div>
    </>
  );
}

async function MetricCard({
  metric,
  profile,
  industry,
  small,
}: {
  metric: MetricKey;
  profile: EmployerProfile;
  industry: string | null | undefined;
  small?: boolean;
}) {
  const t = await getDictionary();
  const { label, help } = t.metrics[metric];
  return (
    <div className="rounded-md border border-black/10 p-4 dark:border-white/15">
      <div className="text-sm text-black/70 dark:text-white/70">{label}</div>
      <div className={`mt-1 font-semibold ${small ? "text-lg" : "text-2xl"}`}>
        <MetricValue metric={metric} value={profile.values[metric]} emptyLabel={t.common.noData} />
      </div>
      {help && <p className="mt-2 text-xs text-black/60 dark:text-white/60">{help}</p>}
      <BenchmarkLine metric={metric} value={profile.values[metric]} industry={industry} />
    </div>
  );
}

// Year-by-year figures from the securities reports only.
const HISTORY_METRICS = METRIC_GROUPS.flatMap((g) => g.keys).filter((key) => METRICS[key].edinet);

async function HistoryTable({ years }: { years: FinancialYear[] }) {
  const t = await getDictionary();
  return (
    <div className="overflow-x-auto rounded-md border border-black/10 dark:border-white/15">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 dark:border-white/15">
            <th className="px-3 py-2 text-left font-medium">{t.common.metric}</th>
            {years.map((y) => (
              <th key={y.fiscal_year} className="px-3 py-2 text-right font-medium">
                {y.doc_id ? (
                  <a
                    href={edinetDocumentUrl(y.doc_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    title={t.company.openFiling}
                  >
                    {fmt(t.common.fy, { year: y.fiscal_year })}
                  </a>
                ) : (
                  fmt(t.common.fy, { year: y.fiscal_year })
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HISTORY_METRICS.map((key) => (
            <tr key={key} className="border-b border-black/5 last:border-0 dark:border-white/10">
              <td className="px-3 py-2 text-black/80 dark:text-white/80">{t.metrics[key].label}</td>
              {years.map((y) => {
                const raw = y[METRICS[key].edinet!];
                return (
                  <td key={y.fiscal_year} className="px-3 py-2 text-right tabular-nums">
                    <MetricValue
                      metric={key}
                      value={raw != null ? { value: raw, source: "edinet", fiscalYear: y.fiscal_year } : undefined}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
