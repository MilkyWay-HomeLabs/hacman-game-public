import { afterEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  type MazeLevelDto,
  mapMazeLevel,
  toInternalDifficulty,
} from '../mappers/maze';
import { useGameInitializer } from '../../hooks/useGameInitializer';
import { easyLevelDto } from './fixtures/mazeLevels';

describe('toInternalDifficulty', () => {
  it('lowercases API difficulty casing', () => {
    expect(toInternalDifficulty('EASY')).toBe('easy');
    expect(toInternalDifficulty('MEDIUM')).toBe('medium');
    expect(toInternalDifficulty('HARD')).toBe('hard');
  });
});

describe('mapMazeLevel', () => {
  it('renames and nests scalar fields per Appendix A', () => {
    const maze = mapMazeLevel(easyLevelDto);

    expect(maze.width).toBe(5);
    expect(maze.height).toBe(5);
    expect(maze.random_seed).toBe(4);
    expect(maze.difficulty).toBe('easy');
    expect(maze.player).toEqual({ start_position: { x: 1, y: 1 }, direction: 'right' });
    expect(maze.placement_rules).toEqual({ allowed_on: 'road', avoid_adjacent_walls: false });
    expect(maze.cells).toBe(easyLevelDto.cells);
  });

  it('converts [x,y] tuples to {x,y} for dots, enemies, buffs and debuffs', () => {
    const maze = mapMazeLevel(easyLevelDto);

    expect(maze.dots.static_positions).toEqual([{ x: 2, y: 1 }, { x: 3, y: 1 }]);
    expect(maze.dots.random_count).toBe(0);
    expect(maze.enemies[0].static_positions).toEqual([{ x: 3, y: 3 }]);
    expect(maze.buffs[0].static_positions).toEqual([{ x: 1, y: 3 }]);
    expect(maze.debuffs[0].static_positions).toEqual([{ x: 3, y: 2 }]);
  });

  it('preserves entity metadata (effect/rules/style) and maps null notes to undefined', () => {
    const maze = mapMazeLevel(easyLevelDto);

    expect(maze.enemies[0].notes).toBeUndefined();
    expect(maze.enemies[0].style).toBeUndefined();
    expect(maze.buffs[0].style).toBe('buff-4');
    expect(maze.buffs[0].effect).toEqual(easyLevelDto.buffs[0].effect);
    expect(maze.buffs[0].rules).toEqual({ pickupBy: ['player', 'enemy'], destroyOnTouch: true });
    expect(maze.debuffs[0].effect).toEqual(easyLevelDto.debuffs[0].effect);
  });

  it('defaults a missing debuff effect to an empty object', () => {
    const dto: MazeLevelDto = {
      ...easyLevelDto,
      debuffs: [{ type: 'debuff', id: 'x', positions: [[1, 3]], random_count: 0 }],
    };

    expect(mapMazeLevel(dto).debuffs[0].effect).toEqual({});
  });

  it('tolerates absent entity arrays', () => {
    const dto = { ...easyLevelDto } as Partial<MazeLevelDto> as MazeLevelDto;
    // Simulate a payload omitting optional collections.
    delete (dto as { enemies?: unknown }).enemies;
    delete (dto as { buffs?: unknown }).buffs;

    const maze = mapMazeLevel(dto);
    expect(maze.enemies).toEqual([]);
    expect(maze.buffs).toEqual([]);
  });
});

describe('byte-compatibility with useGameInitializer', () => {
  afterEach(() => {
    delete (globalThis as { __TEST_MAZE_MODULE?: unknown }).__TEST_MAZE_MODULE;
  });

  it('mapped MazeData initializes the game exactly as the engine expects', () => {
    const maze = mapMazeLevel(easyLevelDto);
    (globalThis as { __TEST_MAZE_MODULE?: unknown }).__TEST_MAZE_MODULE = { testMaze: maze };

    const { result } = renderHook(() => useGameInitializer());
    const state = result.current;

    expect(state.mazeData).toBe(maze);
    expect(state.difficulty).toBe('easy');
    expect(state.timerDuration).toBe(10 * 60); // easy → 10 minutes
    expect(state.initialTotalDots).toBe(2);
    expect(state.activeDots.has('2-1')).toBe(true);
    expect(state.activeDots.has('3-1')).toBe(true);
    // Enemy has no style → default style for an unknown type.
    expect(state.enemyPositions.get('3-3')).toBe('enemy-3');
    expect(state.buffPositions.get('1-3')).toBe('buff-4');
    expect(state.debuffPositions.get('3-2')).toBe('debuff-7');
    expect(state.buffMetaAt.get('1-3')).toBe(maze.buffs[0]);
  });
});
