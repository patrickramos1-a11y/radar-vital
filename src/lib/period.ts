/**
 * Shared period vocabulary for history and performance views, so every
 * period selector in the Central uses the same options and the same rules.
 */
export type PeriodKey = 'month' | '30d' | '90d' | 'year' | 'all';

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'month', label: 'Este mês' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: 'year', label: 'Este ano' },
  { value: 'all', label: 'Tudo' },
];

const DAY_MS = 86_400_000;

/** First instant (ms) included in the period, or null when it has no lower bound. */
export function periodStart(period: PeriodKey, now: Date = new Date()): number | null {
  switch (period) {
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    case 'year':
      return new Date(now.getFullYear(), 0, 1).getTime();
    case '30d':
      return now.getTime() - 30 * DAY_MS;
    case '90d':
      return now.getTime() - 90 * DAY_MS;
    default:
      return null;
  }
}

/**
 * Whether a timestamp falls inside the period. A missing timestamp counts as
 * inside, matching how records without a completion date were always shown.
 */
export function isInPeriod(
  value: string | null | undefined,
  period: PeriodKey,
  now: Date = new Date(),
): boolean {
  const start = periodStart(period, now);
  if (start === null || !value) return true;
  const time = new Date(value).getTime();
  return Number.isNaN(time) || time >= start;
}
