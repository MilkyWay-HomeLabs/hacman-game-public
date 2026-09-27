import { describe, expect, it } from 'vitest';
import {
  MIN_TIMER_DURATION_SECONDS,
  elapsedMs,
  elapsedSeconds,
  formatTime,
  resolveTimeLeft,
  timerDurationForDifficulty,
} from '../score';

describe('timerDurationForDifficulty', () => {
  it('returns the base duration per known difficulty', () => {
    expect(timerDurationForDifficulty('easy')).toBe(600);
    expect(timerDurationForDifficulty('medium')).toBe(300);
    expect(timerDurationForDifficulty('hard')).toBe(360);
  });

  it('falls back to easy for an unknown difficulty', () => {
    expect(timerDurationForDifficulty('impossible')).toBe(600);
  });

  it('never returns less than the minimum', () => {
    expect(MIN_TIMER_DURATION_SECONDS).toBe(30);
    // All configured durations are above the floor, so the floor only matters as a guarantee.
    expect(timerDurationForDifficulty('hard')).toBeGreaterThanOrEqual(MIN_TIMER_DURATION_SECONDS);
  });
});

describe('elapsedSeconds / elapsedMs', () => {
  it('derives elapsed time from duration minus remaining', () => {
    expect(elapsedSeconds(600, 540)).toBe(60);
    expect(elapsedMs(600, 540)).toBe(60_000);
  });

  it('clamps to zero when remaining exceeds duration', () => {
    expect(elapsedSeconds(300, 400)).toBe(0);
    expect(elapsedMs(300, 400)).toBe(0);
  });

  it('is zero at the start of a level', () => {
    expect(elapsedSeconds(600, 600)).toBe(0);
    expect(elapsedMs(600, 600)).toBe(0);
  });
});

describe('formatTime', () => {
  it('formats whole seconds as m:ss with a zero-padded seconds field', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(600)).toBe('10:00');
  });
});

describe('resolveTimeLeft', () => {
  it('returns null before the timer has started and no time is on the clock', () => {
    expect(resolveTimeLeft(false, 0)).toBeNull();
  });

  it('returns the remaining seconds once the timer has started', () => {
    expect(resolveTimeLeft(true, 0)).toBe(0);
    expect(resolveTimeLeft(true, 120)).toBe(120);
  });

  it('returns the remaining seconds when time is still on the clock even if not marked started', () => {
    expect(resolveTimeLeft(false, 120)).toBe(120);
  });
});
