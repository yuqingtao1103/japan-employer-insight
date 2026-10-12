export function formatPercent(value: number | null | undefined): string | null {
  if (value == null) return null;
  return `${(value * 100).toFixed(1)}%`;
}

export function formatYen(value: number | null | undefined): string | null {
  if (value == null) return null;
  return `¥${Math.round(value).toLocaleString("en-US")}`;
}

export function formatNumber(value: number | null | undefined): string | null {
  if (value == null) return null;
  return Math.round(value).toLocaleString("en-US");
}
