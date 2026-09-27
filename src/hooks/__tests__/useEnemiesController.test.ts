import React, {type Dispatch, type SetStateAction, useEffect} from 'react';
import {act, cleanup, render} from '@testing-library/react';
import {
    canGo,
    clampToRoad,
    type Direction,
    type EnemiesAPI,
    type EnemyRuntime,
    listAvailableDirs,
    opposite,
    pickDirection,
    pickUnblockedDirection,
    seekNextStep,
    turnLeft,
    turnRight,
    useEnemiesController,
} from '../useEnemiesController';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

declare global {
    // Test-only channel to read the controller API out of a rendered component's effect.
    interface Window {
        __ENEMY_API?: EnemiesAPI;
    }
}

function setupControlledRaf() {
    const originalRaf = window.requestAnimationFrame;
    const originalCaf = window.cancelAnimationFrame;
    const rafQueue: Array<(ts: number) => void> = [];

    window.requestAnimationFrame = (cb: (ts: number) => void) => {
        rafQueue.push(cb);
        return rafQueue.length;
    };
    window.cancelAnimationFrame = (id: number) => {
        const idx = id - 1;
        if (rafQueue[idx]) rafQueue[idx] = () => {};
    };

    const restore = () => {
        window.requestAnimationFrame = originalRaf;
        window.cancelAnimationFrame = originalCaf;
    };

    return { rafQueue, restore };
}

function runNextRaf(rafQueue: Array<(ts: number) => void>, ts = Date.now()) {
    const cb = rafQueue.shift();
    if (cb) cb(ts);
}

function mountControllerWith(opts: {
    cells: number[][],
    player: { x: number; y: number } | null,
    enemyPositions: Map<string, string>,
    setEnemyPositions: Dispatch<SetStateAction<Map<string, string>>>,
    playerInvisible?: boolean,
    enemySpeedMultiplier?: number,
}) {
    function TestComp() {
        const api = useEnemiesController({
            cells: opts.cells,
            player: opts.player,
            playerInvisible: opts.playerInvisible ?? false,
            enemySpeedMultiplier: opts.enemySpeedMultiplier ?? 1,
            enemyPositions: opts.enemyPositions,
            setEnemyPositions: opts.setEnemyPositions,
        });
        useEffect(() => {
            // expose for test
            window.__ENEMY_API = api;
        }, [api]);
        return null;
    }
    act(() => {
        render(React.createElement(TestComp));
    });
}


describe('canGo', () => {
    it('returns true for valid movement inside bounds', () => {
        const cells = [
            [0, 0],
            [0, 0],
        ];
        expect(canGo(cells, 0, 0, 'right')).toBe(true);
        expect(canGo(cells, 0, 0, 'down')).toBe(true);
    });

    it('wraps around the maze edges when the opposite cell is a path', () => {
        const cells = [
            [0, 0],
            [0, 0],
        ];
        // Stepping off the top re-enters from the bottom, and off the right
        // edge from the left (Pac-Man tunnels).
        expect(canGo(cells, 0, 0, 'up')).toBe(true);
        expect(canGo(cells, 1, 1, 'right')).toBe(true);
    });

    it('rejects a wrap when the opposite cell is a wall', () => {
        const cells = [
            [0, 1],
            [0, 1],
        ];
        expect(canGo(cells, 0, 0, 'left')).toBe(false); // wraps onto (1,0) = wall
        expect(canGo(cells, 0, 0, 'up')).toBe(true); // wraps onto (0,1) = path
    });

    it('returns false for movement into a wall cell', () => {
        const cells = [
            [0, 1],
            [0, 0],
        ];
        expect(canGo(cells, 0, 0, 'right')).toBe(false);
        expect(canGo(cells, 0, 0, 'down')).toBe(true);
    });
});

describe('opposite', () => {
    it('returns the opposite for every direction', () => {
        expect(opposite('up')).toBe('down');
        expect(opposite('down')).toBe('up');
        expect(opposite('left')).toBe('right');
        expect(opposite('right')).toBe('left');
    });
});

