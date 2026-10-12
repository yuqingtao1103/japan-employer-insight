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
  E34064: [
    {
      metric: "gender_pay_gap_all",
      value: 0.7074,
      fiscalYear: 2026,
      docId: "S100Z2BE",
      note: "労働者の男女の賃金の差異 29.26% reported as a gap; ratio = 100 − 29.26",
    },
  ],
};

export function getCorrections(edinetCode: string): Correction[] {
  return CORRECTIONS[edinetCode] ?? [];
}
