import "server-only";
import data from "@/data/mhlw-workplace.json";

// Figures companies publish in the MHLW women's advancement database
// (女性の活躍推進企業データベース). Built by scripts/build-mhlw-data.mjs.
// Ratios are decimals (0.526 = 52.6%), like EDINET DB.
export type MhlwRecord = {
  maleParentalLeave?: number;
  overtimeHours?: number; // average per month
  paidLeave?: number; // share of annual paid leave taken
  femaleManagers?: number;
  femaleBoard?: number;
  payAll?: number;
  payRegular?: number;
  payNonregular?: number;
  payPeriod?: string; // "2025-04/2026-03"
  dataAsOf?: string; // "2026-03"
  updated?: string; // "2026-07-14"
  telework?: boolean;
  flextime?: boolean;
  eruboshi?: 1 | 2 | 3 | "platinum";
  kurumin?: true | "platinum";
};

const companies = data.companies as Record<string, MhlwRecord>;

export const MHLW_SOURCE = {
  name: data.source,
  url: data.sourceUrl,
  asOf: data.asOf,
};

export function getMhlwRecord(corporateNumber: string | null | undefined): MhlwRecord | undefined {
  return corporateNumber ? companies[corporateNumber] : undefined;
}
