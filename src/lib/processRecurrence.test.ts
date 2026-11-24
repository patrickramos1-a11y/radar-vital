import { describe, expect, it } from 'vitest';
import { dueOccurrences, occurrenceDate } from './processRecurrence';

describe('process recurrence', () => {
  it('distinguishes calendar months from 30-day intervals', () => {
    expect(occurrenceDate({ unit: 'months', interval: 1, startDate: '2027-01-01', dayOfMonth: 1 }, 1)).toBe('2027-02-01');
    expect(occurrenceDate({ unit: 'days', interval: 30, startDate: '2027-01-01' }, 1)).toBe('2027-01-31');
  });

  it('clamps the day for shorter months without drifting subsequent occurrences', () => {
    const rule = { unit: 'months' as const, interval: 1, startDate: '2027-01-31', dayOfMonth: 31 };
    expect(occurrenceDate(rule, 1)).toBe('2027-02-28');
    expect(occurrenceDate(rule, 2)).toBe('2027-03-31');
  });

  it('lists every due period regardless of whether earlier periods were completed', () => {
    expect(dueOccurrences({ unit: 'months', interval: 1, startDate: '2027-01-01', dayOfMonth: 1 }, '2027-03-02'))
      .toEqual(['2027-01-01', '2027-02-01', '2027-03-01']);
  });

  it('rejects invalid dates and intervals', () => {
    expect(() => occurrenceDate({ unit: 'days', interval: 0, startDate: '2027-01-01' }, 1)).toThrow();
    expect(() => occurrenceDate({ unit: 'days', interval: 30, startDate: '2027-02-30' }, 1)).toThrow();
  });
});
