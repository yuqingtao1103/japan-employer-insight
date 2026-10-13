import { afterEach, describe, expect, it, vi } from "vitest";

const getEmployerProfile = vi.fn();
vi.mock("@/lib/profile", () => ({ getEmployerProfile }));

const { GET } = await import("@/app/api/warm/route");
const { POOL_COMPANIES } = await import("@/lib/companies");

const request = (auth?: string) =>
  new Request("https://example.com/api/warm", { headers: auth ? { authorization: auth } : {} });

afterEach(() => {
  vi.unstubAllEnvs();
  getEmployerProfile.mockReset();
});

describe("GET /api/warm", () => {
  it("rejects requests without the cron secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await GET(request())).status).toBe(401);
    expect((await GET(request("Bearer wrong"))).status).toBe(401);
    expect(getEmployerProfile).not.toHaveBeenCalled();
  });

  it("rejects everything when no secret is configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await GET(request("Bearer "))).status).toBe(401);
  });

  it("loads every ranking company and reports failures", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    getEmployerProfile.mockImplementation(async (code: string) => {
      if (code === POOL_COMPANIES[0].code) throw new Error("limit");
      return {};
    });
    const res = await GET(request("Bearer s3cret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      loaded: POOL_COMPANIES.length - 1,
      failed: [POOL_COMPANIES[0].code],
    });
    expect(getEmployerProfile).toHaveBeenCalledTimes(POOL_COMPANIES.length);
  });
});
