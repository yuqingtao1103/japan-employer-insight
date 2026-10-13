import { POOL_COMPANIES } from "@/lib/companies";
import { getEmployerProfile } from "@/lib/profile";

// Called weekly by Vercel Cron (vercel.json) to load the ranking companies
// into the fetch cache ahead of visitors. Vercel sends the CRON_SECRET
// environment variable as a bearer token; other callers are rejected.
// Each run costs at most one EDINET DB request per company whose cached data
// is older than a week (30 companies, well under the 100/day limit).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = await Promise.allSettled(
    POOL_COMPANIES.map((company) => getEmployerProfile(company.code, company.corporateNumber)),
  );
  const failed = POOL_COMPANIES.filter((_, i) => results[i].status === "rejected").map((c) => c.code);

  return Response.json({ loaded: POOL_COMPANIES.length - failed.length, failed });
}
