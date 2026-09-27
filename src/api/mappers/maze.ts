// Mapping from the Hacman API maze DTO to the internal `MazeData` consumed by the game.
// See docs/API.md for the maze DTO shape and field contract.

import type {
  Buff,
  Debuff,
  Difficulty,
  EffectSpec,
  Enemy,
  MazeData,
  Position,
} from '../../types/maze';

export type ApiDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

/** `[x, y]` tuple as returned by the API for every placement. */
export type PositionTuple = [number, number];

interface DotsDto {
  static: PositionTuple[];
  random_count: number;
}

interface EnemyDto {
  type: string;
  id: string;
  style?: string;
  positions: PositionTuple[];
  random_count: number;
  notes?: string | null;
}

interface BuffDto {
  type: string;
  id: string;
  style?: string;
  positions: PositionTuple[];
  random_count: number;
  effect?: EffectSpec;
  rules?: Buff['rules'];
  notes?: string | null;
}

interface DebuffDto {
  type: string;
  id: string;
  style?: string;
  positions: PositionTuple[];
  random_count: number;
  effect?: EffectSpec;
  rules?: Debuff['rules'];
  notes?: string | null;
}

export interface MazeLevelDto {
  id: number;
  galleryId: string;
  difficulty: ApiDifficulty;
  width: number;
  height: number;
  randomSeed: number;
  placementAllowedOn: 'road' | 'wall';
  placementAvoidAdjWalls: boolean;
  cells: number[][];
  playerStartX: number;
  playerStartY: number;
  playerDirection: 'up' | 'down' | 'left' | 'right';
  dots: DotsDto;
  enemies: EnemyDto[];
  buffs: BuffDto[];
  debuffs: DebuffDto[];
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** API → internal difficulty casing (`"EASY"` → `"easy"`). */
export function toInternalDifficulty(difficulty: ApiDifficulty): Difficulty {
  return difficulty.toLowerCase() as Difficulty;
}

/** Internal → API difficulty casing (`"easy"` → `"EASY"`), used in the score payload. */
export function toApiDifficulty(difficulty: Difficulty): ApiDifficulty {
  return difficulty.toUpperCase() as ApiDifficulty;
}

/** `[x, y]` tuple → `{ x, y }`. */
const toPos = ([x, y]: PositionTuple): Position => ({ x, y });

function mapEnemy(dto: EnemyDto): Enemy {
  return {
    type: dto.type,
    id: dto.id,
    style: dto.style,
    static_positions: (dto.positions ?? []).map(toPos),
    random_count: dto.random_count,
    notes: dto.notes ?? undefined,
  };
}

function mapBuff(dto: BuffDto): Buff {
  return {
    type: dto.type,
    id: dto.id,
    style: dto.style,
    static_positions: (dto.positions ?? []).map(toPos),
    random_count: dto.random_count,
    effect: dto.effect,
    rules: dto.rules,
  };
}

function mapDebuff(dto: DebuffDto): Debuff {
  return {
    type: dto.type,
    id: dto.id,
    style: dto.style,
    static_positions: (dto.positions ?? []).map(toPos),
    random_count: dto.random_count,
    effect: dto.effect ?? {},
    rules: dto.rules,
  };
}

/** Map a single API maze level to the internal `MazeData` shape. */
export function mapMazeLevel(dto: MazeLevelDto): MazeData {
  return {
    width: dto.width,
    height: dto.height,
    random_seed: dto.randomSeed,
    difficulty: toInternalDifficulty(dto.difficulty),
    player: {
      start_position: { x: dto.playerStartX, y: dto.playerStartY },
      direction: dto.playerDirection,
    },
    placement_rules: {
      allowed_on: dto.placementAllowedOn,
      avoid_adjacent_walls: dto.placementAvoidAdjWalls,
    },
    cells: dto.cells,
    enemies: (dto.enemies ?? []).map(mapEnemy),
    buffs: (dto.buffs ?? []).map(mapBuff),
    debuffs: (dto.debuffs ?? []).map(mapDebuff),
    dots: {
      static_positions: (dto.dots?.static ?? []).map(toPos),
      random_count: dto.dots?.random_count ?? 0,
    },
  };
}
