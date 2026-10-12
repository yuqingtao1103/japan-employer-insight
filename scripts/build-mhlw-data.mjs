// Builds data/mhlw-workplace.json from the MHLW "女性の活躍推進企業データベース"
// open data CSV (UTF-8, no BOM): https://positive-ryouritsu.mhlw.go.jp/positivedb/opendata/
//
// Usage: node scripts/build-mhlw-data.mjs <path-to-csv> <data-as-of YYYY-MM-DD>
//
// The open data is published under the Government of Japan Standard Terms of
// Use (compatible with CC BY 4.0), so the processed subset can be committed
// as long as the source is credited.

import fs from "node:fs";
import path from "node:path";

const [csvPath, asOf] = process.argv.slice(2);
if (!csvPath || !/^\d{4}-\d{2}-\d{2}$/.test(asOf ?? "")) {
  console.error("Usage: node scripts/build-mhlw-data.mjs <csv> <YYYY-MM-DD>");
  process.exit(1);
}

// Minimal RFC 4180 parser: handles quoted fields, escaped quotes and newlines.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const [header, ...rows] = parseCsv(fs.readFileSync(csvPath, "utf8"));

// Several headers repeat (e.g. "女性(%)" per employment category), so columns
// are located by the first header that starts with the given prefix.
function col(prefix) {
  const index = header.findIndex((h) => h.startsWith(prefix));
  if (index === -1) throw new Error(`Column not found: ${prefix}`);
  return index;
}

const COLS = {
  name: col("企業名"),
  corporateNumber: col("法人番号"),
  size: col("企業規模"),
  secCode: col("証券コード"),
  eruboshi: col("企業認定等-えるぼし"),
  platinumEruboshi: col("企業認定等-プラチナえるぼし"),
  kurumin: col("企業認定等-くるみん認定"),
  platinumKurumin: col("企業認定等-プラチナくるみん認定"),
  maleParentalLeave: col("5.男女別の育児休業取得率-男性(%)"),
  overtimeHours: col("6.一月当たりの労働者の平均残業時間-平均残業時間(時間)"),
  paidLeave: col("8.(1)年次有給休暇の取得率-対象労働者(%)"),
  paidLeaveByCategory: col("8.(2)年次有給休暇の取得率(区)-有給休暇取得率(%)"),
  femaleManagers: col("10.管理職に占める女性労働者の割合-割合(%)"),
  femaleBoard: col("11.役員に占める女性の割合-割合(%)"),
  payAll: col("14.男女の賃金の差異1-全労働者(%)"),
  payRegular: col("14.男女の賃金の差異2-うち正規雇用労働者(%)"),
  payNonregular: col("14.男女の賃金の差異3-うち非正規雇用労働者(%)"),
  payPeriod: col("14.対象期間"),
  dataAsOf: col("16.データ集計時点-データ集計時点"),
  flextime: col("フレックスタイム制度"),
  telework: col("在宅勤務・テレワーク"),
  updated: col("データの最終更新日"),
};

// Female manager ratio and pay gap disclosure is mandatory from 301 employees.
// Smaller companies, and companies without any of the figures we use, are
// skipped to keep the file small.
const SIZES = new Set(["301～500人", "501～1000人", "1001～5000人", "5001人以上"]);
const FIGURES = [
  "maleParentalLeave",
  "overtimeHours",
  "paidLeave",
  "femaleManagers",
  "femaleBoard",
  "payAll",
];

const text = (row, key) => (row[COLS[key]] ?? "").trim();

// Percentages become decimal ratios (52.6 -> 0.526) to match EDINET DB.
function ratio(row, key) {
  const value = Number.parseFloat(text(row, key));
  return Number.isFinite(value) ? Math.round(value * 10) / 1000 : undefined;
}

function number(row, key) {
  const value = Number.parseFloat(text(row, key));
  return Number.isFinite(value) ? value : undefined;
}

// Values look like "認定あり【青色】", "プラス認定あり", "認定なし" or "未選定".
// "2025年4月1日～2026年3月31日" -> "2025-04/2026-03"; "2026年3月時点" -> "2026-03".
function yearMonths(value) {
  const parts = [...value.matchAll(/(\d{4})年(\d{1,2})月/g)].map(
    ([, y, m]) => `${y}-${m.padStart(2, "0")}`,
  );
  return parts.length ? parts.join("/") : undefined;
}

// "2026年07月14日" -> "2026-07-14"
function isoDate(value) {
  const m = value.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : undefined;
}

const certified = (value) => value.startsWith("認定あり") || value.startsWith("プラス認定あり");

const companies = {};
let skipped = 0;
for (const row of rows) {
  const corporateNumber = text(row, "corporateNumber");
  if (!/^\d{13}$/.test(corporateNumber) || !SIZES.has(text(row, "size"))) {
    skipped++;
    continue;
  }
  // "認定段階３" -> 3 (full-width digit).
  const eruboshiMatch = text(row, "eruboshi").match(/認定段階([１２３123])/);
  const eruboshiLevel = eruboshiMatch ? "１２３".indexOf(eruboshiMatch[1]) + 1 || Number(eruboshiMatch[1]) : NaN;
  const entry = {
    maleParentalLeave: ratio(row, "maleParentalLeave"),
    overtimeHours: number(row, "overtimeHours"),
    paidLeave: ratio(row, "paidLeave") ?? ratio(row, "paidLeaveByCategory"),
    femaleManagers: ratio(row, "femaleManagers"),
    femaleBoard: ratio(row, "femaleBoard"),
    payAll: ratio(row, "payAll"),
    payRegular: ratio(row, "payRegular"),
    payNonregular: ratio(row, "payNonregular"),
    payPeriod: yearMonths(text(row, "payPeriod")),
    dataAsOf: yearMonths(text(row, "dataAsOf")),
    updated: isoDate(text(row, "updated")),
    telework: text(row, "telework") !== "" || undefined,
    flextime: text(row, "flextime") !== "" || undefined,
    eruboshi: certified(text(row, "platinumEruboshi"))
      ? "platinum"
      : Number.isFinite(eruboshiLevel)
        ? eruboshiLevel
        : undefined,
    kurumin: certified(text(row, "platinumKurumin"))
      ? "platinum"
      : certified(text(row, "kurumin")) || undefined,
  };
  if (!FIGURES.some((key) => entry[key] !== undefined)) {
    skipped++;
    continue;
  }
  // Keep the most recently updated entry if a company appears twice.
  const existing = companies[corporateNumber];
  if (!existing || (entry.updated ?? "") > (existing.updated ?? "")) {
    companies[corporateNumber] = entry;
  }
}

const output = {
  source: "女性の活躍推進企業データベースオープンデータ",
  sourceUrl: "https://positive-ryouritsu.mhlw.go.jp/positivedb/opendata/",
  asOf,
  companies,
};

const outPath = path.join(import.meta.dirname, "..", "data", "mhlw-workplace.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(output));
console.log(
  `Wrote ${Object.keys(companies).length} companies (${skipped} rows skipped) to ${outPath}`,
);
