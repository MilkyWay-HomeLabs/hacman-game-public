import type {Dispatch, SetStateAction} from 'react';
import {useEffect, useRef} from 'react';
import {wrapStep} from '../domain/grid';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface EnemyRuntime {
    id: string;
    style: string; // CSS class used for rendering
    x: number; // integer grid position
    y: number; // integer grid position
    dir: Direction;
    speed: number; // cells per second
    frozenUntil?: number; // epoch ms
    rustStacks?: number; // each stack slows by ~5%
    speedBoostUntil?: number;
    speedBoostMultiplier?: number;
    behavior: 'random' | 'seeker' | 'patroller' | 'ambusher' | 'coward' | 'charger';
    progress: number; // accumulated fractional cells, step when >= 1
}

interface UseEnemiesControllerParams {
    cells: number[][];
    player: { x: number; y: number } | null;
    playerInvisible?: boolean;
    /** Global speed multiplier applied to all enemies (e.g., based on difficulty). Default = 1.0 */
    enemySpeedMultiplier?: number;
    /**
     * Current enemy positions map (key: "x-y" -> CSS class) used by App for rendering and collisions.
     * Only used to initialize internal runtime once; ongoing updates are pushed via setEnemyPositions.
     */
    enemyPositions: Map<string, string>;
    setEnemyPositions: Dispatch<SetStateAction<Map<string, string>>>;
}

/** Helper: check if movement to the neighbor cell is possible (edges wrap around). */
export function canGo(cells: number[][], x: number, y: number, dir: Direction): boolean {
    return wrapStep(cells, x, y, dir) !== null;
}

export function opposite(dir: Direction): Direction {
    const opposites: Record<Direction, Direction> = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left',
    };
    return opposites[dir];
}

export function listAvailableDirs(cells: number[][], x: number, y: number): Direction[] {
    const dirs: Direction[] = ['up', 'down', 'left', 'right'];
    return dirs.filter((dir) => canGo(cells, x, y, dir));
}

export interface EnemiesAPI {
    /** Freeze all enemies within manhattan range from (x,y) for given ms */
    freezeInRadius: (x: number, y: number, range: number, ms: number) => void;
    /** Freeze enemy standing exactly at (x,y) */
    freezeAt: (x: number, y: number, ms: number) => void;
    /** Add rust stacks to an enemy at (x,y) */
    addRustAt: (x: number, y: number, stacks: number) => void;
    /** Grant temporary speed multiplier to an enemy at (x,y) */
    addSpeedBuffAt: (x: number, y: number, multiplier: number, durationMs: number) => void;
    /** Destroy the enemy at (x,y) */
    destroyAt: (x: number, y: number) => void;
}

/**
 * Minimal enemy movement controller hook.
 * - Initializes runtimes from a provided enemyPositions map (one-time).
 * - Moves enemies on a requestAnimationFrame loop (Random Walker behavior with straight bias).
 * - Publishes an updated positions map for rendering/collision via setEnemyPositions.
 */
