import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Stand-in for Vercel's Runtime Cache.
const store = new Map<string, unknown>();
const cache = {
  get: vi.fn(async (key: string) => store.get(key) ?? null),
  set: vi.fn(async (key: string, value: unknown) => void store.set(key, value)),
};
vi.mock("@vercel/functions", () => ({ getCache: () => cache }));
vi.mock("next/cache", () => ({ io: async () => {} }));
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
  store.clear();
  cache.get.mockClear();
  cache.set.mockClear();
});

describe("EDINET DB client", () => {
  it("returns financials sorted by year and caches them for a week", async () => {
    respond(200, { data: [{ fiscal_year: 2026 }, { fiscal_year: 2024 }] });
    const rows = await getFinancials("E02144");
    expect(rows.map((r) => r.fiscal_year)).toEqual([2024, 2026]);
    expect(cache.set).toHaveBeenCalledWith(
      "/companies/E02144/financials",
      expect.anything(),
      expect.objectContaining({ ttl: 7 * 24 * 60 * 60 }),
    );
  });

  it("serves later requests from the cache without calling the API", async () => {
    respond(200, { data: [{ fiscal_year: 2026 }] });
    await getFinancials("E02144");
    await getFinancials("E02144");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("makes one API call for simultaneous requests for the same company", async () => {
    respond(200, { data: [{ fiscal_year: 2026 }] });
    await Promise.all([getFinancials("E02144"), getFinancials("E02144"), getFinancials("E02144")]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("sends the API key and never exposes it in errors", async () => {
    respond(500);
    const error = await getFinancials("E02144").catch((e) => e);
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ headers: { "X-API-Key": "test-key" } });
    expect(String(error.message)).not.toContain("test-key");
  });

  it("turns the daily limit into a catchable error and does not cache it", async () => {
    respond(429);
    const error = await getFinancials("E02144").catch((e) => e);
    expect(error).toBeInstanceOf(EdinetDbError);
    expect(error.status).toBe(429);
    expect(cache.set).not.toHaveBeenCalled();

    // Once the limit resets, the next request reaches the API again.
    respond(200, { data: [{ fiscal_year: 2026 }] });
    expect(await getFinancials("E02144")).toHaveLength(1);
  });

  it("treats unknown companies as not found", async () => {
    respond(404);
    expect(await getCompany("E99999")).toBeNull();
    expect(await getFinancials("E99999")).toEqual([]);
  });

  it("still works when the cache is unavailable", async () => {
    cache.get.mockRejectedValueOnce(new Error("cache down"));
    cache.set.mockRejectedValueOnce(new Error("cache down"));
    respond(200, { data: [{ fiscal_year: 2026 }] });
    expect(await getFinancials("E02144")).toHaveLength(1);
  });

  it("fails clearly when the API key is missing, without calling the API", async () => {
    vi.stubEnv("EDINET_DB_API_KEY", "");
    respond(200, { data: [] });
    await expect(getFinancials("E02144")).rejects.toThrow("EDINET_DB_API_KEY is not set");
    expect(fetch).not.toHaveBeenCalled();
  });
});
