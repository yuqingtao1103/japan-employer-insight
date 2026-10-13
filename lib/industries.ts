// URL slugs for the Tokyo Stock Exchange's 33 sectors, keyed by the Japanese
// names used in the EDINET code list (same slugs as EDINET DB uses).
export const INDUSTRY_SLUGS: Record<string, string> = {
  "水産・農林業": "fishery-forestry",
  鉱業: "mining",
  建設業: "construction",
  食料品: "foods",
  繊維製品: "textiles",
  "パルプ・紙": "pulp-paper",
  化学: "chemicals",
  医薬品: "pharmaceutical",
  "石油・石炭製品": "oil-coal",
  ゴム製品: "rubber",
  "ガラス・土石製品": "glass-ceramics",
  鉄鋼: "iron-steel",
  非鉄金属: "nonferrous-metals",
  金属製品: "metal-products",
  機械: "machinery",
  電気機器: "electric-appliances",
  輸送用機器: "transportation-equipment",
  精密機器: "precision-instruments",
  その他製品: "other-products",
  "電気・ガス業": "electric-gas",
  陸運業: "land-transportation",
  海運業: "marine-transportation",
  空運業: "air-transportation",
  "倉庫・運輸関連": "warehousing",
  "情報・通信業": "information-communication",
  卸売業: "wholesale",
  小売業: "retail",
  銀行業: "banks",
  "証券、商品先物取引業": "securities",
  保険業: "insurance",
  その他金融業: "other-financing",
  不動産業: "real-estate",
  サービス業: "service",
};

const BY_SLUG = Object.fromEntries(Object.entries(INDUSTRY_SLUGS).map(([name, slug]) => [slug, name]));

export function industrySlug(industry: string | null | undefined): string | undefined {
  return industry ? INDUSTRY_SLUGS[industry] : undefined;
}

export function industryFromSlug(slug: string): string | undefined {
  return BY_SLUG[slug];
}