export function useEnemiesController({
                                         cells,
                                         player,
                                         playerInvisible,
                                         enemySpeedMultiplier = 1,
                                         enemyPositions,
                                         setEnemyPositions
                                     }: UseEnemiesControllerParams): EnemiesAPI {
    const runtimesRef = useRef<EnemyRuntime[] | null>(null);
    const apiRef = useRef<EnemiesAPI | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastTsRef = useRef<number | null>(null);

    // Initialize runtimes once when an initial enemyPositions is available
    useEffect(() => {
        if (runtimesRef.current || !enemyPositions?.size) return;

        const behaviors: Record<string, EnemyRuntime['behavior']> = {
            'enemy-1': 'seeker',
            'enemy-7': 'patroller',
            'enemy-3': 'ambusher',
            'enemy-6': 'charger',
            'enemy-8': 'coward',
        };

        const speeds: Record<string, number> = {
            'enemy-6': 1.4,
            'enemy-1': 1.2,
            'enemy-7': 1.0,
        };

        runtimesRef.current = Array.from(enemyPositions.entries()).map(([key, style]) => {
            const [sx, sy] = key.split('-').map(Number);
            const dir = listAvailableDirs(cells, sx, sy)[0] ?? 'right';
            return {
                id: `e-${sx}-${sy}-${style}`,
                style,
                x: sx,
                y: sy,
                dir,
                speed: speeds[style] ?? 1.0,
                frozenUntil: 0,
                rustStacks: 0,
                speedBoostUntil: 0,
                speedBoostMultiplier: 1,
                behavior: Object.keys(behaviors).find((key) => style.includes(key))
                    ? behaviors[Object.keys(behaviors).find((key) => style.includes(key))!]
                    : 'random',
                progress: 0,
            };
        });
        setEnemyPositions(() => new Map(enemyPositions));
    }, [enemyPositions]);

    // Movement loop
    useEffect(() => {
        const step = (ts: number) => {
            const rt = runtimesRef.current;
            if (!rt) {
                rafRef.current = window.requestAnimationFrame(step);
                return;
            }
            const last = lastTsRef.current ?? ts;
            lastTsRef.current = ts;
            const dtSec = Math.min(0.05, Math.max(0, (ts - last) / 1000)); // clamp to avoid big jumps

            // Occupancy set for current frame (pre-move)
            const occupied = new Set<string>();
            for (const e of rt) occupied.add(`${e.x}-${e.y}`);

            // Move each enemy using fractional accumulation of distance
            // First pass: update progress and pick directions (no moves applied yet)
            for (const e of rt) {
                if ((e.frozenUntil ?? 0) > performance.now()) continue;

                const rustEffect = Math.pow(0.95, e.rustStacks ?? 0);
                const speedBoost = (e.speedBoostUntil ?? 0) > performance.now() ? (e.speedBoostMultiplier ?? 1) : 1;
                e.progress = Math.min(2, (e.progress || 0) + e.speed * enemySpeedMultiplier * rustEffect * speedBoost * dtSec);

                const availableDirs = listAvailableDirs(cells, e.x, e.y);
                if (!canGo(cells, e.x, e.y, e.dir) || availableDirs.length >= 3) {
                    e.dir = pickDirection(e, availableDirs, cells, player, !!playerInvisible);
                }
            }

            // Second pass: compute movement proposals for at most one tile per enemy
            const proposals: Array<{ idx: number; fromKey: string; toKey: string; tx: number; ty: number }> = [];
            for (let i = 0; i < rt.length; i++) {
                const e = rt[i];
                if ((e.frozenUntil ?? 0) > performance.now() || e.progress < 1 - 1e-6) {
                    continue;
                }

                const fromKey = `${e.x}-${e.y}`;
                let next = wrapStep(cells, e.x, e.y, e.dir);

                // If the forward cell is a wall (next === null) or is taken by another
                // enemy, try to re-route to a walkable, currently-free neighbor instead
                // of stalling. Without this, two enemies meeting head-on in a corridor
                // deadlock forever — often parked on dot cells the player can't reach.
                if (!next || occupied.has(`${next.x}-${next.y}`)) {
                    const escape = pickUnblockedDirection(e, cells, occupied, player, !!playerInvisible);
                    if (!escape) continue; // fully boxed in this frame; wait for the next
                    e.dir = escape;
                    next = wrapStep(cells, e.x, e.y, escape);
                    if (!next) continue;
                }

                const toKey = `${next.x}-${next.y}`;
                if (!occupied.has(toKey)) {
                    proposals.push({idx: i, fromKey, toKey, tx: next.x, ty: next.y});
                }
            }
            // Resolve collisions: allow only unique destinations
            const counts = new Map<string, number>();
            for (const p of proposals) counts.set(p.toKey, (counts.get(p.toKey) ?? 0) + 1);

            for (const p of proposals) {
                if ((counts.get(p.toKey) ?? 0) !== 1) continue; // Skip conflicts

                const e = rt[p.idx];
                e.x = p.tx;
                e.y = p.ty;

                e.progress = Math.max(0, e.progress - 1);

                occupied.delete(p.fromKey);
                occupied.add(p.toKey);

                const availableDirs = listAvailableDirs(cells, e.x, e.y);
                if (availableDirs.length >= 3) {
                    e.dir = pickDirection(e, availableDirs, cells, player, !!playerInvisible);
                }
            }

            // Publish a new positions map for rendering/collision
            setEnemyPositions(() => {
                const map = new Map<string, string>();
                for (const e of rt) {
                    map.set(`${e.x}-${e.y}`, e.style);
                }
                return map;
            });

            rafRef.current = window.requestAnimationFrame(step);
        };

        rafRef.current = window.requestAnimationFrame(step);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            lastTsRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cells.length, enemySpeedMultiplier]);

    // Expose API
    if (!apiRef.current) {
        const updateFreeze = (x: number, y: number, range: number, ms: number, exact: boolean) => {
            const rt = runtimesRef.current;
            if (!rt) return;
            const until = performance.now() + Math.max(0, ms);
            for (const e of rt) {
                const dist = Math.abs(e.x - x) + Math.abs(e.y - y);
                if ((exact && dist === 0) || (!exact && dist <= range)) {
                    e.frozenUntil = Math.max(until, e.frozenUntil ?? 0);
                }
            }
        };

        apiRef.current = {
            freezeInRadius: (x, y, range, ms) => updateFreeze(x, y, range, ms, false),
            freezeAt: (x, y, ms) => updateFreeze(x, y, 0, ms, true),
            addRustAt: (x, y, stacks) => {
                const rt = runtimesRef.current;
                if (!rt) return;
                for (const e of rt) {
                    if (e.x === x && e.y === y) {
                        e.rustStacks = Math.max(0, (e.rustStacks ?? 0) + Math.max(0, Math.floor(stacks)));
                    }
                }
            },
            addSpeedBuffAt: (x, y, multiplier, durationMs) => {
                const rt = runtimesRef.current;
                if (!rt) return;
                const until = performance.now() + Math.max(0, durationMs);
                for (const e of rt) {
                    if (e.x === x && e.y === y) {
                        e.speedBoostMultiplier = Math.max(0.1, multiplier || 1);
                        e.speedBoostUntil = Math.max(until, e.speedBoostUntil ?? 0);
                    }
                }
            },
            destroyAt: (x, y) => {
                const rt = runtimesRef.current;
                if (!rt) return;
                runtimesRef.current = rt.filter(e => !(e.x === x && e.y === y));
            }
        };
    }

    return apiRef.current!;
}