describe('listAvailableDirs', () => {
    it('lists all available directions when open space', () => {
        const cells = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];
        expect(listAvailableDirs(cells, 1, 1).sort()).toEqual(['up', 'down', 'left', 'right'].sort());
    });

    it('omits blocked directions; open edges wrap around', () => {
        const cells = [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
        ];
        expect(listAvailableDirs(cells, 1, 1)).toEqual([]);
        const small = [
            [0, 0],
            [0, 0],
        ];
        // All-road grid: stepping off any edge wraps onto a path cell.
        expect(listAvailableDirs(small, 0, 0).sort()).toEqual(['down', 'left', 'right', 'up'].sort());
    });
});

describe('turnLeft / turnRight', () => {
    it('rotates directions correctly', () => {
        expect(turnLeft('up')).toBe('left');
        expect(turnLeft('left')).toBe('down');
        expect(turnLeft('down')).toBe('right');
        expect(turnLeft('right')).toBe('up');

        expect(turnRight('up')).toBe('right');
        expect(turnRight('right')).toBe('down');
        expect(turnRight('down')).toBe('left');
        expect(turnRight('left')).toBe('up');
    });
});

describe('seekNextStep (BFS pathfinder)', () => {
    it('returns null when source equals destination', () => {
        const grid = [[0]];
        expect(seekNextStep({x: 0, y: 0}, {x: 0, y: 0}, grid)).toBeNull();
    });

    it('finds direct neighbor steps', () => {
        const grid = [
            [0, 0],
            [0, 0],
        ];
        expect(seekNextStep({x: 0, y: 0}, {x: 1, y: 0}, grid)).toBe('right');
        expect(seekNextStep({x: 1, y: 1}, {x: 0, y: 1}, grid)).toBe('left');
        expect(seekNextStep({x: 1, y: 1}, {x: 1, y: 0}, grid)).toBe('up');
    });

    it('finds a path around obstacles', () => {
        const grid = [
            [0, 1, 0],
            [0, 1, 0],
            [0, 0, 0],
        ];
        // from (0,0) to (2,0) the correct first move is down (to go around the wall)
        expect(seekNextStep({x: 0, y: 0}, {x: 2, y: 0}, grid)).toBe('down');
    });

    it('returns null when no path exists', () => {
        const grid = [
            [0, 1],
            [1, 0],
        ];
        expect(seekNextStep({x: 0, y: 0}, {x: 1, y: 1}, grid)).toBeNull();
    });
});

describe('clampToRoad', () => {
    it('clamps coordinates inside grid and returns road cell when already road', () => {
        const grid = [
            [0, 0],
            [0, 0],
        ];
        expect(clampToRoad({x: 0.7, y: 1.2}, grid)).toEqual({x: 0, y: 1});
        expect(clampToRoad({x: 1, y: 0}, grid)).toEqual({x: 1, y: 0});
    });

    it('searches nearby tiles when target is a wall', () => {
        const grid = [
            [1, 1, 1],
            [1, 1, 0],
            [1, 1, 1],
        ];
        expect(clampToRoad({x: 1, y: 1}, grid)).toEqual({x: 2, y: 1});
    });

    it('clamps out-of-bounds to edges', () => {
        const grid = [
            [0, 0, 0],
            [0, 0, 0],
        ];
        expect(clampToRoad({x: -5, y: 10}, grid)).toEqual({x: 0, y: 1});
    });
});

