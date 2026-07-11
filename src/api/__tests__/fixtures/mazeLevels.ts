// Test fixtures modelled on the real API payload (see docs/API.md),
// trimmed to compact 5x5 grids so mapper output can be asserted exhaustively.

import type { MazeLevelDto } from '../../mappers/maze';

// 5x5 maze; `0` = road, `1` = wall.
//  (1,1)(2,1)(3,1) road
//  (1,2)      (3,2) road, (2,2) wall
//  (1,3)(2,3)(3,3) road
const GRID_5x5: number[][] = [
  [1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
];

export const easyLevelDto: MazeLevelDto = {
  id: 13,
  galleryId: 'a263042a-ca07-4026-9b01-538d7ffba222',
  difficulty: 'EASY',
  width: 5,
  height: 5,
  randomSeed: 4,
  placementAllowedOn: 'road',
  placementAvoidAdjWalls: false,
  cells: GRID_5x5,
  playerStartX: 1,
  playerStartY: 1,
  playerDirection: 'right',
  dots: { static: [[2, 1], [3, 1]], random_count: 0 },
  // No `style` and `notes: null` on purpose — exercises the initializer fallbacks.
  enemies: [
    { type: 'enemy', id: 'random_walker', positions: [[3, 3]], random_count: 0, notes: null },
  ],
  buffs: [
    {
      type: 'buff',
      id: 'damage',
      style: 'buff-4',
      positions: [[1, 3]],
      random_count: 0,
      effect: { id: 'buff-4', kind: 'damage', scope: 'player', durationMs: 7000, killOnTouch: true },
      rules: { pickupBy: ['player', 'enemy'], destroyOnTouch: true },
      notes: null,
    },
  ],
  debuffs: [
    {
      type: 'debuff',
      id: 'spike',
      style: 'debuff-7',
      positions: [[3, 2]],
      random_count: 0,
      effect: { id: 'debuff-7', kind: 'spike', enemy: { destroy: true }, scope: 'global', durationMs: 0 },
      rules: { pickupBy: ['player', 'enemy'], destroyOnTouch: true },
      notes: null,
    },
  ],
  notes: 'auto-generated: easy fixture',
  createdAt: '2026-07-02T15:09:56.249836+00:00',
  updatedAt: '2026-07-02T15:09:56.249836+00:00',
};

// Minimal level with no entities — exercises empty-array / missing-field fallbacks.
export const mediumLevelDto: MazeLevelDto = {
  id: 14,
  galleryId: 'a263042a-ca07-4026-9b01-538d7ffba222',
  difficulty: 'MEDIUM',
  width: 5,
  height: 5,
  randomSeed: 7,
  placementAllowedOn: 'road',
  placementAvoidAdjWalls: false,
  cells: GRID_5x5,
  playerStartX: 1,
  playerStartY: 1,
  playerDirection: 'up',
  dots: { static: [[2, 3]], random_count: 0 },
  enemies: [],
  buffs: [],
  debuffs: [],
};

export const hardLevelDto: MazeLevelDto = {
  ...mediumLevelDto,
  id: 15,
  difficulty: 'HARD',
  randomSeed: 9,
  playerDirection: 'down',
  dots: { static: [[3, 1]], random_count: 0 },
};

export const mazeLevelsDto: MazeLevelDto[] = [easyLevelDto, mediumLevelDto, hardLevelDto];