// --- Behavior helpers ---

/**
 * Pick a direction whose neighbor cell is both walkable and currently free (not
 * held by another enemy), preferring the enemy's behavior via {@link pickDirection}.
 * Returns null when every neighbor is a wall or occupied — the enemy waits a frame.
 * Used to break head-on corridor deadlocks so enemies never idle indefinitely.
 */
export function pickUnblockedDirection(
    e: EnemyRuntime,
    cells: number[][],
    occupied: Set<string>,
    player: { x: number; y: number } | null,
    playerInvisible: boolean
): Direction | null {
    const free = listAvailableDirs(cells, e.x, e.y).filter((dir) => {
        const next = wrapStep(cells, e.x, e.y, dir);
        return next !== null && !occupied.has(`${next.x}-${next.y}`);
    });
    if (free.length === 0) return null;
    return pickDirection(e, free, cells, player, playerInvisible);
}

export function pickDirection(
    e: EnemyRuntime,
    options: Direction[],
    cells: number[][],
    player: { x: number; y: number } | null,
    playerInvisible: boolean
): Direction {
    const straightOk = options.includes(e.dir);

    if (e.behavior === 'seeker' && player && !playerInvisible) {
        const direction = seekNextStep({x: e.x, y: e.y}, player, cells);
        if (direction && options.includes(direction)) return direction;
    }

    if (e.behavior === 'ambusher' && player && !playerInvisible) {
        const dx = Math.sign(player.x - e.x);
        const dy = Math.sign(player.y - e.y);
        const target = {x: player.x + dx * 3, y: player.y + dy * 3};
        const direction =
            seekNextStep({x: e.x, y: e.y}, clampToRoad(target, cells), cells) ||
            seekNextStep({x: e.x, y: e.y}, player, cells);
        if (direction && options.includes(direction)) return direction;
    }

    if (e.behavior === 'coward' && player) {
        let bestDirection: Direction | null = null;
        let maxDistance = -Infinity;

        for (const direction of options) {
            const nx = direction === 'left' ? e.x - 1 : direction === 'right' ? e.x + 1 : e.x;
            const ny = direction === 'up' ? e.y - 1 : direction === 'down' ? e.y + 1 : e.y;
            const distance = Math.abs(nx - player.x) + Math.abs(ny - player.y);

            if (distance > maxDistance && !(opposite(e.dir) === direction && options.length > 1)) {
                maxDistance = distance;
                bestDirection = direction;
            }
        }

        if (bestDirection) return bestDirection;
    }

    if (e.behavior === 'charger') {
        if (straightOk) return e.dir;

        const order = [turnLeft(e.dir), turnRight(e.dir), opposite(e.dir)];
        for (const direction of order) {
            if (options.includes(direction)) return direction;
        }
    }

    if (e.behavior === 'patroller') {
        const order = [turnLeft(e.dir), e.dir, turnRight(e.dir), opposite(e.dir)];
        for (const direction of order) {
            if (options.includes(direction)) return direction;
        }
    }

    const filteredOptions = options.filter((direction) => direction !== opposite(e.dir));
    const pool = filteredOptions.length > 0 ? filteredOptions : options;

    if (straightOk && Math.random() < 0.6) return e.dir;
    return pool[Math.floor(Math.random() * pool.length)] || e.dir;
}

