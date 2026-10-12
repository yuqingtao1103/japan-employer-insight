// Well-known employers shown on the home page, picked across industries.
// Names are kept here so the list renders without extra API calls.
export const FEATURED_COMPANIES = [
  { code: "E02144", name: "Toyota Motor", nameJa: "トヨタ自動車", industry: "Automotive" },
  { code: "E01737", name: "Hitachi", nameJa: "日立製作所", industry: "Electronics" },
  { code: "E02367", name: "Nintendo", nameJa: "任天堂", industry: "Games" },
  { code: "E05080", name: "Rakuten Group", nameJa: "楽天グループ", industry: "Internet services" },
  { code: "E00919", name: "Takeda Pharmaceutical", nameJa: "武田薬品工業", industry: "Pharmaceuticals" },
  { code: "E02529", name: "Mitsubishi Corporation", nameJa: "三菱商事", industry: "Trading" },
  { code: "E00990", name: "Shiseido", nameJa: "資生堂", industry: "Cosmetics" },
  { code: "E34064", name: "Mercari", nameJa: "メルカリ", industry: "Internet services" },
] as const;
