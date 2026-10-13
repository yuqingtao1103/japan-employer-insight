import "server-only";
import data from "@/data/listed-companies.json";
import { POOL_COMPANIES } from "@/lib/companies";
import { getCompany, type CompanyDetail, type CompanySummary } from "@/lib/edinetdb";

// Local list of listed companies from the FSA's EDINET code list (built by
// scripts/build-company-index.mjs). Search and company names come from here
// so they cost no EDINET DB API requests.

type Entry = {
  code: string;
  name: string;
  nameEn: string;
  industry: string;
  secCode: string;
  corporateNumber: string;
  // Normalized names used for matching.
  keys: string[];
};

export const COMPANY_LIST_SOURCE = { name: data.source, url: data.sourceUrl, asOf: data.asOf };

// Folds width, case, hiragana/katakana and legal suffixes so that
// "トヨタ", "とよた", "Toyota Motor Corp." and "ＴＯＹＯＴＡ" all match.
function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))
    .replace(/株式会社|\(株\)|カブシキガイシャ|カブシキカイシャ/g, "")
    .replace(/\b(co|ltd|inc|corp|corporation|company|limited|k\.?k)\b\.?/g, "")
    .replace(/[\s・,.'’&\-()（）]/g, "");
}

// Full-width letters and spaces (e.g. "Ｕ－ＮＥＸＴ") become regular ones.
const clean = (value: string) => value.normalize("NFKC").replace(/\s+/g, " ").trim();

const ENTRIES: Entry[] = (data.companies as string[][]).map(
  ([code, name, nameEn, kana, industry, secCode, corporateNumber]) => ({
    code,
    name: clean(name),
    nameEn: clean(nameEn),
    industry,
    secCode,
    corporateNumber,
    keys: [normalize(name), normalize(nameEn), normalize(kana)].filter(Boolean),
  }),
);

const BY_CODE = new Map(ENTRIES.map((entry) => [entry.code, entry]));

// Well-known employers come first among equally good matches.
const WELL_KNOWN = new Set(POOL_COMPANIES.map((company) => company.code));
const shortestKey = (entry: Entry) => Math.min(...entry.keys.map((key) => key.length));

function toSummary(entry: Entry): CompanySummary {
  return {
    edinet_code: entry.code,
    sec_code: entry.secCode || null,
    name: entry.name,
    name_ja: entry.name,
    name_en: entry.nameEn || null,
    industry: entry.industry || null,
    is_delisted: false,
  };
}

function score(entry: Entry, query: string, digits: string | null): number {
  if (digits && entry.secCode.startsWith(digits)) return 100;
  let best = 0;
  for (const key of entry.keys) {
    if (key === query) return 100;
    if (key.startsWith(query)) best = Math.max(best, 80);
    else if (key.includes(query)) best = Math.max(best, 60);
  }
  return best;
}

export function searchListedCompanies(query: string, limit = 20): CompanySummary[] {
  const normalized = normalize(query);
  if (!normalized) return [];
  const digits = /^\d{4,5}$/.test(query.trim()) ? query.trim() : null;
  return ENTRIES.map((entry) => ({ entry, score: score(entry, normalized, digits) }))
    .filter((match) => match.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(WELL_KNOWN.has(b.entry.code)) - Number(WELL_KNOWN.has(a.entry.code)) ||
        shortestKey(a.entry) - shortestKey(b.entry),
    )
    .slice(0, limit)
    .map((match) => toSummary(match.entry));
}

// Company name, industry and corporate number: from the local list when the
// company is listed, otherwise from the API (e.g. recently delisted companies).
export async function getCompanyInfo(edinetCode: string): Promise<CompanyDetail | null> {
  const entry = BY_CODE.get(edinetCode);
  if (entry) {
    return { ...toSummary(entry), corporate_number: entry.corporateNumber || null };
  }
  return getCompany(edinetCode);
}

export type ListedCompany = Omit<Entry, "keys">;

// Every listed company (for industry benchmarks and industry pages).
export function listedCompanies(): ListedCompany[] {
  return ENTRIES.map(({ code, name, nameEn, industry, secCode, corporateNumber }) => ({
    code,
    name,
    nameEn,
    industry,
    secCode,
    corporateNumber,
  }));
}
