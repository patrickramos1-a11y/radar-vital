export type ProcessRecurrence =
  | { unit: 'days'; interval: number; startDate: string }
  | { unit: 'months'; interval: number; startDate: string; dayOfMonth: number };

function parseDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error('Data invalida. Use AAAA-MM-DD.');
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (date.toISOString().slice(0, 10) !== value) throw new Error('Data invalida.');
  return date;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function occurrenceDate(rule: ProcessRecurrence, index: number): string {
  if (!Number.isSafeInteger(index) || index < 0) throw new Error('Indice invalido.');
  if (!Number.isSafeInteger(rule.interval) || rule.interval < 1) throw new Error('Intervalo invalido.');
  const start = parseDate(rule.startDate);

  if (rule.unit === 'days') {
    start.setUTCDate(start.getUTCDate() + index * rule.interval);
    return formatDate(start);
  }

  if (!Number.isSafeInteger(rule.dayOfMonth) || rule.dayOfMonth < 1 || rule.dayOfMonth > 31) {
    throw new Error('Dia do mes invalido.');
  }
  const targetMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index * rule.interval, 1));
  const lastDay = new Date(Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 0)).getUTCDate();
  targetMonth.setUTCDate(Math.min(rule.dayOfMonth, lastDay));
  return formatDate(targetMonth);
}

export function dueOccurrences(rule: ProcessRecurrence, throughDate: string, limit = 120): string[] {
  const through = parseDate(throughDate).getTime();
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('Limite invalido.');
  const dates: string[] = [];
  for (let index = 0; index < limit; index += 1) {
    const date = occurrenceDate(rule, index);
    if (parseDate(date).getTime() > through) break;
    if (parseDate(date).getTime() >= parseDate(rule.startDate).getTime()) dates.push(date);
  }
  return dates;
}
