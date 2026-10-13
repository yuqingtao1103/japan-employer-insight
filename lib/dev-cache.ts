import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

// Local-only disk cache for API responses. Next.js' in-memory cache is wiped
// whenever code changes during development, which quickly burns through the
// EDINET DB free quota (100 requests/day). Responses are kept in .cache/
// (git-ignored) and re-fetched after a week. Disabled on Vercel and in CI.

const CACHE_DIR = path.join(process.cwd(), ".cache", "edinetdb");
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const devCacheEnabled = process.env.VERCEL !== "1" && !process.env.CI;

function fileFor(key: string): string {
  return path.join(CACHE_DIR, `${key.replace(/[^a-zA-Z0-9]+/g, "_")}.json`);
}

export async function readDevCache<T>(key: string): Promise<T | undefined> {
  if (!devCacheEnabled) return undefined;
  try {
    const { fetchedAt, data } = JSON.parse(await fs.readFile(fileFor(key), "utf8"));
    return Date.now() - fetchedAt < MAX_AGE_MS ? (data as T) : undefined;
  } catch {
    return undefined;
  }
}

export async function writeDevCache(key: string, data: unknown): Promise<void> {
  if (!devCacheEnabled) return;
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(fileFor(key), JSON.stringify({ fetchedAt: Date.now(), data }));
  } catch {
    // Caching is best effort.
  }
}