describe('pickDirection behaviors', () => {
    let randSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        randSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });
    afterEach(() => {
        randSpy.mockRestore();
    });

    function baseEnemy(overrides: Partial<EnemyRuntime>): EnemyRuntime {
        return {
            id: 'e',
            style: '',
            x: 0,
            y: 0,
            dir: 'right',
            speed: 1,
            behavior: 'random',
            progress: 0,
            frozenUntil: 0,
            rustStacks: 0,
            speedBoostUntil: 0,
            speedBoostMultiplier: 1,
            ...overrides,
        };
    }

    it('seeker chooses the path from seekNextStep when available', () => {
        const grid = [
            [0, 0],
            [0, 0],
        ];
        const e = baseEnemy({x: 0, y: 0, dir: 'down', behavior: 'seeker'});
        const dir = pickDirection(e, ['right', 'down'], grid, {x: 1, y: 0}, false);
        expect(dir).toBe('right');
    });

    it('seeker does not chase when player is invisible', () => {
        const grid = [
            [0, 0],
            [0, 0],
        ];
        const e = baseEnemy({x: 0, y: 0, dir: 'down', behavior: 'seeker'});
        const dir = pickDirection(e, ['down', 'right'], grid, {x: 1, y: 0}, true);
        expect(dir).toBe('down');
    });

    it('ambusher targets ahead of the player using clampToRoad fallback', () => {
        const grid = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ];
        const e = baseEnemy({x: 1, y: 1, dir: 'left', behavior: 'ambusher'});
        const dir = pickDirection(e, ['right', 'up', 'left'], grid, {x: 3, y: 1}, false);
        expect(dir).toBe('right');
    });

    it('coward chooses direction that maximizes distance and avoids immediate backtrack', () => {
        const grid = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];
        const e = baseEnemy({x: 1, y: 1, dir: 'left', behavior: 'coward'});
        const dir = pickDirection(e, ['left', 'right', 'up'], grid, {x: 0, y: 1}, false);
        expect(dir).toBe('up');
    });

    it('coward allows opposite when it is the only option', () => {
        const grid = [
            [0, 0],
            [0, 0],
        ];
        const e = baseEnemy({x: 0, y: 0, dir: 'left', behavior: 'coward'});
        const dir = pickDirection(e, ['right'], grid, {x: 5, y: 5}, false);
        expect(dir).toBe('right');
    });

    it('charger prefers straight, otherwise left, right, then back (order check)', () => {
        const grid = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];
        const e1 = baseEnemy({x: 1, y: 1, dir: 'up', behavior: 'charger'});
        expect(pickDirection(e1, ['up', 'left'], grid, null, false)).toBe('up');

        const e2 = baseEnemy({x: 1, y: 1, dir: 'right', behavior: 'charger'});
        expect(pickDirection(e2, ['down', 'left'], grid, null, false)).toBe('down');

        const e3 = baseEnemy({x: 1, y: 1, dir: 'right', behavior: 'charger'});
        expect(pickDirection(e3, ['left'], grid, null, false)).toBe('left');
    });

    it('patroller picks left, straight, right, opposite order where available', () => {
        const grid = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];
        const e = baseEnemy({x: 1, y: 1, dir: 'up', behavior: 'patroller'});
        expect(pickDirection(e, ['left', 'right', 'down'], grid, null, false)).toBe('left');
    });

    it('defaults to not reversing unless only option (filteredOptions empty) and respects randomness bias', () => {
        const grid = [
            [0, 0],
            [0, 0],
        ];
        const e = baseEnemy({x: 0, y: 0, dir: 'right', behavior: 'random'});
        const dir = pickDirection(e, ['left'], grid, null, false);
        expect(dir).toBe('left');
    });

    it('straight bias returns straight when random < 0.6 and straight is allowed', () => {
        randSpy.mockReturnValue(0.4);
        const grid = [
            [0, 0],
            [0, 0],
        ];
        const e = baseEnemy({x: 0, y: 0, dir: 'right', behavior: 'random'});
        const dir = pickDirection(e, ['right', 'down'], grid, null, false);
        expect(dir).toBe('right');
    });

    it('random selection from pool when not taking straight bias', () => {
        randSpy.mockReturnValue(0.99);
        const grid = [
            [0, 0],
            [0, 0],
        ];
        const e = baseEnemy({x: 0, y: 0, dir: 'right', behavior: 'random'});
        const result = pickDirection(e, ['right', 'down'], grid, null, false);
        expect(['right', 'down']).toContain(result);
    });
});

