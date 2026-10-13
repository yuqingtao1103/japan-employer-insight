import { describe, expect, it, vi } from "vitest";

// Company info must come from the local list without calling the API.
const getCompany = vi.fn();
vi.mock("@/lib/edinetdb", () => ({ getCompany }));

const { getCompanyInfo, searchListedCompanies } = await import("@/lib/company-index");

const firstCode = (query: string) => searchListedCompanies(query)[0]?.edinet_code;

describe("searchListedCompanies", () => {
  it("finds companies by Japanese name, in katakana or hiragana", () => {
    expect(firstCode("トヨタ")).toBe("E02144");
    expect(firstCode("とよた")).toBe("E02144");
  });

  it("finds companies by English name, ignoring case and legal suffixes", () => {
    expect(firstCode("sony")).toBe("E01777");
    expect(firstCode("Mitsui & Co., Ltd.")).toBe("E02513");
  });

  it("ignores full-width/half-width differences", () => {
    expect(firstCode("ＬＩＮＥヤフー")).toBe("E05000");
    expect(firstCode("LINEヤフー")).toBe("E05000");
  });

  it("finds companies by securities code", () => {
    expect(firstCode("7203")).toBe("E02144");
  });

  it("returns nothing for empty or unknown queries", () => {
    expect(searchListedCompanies("")).toEqual([]);
    expect(searchListedCompanies("株式会社")).toEqual([]);
    expect(searchListedCompanies("zzqqxx")).toEqual([]);
  });

  it("limits the number of results", () => {
    expect(searchListedCompanies("電", 3)).toHaveLength(3);
  });
});

describe("getCompanyInfo", () => {
  it("returns names and the corporate number from the local list", async () => {
    const info = await getCompanyInfo("E02144");
    expect(info).toMatchObject({
      edinet_code: "E02144",
      name_en: "TOYOTA MOTOR CORPORATION",
      industry: "輸送用機器",
      corporate_number: "1180301018771",
    });
    expect(getCompany).not.toHaveBeenCalled();
  });

  it("falls back to the API for companies not in the list", async () => {
    getCompany.mockResolvedValueOnce(null);
    expect(await getCompanyInfo("E99999")).toBeNull();
    expect(getCompany).toHaveBeenCalledWith("E99999");
  });
});
