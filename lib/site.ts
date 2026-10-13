// Public base URL of the site. Vercel sets VERCEL_PROJECT_PRODUCTION_URL
// (without protocol) on deployments.
export function siteUrl(): string {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return host ? `https://${host}` : "http://localhost:3000";
}

const REPO = "yuqingtao1103/japan-employer-insight";

// Opens the "Report a data error" issue form with the company and page filled in.
export function reportIssueUrl({ company, path }: { company?: string; path: string }): string {
  const params = new URLSearchParams({ template: "data-error.yml" });
  if (company) {
    params.set("title", `Data error: ${company}`);
    params.set("company", company);
  }
  params.set("page", `${siteUrl()}${path}`);
  return `https://github.com/${REPO}/issues/new?${params}`;
}
