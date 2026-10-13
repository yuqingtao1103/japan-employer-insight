import "server-only";
import { cacheLife } from "next/cache";
import { readDevCache, writeDevCache } from "@/lib/dev-cache";

// Server-side client for the EDINET DB API (https://edinetdb.jp/developers).
// The API key must never reach the browser, so this module is server-only.
// The free plan allows 100 requests/day, so responses are cached: search
// results for a day, company data for a week (filings change about once a year).

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

async function request<T>(path: string): Promise<T> {
  const cached = await readDevCache<T>(path);
  if (cached !== undefined) return cached;

  const apiKey = process.env.EDINET_DB_API_KEY;
  if (!apiKey) {
    throw new EdinetDbError(
      "EDINET_DB_API_KEY is not set. Add it to .env.local.",
    );
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-API-Key": apiKey },
  });

  if (res.status === 404) {
    throw new EdinetDbError("Not found", 404);
  }
  if (res.status === 429) {
    throw new EdinetDbError("EDINET DB daily request limit reached", 429);
  }
  if (!res.ok) {
    throw new EdinetDbError(`EDINET DB request failed (${res.status})`, res.status);
  }

  const body = (await res.json()) as { data: T };
  await writeDevCache(path, body.data);
  return body.data;
}

export async function searchCompanies(query: string): Promise<CompanySummary[]> {
  "use cache";
  cacheLife("days");
  return request<CompanySummary[]>(`/search?q=${encodeURIComponent(query)}`);
}

export async function getCompany(edinetCode: string): Promise<CompanyDetail | null> {
  "use cache";
  cacheLife("weeks");
  try {
    return await request<CompanyDetail>(`/companies/${edinetCode}`);
  } catch (error) {
    if (error instanceof EdinetDbError && error.status === 404) return null;
    throw error;
  }
}

export async function getFinancials(edinetCode: string): Promise<FinancialYear[]> {
  "use cache";
  cacheLife("weeks");
  try {
    const rows = await request<FinancialYear[]>(`/companies/${edinetCode}/financials`);
    return [...rows].sort((a, b) => a.fiscal_year - b.fiscal_year);
  } catch (error) {
    if (error instanceof EdinetDbError && error.status === 404) return [];
    throw error;
  }
}
