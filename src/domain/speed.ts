// Single source of truth for movement speeds that vary by difficulty. Pure
// functions (no React, no side effects) so they can be unit-tested in isolation
// and shared by the player-movement hook and the enemy controller wiring.

import type { Difficulty } from '../types/maze';

/**
 * Base player glide speed (cells per second) per difficulty. The player is kept
 * comfortably faster than the enemies so they can be outrun, and higher
 * difficulties are quicker to keep pace with the faster enemies. The timed
 * 'speed' buff multiplies this value at runtime.
 */
const PLAYER_SPEED_CELLS_PER_SEC: Record<Difficulty, number> = {
  easy: 4,
  medium: 4.5,
  hard: 5,
};

/** Fallback player speed for an unknown difficulty (matches `easy`). */
export const DEFAULT_PLAYER_SPEED_CELLS_PER_SEC = PLAYER_SPEED_CELLS_PER_SEC.easy;

/** Player glide speed (cells/sec) for a difficulty; unknown values fall back to `easy`. */
export function playerSpeedForDifficulty(difficulty: string): number {
  return PLAYER_SPEED_CELLS_PER_SEC[difficulty as Difficulty] ?? DEFAULT_PLAYER_SPEED_CELLS_PER_SEC;
}

/** Global speed multiplier applied to every enemy, per difficulty. */
const ENEMY_SPEED_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1.25,
  medium: 1.5,
  hard: 1.75,
};

/** Fallback enemy speed multiplier for an unknown difficulty (matches `medium`). */
export const DEFAULT_ENEMY_SPEED_MULTIPLIER = ENEMY_SPEED_MULTIPLIER.medium;

/** Enemy speed multiplier for a difficulty; unknown values fall back to `medium`. */
export function enemySpeedMultiplierForDifficulty(difficulty: string): number {
  return ENEMY_SPEED_MULTIPLIER[difficulty as Difficulty] ?? DEFAULT_ENEMY_SPEED_MULTIPLIER;
}