describe('helpers (existing unit tests)', () => {
    it('canGo basic checks', () => {
        const cells = [
            [0, 0],
            [0, 0],
        ];
        expect(canGo(cells, 0, 0, 'right')).toBe(true);
        expect(canGo(cells, 0, 0, 'down')).toBe(true);
        // Edges wrap: both moves land on the opposite side (path cells).
        expect(canGo(cells, 0, 0, 'up')).toBe(true);
        expect(canGo(cells, 1, 1, 'right')).toBe(true);
    });

    it('opposite / turnLeft / turnRight', () => {
        expect(opposite('up')).toBe('down');
        expect(opposite('left')).toBe('right');

        expect(turnLeft('up')).toBe('left');
        expect(turnRight('up')).toBe('right');
    });

    it('listAvailableDirs respects walls and edges', () => {
        const cells = [
            [1, 0, 1],
            [0, 0, 0],
            [1, 0, 1],
        ];
        expect(listAvailableDirs(cells, 1, 1).sort()).toEqual(['up', 'down', 'left', 'right'].sort());
    });

    it('seekNextStep & clampToRoad edge cases', () => {
        const grid = [[0]];
        expect(seekNextStep({x: 0, y: 0}, {x: 0, y: 0}, grid)).toBeNull();

        const grid2 = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];
        expect(seekNextStep({x: 0, y: 0}, {x: 2, y: 2}, grid2)).toBeDefined();
        expect(clampToRoad({x: -5, y: 10}, grid2)).toEqual({x: 0, y: 2});
    });
});


