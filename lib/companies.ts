// Well-known employers used for the ranking, picked across industries.
// `featured` ones are also shown on the home page. Names and corporate numbers
// (法人番号, the national company ID) are kept here so these lists render
// without extra API calls; corporate numbers link EDINET filings to MHLW data.
export type PoolCompany = {
  code: string; // EDINET code
  name: string;
  nameJa: string;
  industry: string; // key into the dictionaries' `industries`
  corporateNumber?: string;
  featured?: boolean;
};

export const POOL_COMPANIES: PoolCompany[] = [
  { code: "E02144", name: "Toyota Motor", nameJa: "トヨタ自動車", industry: "automotive", corporateNumber: "1180301018771", featured: true },
  { code: "E02166", name: "Honda Motor", nameJa: "本田技研工業", industry: "automotive", corporateNumber: "6010401027577" },
  { code: "E01777", name: "Sony Group", nameJa: "ソニーグループ", industry: "electronics", corporateNumber: "5010401067252" },
  { code: "E01737", name: "Hitachi", nameJa: "日立製作所", industry: "electronics", corporateNumber: "7010001008844", featured: true },
  { code: "E01766", name: "Fujitsu", nameJa: "富士通", industry: "itServices", corporateNumber: "1020001071491" },
  { code: "E01967", name: "Keyence", nameJa: "キーエンス", industry: "electronics", corporateNumber: "4120001051530" },
  { code: "E02367", name: "Nintendo", nameJa: "任天堂", industry: "games", corporateNumber: "1130001011420", featured: true },
  { code: "E02417", name: "Capcom", nameJa: "カプコン", industry: "games", corporateNumber: "3120001077023" },
  { code: "E05080", name: "Rakuten Group", nameJa: "楽天グループ", industry: "internet", corporateNumber: "9010701020592", featured: true },
  { code: "E34064", name: "Mercari", nameJa: "メルカリ", industry: "internet", corporateNumber: "6010701027558", featured: true },
  { code: "E05000", name: "LY Corporation", nameJa: "LINEヤフー", industry: "internet", corporateNumber: "4010401039979" },
  { code: "E05072", name: "CyberAgent", nameJa: "サイバーエージェント", industry: "internet", corporateNumber: "4011001034156" },
  { code: "E05062", name: "Nomura Research Institute", nameJa: "野村総合研究所", industry: "itServices", corporateNumber: "4010001054032" },
  { code: "E04426", name: "SoftBank Corp.", nameJa: "ソフトバンク", industry: "telecom", corporateNumber: "9010401052465" },
  { code: "E00919", name: "Takeda Pharmaceutical", nameJa: "武田薬品工業", industry: "pharma", corporateNumber: "2120001077461", featured: true },
  { code: "E00920", name: "Astellas Pharma", nameJa: "アステラス製薬", industry: "pharma", corporateNumber: "5010001034966" },
  { code: "E00932", name: "Chugai Pharmaceutical", nameJa: "中外製薬", industry: "pharma", corporateNumber: "5011501002900" },
  { code: "E02529", name: "Mitsubishi Corporation", nameJa: "三菱商事", industry: "trading", corporateNumber: "5010001008771", featured: true },
  { code: "E02497", name: "ITOCHU", nameJa: "伊藤忠商事", industry: "trading", corporateNumber: "7120001077358" },
  { code: "E02513", name: "Mitsui & Co.", nameJa: "三井物産", industry: "trading", corporateNumber: "1010001008767" },
  { code: "E00990", name: "Shiseido", nameJa: "資生堂", industry: "cosmetics", corporateNumber: "1010001034813", featured: true },
  { code: "E00883", name: "Kao", nameJa: "花王", industry: "consumerGoods", corporateNumber: "4010001034760" },
  { code: "E00436", name: "Ajinomoto", nameJa: "味の素", industry: "food", corporateNumber: "8010001034740" },
  { code: "E03248", name: "Ryohin Keikaku (MUJI)", nameJa: "良品計画", industry: "retail", corporateNumber: "5013301012443" },
  { code: "E04762", name: "ORIX", nameJa: "オリックス", industry: "financial", corporateNumber: "8010401006942" },
  { code: "E03855", name: "Mitsui Fudosan", nameJa: "三井不動産", industry: "realEstate", corporateNumber: "6010001034957" },
  { code: "E04272", name: "Japan Airlines", nameJa: "日本航空", industry: "airlines", corporateNumber: "7010701007666" },
  { code: "E04707", name: "Oriental Land", nameJa: "オリエンタルランド", industry: "leisure" },
  { code: "E01532", name: "Komatsu", nameJa: "小松製作所", industry: "machinery", corporateNumber: "1010401010455" },
  { code: "E00776", name: "Shin-Etsu Chemical", nameJa: "信越化学工業", industry: "chemicals", corporateNumber: "5010001008680" },
];

export const FEATURED_COMPANIES = POOL_COMPANIES.filter((c) => c.featured);
