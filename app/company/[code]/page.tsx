import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompareButton } from "@/components/compare-button";
import { DataError } from "@/components/data-error";
import { CorrectedTag, MetricValue, SourceTag } from "@/components/metric-value";
import { WorkplaceBadges } from "@/components/workplace-badges";
import { edinetDocumentUrl, isEdinetCode } from "@/lib/edinet-code";
import { getCompany, getFinancials, type FinancialYear } from "@/lib/edinetdb";
import {
  buildProfile,
  CORE_METRICS,
  hasWorkplaceData,
  METRIC_GROUPS,
  METRICS,
  type EmployerProfile,
  type MetricKey,
} from "@/lib/metrics";
import { getCorrections } from "@/lib/corrections";
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
}: PageProps<"/company/[code]">): Promise<Metadata> {
  const { code } = await params;
  if (!isEdinetCode(code)) return {};
  const company = await getCompany(code);
  return company ? { title: company.name_en || company.name } : {};
}

export default function CompanyPage({ params }: PageProps<"/company/[code]">) {
  return (
    <div className="space-y-8">
      <Link href="/" className="text-sm underline">
        ← Back to search
      </Link>
      <Suspense fallback={<p className="text-sm text-black/60 dark:text-white/60">Loading…</p>}>
        <CompanyDetails params={params} />
      </Suspense>
    </div>
  );
}

async function CompanyDetails({ params }: Pick<PageProps<"/company/[code]">, "params">) {
  const { code } = await params;
  if (!isEdinetCode(code)) notFound();

  let company, financials;
  try {
    [company, financials] = await Promise.all([getCompany(code), getFinancials(code)]);
  } catch (error) {
    return (
      <DataError error={error} fallback="Could not load this company's data. Please try again later." />
    );
  }
  if (!company) notFound();

  const displayName = company.name_en || company.name;
  const profile = buildProfile(financials, getMhlwRecord(company.corporate_number), getCorrections(code));
  const hasCore = CORE_METRICS.some((key) => profile.values[key]);
  const filing = profile.latestFiling;
  const history = financials.filter(hasWorkplaceData).slice(-YEARS_SHOWN);

  return (
    <>
      <section className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {[company.name_ja, company.industry, company.sec_code && `Securities code ${company.sec_code.slice(0, 4)}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <CompareButton code={company.edinet_code} name={displayName} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Mandatory disclosures{" "}
          {filing && hasWorkplaceData(filing) && (
            <span className="font-normal text-black/60 dark:text-white/60">(FY{filing.fiscal_year})</span>
          )}
        </h2>
        {hasCore ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {CORE_METRICS.map((key) => (
              <MetricCard key={key} metric={key} profile={profile} emptyLabel="No data" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-black/70 dark:text-white/70">
            No workplace diversity figures were found for this company.
            Companies with 300 or fewer employees are not required to disclose them.
          </p>
        )}
        {filing?.doc_id && (
          <a
            href={edinetDocumentUrl(filing.doc_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm underline"
          >
            View the FY{filing.fiscal_year} securities report on EDINET ↗
          </a>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Work-life balance, pay and growth</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {MORE_METRICS.map((key) => (
            <MetricCard key={key} metric={key} profile={profile} emptyLabel="No data" small />
          ))}
        </div>
        <WorkplaceBadges profile={profile} />
      </section>

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent years (securities reports)</h2>
          <HistoryTable years={history} />
        </section>
      )}

      <div className="space-y-1 text-xs text-black/60 dark:text-white/60">
        <p>
          FY = the fiscal year ending in that calendar year. Workplace figures
          and average salary cover the filing company itself; employee count
          and revenue are for the whole group.
        </p>
        <p>
          Figures come from the securities report first. When a figure is
          missing or looks wrong there, it is filled from the MHLW women&apos;s
          advancement database and tagged <SourceTag />. Figures tagged{" "}
          <CorrectedTag /> were read by hand from the securities report. ⚠
          marks an unusual value (a possible data error or a different
          reporting format).
        </p>
      </div>
    </>
  );
}

function MetricCard({
  metric,
  profile,
  emptyLabel,
  small,
}: {
  metric: MetricKey;
  profile: EmployerProfile;
  emptyLabel: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-md border border-black/10 p-4 dark:border-white/15">
      <div className="text-sm text-black/70 dark:text-white/70">{METRICS[metric].label}</div>
      <div className={`mt-1 font-semibold ${small ? "text-lg" : "text-2xl"}`}>
        <MetricValue metric={metric} value={profile.values[metric]} emptyLabel={emptyLabel} />
      </div>
      {METRICS[metric].help && (
        <p className="mt-2 text-xs text-black/60 dark:text-white/60">{METRICS[metric].help}</p>
      )}
    </div>
  );
}

// Year-by-year figures from the securities reports only.
const HISTORY_METRICS = METRIC_GROUPS.flatMap((g) => g.keys).filter((key) => METRICS[key].edinet);

function HistoryTable({ years }: { years: FinancialYear[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-black/10 dark:border-white/15">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/10 dark:border-white/15">
            <th className="px-3 py-2 text-left font-medium">Metric</th>
            {years.map((y) => (
              <th key={y.fiscal_year} className="px-3 py-2 text-right font-medium">
                {y.doc_id ? (
                  <a
                    href={edinetDocumentUrl(y.doc_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    title="Open the source filing on EDINET"
                  >
                    FY{y.fiscal_year}
                  </a>
                ) : (
                  `FY${y.fiscal_year}`
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HISTORY_METRICS.map((key) => (
            <tr key={key} className="border-b border-black/5 last:border-0 dark:border-white/10">
              <td className="px-3 py-2 text-black/80 dark:text-white/80">{METRICS[key].label}</td>
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
