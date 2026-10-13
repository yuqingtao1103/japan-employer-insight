import "server-only";
import { cacheLife } from "next/cache";
import { readDevCache, writeDevCache } from "@/lib/dev-cache";

// Server-side client for the EDINET DB API (https://edinetdb.jp/developers).
// The API key must never reach the browser, so this module is server-only.
// The free plan allows 100 requests/day, so responses are cached for a week
// (filings change about once a year). Search runs locally (lib/company-index.ts).
// Responses are cached with `use cache: remote`, which on Vercel is the
// Runtime Cache: shared across server instances and kept across deploys.
// (The fetch data cache does not apply when Cache Components is enabled.)
// Cached functions return a result instead of throwing, because errors thrown
// inside a cache scope cannot be caught by the page; failures such as the
// daily limit are cached for one minute only.

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

// Keeps successful (and "not found") answers for a week, failures for a minute.
function cacheFor(result: Result<unknown>) {
  if (result.ok || result.status === 404) cacheLife("weeks");
  else cacheLife("seconds");
}

async function cachedCompany(edinetCode: string) {
  "use cache: remote";
  const result = await request<CompanyDetail>(`/companies/${edinetCode}`);
  cacheFor(result);
  return result;
}

async function cachedFinancials(edinetCode: string) {
  "use cache: remote";
  const result = await request<FinancialYear[]>(`/companies/${edinetCode}/financials`);
  cacheFor(result);
  return result;
}

export async function getCompany(edinetCode: string): Promise<CompanyDetail | null> {
  const result = await cachedCompany(edinetCode);
  if (result.ok) return result.data;
  if (result.status === 404) return null;
  throw new EdinetDbError(result.message, result.status);
}

export async function getFinancials(edinetCode: string): Promise<FinancialYear[]> {
  const result = await cachedFinancials(edinetCode);
  if (result.ok) return [...result.data].sort((a, b) => a.fiscal_year - b.fiscal_year);
  if (result.status === 404) return [];
  throw new EdinetDbError(result.message, result.status);
}
