// Pure per-level statistics for presentation (the difficulty picker). Counts
// combine the fixed placements with the randomly spawned extras, so they match
// what the initializer will actually put on the board.

import type {MazeData, Position} from '../types/maze';

/** Anything the maze places on the board: fixed spots plus random spawns. */
interface PlacedEntity {
    static_positions: Position[];
    random_count: number;
}

export interface MazeStats {
    /** Board size in cells. */
    width: number;
    height: number;
    enemyCount: number;
    buffCount: number;
    debuffCount: number;
}

/** Total instances a group of entities will place (negative random counts are ignored). */
function entityCount(entities: PlacedEntity[]): number {
    return entities.reduce(
        (sum, entity) => sum + entity.static_positions.length + Math.max(0, entity.random_count),
        0,
    );
}

/** Presentation stats for one maze level. */
export function mazeStats(maze: MazeData): MazeStats {
    return {
        width: maze.width,
        height: maze.height,
        enemyCount: entityCount(maze.enemies),
        buffCount: entityCount(maze.buffs),
        debuffCount: entityCount(maze.debuffs),
    };
}
