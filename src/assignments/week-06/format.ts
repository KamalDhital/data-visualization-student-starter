// Compact formatting keeps large dashboard numbers readable inside KPI cards.
export function formatCompact(value: number) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

// Percent values in this project are already stored on a 0-100 scale.
export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

// Used for the AI investment KPI, which represents dollars per employee.
export function formatCurrency(value: number) {
  return Intl.NumberFormat('en', {
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: 'compact',
    style: 'currency',
  }).format(value);
}
