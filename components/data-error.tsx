import { connection } from "next/server";
import { EdinetDbError } from "@/lib/edinetdb";
import { getDictionary } from "@/lib/i18n/server";

export async function DataError({ error, fallback }: { error: unknown; fallback: string }) {
  // Errors (e.g. the daily API limit during a build) must not be saved as
  // static pages: render this part per request so it recovers on its own.
  await connection();
  const t = await getDictionary();
  const message = error instanceof EdinetDbError && error.status === 429 ? t.errors.limit : fallback;
  return <p className="text-sm text-red-700 dark:text-red-400">{message}</p>;
}
