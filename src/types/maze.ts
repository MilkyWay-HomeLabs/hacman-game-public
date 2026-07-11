export interface Position {
  x: number;
  y: number;
}

/** Internal difficulty casing (the API uses UPPERCASE — see the maze mapper). */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * Runtime effect payload attached to buffs and debuffs. The API returns a richer
 * object than the game strictly consumes, so known fields are typed and the index
 * signature keeps any extra keys accessible without `any`.
 */
export interface EffectSpec {
  id?: string;
  kind?: string;
  scope?: 'player' | 'global' | string;
  durationMs?: number;
  killOnTouch?: boolean;
  speedMultiplier?: number;
  enemy?: { destroy?: boolean; rustStack?: number; [key: string]: unknown };
  [key: string]: unknown;
}

export interface Player {
  start_position: Position;
  direction: 'up' | 'down' | 'left' | 'right';
}

export interface Enemy {
  type: string;
  id: string;
  static_positions: Position[];
  random_count: number;
  notes?: string;
  /**
   * Optional CSS style class for this enemy. Should match a class from style/Enemies.css, e.g. "enemy-1".
   */
  style?: string;
}

export interface Buff {
  type: string;
  id: string;
  static_positions: Position[];
  random_count: number;
  description?: string;
  /**
   * Optional CSS style class for this buff. Should match a class from style/Buffs.css, e.g. "buff-6".
   */
  style?: string;
  /** Optional runtime effect payload and pickup rules (used by collisions). */
  effect?: EffectSpec;
  rules?: {
    pickupBy?: Array<'player' | 'enemy'>;
    destroyOnTouch?: boolean;
  };
}

export interface Debuff {
  type: string;
  id: string;
  effect: EffectSpec;
  static_positions: Position[];
  random_count: number;
  /**
   * Optional CSS style class for this debuff. Should match a class from style/Debuffs.css, e.g. "debuff" or "debuff-1".
   */
  style?: string;
  /** Optional runtime effect payload and pickup rules (used by collisions). */
  rules?: {
    pickupBy?: Array<'player' | 'enemy'>;
    destroyOnTouch?: boolean;
  };
}

export interface Dots {
  static_positions: Position[];
  random_count: number;
}

export interface PlacementRules {
  allowed_on: 'road' | 'wall';
  avoid_adjacent_walls: boolean;
}

export interface MazeData {
  width: number;
  height: number;
  random_seed: number;
  /** Present on API-sourced mazes; the initializer falls back to `easy` when absent. */
  difficulty?: Difficulty;
  player: Player;
  placement_rules: PlacementRules;
  cells: number[][];
  enemies: Enemy[];
  buffs: Buff[];
  debuffs: Debuff[];
  dots: Dots;
}

/**
 * Input shape for `MazeGenerator.buildMazeData`. It mirrors the object collections of
 * `MazeData` (so the two never drift), but keeps `player.direction` as a plain string
 * for ergonomic, un-annotated config literals.
 */
export interface MazeConfig extends Pick<MazeData, 'enemies' | 'buffs' | 'debuffs' | 'dots'> {
    player: {
        start_position: Position;
        direction: string;
    };
}