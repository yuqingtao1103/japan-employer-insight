import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, Suspense } from "react";
import { DataError } from "@/components/data-error";
import { EmptyCompare } from "@/components/empty-compare";
import { CorrectedTag, MetricValue, SourceTag } from "@/components/metric-value";
import { SyncCompareSelection } from "@/components/sync-compare-selection";
import { WorkplaceBadges } from "@/components/workplace-badges";
import { compareHref, MAX_COMPARE, parseCompareParam } from "@/lib/compare";
import { edinetDocumentUrl } from "@/lib/edinet-code";
import { getCompany, getFinancials, type CompanyDetail } from "@/lib/edinetdb";
import {
  buildProfile,
  isPlausible,
  METRIC_GROUPS,
  METRICS,
  type EmployerProfile,
  type MetricKey,
} from "@/lib/metrics";
import { getCorrections } from "@/lib/corrections";
import { getMhlwRecord } from "@/lib/mhlw";

export const metadata: Metadata = { title: "Compare employers" };

type Column =
  | { code: string; ok: true; company: CompanyDetail; profile: EmployerProfile }
  | { code: string; ok: false; error: unknown };

export default function ComparePage({ searchParams }: PageProps<"/compare">) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Compare employers</h1>
      <Suspense fallback={<p className="text-sm text-black/60 dark:text-white/60">Loading…</p>}>
        <CompareContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function loadColumn(code: string): Promise<Column | null> {
  try {
    const [company, financials] = await Promise.all([getCompany(code), getFinancials(code)]);
    if (!company) return null;
    const profile = buildProfile(financials, getMhlwRecord(company.corporate_number), getCorrections(code));
    return { code, ok: true, company, profile };
  } catch (error) {
    return { code, ok: false, error };
  }
}

async function CompareContent({ searchParams }: Pick<PageProps<"/compare">, "searchParams">) {
  const codes = parseCompareParam((await searchParams).c);

  if (codes.length === 0) return <EmptyCompare />;

  const columns = (await Promise.all(codes.map(loadColumn))).filter((c): c is Column => c !== null);
  const loaded = columns.filter((c): c is Extract<Column, { ok: true }> => c.ok);

  return (
    <>
      <SyncCompareSelection
        items={loaded.map((c) => ({ code: c.code, name: c.company.name_en || c.company.name }))}
      />

      {columns.length < MAX_COMPARE && (
        <p className="text-sm text-black/70 dark:text-white/70">
          <Link href="/" className="underline">
            Add another company
          </Link>{" "}
          (up to {MAX_COMPARE}).
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-black/10 dark:border-white/15">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-black/10 align-top dark:border-white/15">
              <th className="sticky left-0 bg-background px-3 py-3 text-left font-medium">Metric</th>
              {columns.map((col) => (
                <th key={col.code} className="px-3 py-3 text-right font-normal">
                  <CompanyHeader column={col} remainingCodes={codes.filter((c) => c !== col.code)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_GROUPS.map((group) => (
              <Fragment key={group.title}>
                <tr className="border-b border-black/10 bg-black/[.03] dark:border-white/15 dark:bg-white/[.04]">
                  <th
                    colSpan={columns.length + 1}
                    className="sticky left-0 px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60"
                  >
                    {group.title}
                  </th>
                </tr>
                {group.keys.map((key) => {
                  const extremes = findExtremes(key, columns);
                  return (
                    <tr key={key} className="border-b border-black/5 dark:border-white/10">
                      <td className="sticky left-0 bg-background px-3 py-2 text-black/80 dark:text-white/80">
                        {METRICS[key].label}
                      </td>
                      {columns.map((col) => (
                        <td key={col.code} className="px-3 py-2 text-right tabular-nums">
                          {col.ok ? (
                            <>
                              <MetricValue metric={key} value={col.profile.values[key]} />
                              {extremes?.best === col.code && <Marker kind="best" />}
                              {extremes?.worst === col.code && <Marker kind="worst" />}
                            </>
                          ) : (
                            <span className="text-black/40 dark:text-white/40">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
            <tr>
              <td className="sticky left-0 bg-background px-3 py-2 align-top text-black/80 dark:text-white/80">
                Flexible work &amp; certifications
              </td>
              {columns.map((col) => (
                <td key={col.code} className="px-3 py-2 align-top">
                  {col.ok && <WorkplaceBadges profile={col.profile} />}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-1 text-xs text-black/60 dark:text-white/60">
        <p>
          ▲ best and ▼ weakest among the companies shown (for overtime, lower
          is better). Values marked ⚠ are unusual (a possible data error or a
          different reporting format) and are not ranked.
        </p>
        <p>
          Figures come from each company&apos;s latest securities report. Gaps
          are filled from the MHLW women&apos;s advancement database and tagged{" "}
          <SourceTag />, so periods can differ slightly. Figures tagged{" "}
          <CorrectedTag /> were read by hand from the securities report. Workplace figures and
          average salary cover the filing company itself; employee count and
          revenue are for the whole group.
        </p>
      </div>
    </>
  );
}

function CompanyHeader({ column, remainingCodes }: { column: Column; remainingCodes: string[] }) {
  const removeLink = (
    <Link href={compareHref(remainingCodes)} className="text-xs text-black/50 underline dark:text-white/50">
      Remove
    </Link>
  );

  if (!column.ok) {
    return (
      <div className="space-y-1">
        <div className="font-medium">{column.code}</div>
        <DataError error={column.error} fallback="Could not load data." />
        {removeLink}
      </div>
    );
  }

  const { company, profile } = column;
  const filing = profile.latestFiling;
  return (
    <div className="space-y-1">
      <Link href={`/company/${company.edinet_code}`} className="font-medium hover:underline">
        {company.name_en || company.name}
      </Link>
      <div className="text-xs text-black/60 dark:text-white/60">{company.name_ja}</div>
      <div className="text-xs">
        {filing ? (
          filing.doc_id ? (
            <a
              href={edinetDocumentUrl(filing.doc_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              title="Open the source filing on EDINET"
            >
              FY{filing.fiscal_year} report ↗
            </a>
          ) : (
            `FY${filing.fiscal_year}`
          )
        ) : (
          <span className="text-black/50 dark:text-white/50">No filing data</span>
        )}
      </div>
      {removeLink}
    </div>
  );
}

// Best and weakest plausible values for a metric, when at least two companies
// report it and the values differ.
function findExtremes(key: MetricKey, columns: Column[]) {
  const direction = METRICS[key].higherIsBetter;
  if (direction === undefined) return null;
  const values = columns.flatMap((col) => {
    const value = col.ok ? col.profile.values[key]?.value : undefined;
    return value != null && isPlausible(key, value) ? [{ code: col.code, value }] : [];
  });
  if (values.length < 2) return null;
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  if (low.value === high.value) return null;
  return direction ? { best: high.code, worst: low.code } : { best: low.code, worst: high.code };
}

function Marker({ kind }: { kind: "best" | "worst" }) {
  return kind === "best" ? (
    <span className="ml-1 text-emerald-700 dark:text-emerald-400" title="Best among companies shown">
      ▲
    </span>
  ) : (
    <span className="ml-1 text-black/50 dark:text-white/50" title="Weakest among companies shown">
      ▼
    </span>
  );
}
