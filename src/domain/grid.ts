import type {Position} from '../types/maze';

export type Direction = 'up' | 'down' | 'left' | 'right';

/** Grid vector for each direction. */
const VECTORS: Record<Direction, { dx: number; dy: number }> = {
    up: {dx: 0, dy: -1},
    down: {dx: 0, dy: 1},
    left: {dx: -1, dy: 0},
    right: {dx: 1, dy: 0},
};

/**
 * One grid step in `dir` from (x, y) with wrap-around on both axes: stepping
 * off an edge re-enters from the opposite edge (Pac-Man tunnels). Returns the
 * target position when it is a walkable path cell (0), otherwise null.
 * The horizontal wrap uses the destination row's own width, so ragged rows
 * stay safe.
 */
export function wrapStep(cells: number[][], x: number, y: number, dir: Direction): Position | null {
    const height = cells.length;
    if (height === 0) return null;
    const {dx, dy} = VECTORS[dir];
    const ny = (y + dy + height) % height;
    const width = cells[ny]?.length ?? 0;
    if (width === 0) return null;
    const nx = (x + dx + width) % width;
    return cells[ny][nx] === 0 ? {x: nx, y: ny} : null;
}
