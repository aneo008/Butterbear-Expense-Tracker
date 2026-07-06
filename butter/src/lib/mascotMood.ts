import { GameState } from '../db/types';
import { Mood } from '../constants/mascotLayers';
import { todayISO } from './date';
import { effectiveStreak } from './streak';

// Derive Butter's resting mood from game state. (worried = budget-driven,
// wired in Phase 5; not selected here yet.)
export function moodFromState(gs: GameState): Mood {
  const today = todayISO();
  const loggedToday = gs.last_log_date === today;
  if (!loggedToday) return 'sleepy';
  // logged today → effective streak equals the stored count.
  if (effectiveStreak(gs.streak_count, gs.last_log_date, today) >= 7) return 'excited';
  return 'happy';
}

// A warm, rotating speech-bubble line. Never nags.
export function speechLine(gs: GameState): string {
  const today = todayISO();
  const loggedToday = gs.last_log_date === today;
  const streak = effectiveStreak(gs.streak_count, gs.last_log_date, today);

  if (!loggedToday) {
    // Streak was alive but a day got missed — acknowledge it kindly, never nag.
    if (gs.streak_count > 0 && streak === 0) {
      const reset = [
        `Your ${gs.streak_count}-day streak paused — let's start a fresh one 🧈`,
        'A new streak begins with one little log ✨',
      ];
      return reset[Math.floor(Math.random() * reset.length)];
    }
    const waiting = [
      'Ready when you are 🧈',
      'What did we spend on today?',
      streak > 0 ? 'A little log keeps the streak alive ✨' : 'Ready when you are 🧈',
    ];
    return waiting[Math.floor(Math.random() * waiting.length)];
  }
  if (streak >= 7) {
    return `${streak}-day streak — you're on fire! 🔥`;
  }
  const cheerful = [
    'Nice work logging today! 🎉',
    'Every little bit counts 🪙',
    "I'm proud of you 🧈",
    streak > 1 ? `${streak} days in a row — lovely!` : 'Great start today!',
  ];
  return cheerful[Math.floor(Math.random() * cheerful.length)];
}