export function turnLeft(dir: Direction): Direction {
    const turns: Record<Direction, Direction> = {
        up: 'left',
        down: 'right',
        left: 'down',
        right: 'up',
    };
    return turns[dir];
}

export function turnRight(dir: Direction): Direction {
    const turns: Record<Direction, Direction> = {
        up: 'right',
        down: 'left',
        left: 'up',
        right: 'down',
    };
    return turns[dir];
}

/**
 * BFS next step from `from` towards `to`. Deliberately unaware of edge
 * wrap-around: seekers plan inside the grid only (accepted limitation), while
 * actual movement still wraps via {@link canGo}/wrapStep.
 */
export function seekNextStep(
    from: { x: number; y: number },
    to: { x: number; y: number },
    cells: number[][]
): Direction | null {
    if (from.x === to.x && from.y === to.y) return null;

    const width = cells[0]?.length ?? 0;
    const height = cells.length;
    const key = (x: number, y: number) => y * 10000 + x;
    const queue: { x: number; y: number }[] = [from];
    const previous = new Map<number, { x: number; y: number }>();
    const visited = new Set<number>([key(from.x, from.y)]);
    const directions: Direction[] = ['up', 'down', 'left', 'right'];
    let target: { x: number; y: number } | null = null;
    const MAX_STEPS = 2000;

    for (let steps = 0; queue.length && steps < MAX_STEPS; steps++) {
        const current = queue.shift()!;
        if (current.x === to.x && current.y === to.y) {
            target = current;
            break;
        }

        for (const dir of directions) {
            const nx = dir === 'left' ? current.x - 1 : dir === 'right' ? current.x + 1 : current.x;
            const ny = dir === 'up' ? current.y - 1 : dir === 'down' ? current.y + 1 : current.y;

            if (nx < 0 || ny < 0 || nx >= width || ny >= height || cells[ny][nx] !== 0) continue;

            const nextKey = key(nx, ny);
            if (visited.has(nextKey)) continue;

            visited.add(nextKey);
            previous.set(nextKey, current);
            queue.push({x: nx, y: ny});
        }
    }

    if (!target) return null;

    // Reconstruct a path: walk back from the target until we reach the node whose parent is `from`
    // After this loop `curr` will be the first step after `from` on the path to `to`
    let curr = target;
    while (true) {
        const prev = previous.get(key(curr.x, curr.y));
        if (!prev) break; // reached a node without a parent
        if (prev.x === from.x && prev.y === from.y) break; // the parent is the source => curr is the first step
        curr = prev;
    }

    if (curr.x > from.x) return 'right';
    if (curr.x < from.x) return 'left';
    if (curr.y > from.y) return 'down';
    if (curr.y < from.y) return 'up';
    return null;
}

export function clampToRoad(p: { x: number; y: number }, cells: number[][]): { x: number; y: number } {
    const width = cells[0]?.length ?? 0;
    const height = cells.length;
    const clampedX = Math.max(0, Math.min(width - 1, Math.floor(p.x)));
    const clampedY = Math.max(0, Math.min(height - 1, Math.floor(p.y)));

    if (cells[clampedY]?.[clampedX] === 0) return {x: clampedX, y: clampedY};

    const searchRadius = 3;
    for (let r = 1; r <= searchRadius; r++) {
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                const nx = clampedX + dx;
                const ny = clampedY + dy;
                if (ny >= 0 && ny < height && nx >= 0 && nx < width && cells[ny]?.[nx] === 0) {
                    return {x: nx, y: ny};
                }
            }
        }
    }

    return {x: clampedX, y: clampedY};
}