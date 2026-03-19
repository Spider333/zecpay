import { PayrollSchedule } from './types';

/** Parse YYYY-MM-DD to year/month/day numbers (no timezone shift) */
function parseDate(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m: m - 1, d }; // month is 0-indexed for Date constructor
}

function toLocalMidnight(iso: string): Date {
  const { y, m, d } = parseDate(iso);
  return new Date(y, m, d);
}

function todayMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getNextPayrollDate(schedule: PayrollSchedule): Date {
  const start = toLocalMidnight(schedule.startDate);
  const now = todayMidnight();

  let cursor = new Date(start);

  const stepDays = schedule.frequency === 'biweekly'
    ? 14
    : schedule.frequency === 'custom'
      ? (schedule.customDays ?? 30)
      : 0; // monthly handled separately

  while (cursor < now) {
    if (schedule.frequency === 'monthly') {
      cursor.setMonth(cursor.getMonth() + 1);
    } else {
      cursor.setDate(cursor.getDate() + stepDays);
    }
  }

  return cursor;
}

export function isPayrollDue(schedule: PayrollSchedule): boolean {
  const next = getNextPayrollDate(schedule);
  const today = todayMidnight();

  if (next > today) return false;

  // Already processed this cycle?
  if (schedule.lastProcessedDate) {
    const lastProcessed = toLocalMidnight(schedule.lastProcessedDate);
    if (lastProcessed >= next) return false;
  }

  return true;
}

export function formatSchedule(schedule: PayrollSchedule): string {
  const next = getNextPayrollDate(schedule);
  const nextStr = next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  switch (schedule.frequency) {
    case 'biweekly':
      return `Biweekly, next: ${nextStr}`;
    case 'monthly':
      return `Monthly, next: ${nextStr}`;
    case 'custom':
      return `Every ${schedule.customDays ?? 30} days, next: ${nextStr}`;
  }
}
