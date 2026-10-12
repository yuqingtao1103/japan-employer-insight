// Well-known employers used for the ranking, picked across industries.
// `featured` ones are also shown on the home page. Names and corporate numbers
// (法人番号, the national company ID) are kept here so these lists render
// without extra API calls; corporate numbers link EDINET filings to MHLW data.
export type PoolCompany = {
  code: string; // EDINET code
  name: string;
  nameJa: string;
  industry: string;
  corporateNumber?: string;
  featured?: boolean;
};

export const POOL_COMPANIES: PoolCompany[] = [
  { code: "E02144", name: "Toyota Motor", nameJa: "トヨタ自動車", industry: "Automotive", corporateNumber: "1180301018771", featured: true },
  { code: "E02166", name: "Honda Motor", nameJa: "本田技研工業", industry: "Automotive", corporateNumber: "6010401027577" },
  { code: "E01777", name: "Sony Group", nameJa: "ソニーグループ", industry: "Electronics", corporateNumber: "5010401067252" },
  { code: "E01737", name: "Hitachi", nameJa: "日立製作所", industry: "Electronics", corporateNumber: "7010001008844", featured: true },
  { code: "E01766", name: "Fujitsu", nameJa: "富士通", industry: "IT services", corporateNumber: "1020001071491" },
  { code: "E01967", name: "Keyence", nameJa: "キーエンス", industry: "Electronics", corporateNumber: "4120001051530" },
  { code: "E02367", name: "Nintendo", nameJa: "任天堂", industry: "Games", corporateNumber: "1130001011420", featured: true },
  { code: "E02417", name: "Capcom", nameJa: "カプコン", industry: "Games", corporateNumber: "3120001077023" },
  { code: "E05080", name: "Rakuten Group", nameJa: "楽天グループ", industry: "Internet services", corporateNumber: "9010701020592", featured: true },
  { code: "E34064", name: "Mercari", nameJa: "メルカリ", industry: "Internet services", corporateNumber: "6010701027558", featured: true },
  { code: "E05000", name: "LY Corporation", nameJa: "LINEヤフー", industry: "Internet services", corporateNumber: "4010401039979" },
  { code: "E05072", name: "CyberAgent", nameJa: "サイバーエージェント", industry: "Internet services", corporateNumber: "4011001034156" },
  { code: "E05062", name: "Nomura Research Institute", nameJa: "野村総合研究所", industry: "IT services", corporateNumber: "4010001054032" },
  { code: "E04426", name: "SoftBank Corp.", nameJa: "ソフトバンク", industry: "Telecom", corporateNumber: "9010401052465" },
  { code: "E00919", name: "Takeda Pharmaceutical", nameJa: "武田薬品工業", industry: "Pharmaceuticals", corporateNumber: "2120001077461", featured: true },
  { code: "E00920", name: "Astellas Pharma", nameJa: "アステラス製薬", industry: "Pharmaceuticals", corporateNumber: "5010001034966" },
  { code: "E00932", name: "Chugai Pharmaceutical", nameJa: "中外製薬", industry: "Pharmaceuticals", corporateNumber: "5011501002900" },
  { code: "E02529", name: "Mitsubishi Corporation", nameJa: "三菱商事", industry: "Trading", corporateNumber: "5010001008771", featured: true },
  { code: "E02497", name: "ITOCHU", nameJa: "伊藤忠商事", industry: "Trading", corporateNumber: "7120001077358" },
  { code: "E02513", name: "Mitsui & Co.", nameJa: "三井物産", industry: "Trading", corporateNumber: "1010001008767" },
  { code: "E00990", name: "Shiseido", nameJa: "資生堂", industry: "Cosmetics", corporateNumber: "1010001034813", featured: true },
  { code: "E00883", name: "Kao", nameJa: "花王", industry: "Consumer goods" },
  { code: "E00436", name: "Ajinomoto", nameJa: "味の素", industry: "Food", corporateNumber: "8010001034740" },
  { code: "E03248", name: "Ryohin Keikaku (MUJI)", nameJa: "良品計画", industry: "Retail", corporateNumber: "5013301012443" },
  { code: "E04762", name: "ORIX", nameJa: "オリックス", industry: "Financial services", corporateNumber: "8010401006942" },
  { code: "E03855", name: "Mitsui Fudosan", nameJa: "三井不動産", industry: "Real estate", corporateNumber: "6010001034957" },
  { code: "E04272", name: "Japan Airlines", nameJa: "日本航空", industry: "Airlines", corporateNumber: "7010701007666" },
  { code: "E04707", name: "Oriental Land", nameJa: "オリエンタルランド", industry: "Leisure" },
  { code: "E01532", name: "Komatsu", nameJa: "小松製作所", industry: "Machinery", corporateNumber: "1010401010455" },
  { code: "E00776", name: "Shin-Etsu Chemical", nameJa: "信越化学工業", industry: "Chemicals", corporateNumber: "5010001008680" },
];

export const FEATURED_COMPANIES = POOL_COMPANIES.filter((c) => c.featured);
