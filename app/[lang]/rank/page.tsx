import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CompareButton } from "@/components/compare-button";
import { MetricValue } from "@/components/metric-value";
import { RankWeights } from "@/components/rank-weights";
import { POOL_COMPANIES, type PoolCompany } from "@/lib/companies";
import { fmt, localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getEmployerProfile } from "@/lib/profile";
import { FACTORS, MIN_COVERAGE, parseWeights, rankEmployers, type RankedEmployer, type Weight } from "@/lib/ranking";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).rank.metaTitle };
}

export default async function RankPage({ searchParams }: PageProps<"/[lang]/rank">) {
  const t = await getDictionary();
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t.rank.title}</h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          {fmt(t.rank.intro, { count: POOL_COMPANIES.length })}
        </p>
      </section>
      <Suspense fallback={<p className="text-sm text-black/60 dark:text-white/60">{t.common.loading}</p>}>
        <RankContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RankContent({ searchParams }: Pick<PageProps<"/[lang]/rank">, "searchParams">) {
  const locale = await getLocale();
  const t = await getDictionary();
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
  const labels = Object.fromEntries(FACTORS.map((f) => [f.id, t.metrics[f.metric]]));

  return (
    <>
      <RankWeights weights={weights} labels={labels} />

      {failed > 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-400">{fmt(t.rank.failed, { count: failed })}</p>
      )}

      {noWeights ? (
        <p className="text-sm text-black/70 dark:text-white/70">{t.rank.chooseFactor}</p>
      ) : (
        <ol className="space-y-2">
          {ranked.map((entry, i) => (
            <RankRow key={entry.item.code} entry={entry} position={i + 1} />
          ))}
        </ol>
      )}

      {!noWeights && insufficient.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">{t.rank.insufficientTitle}</h2>
          <p className="text-xs text-black/60 dark:text-white/60">
            {fmt(t.rank.insufficientNote, { percent: Math.round(MIN_COVERAGE * 100) })}
          </p>
          <ul className="space-y-2">
            {insufficient.map((entry) => (
              <RankRow key={entry.item.code} entry={entry} />
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-black/60 dark:text-white/60">
        {t.rank.footnote}{" "}
        <Link href={localePath(locale, "/guide#sources")} className="underline">
          {t.common.learnMore}
        </Link>
      </p>
    </>
  );
}

async function RankRow({ entry, position }: { entry: RankedEmployer<PoolCompany>; position?: number }) {
  const locale = await getLocale();
  const t = await getDictionary();
  const weightLabels: Record<Weight, string> = {
    0: t.client.weight0,
    1: t.client.weight1,
    2: t.client.weight2,
    3: t.client.weight3,
  };
  const company = entry.item;
  const weighted = entry.factors.filter((f) => f.weight > 0);
  const strengths = weighted
    .filter((f) => f.percentile !== undefined && f.percentile >= 75)
    .sort((a, b) => b.percentile! - a.percentile!)
    .slice(0, 3);
  const separator = locale === "zh" ? "、" : ", ";

  return (
    <li className="rounded-md border border-black/10 dark:border-white/15">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
        <div className="w-8 shrink-0 text-center text-lg font-semibold tabular-nums text-black/60 dark:text-white/60">
          {position ?? "–"}
        </div>
        <div className="min-w-0 flex-1 basis-40">
          <Link href={localePath(locale, `/company/${company.code}`)} className="font-medium hover:underline">
            {company.name}
          </Link>
          <div className="text-xs text-black/60 dark:text-white/60">
            {company.nameJa} · {t.industries[company.industry]}
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-semibold tabular-nums">{Math.round(entry.score)}</div>
            <div className="text-[0.65rem] text-black/50 dark:text-white/50">
              {fmt(t.rank.dataShare, { percent: Math.round(entry.coverage * 100) })}
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
              {fmt(t.rank.strongOn, {
                list: strengths.map((f) => t.metrics[f.metric].label).join(separator),
              })}
            </div>
          )}
        </div>
      </div>

      <details className="border-t border-black/5 px-3 py-2 text-sm dark:border-white/10">
        <summary className="cursor-pointer text-xs text-black/60 dark:text-white/60">{t.rank.howCalculated}</summary>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-left text-black/60 dark:text-white/60">
              <th className="py-1 font-medium">{t.rank.factor}</th>
              <th className="py-1 text-right font-medium">{t.rank.value}</th>
              <th className="py-1 text-right font-medium">{t.rank.score}</th>
              <th className="py-1 text-right font-medium">{t.rank.weight}</th>
            </tr>
          </thead>
          <tbody>
            {weighted.map((f) => (
              <tr key={f.factorId} className="border-t border-black/5 dark:border-white/10">
                <td className="py-1">{t.metrics[f.metric].label}</td>
                <td className="py-1 text-right tabular-nums">
                  <MetricValue metric={f.metric} value={f.value} emptyLabel={t.common.noData} />
                </td>
                <td className="py-1 text-right tabular-nums">
                  {f.percentile !== undefined ? Math.round(f.percentile) : t.rank.skipped}
                </td>
                <td className="py-1 text-right">{weightLabels[f.weight]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </li>
  );
}