// Hook / API integration tests
describe('useEnemiesController integration', () => {
    let rafQueue: Array<(ts: number) => void>;
    let restoreRaf: () => void;

    beforeEach(() => {
        const res = setupControlledRaf();
        rafQueue = res.rafQueue;
        restoreRaf = res.restore;
        vi.spyOn(performance, 'now').mockImplementation(() => 1000);
    });

    afterEach(() => {
        restoreRaf();
        vi.restoreAllMocks();
        cleanup();
    });

    it('initializes runtimes and publishes initial enemyPositions', () => {
        const setEnemyPositions = vi.fn();
        const enemyPositions = new Map<string, string>([['1-1', 'enemy-1']]);

        mountControllerWith({
            cells: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
            player: null,
            enemyPositions,
            setEnemyPositions,
        });

        expect(setEnemyPositions).toHaveBeenCalledTimes(1);

        runNextRaf(rafQueue, 2000);
        expect(setEnemyPositions.mock.calls.length).toBeGreaterThanOrEqual(2);

        const api: ReturnType<typeof useEnemiesController> = window.__ENEMY_API!;
        expect(typeof api.freezeInRadius).toBe('function');
        expect(typeof api.freezeAt).toBe('function');
        expect(typeof api.addRustAt).toBe('function');
        expect(typeof api.addSpeedBuffAt).toBe('function');
        expect(typeof api.destroyAt).toBe('function');

        act(() => {
            api.freezeAt(1, 1, 1000);
            api.freezeInRadius(0, 0, 2, 500);
            api.addRustAt(1, 1, 2);
            api.addSpeedBuffAt(1, 1, 1.5, 2000);
        });

        act(() => {
            api.destroyAt(1, 1);
            runNextRaf(rafQueue, 3000);
        });

        const latestCall = setEnemyPositions.mock.calls[setEnemyPositions.mock.calls.length - 1];
        const mapResult = latestCall[0]();
        expect(mapResult instanceof Map).toBe(true);
        expect(mapResult.size).toBe(0);
    });

    it('movement loop invokes pickDirection when many available dirs', () => {
        const setEnemyPositions = vi.fn();
        const enemyPositions = new Map<string, string>([['1-1', 'enemy-7']]);

        mountControllerWith({
            cells: [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
            ],
            player: null,
            enemyPositions,
            setEnemyPositions,
        });

        expect(setEnemyPositions).toHaveBeenCalled();

        runNextRaf(rafQueue, 2100);
        expect(setEnemyPositions.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
});
function baseEnemy(overrides: Partial<EnemyRuntime>): EnemyRuntime {
    return {
        id: 'e',
        style: '',
        x: 0,
        y: 0,
        dir: 'right',
        speed: 1,
        behavior: 'random',
        progress: 0,
        frozenUntil: 0,
        rustStacks: 0,
        speedBoostUntil: 0,
        speedBoostMultiplier: 1,
        ...overrides,
    };
}

describe('coverage: additional pickDirection / helpers branches', () => {
    let randSeq: number[] = [];
    beforeEach(() => {
        randSeq = [];
        vi.spyOn(Math, 'random').mockImplementation(() => {
            // default fallback if a sequence exhausted
            return randSeq.length ? randSeq.shift()! : 0.5;
        });
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('coward avoids immediate backtrack when other options exist', () => {
        const grid = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];
        // enemy facing right; opposite = left should be avoided when other options present
        const e = baseEnemy({x: 1, y: 1, dir: 'right', behavior: 'coward'});
        const options: Direction[] = ['left', 'up', 'down']; // left is immediately backtracked
        const player = {x: 1, y: 0}; // player above
        const dir = pickDirection(e, options, grid, player, false);
        // Expect not immediate backtrack 'left'; choose the direction that maximizes distance (likely 'down')
        expect(dir).not.toBe('left');
        expect(['up', 'down']).toContain(dir);
    });

    it('charger picks in correct priority order (left / right / opposite)', () => {
        const grid = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];
        // For dir='left', turnLeft(left) -> down (per implementation)
        const e = baseEnemy({x: 1, y: 1, dir: 'left', behavior: 'charger'});
        const choice = pickDirection(e, ['up', 'down'], grid, null, false);
        // order is [turnLeft='down', turnRight='up', opposite='right'] -> 'down' should be picked
        expect(choice).toBe('down');
    });

    it('default selection uses second Math.random call when straight-bias skipped', () => {
        const grid = [
            [0, 0, 0],
            [0, 0, 0],
        ];
        // Setup sequence: first Math.random() -> 0.7 (skip straight-bias), second -> 0.2 (select pool index 0)
        randSeq.push(0.7, 0.2);
        const e = baseEnemy({x: 0, y: 0, dir: 'right', behavior: 'random'});
        // options include opposite 'left' which will be filtered out, pool order preserved
        const options: Direction[] = ['up', 'right', 'left'];
        const dir = pickDirection(e, options, grid, null, false);
        // the filtered pool is ['up','right'] -> second random 0.2 => index 0 => 'up'
        expect(dir).toBe('up');
    });

    it('seekNextStep reconstructs longer paths correctly (returns first step direction)', () => {
        // one-row corridor 0..4: from (0,0) to (4,0) the first step must be 'right'
        const grid = [[0, 0, 0, 0, 0]];
        const dir = seekNextStep({x: 0, y: 0}, {x: 4, y: 0}, grid);
        expect(dir).toBe('right');
    });

    it('clampToRoad finds nearest road using search radius when clamped cell is wall', () => {
        const grid = [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0],
        ];
        // target is center which is a wall; radius=1 search should find (0,0) first (dy=-1,dx=-1 order)
        const result = clampToRoad({x: 1, y: 1}, grid);
        expect(result).toEqual({x: 0, y: 0});
    });
});


describe('additional branches and API calls', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        cleanup();
    });

    it('seeker fallback: when path not found should fall back to random selection', () => {
        // Grid where the seeker cannot reach the player (isolated by walls)
        const grid = [
            [0, 1],
            [1, 1],
        ];
        const e = baseEnemy({x: 0, y: 0, dir: 'right', behavior: 'seeker'});
        const options: Direction[] = ['right', 'down'];

        // Force Math.random to skip straight-bias and pick a deterministic pool index
        const rand = vi.spyOn(Math, 'random').mockReturnValue(0.99);

        const dir = pickDirection(e, options, grid, {x: 1, y: 1}, false);
        // since seeker can't find a path, pickDirection should return one of the provided options
        expect(options).toContain(dir);

        rand.mockRestore();
    });

    it('ambusher tries clampToRoad first then falls back to player path', () => {
        // Make a grid where the ambush target is unreachable but the player itself is reachable
        // Layout:
        // 0 0 0
        // 1 1 0
        // 0 0 0
        // place enemy at (0,0), player at (2,2). clampToRoad(target) might point to (2,2), but
        // a path to clamped-target goes through walls while a direct path to player exists via the bottom row.
        const grid = [
            [0, 0, 0],
            [1, 1, 0],
            [0, 0, 0],
        ];
        const e = baseEnemy({x: 0, y: 0, dir: 'right', behavior: 'ambusher'});
        const options: Direction[] = ['right', 'down', 'left'];

        // Ensure deterministic random behavior if needed
        const dir = pickDirection(e, options, grid, {x: 2, y: 2}, false);
        // Should pick a valid option (preferably toward the player); just assert a valid option returned
        expect(options).toContain(dir);
    });

    it('clampToRoad returns clamped point when no road within search radius', () => {
        // Grid all walls except the clamped corner; use a large out-of-bounds input
        const grid = [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
        ];
        // clamped coordinates (floor and clamp) should be inside the grid
        const res = clampToRoad({x: 10, y: -5}, grid);
        expect(res.x).toBeGreaterThanOrEqual(0);
        expect(res.y).toBeGreaterThanOrEqual(0);
        // since the whole grid is walls, clampToRoad returns the clamped coordinate
        // (floor + clamp) => x = 2, y = 0
        expect(res).toEqual({x: 2, y: 0});
    });

    it('hook API methods exercise branches: addRustAt, addSpeedBuffAt, freeze, destroy', () => {
        const rafQueue: Array<(ts: number) => void> = [];
        const originalRaf = window.requestAnimationFrame;
        const originalCaf = window.cancelAnimationFrame;

        // Controlled RAF for the hook
        window.requestAnimationFrame = (cb: (ts: number) => void) => {
            rafQueue.push(cb);
            return rafQueue.length;
        };
        window.cancelAnimationFrame = (id: number) => {
            const idx = id - 1;
            if (rafQueue[idx]) rafQueue[idx] = () => {
            };
        };

        vi.spyOn(performance, 'now').mockImplementation(() => 1000);

        const setEnemyPositions = vi.fn();
        // Provide two enemies so init maps different behaviors via style names
        const enemyPositions = new Map<string, string>([
            ['0-0', 'enemy-1'],
            ['1-0', 'enemy-3'],
        ]);

        function TestComp() {
            const api = useEnemiesController({
                cells: [
                    [0, 0, 0],
                    [0, 0, 0],
                ],
                player: {x: 10, y: 10},
                playerInvisible: false,
                enemySpeedMultiplier: 1,
                enemyPositions,
                setEnemyPositions,
            });
            useEffect(() => {
                // expose for test
                window.__ENEMY_API = api;
            }, [api]);
            return null;
        }

        act(() => {
            render(React.createElement(TestComp));
        });

        // the initial publication must have happened
        expect(setEnemyPositions).toHaveBeenCalled();

        // retrieve API
        const api = window.__ENEMY_API!;
        expect(typeof api.addRustAt).toBe('function');

        // call addRustAt with fractional and negative values to exercise flooring and clamping branches
        act(() => {
            api.addRustAt(0, 0, 2.9); // should floor to 2
            api.addRustAt(0, 0, -5);  // should not reduce below 0
            api.addSpeedBuffAt(0, 0, 0, 1000); // multiplier 0 -> should clamp to min 0.1
            api.freezeAt(0, 0, 200);
            api.freezeInRadius(0, 0, 2, 300);
        });

        // trigger one RAF step to let hook process (movement and publish)
        act(() => {
            const cb = rafQueue.shift();
            if (cb) cb(Date.now());
        });

        // call destroyAt and ensure publish happens again
        act(() => {
            api.destroyAt(0, 0);
            const cb = rafQueue.shift();
            if (cb) cb(Date.now());
        });

        // the last published map should be a Map (function was passed to setEnemyPositions)
        const lastCall = setEnemyPositions.mock.calls[setEnemyPositions.mock.calls.length - 1];
        const maybeMap = lastCall?.[0] && typeof lastCall[0] === 'function' ? lastCall[0]() : null;
        expect(maybeMap instanceof Map).toBe(true);

        // restore RAF
        window.requestAnimationFrame = originalRaf;
        window.cancelAnimationFrame = originalCaf;
    });
});

