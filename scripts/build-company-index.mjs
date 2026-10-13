// Builds data/listed-companies.json from the FSA's EDINET code list
// (EdinetcodeDlInfo.csv, Shift_JIS), used for local company search so that
// searching does not spend EDINET DB API requests.
//
// Download: EDINET閲覧サイト > EDINETタクソノミ及びコードリスト ダウンロード
// (https://disclosure2dl.edinet-fsa.go.jp/searchdocument/codelist/Edinetcode.zip)
//
// Usage: node scripts/build-company-index.mjs <path-to-EdinetcodeDlInfo.csv>
//
// EDINET content is published under the Public Data License 1.0 (PDL1.0),
// which allows redistribution of processed data with attribution.

import fs from "node:fs";
import path from "node:path";
import { parseCsv } from "./lib/csv.mjs";

const [csvPath] = process.argv.slice(2);
if (!csvPath) {
  console.error("Usage: node scripts/build-company-index.mjs <EdinetcodeDlInfo.csv>");
  process.exit(1);
}

const text = new TextDecoder("shift_jis").decode(fs.readFileSync(csvPath));
// Line 1: "ダウンロード実行日,2026年10月13日現在,件数,11411件"; line 2: header.
const [meta, header, ...rows] = parseCsv(text);
const asOfMatch = meta[1]?.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
const asOf = asOfMatch
  ? `${asOfMatch[1]}-${asOfMatch[2].padStart(2, "0")}-${asOfMatch[3].padStart(2, "0")}`
  : undefined;

function col(name) {
  const index = header.indexOf(name);
  if (index === -1) throw new Error(`Column not found: ${name}`);
  return index;
}

const COLS = {
  code: col("ＥＤＩＮＥＴコード"),
  listing: col("上場区分"),
  name: col("提出者名"),
  nameEn: col("提出者名（英字）"),
  kana: col("提出者名（ヨミ）"),
  industry: col("提出者業種"),
  secCode: col("証券コード"),
  corporateNumber: col("提出者法人番号"),
};

// One array per company to keep the file small:
// [edinetCode, name, nameEn, kana, industry, secCode, corporateNumber]
const companies = rows
  .filter((row) => row[COLS.listing] === "上場" && /^E\d{5}$/.test(row[COLS.code]))
  .map((row) => [
    row[COLS.code],
    row[COLS.name],
    row[COLS.nameEn],
    row[COLS.kana],
    row[COLS.industry],
    row[COLS.secCode],
    row[COLS.corporateNumber],
  ]);

const output = {
  source: "EDINET閲覧（提出）サイト EDINETコードリスト",
  sourceUrl: "https://disclosure2.edinet-fsa.go.jp/",
  license: "PDL1.0",
  asOf,
  fields: ["edinetCode", "name", "nameEn", "kana", "industry", "secCode", "corporateNumber"],
  companies,
};

const outPath = path.join(import.meta.dirname, "..", "data", "listed-companies.json");
fs.writeFileSync(outPath, JSON.stringify(output));
console.log(`Wrote ${companies.length} listed companies (as of ${asOf}) to ${outPath}`);
