import { describe, expect, it } from "vitest";
import { compareHref, MAX_COMPARE, parseCompareParam } from "@/lib/compare";
import { getCorrections } from "@/lib/corrections";
import { fmt, isLocale, localePath } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dictionaries/en";
import { zh } from "@/lib/i18n/dictionaries/zh";
import { isPlausible } from "@/lib/metrics";

describe("compare links", () => {
  it("keeps valid, unique codes up to the limit", () => {
    expect(parseCompareParam("E02144,e02144,BAD,E01737")).toEqual(["E02144", "E01737"]);
    expect(parseCompareParam("E00001,E00002,E00003,E00004,E00005")).toHaveLength(MAX_COMPARE);
    expect(parseCompareParam(undefined)).toEqual([]);
  });

  it("builds localized links", () => {
    expect(compareHref("zh", ["E02144", "E01737"])).toBe("/zh/compare?c=E02144,E01737");
    expect(compareHref("en", [])).toBe("/en/compare");
  });
});

describe("i18n helpers", () => {
  it("fills placeholders and leaves unknown ones", () => {
    expect(fmt("FY{year} {x}", { year: 2026 })).toBe("FY2026 {x}");
  });

  it("prefixes paths with the locale", () => {
    expect(localePath("en", "/")).toBe("/en");
    expect(localePath("zh", "/rank")).toBe("/zh/rank");
    expect(isLocale("zh")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("has the same placeholders in English and Chinese", () => {
    const placeholders = (value: unknown): string[] =>
      typeof value === "string"
        ? (value.match(/\{\w+\}/g) ?? []).sort()
        : value && typeof value === "object"
          ? Object.entries(value).flatMap(([key, v]) => placeholders(v).map((p) => `${key}:${p}`))
          : [];
    expect(placeholders(zh)).toEqual(placeholders(en));
  });
});

describe("manual corrections", () => {
  it("are plausible values that cite a filing", () => {
    for (const code of ["E00990", "E34064", "E00920", "E05000", "E04707"]) {
      for (const correction of getCorrections(code)) {
        expect(isPlausible(correction.metric, correction.value)).toBe(true);
        expect(correction.docId).toMatch(/^S100[A-Z0-9]{4}$/);
      }
    }
  });
});
