import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DataError } from "@/components/data-error";
import { EmptyCompare } from "@/components/empty-compare";
import { MetricValue } from "@/components/metric-value";
import { SyncCompareSelection } from "@/components/sync-compare-selection";
import { compareHref, MAX_COMPARE, parseCompareParam } from "@/lib/compare";
import { edinetDocumentUrl } from "@/lib/edinet-code";
import { getCompany, getFinancials, type CompanyDetail, type FinancialYear } from "@/lib/edinetdb";
import { ALL_METRICS, isPlausible, latestWorkplaceYear, METRICS, type MetricKey } from "@/lib/metrics";

export const metadata: Metadata = { title: "Compare employers" };

// Headcount differences are context, not something to rank.
const NO_HIGHLIGHT = new Set<MetricKey>(["num_employees"]);

type Column =
  | { code: string; ok: true; company: CompanyDetail; latest?: FinancialYear }
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
    return { code, ok: true, company, latest: latestWorkplaceYear(financials) };
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
            {ALL_METRICS.map((key) => {
              const extremes = findExtremes(key, columns);
              return (
                <tr key={key} className="border-b border-black/5 last:border-0 dark:border-white/10">
                  <td className="sticky left-0 bg-background px-3 py-2 text-black/80 dark:text-white/80">
                    {METRICS[key].label}
                  </td>
                  {columns.map((col) => (
                    <td key={col.code} className="px-3 py-2 text-right tabular-nums">
                      {col.ok ? (
                        <>
                          <MetricValue metric={key} value={col.latest?.[key]} />
                          {extremes?.high === col.code && <Marker kind="high" />}
                          {extremes?.low === col.code && <Marker kind="low" />}
                        </>
                      ) : (
                        <span className="text-black/40 dark:text-white/40">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 text-xs text-black/60 dark:text-white/60">
        <p>
          ▲ highest and ▼ lowest among the companies shown. Each company&apos;s
          most recent filing with workplace data is used, so fiscal years can
          differ. Values marked ⚠ are unusual (a possible data error or a
          different reporting format) and are not ranked.
        </p>
        <p>
          Workplace figures and average salary cover the filing company itself;
          employee count is for the whole group.
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

  const { company, latest } = column;
  return (
    <div className="space-y-1">
      <Link href={`/company/${company.edinet_code}`} className="font-medium hover:underline">
        {company.name_en || company.name}
      </Link>
      <div className="text-xs text-black/60 dark:text-white/60">{company.name_ja}</div>
      <div className="text-xs">
        {latest ? (
          latest.doc_id ? (
            <a
              href={edinetDocumentUrl(latest.doc_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              title="Open the source filing on EDINET"
            >
              FY{latest.fiscal_year} report ↗
            </a>
          ) : (
            `FY${latest.fiscal_year}`
          )
        ) : (
          <span className="text-black/50 dark:text-white/50">No workplace data</span>
        )}
      </div>
      {removeLink}
    </div>
  );
}

// Highest and lowest plausible values for a metric, when at least two
// companies report it and the values differ.
function findExtremes(key: MetricKey, columns: Column[]) {
  if (NO_HIGHLIGHT.has(key)) return null;
  const values = columns.flatMap((col) => {
    const value = col.ok ? col.latest?.[key] : undefined;
    return value != null && isPlausible(key, value) ? [{ code: col.code, value }] : [];
  });
  if (values.length < 2) return null;
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  if (low.value === high.value) return null;
  return { high: high.code, low: low.code };
}

function Marker({ kind }: { kind: "high" | "low" }) {
  return kind === "high" ? (
    <span className="ml-1 text-emerald-700 dark:text-emerald-400" title="Highest">
      ▲
    </span>
  ) : (
    <span className="ml-1 text-black/50 dark:text-white/50" title="Lowest">
      ▼
    </span>
  );
}
