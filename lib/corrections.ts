import type { MetricKey } from "@/lib/metrics";

// Figures read by hand from the securities report when the automated data is
// missing or wrong. Each entry must cite the filing (EDINET doc ID) it comes from.
type Correction = {
  metric: MetricKey;
  value: number; // decimal ratio, like EDINET DB
  fiscalYear: number;
  docId: string;
  note: string;
};

const CORRECTIONS: Record<string, Correction[]> = {
  // Shiseido FY2025: male parental leave is in the report but not in EDINET DB or MHLW data.
  E00990: [
    {
      metric: "male_parental_leave_ratio",
      value: 0.911,
      fiscalYear: 2025,
      docId: "S100XSCU",
      note: "男性労働者の育児休業取得率 91.1%",
    },
  ],
  // Mercari FY2026 reports the pay gap as a difference (29.26%), not a ratio.
  // Paid leave: the report has FY2026; MHLW data still shows FY2025 (75.1%).
  E34064: [
    {
      metric: "gender_pay_gap_all",
      value: 0.7074,
      fiscalYear: 2026,
      docId: "S100Z2BE",
      note: "労働者の男女の賃金の差異 29.26% reported as a gap; ratio = 100 − 29.26",
    },
    {
      metric: "paid_leave_ratio",
      value: 0.834,
      fiscalYear: 2026,
      docId: "S100Z2BE",
      note: "年次有給休暇の取得率 83.4%（2026年6月期）",
    },
  ],
  // Astellas FY2026: EDINET DB misses male parental leave; MHLW shows 82.8%,
  // but the securities report states 72.7%.
  E00920: [
    {
      metric: "male_parental_leave_ratio",
      value: 0.727,
      fiscalYear: 2026,
      docId: "S100YBPK",
      note: "男性労働者の育児休業等取得率 72.7%",
    },
  ],
  // LY Corporation FY2026: male parental leave is in the report only.
  E05000: [
    {
      metric: "male_parental_leave_ratio",
      value: 1.0,
      fiscalYear: 2026,
      docId: "S100YBXD",
      note: "男性労働者の育児休業取得率 100.0%",
    },
  ],
  // Oriental Land FY2026: not in MHLW data; the report's human capital
  // section gives overtime and paid leave for regular employees.
  E04707: [
    {
      metric: "overtime_hours",
      value: 14.08,
      fiscalYear: 2026,
      docId: "S100YCJX",
      note: "月の所定外労働時間 14時間05分",
    },
    {
      metric: "paid_leave_ratio",
      value: 0.995,
      fiscalYear: 2026,
      docId: "S100YCJX",
      note: "有給休暇取得率（社員）99.5%",
    },
  ],
};

export function getCorrections(edinetCode: string): Correction[] {
  return CORRECTIONS[edinetCode] ?? [];
}
