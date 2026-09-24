/**
 * Display formatting.
 * Kept out of the components so numbers read the same on every screen.
 */

/** 2650 -> "2,650". Thin, locale-independent grouping. */
export function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '--';
  const fixed = value.toFixed(decimals);
  const [whole, fraction] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction ? `${grouped}.${fraction}` : grouped;
}

/** 2960 mL -> "3.0" (litres), the unit the crew actually reads. */
export function mlToLiters(ml: number, decimals = 1): string {
  return (ml / 1000).toFixed(decimals);
}

export function formatGrams(value: number): string {
  return `${formatNumber(Math.round(value))} g`;
}

export function formatKcal(value: number): string {
  return `${formatNumber(Math.round(value))} kcal`;
}

export function formatLiters(ml: number): string {
  return `${mlToLiters(ml)} L`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** Infinity-safe day count for the autonomy readout. */
export function formatDays(days: number): string {
  if (!Number.isFinite(days)) return 'illimité';
  return `${formatNumber(Math.round(days))} jours`;
}

/** Epoch ms -> "21 Sep, 14:03". */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('fr-FR', { month: 'short' });
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month}, ${hours}:${minutes}`;
}
