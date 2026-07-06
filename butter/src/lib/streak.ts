import { addDaysISO } from './date';

// Single source of truth for the streak economy: multiplier tiers, the daily
// coin cap, and one-time milestone bonus chests. The reward logic (db/queries)
// AND the popups (StreakSheet / DailyCapSheet) both import from here, so the
// numbers a user sees always match what's actually awarded.

export type StreakTier = { days: number; mult: number };

// Coin multiplier grows with the unbroken daily-log streak. A missed day resets
// the streak (and therefore the multiplier) — that loss is the daily-return hook.
export const STREAK_TIERS: StreakTier[] = [
  { days: 0,   mult: 1.0 },
  { days: 3,   mult: 1.2 },
  { days: 7,   mult: 1.5 },
  { days: 14,  mult: 2.0 },
  { days: 30,  mult: 2.5 },
  { days: 100, mult: 3.0 },
];

export const BASE_PER_LOG = 5;     // coins per logged expense (before multiplier)
export const FIRST_LOG_BONUS = 10; // extra on the first log of each day
export const DAILY_BASE_CAP = 60;  // cap at ×1.0; scales with the multiplier

// The streak the user actually has RIGHT NOW. The stored `streak_count` only resets
// on the next log, so between a missed day and that log it is stale. This returns 0
// once a day has been missed (last log is neither today nor yesterday) — matching
// what the next log will really pay (×1.0, streak → 1). Use it for anything DISPLAYED;
// the reward logic in db/queries already resets correctly on write.
export function effectiveStreak(streakCount: number, lastLogDate: string | null, today: string): number {
  if (!lastLogDate) return 0;
  if (lastLogDate === today || lastLogDate === addDaysISO(today, -1)) return streakCount;
  return 0;
}

// Current coin multiplier for a streak length.
export function streakMultiplier(streak: number): number {
  let mult = STREAK_TIERS[0].mult;
  for (const t of STREAK_TIERS) if (streak >= t.days) mult = t.mult;
  return mult;
}

// The next tier above the current streak, or null once at the top tier.
export function nextTier(streak: number): StreakTier | null {
  return STREAK_TIERS.find(t => t.days > streak) ?? null;
}

// Daily coin cap scales with the multiplier (60 → 180), so a long streak both
// earns more per log AND can bank more per day.
export function dailyCap(streak: number): number {
  return Math.round(DAILY_BASE_CAP * streakMultiplier(streak));
}

// Coins for one logged expense at the given streak (before the daily-cap clamp).
export function coinsForLog(streak: number, isFirstLogToday: boolean): number {
  const subtotal = BASE_PER_LOG + (isFirstLogToday ? FIRST_LOG_BONUS : 0);
  return Math.round(subtotal * streakMultiplier(streak));
}

// One-time milestone bonus chests (coins), keyed by the streak day reached.
// Paid IN FULL on top of the daily cap — they are NOT counted toward the day's
// capped earnings, so a chest never suppresses same-day coin income.
export const MILESTONE_CHESTS: Record<number, number> = {
  3: 25, 7: 50, 14: 100, 30: 250, 50: 400, 100: 750, 200: 1500, 365: 3000,
};

// Chest coins awarded for reaching exactly this streak day (0 if not a milestone).
export function chestFor(streak: number): number {
  return MILESTONE_CHESTS[streak] ?? 0;
}

// New players start with a small welcome grant so the first item is buyable on
// day one.
export const WELCOME_GRANT = 50;
