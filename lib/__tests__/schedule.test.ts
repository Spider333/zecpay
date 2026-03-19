import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getNextPayrollDate, isPayrollDue, formatSchedule } from '../schedule';
import { PayrollSchedule } from '../types';

describe('getNextPayrollDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Use local midnight to avoid timezone issues
    vi.setSystemTime(new Date(2026, 2, 19)); // March 19, 2026 local
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns next biweekly date from start', () => {
    const schedule: PayrollSchedule = { startDate: '2026-03-01', frequency: 'biweekly' };
    const next = getNextPayrollDate(schedule);
    // Mar 1 + 14 = Mar 15 (past), + 14 = Mar 29
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(2); // March
    expect(next.getDate()).toBe(29);
  });

  it('returns next monthly date', () => {
    const schedule: PayrollSchedule = { startDate: '2026-01-15', frequency: 'monthly' };
    const next = getNextPayrollDate(schedule);
    // Jan 15 → Feb 15 → Mar 15 (past) → Apr 15
    expect(next.getMonth()).toBe(3); // April
    expect(next.getDate()).toBe(15);
  });

  it('returns start date if it is in the future', () => {
    const schedule: PayrollSchedule = { startDate: '2026-04-01', frequency: 'monthly' };
    const next = getNextPayrollDate(schedule);
    expect(next.getMonth()).toBe(3); // April
    expect(next.getDate()).toBe(1);
  });

  it('handles custom interval', () => {
    const schedule: PayrollSchedule = { startDate: '2026-03-10', frequency: 'custom', customDays: 7 };
    const next = getNextPayrollDate(schedule);
    // Mar 10 + 7 = Mar 17 (past), + 7 = Mar 24
    expect(next.getMonth()).toBe(2); // March
    expect(next.getDate()).toBe(24);
  });
});

describe('isPayrollDue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 15)); // March 15, 2026 local
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true when next date equals today', () => {
    const schedule: PayrollSchedule = { startDate: '2026-03-01', frequency: 'biweekly' };
    // Mar 1 + 14 = Mar 15 = today
    expect(isPayrollDue(schedule)).toBe(true);
  });

  it('returns false when already processed this cycle', () => {
    const schedule: PayrollSchedule = {
      startDate: '2026-03-01',
      frequency: 'biweekly',
      lastProcessedDate: '2026-03-15',
    };
    expect(isPayrollDue(schedule)).toBe(false);
  });

  it('returns false when next date is in the future', () => {
    const schedule: PayrollSchedule = { startDate: '2026-03-20', frequency: 'monthly' };
    expect(isPayrollDue(schedule)).toBe(false);
  });
});

describe('formatSchedule', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 19)); // March 19, 2026 local
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats biweekly schedule', () => {
    const schedule: PayrollSchedule = { startDate: '2026-03-01', frequency: 'biweekly' };
    const formatted = formatSchedule(schedule);
    expect(formatted).toMatch(/Biweekly, next: Mar 29/);
  });

  it('formats monthly schedule', () => {
    const schedule: PayrollSchedule = { startDate: '2026-01-15', frequency: 'monthly' };
    const formatted = formatSchedule(schedule);
    expect(formatted).toMatch(/Monthly, next:/);
  });

  it('formats custom schedule', () => {
    const schedule: PayrollSchedule = { startDate: '2026-03-01', frequency: 'custom', customDays: 10 };
    const formatted = formatSchedule(schedule);
    expect(formatted).toMatch(/Every 10 days, next:/);
  });
});
