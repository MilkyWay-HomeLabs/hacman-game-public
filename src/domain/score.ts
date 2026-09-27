// Single source of truth for the game's time/score arithmetic. These are pure functions
// (no React, no side effects) so they can be unit-tested in isolation and reused by the
// initializer, the play UI, and the score-submission path.

/** Base countdown per difficulty, in seconds. */
const BASE_DURATIONS_SECONDS: Record<string, number> = {
  easy: 10 * 60, // 10 minutes
  medium: 5 * 60, // 5 minutes
  hard: 6 * 60, // 6 minutes
};

/** Minimum countdown length regardless of difficulty. */
export const MIN_TIMER_DURATION_SECONDS = 30;

/**
 * Countdown duration (seconds) for a difficulty, floored at {@link MIN_TIMER_DURATION_SECONDS}.
 * Unknown difficulties fall back to `easy`, matching the initializer's default.
 */
export function timerDurationForDifficulty(difficulty: string): number {
  const base = BASE_DURATIONS_SECONDS[difficulty] ?? BASE_DURATIONS_SECONDS.easy;
  return Math.max(MIN_TIMER_DURATION_SECONDS, base);
}

/**
 * Elapsed play time in seconds, derived from the countdown: the configured duration
 * minus the remaining time. Never negative.
 */
export function elapsedSeconds(timerDuration: number, timerSeconds: number): number {
  return Math.max(0, timerDuration - timerSeconds);
}

/** Elapsed play time in milliseconds — the value submitted to the score API. */
export function elapsedMs(timerDuration: number, timerSeconds: number): number {
  return elapsedSeconds(timerDuration, timerSeconds) * 1000;
}

/** Format a whole-second count as `m:ss` (e.g. 65 → `1:05`). */
export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * The time-left value to display: the remaining seconds once the timer has started
 * (or still has time on the clock), otherwise `null` (no timer shown yet).
 */
export function resolveTimeLeft(timerStarted: boolean, timerSeconds: number): number | null {
  return timerStarted || timerSeconds > 0 ? timerSeconds : null;
}
