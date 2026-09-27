// Utilities for dot collection to avoid double counting and races
import type { Dispatch, SetStateAction } from 'react';

/**
 * Atomically remove provided dot keys from the active set.
 * Returns the number of actually removed dots (keys that existed).
 */
export function removeDotKeys(
  setActiveDots: Dispatch<SetStateAction<Set<string>>>,
  keys: string[]
): number {
  let removed = 0;
  setActiveDots(prev => {
    const next = new Set(prev);
    for (const k of keys) {
      if (next.delete(k)) removed += 1;
    }
    return next;
  });
  return removed;
}

/**
 * Helper to remove a single dot key and report if it was removed.
 */
export function removeDotKey(
  setActiveDots: Dispatch<SetStateAction<Set<string>>>,
  key: string
): boolean {
  return removeDotKeys(setActiveDots, [key]) > 0;
}