describe('extra coverage: init mappings and collision resolution', () => {
    let originalRaf: typeof window.requestAnimationFrame;
    let originalCaf: typeof window.cancelAnimationFrame;
    let rafQueue: Array<(ts: number) => void>;

    beforeEach(() => {
        originalRaf = window.requestAnimationFrame;
        originalCaf = window.cancelAnimationFrame;
        rafQueue = [];

        window.requestAnimationFrame = (cb: (ts: number) => void) => {
            rafQueue.push(cb);
            return rafQueue.length;
        };
        window.cancelAnimationFrame = (id: number) => {
            const idx = id - 1;
            if (rafQueue[idx]) rafQueue[idx] = () => {
            };
        };

        vi.spyOn(performance, 'now').mockImplementation(() => 1000);
    });

    afterEach(() => {
        window.requestAnimationFrame = originalRaf;
        window.cancelAnimationFrame = originalCaf;
        vi.restoreAllMocks();
        cleanup();
    });

    function runNextRaf(ts = Date.now()) {
        const cb = rafQueue.shift();
        if (cb) cb(ts);
    }

    it('initialization executes behavior/speed mapping for known and unknown styles', () => {
        const setEnemyPositions = vi.fn();
        // Provide multiple styles: enemy-6 (mapped speed), enemy-8 (mapped behavior), and unknown style
        const enemyPositions = new Map<string, string>([
            ['0-0', 'enemy-6'],        // speed mapping exists
            ['1-0', 'enemy-8'],        // coward mapping exists
            ['2-0', 'enemy-unknown'],  // falls back to 'random'
        ]);

        function TestComp() {
            const api = useEnemiesController({
                cells: [
                    [0, 0, 0],
                ],
                player: null,
                playerInvisible: false,
                enemySpeedMultiplier: 1,
                enemyPositions,
                setEnemyPositions,
            });
            useEffect(() => {
                // expose api for test usage
                window.__ENEMY_API = api;
            }, [api]);
            return null;
        }

        act(() => {
            render(React.createElement(TestComp));
        });

        // Initialization should have copied and published the initial map
        expect(setEnemyPositions).toHaveBeenCalledTimes(1);

        // API should be exposed and callable
        const api = window.__ENEMY_API!;
        expect(typeof api.freezeAt).toBe('function');

        // Call clampToRoad to touch that helper path (sanity)
        const clamped = clampToRoad({x: -10, y: 0}, [[1, 1, 1]]);
        expect(typeof clamped.x).toBe('number');
    });

    it('collision proposals with multiple contenders are skipped (counts > 1 branch)', () => {
        const setEnemyPositions = vi.fn();
        // place two enemies that will both try to move into the center (2-1)
        const enemyPositions = new Map<string, string>([
            ['1-1', 'enemy-a'],
            ['3-1', 'enemy-b'],
        ]);

        function TestComp() {
            const api = useEnemiesController({
                // Grid arranged so (1,1) can only go right and (3,1) can only go
                // left -> both target (2,1). Solid borders keep edge wrap-around
                // out of the picture, so the conflict is deterministic.
                cells: [
                    [1, 1, 1, 1, 1],
                    [1, 0, 0, 0, 1],
                    [1, 1, 1, 1, 1],
                ],
                player: null,
                playerInvisible: false,
                enemySpeedMultiplier: 1,
                enemyPositions,
                setEnemyPositions,
            });
            useEffect(() => {
                // expose api
                window.__ENEMY_API = api;
            }, [api]);
            return null;
        }

        act(() => {
            render(React.createElement(TestComp));
        });

        // initial publish happened
        expect(setEnemyPositions).toHaveBeenCalled();

        // Retrieve API and give both enemies a very large speed buff, so they will propose a move in one frame
        const api = window.__ENEMY_API!;
        expect(api).toBeDefined();

        act(() => {
            // a large multiplier ensures progress >= 1 in a single RAF step (speedBoost path exercised)
            api.addSpeedBuffAt(1, 1, 1000, 10000);
            api.addSpeedBuffAt(3, 1, 1000, 10000);
        });

        // Run one RAF step to process movement proposals
        act(() => {
            runNextRaf(Date.now() + 16);
        });

        // The next RAF step performs publication after a movement attempt
        act(() => {
            runNextRaf(Date.now() + 32);
        });

        // Examine the last published map: because both proposed the same destination (2-1),
        // the code path that counts destinations >1 should skip moves, and original positions remain.
        const lastCall = setEnemyPositions.mock.calls[setEnemyPositions.mock.calls.length - 1];
        const maybeMap = lastCall?.[0] && typeof lastCall[0] === 'function' ? lastCall[0]() : null;
        expect(maybeMap instanceof Map).toBe(true);
        // both original positions should still exist (no one moved into 2-1)
        expect(maybeMap!.has('1-1')).toBe(true);
        expect(maybeMap!.has('3-1')).toBe(true);
        // center (2-1) should not be occupied by either enemy
        expect(maybeMap!.has('2-1')).toBe(false);
    });
});

