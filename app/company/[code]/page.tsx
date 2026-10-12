import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompareButton } from "@/components/compare-button";
import { DataError } from "@/components/data-error";
import { MetricValue } from "@/components/metric-value";
import { edinetDocumentUrl, isEdinetCode } from "@/lib/edinet-code";
import { getCompany, getFinancials, type FinancialYear } from "@/lib/edinetdb";
import { ALL_METRICS, CORE_METRICS, hasWorkplaceData, METRICS } from "@/lib/metrics";

// Number of most recent fiscal years shown in the history table.
const YEARS_SHOWN = 3;

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
  const years = financials.filter(hasWorkplaceData).slice(-YEARS_SHOWN);
  const latest = years.at(-1);

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

      {!latest ? (
        <p className="text-sm text-black/70 dark:text-white/70">
          No workplace diversity figures were found in this company&apos;s
          available filings. Companies with 300 or fewer employees are not
          required to disclose them.
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              Latest disclosure{" "}
              <span className="font-normal text-black/60 dark:text-white/60">
                (FY{latest.fiscal_year})
              </span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {CORE_METRICS.map((key) => (
                <div key={key} className="rounded-md border border-black/10 p-4 dark:border-white/15">
                  <div className="text-sm text-black/70 dark:text-white/70">{METRICS[key].label}</div>
                  <div className="mt-1 text-2xl font-semibold">
                    <MetricValue metric={key} value={latest[key]} emptyLabel="Not disclosed" />
                  </div>
                  <p className="mt-2 text-xs text-black/60 dark:text-white/60">{METRICS[key].help}</p>
                </div>
              ))}
            </div>
            {latest.doc_id && (
              <a
                href={edinetDocumentUrl(latest.doc_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm underline"
              >
                View the FY{latest.fiscal_year} securities report on EDINET ↗
              </a>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Recent years</h2>
            <HistoryTable years={years} />
            <p className="text-xs text-black/60 dark:text-white/60">
              FY = the fiscal year ending in that calendar year. Workplace
              figures and average salary cover the filing company itself;
              employee count is for the whole group. ⚠ marks an unusual value
              (a possible data error or a different reporting format): check
              the source filing.
            </p>
          </section>
        </>
      )}
    </>
  );
}

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
          {ALL_METRICS.map((key) => (
            <tr key={key} className="border-b border-black/5 last:border-0 dark:border-white/10">
              <td className="px-3 py-2 text-black/80 dark:text-white/80">{METRICS[key].label}</td>
              {years.map((y) => (
                <td key={y.fiscal_year} className="px-3 py-2 text-right tabular-nums">
                  <MetricValue metric={key} value={y[key]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
