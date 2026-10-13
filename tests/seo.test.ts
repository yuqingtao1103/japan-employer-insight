import { describe, expect, it, vi } from "vitest";

// pageAlternates reads the locale from the URL; tests only use the pure helper.
vi.mock("@/lib/i18n/server", () => ({ getLocale: async () => "en" }));

const { languageAlternates } = await import("@/lib/seo");
const { default: sitemap } = await import("@/app/sitemap");
const { default: robots } = await import("@/app/robots");
const { POOL_COMPANIES } = await import("@/lib/companies");

describe("languageAlternates", () => {
  it("links the English and Chinese versions of a page", () => {
    expect(languageAlternates("/rank")).toEqual({
      en: "/en/rank",
      "zh-Hans": "/zh/rank",
      "x-default": "/en/rank",
    });
    expect(languageAlternates("/").en).toBe("/en");
  });
});

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("lists main, industry and ranking company pages in both languages", () => {
    const pages = 4 + 33 + POOL_COMPANIES.length;
    expect(entries).toHaveLength(pages * 2);
    expect(urls).toContain("http://localhost:3000/zh/industries/banks");
    expect(urls).toContain("http://localhost:3000/en/company/E02144");
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("leaves out pages that would use up the API limit when crawled", () => {
    expect(urls.filter((u) => u.includes("/company/"))).toHaveLength(POOL_COMPANIES.length * 2);
    expect(urls.some((u) => u.includes("/compare"))).toBe(false);
  });

  it("gives every entry its language alternates", () => {
    for (const entry of entries) {
      expect(Object.keys(entry.alternates?.languages ?? {})).toEqual(["en", "zh-Hans", "x-default"]);
    }
  });
});

describe("robots", () => {
  it("allows crawling except the internal API and points to the sitemap", () => {
    const rules = robots();
    expect(rules.rules).toMatchObject({ allow: "/", disallow: "/api/" });
    expect(rules.sitemap).toBe("http://localhost:3000/sitemap.xml");
  });
});