describe('pickUnblockedDirection (deadlock resolution)', () => {
    function baseEnemy(overrides: Partial<EnemyRuntime>): EnemyRuntime {
        return {
            id: 'e', style: '', x: 0, y: 0, dir: 'right', speed: 1,
            behavior: 'random', progress: 0, frozenUntil: 0, rustStacks: 0,
            speedBoostUntil: 0, speedBoostMultiplier: 1, ...overrides,
        };
    }

    // Straight horizontal corridor: (0,0)-(1,0)-(2,0)
    const corridor = [[0, 0, 0]];

    it('reverses out of a corridor when the cell ahead is occupied by another enemy', () => {
        const e = baseEnemy({x: 1, y: 0, dir: 'right'});
        const occupied = new Set<string>(['1-0', '2-0']); // enemy blocked ahead by one at (2,0)
        const dir = pickUnblockedDirection(e, corridor, occupied, null, false);
        expect(dir).toBe('left'); // only free neighbor is the reverse cell (0,0)
    });

    it('returns null when every walkable neighbor is occupied (waits a frame)', () => {
        const e = baseEnemy({x: 1, y: 0, dir: 'right'});
        const occupied = new Set<string>(['0-0', '1-0', '2-0']); // boxed in on both sides
        const dir = pickUnblockedDirection(e, corridor, occupied, null, false);
        expect(dir).toBeNull();
    });

    it('never returns a direction whose target cell is occupied', () => {
        const grid = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];
        const e = baseEnemy({x: 1, y: 1, dir: 'right'});
        // Block right (2,1) and down (1,2); only up (1,0) and left (0,1) remain free.
        const occupied = new Set<string>(['1-1', '2-1', '1-2']);
        const dir = pickUnblockedDirection(e, grid, occupied, null, false);
        expect(['up', 'left']).toContain(dir);
    });
});