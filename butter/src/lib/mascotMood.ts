import { GameState } from '../db/types';
import { Mood } from '../constants/mascotSvgs';
import { todayISO } from './date';

// Derive Butter's resting mood from game state. (worried = budget-driven,
// wired in Phase 5; not selected here yet.)
export function moodFromState(gs: GameState): Mood {
  const loggedToday = gs.last_log_date === todayISO();
  if (!loggedToday) return 'sleepy';
  if (gs.streak_count >= 7) return 'excited';
  return 'happy';
}

// A warm, rotating speech-bubble line. Never nags.
export function speechLine(gs: GameState): string {
  const loggedToday = gs.last_log_date === todayISO();
  const streak = gs.streak_count;

  if (!loggedToday) {
    const waiting = [
      'Ready when you are 🧈',
      'What did we spend on today?',
      'A little log keeps the streak alive ✨',
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
