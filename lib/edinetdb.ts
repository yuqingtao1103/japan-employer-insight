import "server-only";
import { getCache } from "@vercel/functions";
import { io } from "next/cache";
import { readDevCache, writeDevCache } from "@/lib/dev-cache";

// Server-side client for the EDINET DB API (https://edinetdb.jp/developers).
// The API key must never reach the browser, so this module is server-only.
// The free plan allows 100 requests/day, so responses are cached for a week
// (filings change about once a year). Search runs locally (lib/company-index.ts).
// Successful responses are kept for a week in Vercel's Runtime Cache
// (getCache), which is shared across server instances and, unlike
// `use cache: remote`, kept across deployments. Failures such as the daily
// limit are not cached. Outside Vercel, getCache falls back to memory.

const BASE_URL = "https://edinetdb.jp/v1";

export class EdinetDbError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "EdinetDbError";
  }
}

export type CompanySummary = {
  edinet_code: string;
  sec_code?: string | null;
  name: string;
  name_ja?: string | null;
  name_en?: string | null;
  industry?: string | null;
  is_delisted?: boolean;
};

export type CompanyDetail = CompanySummary & {
  accounting_standard?: string | null;
  latest_fiscal_year?: number | null;
  hq_address?: string | null;
  corporate_number?: string | null; // 法人番号, links to MHLW data
};

// One row per fiscal year. Fields are omitted when the company did not report them.
// Ratios are decimals (0.04 = 4%).
export type FinancialYear = {
  fiscal_year: number;
  doc_id?: string;
  female_manager_ratio?: number | null;
  male_parental_leave_ratio?: number | null;
  gender_pay_gap_all?: number | null;
  gender_pay_gap_regular?: number | null;
  gender_pay_gap_nonregular?: number | null;
  female_director_ratio?: number | null;
  avg_annual_salary?: number | null; // filing company only (non-consolidated)
  avg_age?: number | null;
  avg_tenure_years?: number | null;
  num_employees?: number | null; // consolidated
  revenue?: number | null; // consolidated, JPY
};

type Result<T> = { ok: true; data: T } | { ok: false; status?: number; message: string };

async function request<T>(path: string): Promise<Result<T>> {
  const cached = await readDevCache<T>(path);
  if (cached !== undefined) return { ok: true, data: cached };

  const apiKey = process.env.EDINET_DB_API_KEY;
  if (!apiKey) {
    return { ok: false, message: "EDINET_DB_API_KEY is not set. Add it to .env.local." };
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { headers: { "X-API-Key": apiKey } });
  } catch {
    return { ok: false, message: "Could not reach EDINET DB" };
  }
  if (res.status === 404) return { ok: false, status: 404, message: "Not found" };
  if (res.status === 429) {
    return { ok: false, status: 429, message: "EDINET DB daily request limit reached" };
  }
  if (!res.ok) {
    return { ok: false, status: res.status, message: `EDINET DB request failed (${res.status})` };
  }

  const body = (await res.json()) as { data: T };
  await writeDevCache(path, body.data);
  return { ok: true, data: body.data };
}

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;
// On the Hobby plan all projects of a team share one cache, so keys are namespaced.
const cache = getCache({ namespace: "japan-employer-insight" });
// Requests already in flight on this server instance, so simultaneous page
// views of the same company make one API call.
const inFlight = new Map<string, Promise<Result<unknown>>>();

async function cachedRequest<T>(path: string): Promise<Result<T>> {
  // Company data is read per request, not built into static pages (the cache
  // lookup also reads the current time, which prerendering does not allow).
  await io();
  try {
    const hit = await cache.get(path);
    if (hit != null) return { ok: true, data: hit as T };
  } catch {
    // Cache unavailable: fall through to the API.
  }

  const pending = inFlight.get(path);
  if (pending) return pending as Promise<Result<T>>;

  const promise = request<T>(path).then(async (result) => {
    if (result.ok) {
      await cache.set(path, result.data, { ttl: CACHE_TTL_SECONDS, tags: ["edinetdb"] }).catch(() => {});
    }
    return result;
  });
  inFlight.set(path, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(path);
  }
}

export async function getCompany(edinetCode: string): Promise<CompanyDetail | null> {
  const result = await cachedRequest<CompanyDetail>(`/companies/${edinetCode}`);
  if (result.ok) return result.data;
  if (result.status === 404) return null;
  throw new EdinetDbError(result.message, result.status);
}

export async function getFinancials(edinetCode: string): Promise<FinancialYear[]> {
  const result = await cachedRequest<FinancialYear[]>(`/companies/${edinetCode}/financials`);
  if (result.ok) return [...result.data].sort((a, b) => a.fiscal_year - b.fiscal_year);
  if (result.status === 404) return [];
  throw new EdinetDbError(result.message, result.status);
}
