export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatYen(value: number): string {
  return `¥${Math.round(value).toLocaleString("en-US")}`;
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}
