import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CompareButton } from "@/components/compare-button";
import { MetricValue, SourceTag } from "@/components/metric-value";
import { RankWeights } from "@/components/rank-weights";
import { POOL_COMPANIES, type PoolCompany } from "@/lib/companies";
import { METRICS } from "@/lib/metrics";
import { getEmployerProfile } from "@/lib/profile";
import { MIN_COVERAGE, parseWeights, rankEmployers, WEIGHT_LABELS, type RankedEmployer } from "@/lib/ranking";

export const metadata: Metadata = { title: "Rank employers" };

export default function RankPage({ searchParams }: PageProps<"/rank">) {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Rank employers by what matters to you</h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          {POOL_COMPANIES.length} well-known employers across industries. For
          each factor, a company scores 0–100 by how many of the others it
          beats. The total is the average of those scores, weighted by what you
          choose below. Missing data is skipped, never counted as zero.
        </p>
      </section>
      <Suspense fallback={<p className="text-sm text-black/60 dark:text-white/60">Loading…</p>}>
        <RankContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RankContent({ searchParams }: Pick<PageProps<"/rank">, "searchParams">) {
  const weights = parseWeights(await searchParams);

  const loaded = await Promise.all(
    POOL_COMPANIES.map(async (company) => {
      try {
        return { item: company, profile: await getEmployerProfile(company.code, company.corporateNumber) };
      } catch {
        return null;
      }
    }),
  );
  const items = loaded.filter((x) => x !== null);
  const failed = POOL_COMPANIES.length - items.length;
  const { ranked, insufficient } = rankEmployers(items, weights);
  const noWeights = Object.values(weights).every((w) => w === 0);

  return (
    <>
      <RankWeights weights={weights} />

      {failed > 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          {failed} {failed === 1 ? "company" : "companies"} could not be loaded right now
          (the daily data limit may have been reached) and {failed === 1 ? "is" : "are"} not shown.
        </p>
      )}

      {noWeights ? (
        <p className="text-sm text-black/70 dark:text-white/70">Choose at least one factor to see a ranking.</p>
      ) : (
        <ol className="space-y-2">
          {ranked.map((entry, i) => (
            <RankRow key={entry.item.code} entry={entry} position={i + 1} />
          ))}
        </ol>
      )}

      {!noWeights && insufficient.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Not enough data to rank</h2>
          <p className="text-xs text-black/60 dark:text-white/60">
            These companies have data for less than {Math.round(MIN_COVERAGE * 100)}% of the
            factors you weighted.
          </p>
          <ul className="space-y-2">
            {insufficient.map((entry) => (
              <RankRow key={entry.item.code} entry={entry} />
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-black/60 dark:text-white/60">
        Scores are relative to the companies listed here, not to all employers
        in Japan. Overtime and paid leave come from the MHLW women&apos;s
        advancement database (tagged <SourceTag />); other figures come from the
        latest securities reports.
      </p>
    </>
  );
}

function RankRow({ entry, position }: { entry: RankedEmployer<PoolCompany>; position?: number }) {
  const company = entry.item;
  const weighted = entry.factors.filter((f) => f.weight > 0);
  const strengths = weighted
    .filter((f) => f.percentile !== undefined && f.percentile >= 75)
    .sort((a, b) => b.percentile! - a.percentile!)
    .slice(0, 3);

  return (
    <li className="rounded-md border border-black/10 dark:border-white/15">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
        <div className="w-8 shrink-0 text-center text-lg font-semibold tabular-nums text-black/60 dark:text-white/60">
          {position ?? "–"}
        </div>
        <div className="min-w-0 flex-1 basis-40">
          <Link href={`/company/${company.code}`} className="font-medium hover:underline">
            {company.name}
          </Link>
          <div className="text-xs text-black/60 dark:text-white/60">
            {company.nameJa} · {company.industry}
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-semibold tabular-nums">{Math.round(entry.score)}</div>
            <div className="text-[0.65rem] text-black/50 dark:text-white/50">
              {Math.round(entry.coverage * 100)}% data
            </div>
          </div>
          <CompareButton code={company.code} name={company.name} />
        </div>
        <div className="w-full space-y-1 pl-11">
          {position !== undefined && (
            <div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
              <div className="h-full rounded-full bg-emerald-600" style={{ width: `${entry.score}%` }} />
            </div>
          )}
          {strengths.length > 0 && (
            <div className="text-xs text-black/60 dark:text-white/60">
              Strong on: {strengths.map((f) => METRICS[f.metric].label.toLowerCase()).join(", ")}
            </div>
          )}
        </div>
      </div>

      <details className="border-t border-black/5 px-3 py-2 text-sm dark:border-white/10">
        <summary className="cursor-pointer text-xs text-black/60 dark:text-white/60">How this score is calculated</summary>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-left text-black/60 dark:text-white/60">
              <th className="py-1 font-medium">Factor</th>
              <th className="py-1 text-right font-medium">Value</th>
              <th className="py-1 text-right font-medium">Score</th>
              <th className="py-1 text-right font-medium">Weight</th>
            </tr>
          </thead>
          <tbody>
            {weighted.map((f) => (
              <tr key={f.factorId} className="border-t border-black/5 dark:border-white/10">
                <td className="py-1">{METRICS[f.metric].label}</td>
                <td className="py-1 text-right tabular-nums">
                  <MetricValue metric={f.metric} value={f.value} emptyLabel="No data" />
                </td>
                <td className="py-1 text-right tabular-nums">
                  {f.percentile !== undefined ? Math.round(f.percentile) : "skipped"}
                </td>
                <td className="py-1 text-right">{WEIGHT_LABELS[f.weight]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </li>
  );
}
