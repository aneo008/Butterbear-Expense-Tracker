// Local-time date helpers. We deliberately avoid toISOString() (which is UTC)
// so "today" matches the user's wall clock — e.g. an entry logged at 1am in
// SGT must count as today, not yesterday's UTC date.

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Format a Date as a local YYYY-MM-DD string. */
export function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today as a local YYYY-MM-DD string. */
export function todayISO(): string {
  return dateToISO(new Date());
}

/** Parse a YYYY-MM-DD string into a local Date at midnight. */
export function isoToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** Add (or subtract) days to a YYYY-MM-DD string, returning a new one. */
export function addDaysISO(iso: string, days: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + days);
  return dateToISO(d);
}

/** Current month as a local YYYY-MM string. */
export function currentMonth(): string {
  return todayISO().slice(0, 7);
}

/**
 * Build a continuous list of YYYY-MM strings from `start` through `end`
 * (inclusive), oldest first. If start is null/after end, returns just [end].
 */
export function monthRange(start: string | null, end: string): string[] {
  if (!start || start > end) return [end];
  const months: string[] = [];
  let [y, m] = start.split('-').map(Number);
  const [endY, endM] = end.split('-').map(Number);
  while (y < endY || (y === endY && m <= endM)) {
    months.push(`${y}-${m < 10 ? '0' + m : m}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return months;
}

/** Compact month label for the strip, e.g. "May '26". */
export function formatMonthShort(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const name = new Date(y, m - 1, 1).toLocaleDateString('en-SG', { month: 'short' });
  return `${name} '${String(y).slice(2)}`;
}

/** Full month label, e.g. "May 2026". */
export function formatMonthLong(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-SG', { month: 'long', year: 'numeric' });
}

/** Weekday abbreviation for a YYYY-MM-DD string, e.g. "Sun". */
export function weekday(iso: string): string {
  return isoToDate(iso).toLocaleDateString('en-SG', { weekday: 'short' });
}

/**
 * Human-friendly label with a weekday, e.g. "Today (Sun)", "Yesterday (Sat)",
 * or "31 May (Sun)". When `withYear` is set, the absolute form includes the year.
 */
export function formatDateLabel(iso: string, withYear = false): string {
  const today = todayISO();
  const dow = weekday(iso);
  if (iso === today) return `Today (${dow})`;
  if (iso === addDaysISO(today, -1)) return `Yesterday (${dow})`;
  const dm = isoToDate(iso).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
  return `${dm} (${dow})`;
}
