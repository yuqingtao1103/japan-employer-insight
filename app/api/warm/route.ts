import { POOL_COMPANIES } from "@/lib/companies";
import { getEmployerProfile } from "@/lib/profile";

// Called weekly by Vercel Cron (vercel.json) to load the ranking companies
// into the fetch cache ahead of visitors. It does exactly what opening the
// public ranking page does, and cached data is reused for a week, so calling
// it repeatedly costs no extra EDINET DB requests. A CRON_SECRET environment
// variable is therefore optional; when set, Vercel sends it as a bearer token
// and other callers are rejected.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = await Promise.allSettled(
    POOL_COMPANIES.map((company) => getEmployerProfile(company.code, company.corporateNumber)),
  );
  const failed = POOL_COMPANIES.filter((_, i) => results[i].status === "rejected").map((c) => c.code);

  return Response.json({ loaded: POOL_COMPANIES.length - failed.length, failed });
}
