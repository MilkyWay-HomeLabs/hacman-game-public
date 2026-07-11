import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ENEMY_SPEED_MULTIPLIER,
  DEFAULT_PLAYER_SPEED_CELLS_PER_SEC,
  enemySpeedMultiplierForDifficulty,
  playerSpeedForDifficulty,
} from '../speed';

describe('playerSpeedForDifficulty', () => {
  it('scales with difficulty (easy < medium < hard)', () => {
    expect(playerSpeedForDifficulty('easy')).toBe(4);
    expect(playerSpeedForDifficulty('medium')).toBe(4.5);
    expect(playerSpeedForDifficulty('hard')).toBe(5);
  });

  it('is monotonically increasing with difficulty', () => {
    expect(playerSpeedForDifficulty('easy'))
      .toBeLessThan(playerSpeedForDifficulty('medium'));
    expect(playerSpeedForDifficulty('medium'))
      .toBeLessThan(playerSpeedForDifficulty('hard'));
  });

  it('falls back to the easy speed for an unknown difficulty', () => {
    expect(playerSpeedForDifficulty('impossible')).toBe(DEFAULT_PLAYER_SPEED_CELLS_PER_SEC);
    expect(DEFAULT_PLAYER_SPEED_CELLS_PER_SEC).toBe(4);
  });
});

describe('enemySpeedMultiplierForDifficulty', () => {
  it('scales with difficulty', () => {
    expect(enemySpeedMultiplierForDifficulty('easy')).toBe(1.25);
    expect(enemySpeedMultiplierForDifficulty('medium')).toBe(1.5);
    expect(enemySpeedMultiplierForDifficulty('hard')).toBe(1.75);
  });

  it('falls back to the medium multiplier for an unknown difficulty', () => {
    expect(enemySpeedMultiplierForDifficulty('nope')).toBe(DEFAULT_ENEMY_SPEED_MULTIPLIER);
    expect(DEFAULT_ENEMY_SPEED_MULTIPLIER).toBe(1.5);
  });
});

describe('player vs enemy speed relationship', () => {
  it('keeps the player faster than the enemy multiplier at every difficulty', () => {
    for (const difficulty of ['easy', 'medium', 'hard']) {
      expect(playerSpeedForDifficulty(difficulty))
        .toBeGreaterThan(enemySpeedMultiplierForDifficulty(difficulty));
    }
  });
});
