import { afterEach, describe, expect, it, vi } from "vitest";
import { reportIssueUrl, siteUrl } from "@/lib/site";

afterEach(() => vi.unstubAllEnvs());

describe("siteUrl", () => {
  it("uses the Vercel production host when deployed", () => {
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "example.vercel.app");
    expect(siteUrl()).toBe("https://example.vercel.app");
  });

  it("falls back to localhost", () => {
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});

describe("reportIssueUrl", () => {
  it("opens the data error form with the company and page filled in", () => {
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "example.vercel.app");
    const url = new URL(reportIssueUrl({ company: "Toyota Motor (E02144)", path: "/zh/company/E02144" }));
    expect(url.origin + url.pathname).toBe("https://github.com/yuqingtao1103/japan-employer-insight/issues/new");
    expect(url.searchParams.get("template")).toBe("data-error.yml");
    expect(url.searchParams.get("title")).toBe("Data error: Toyota Motor (E02144)");
    expect(url.searchParams.get("company")).toBe("Toyota Motor (E02144)");
    expect(url.searchParams.get("page")).toBe("https://example.vercel.app/zh/company/E02144");
  });

  it("leaves the company empty for general reports", () => {
    const url = new URL(reportIssueUrl({ path: "/en/industries/banks" }));
    expect(url.searchParams.has("company")).toBe(false);
    expect(url.searchParams.has("title")).toBe(false);
  });
});
