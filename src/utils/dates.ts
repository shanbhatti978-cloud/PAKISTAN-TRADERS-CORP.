/**
 * Date utility functions for local timezone handling (Asia/Karachi, UTC+5).
 * Prevents date rollbacks and off-by-one errors caused by converting local midnight to UTC.
 */

/**
 * Format a Date object to 'YYYY-MM-DD' in the user's local timezone.
 */
export function toLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date formatted as 'YYYY-MM-DD' in the user's local timezone.
 */
export function todayLocal(): string {
  return toLocalISODate(new Date());
}

/**
 * Parses a 'YYYY-MM-DD' string into a Date object at local midnight (not UTC).
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day);
    }
  }
  return new Date(dateStr);
}

/**
 * Adds n months to a date and clamps the day to the last day of the target month.
 * e.g., Jan 31 + 1 month with targetDay 31 clamps to Feb 28 (or Feb 29 in leap year)
 * instead of spilling over to March.
 */
export function addMonthsClamped(date: Date, n: number, targetDayOfMonth: number): Date {
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + n;
  // Day 0 of the following month gives the last day of targetMonth
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(Math.max(1, targetDayOfMonth), daysInTargetMonth);
  return new Date(targetYear, targetMonth, clampedDay);
}
