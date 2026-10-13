import type { MetadataRoute } from "next";
import { POOL_COMPANIES } from "@/lib/companies";
import { LOCALES, localePath } from "@/lib/i18n/config";
import { INDUSTRY_SLUGS } from "@/lib/industries";
import { languageAlternates } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

// Company pages are listed only for the ranking companies: each first visit
// to a company page uses an EDINET DB request, and crawling all ~3,800 would
// use up the daily limit. Industry pages already link to every company.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const paths = [
    "/",
    "/industries",
    "/rank",
    "/guide",
    ...Object.values(INDUSTRY_SLUGS).map((slug) => `/industries/${slug}`),
    ...POOL_COMPANIES.map((company) => `/company/${company.code}`),
  ];
  return paths.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${base}${localePath(locale, path)}`,
      alternates: {
        languages: Object.fromEntries(
          Object.entries(languageAlternates(path)).map(([lang, href]) => [lang, `${base}${href}`]),
        ),
      },
    })),
  );
}
