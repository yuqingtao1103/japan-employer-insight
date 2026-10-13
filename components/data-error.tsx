import { EdinetDbError } from "@/lib/edinetdb";
import { getDictionary } from "@/lib/i18n/server";

export async function DataError({ error, fallback }: { error: unknown; fallback: string }) {
  const t = await getDictionary();
  const message = error instanceof EdinetDbError && error.status === 429 ? t.errors.limit : fallback;
  return <p className="text-sm text-red-700 dark:text-red-400">{message}</p>;
}
