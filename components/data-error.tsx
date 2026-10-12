import { EdinetDbError } from "@/lib/edinetdb";

export function DataError({ error, fallback }: { error: unknown; fallback: string }) {
  const message =
    error instanceof EdinetDbError && error.status === 429
      ? "The daily data request limit has been reached. Please try again tomorrow."
      : fallback;
  return <p className="text-sm text-red-700 dark:text-red-400">{message}</p>;
}
