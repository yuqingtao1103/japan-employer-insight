import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cacheLife = vi.fn();
vi.mock("next/cache", () => ({ cacheLife }));
vi.mock("@/lib/dev-cache", () => ({ readDevCache: async () => undefined, writeDevCache: async () => {} }));

const { EdinetDbError, getCompany, getFinancials } = await import("@/lib/edinetdb");

function respond(status: number, body?: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status })),
  );
}

beforeEach(() => vi.stubEnv("EDINET_DB_API_KEY", "test-key"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  cacheLife.mockReset();
});

describe("EDINET DB client", () => {
  it("returns financials sorted by year and caches them for a week", async () => {
    respond(200, { data: [{ fiscal_year: 2026 }, { fiscal_year: 2024 }] });
    const rows = await getFinancials("E02144");
    expect(rows.map((r) => r.fiscal_year)).toEqual([2024, 2026]);
    expect(cacheLife).toHaveBeenCalledWith("weeks");
  });

  it("sends the API key and never exposes it in errors", async () => {
    respond(500);
    const error = await getFinancials("E02144").catch((e) => e);
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ headers: { "X-API-Key": "test-key" } });
    expect(String(error.message)).not.toContain("test-key");
  });

  it("turns the daily limit into a catchable error cached for a minute only", async () => {
    respond(429);
    const error = await getFinancials("E02144").catch((e) => e);
    expect(error).toBeInstanceOf(EdinetDbError);
    expect(error.status).toBe(429);
    expect(cacheLife).toHaveBeenCalledWith("seconds");
  });

  it("treats unknown companies as not found", async () => {
    respond(404);
    expect(await getCompany("E99999")).toBeNull();
    expect(await getFinancials("E99999")).toEqual([]);
    expect(cacheLife).toHaveBeenCalledWith("weeks");
  });

  it("fails clearly when the API key is missing, without calling the API", async () => {
    vi.stubEnv("EDINET_DB_API_KEY", "");
    respond(200, { data: [] });
    await expect(getFinancials("E02144")).rejects.toThrow("EDINET_DB_API_KEY is not set");
    expect(fetch).not.toHaveBeenCalled();
  });
});
