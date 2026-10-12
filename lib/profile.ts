import "server-only";
import { getCorrections } from "@/lib/corrections";
import { getFinancials } from "@/lib/edinetdb";
import { buildProfile, type EmployerProfile } from "@/lib/metrics";
import { getMhlwRecord } from "@/lib/mhlw";

// Securities report figures (EDINET DB) merged with MHLW data for one company.
export async function getEmployerProfile(
  edinetCode: string,
  corporateNumber: string | null | undefined,
): Promise<EmployerProfile> {
  const rows = await getFinancials(edinetCode);
  return buildProfile(rows, getMhlwRecord(corporateNumber), getCorrections(edinetCode));
}
