import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DataError } from "@/components/data-error";
import {
  edinetDocumentUrl,
  getCompany,
  getFinancials,
  isEdinetCode,
  type FinancialYear,
} from "@/lib/edinetdb";
import { formatNumber, formatPercent, formatYen } from "@/lib/format";

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

const hasWorkplaceData = (row: FinancialYear) =>
  row.female_manager_ratio != null ||
  row.male_parental_leave_ratio != null ||
  row.gender_pay_gap_all != null;

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

  const years = financials.filter(hasWorkplaceData).slice(-YEARS_SHOWN);
  const latest = years.at(-1);

  return (
    <>
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {company.name_en || company.name}
        </h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          {[company.name_ja, company.industry, company.sec_code && `Securities code ${company.sec_code.slice(0, 4)}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </section>

      {!latest ? (
        <p className="text-sm text-black/70 dark:text-white/70">
          No workplace diversity figures were found in this company&apos;s
          available filings.
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
              <MetricCard
                label="Female managers"
                value={formatPercent(latest.female_manager_ratio)}
                help="Share of managers who are women."
              />
              <MetricCard
                label="Male parental leave uptake"
                value={formatPercent(latest.male_parental_leave_ratio)}
                help="Men who took parental leave, relative to men whose child was born that year. Can exceed 100%."
              />
              <MetricCard
                label="Women's pay vs. men's"
                value={formatPercent(latest.gender_pay_gap_all)}
                help="Women's average pay as a share of men's, all employees. 100% means equal pay."
              />
            </div>
            {latest.doc_id && (
              <SourceLink docId={latest.doc_id} fiscalYear={latest.fiscal_year} />
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Recent years</h2>
            <HistoryTable years={years} />
            <p className="text-xs text-black/60 dark:text-white/60">
              FY = the fiscal year ending in that calendar year. Workplace
              figures and average salary cover the filing company itself;
              employee count is for the whole group.
            </p>
          </section>
        </>
      )}
    </>
  );
}

function MetricCard({ label, value, help }: { label: string; value: string | null; help: string }) {
  return (
    <div className="rounded-md border border-black/10 p-4 dark:border-white/15">
      <div className="text-sm text-black/70 dark:text-white/70">{label}</div>
      <div className="mt-1 text-2xl font-semibold">
        {value ?? <span className="text-base font-normal text-black/50 dark:text-white/50">Not disclosed</span>}
      </div>
      <p className="mt-2 text-xs text-black/60 dark:text-white/60">{help}</p>
    </div>
  );
}

function SourceLink({ docId, fiscalYear }: { docId: string; fiscalYear: number }) {
  return (
    <a
      href={edinetDocumentUrl(docId)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block text-sm underline"
    >
      View the FY{fiscalYear} securities report on EDINET ↗
    </a>
  );
}

const HISTORY_ROWS: { label: string; render: (row: FinancialYear) => string | null }[] = [
  { label: "Female managers", render: (r) => formatPercent(r.female_manager_ratio) },
  { label: "Male parental leave uptake", render: (r) => formatPercent(r.male_parental_leave_ratio) },
  { label: "Women's pay vs. men's (all)", render: (r) => formatPercent(r.gender_pay_gap_all) },
  { label: "Women's pay vs. men's (regular)", render: (r) => formatPercent(r.gender_pay_gap_regular) },
  { label: "Women's pay vs. men's (non-regular)", render: (r) => formatPercent(r.gender_pay_gap_nonregular) },
  { label: "Female board members", render: (r) => formatPercent(r.female_director_ratio) },
  { label: "Average annual salary", render: (r) => formatYen(r.avg_annual_salary) },
  { label: "Employees (group)", render: (r) => formatNumber(r.num_employees) },
];

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
          {HISTORY_ROWS.map(({ label, render }) => (
            <tr key={label} className="border-b border-black/5 last:border-0 dark:border-white/10">
              <td className="px-3 py-2 text-black/80 dark:text-white/80">{label}</td>
              {years.map((y) => (
                <td key={y.fiscal_year} className="px-3 py-2 text-right tabular-nums">
                  {render(y) ?? <span className="text-black/40 dark:text-white/40">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
