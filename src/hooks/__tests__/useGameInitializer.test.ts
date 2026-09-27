import React from 'react';
import {cleanup, render} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import type * as InitModule from '../useGameInitializer';
import type {MazeData} from '../../types/maze';

type InitHook = typeof InitModule.useGameInitializer;
type InitResult = ReturnType<InitHook>;

declare global {
    // Test-only channel to read the hook's result out of a rendered component.
    interface Window {
        __GAME_INIT?: InitResult;
    }
}

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    globalThis.__TEST_MAZE_MODULE = undefined;
    vi.resetModules();
});

function setupSeededRandom(seed: number) {
    let state = seed % 2147483647;
    if (state <= 0) state += 2147483646;
    const rng = () => {
        state = (state * 16807) % 2147483647;
        return (state - 1) / 2147483646;
    };
    vi.spyOn(Math, 'random').mockImplementation(rng);
}

// Helper: inject maze and load hook module (avoids hoisted mock factories)
async function loadHookWithMaze(testMaze: unknown) {
    globalThis.__TEST_MAZE_MODULE = {testMaze: testMaze as MazeData};
    vi.resetModules();
    return await import('../useGameInitializer');
}

function mountHookAndGetInit(useGameInitializer: InitHook): InitResult {
    function TestComp() {
        // Expose the hook result for assertions (test-only render side effect).
        // eslint-disable-next-line react-hooks/immutability
        window.__GAME_INIT = useGameInitializer();
        return null;
    }

    render(React.createElement(TestComp));
    return window.__GAME_INIT!;
}

describe('useGameInitializer', () => {
    it('returns correct initial data for a valid maze', async () => {
        const testMaze = {
            cells: [
                [0, 1, 0],
                [1, 0, 1],
                [0, 1, 0],
            ],
            player: {start_position: {x: 0, y: 0}},
            enemies: [{type: 'ghost', static_positions: [{x: 1, y: 1}], random_count: 0}],
            buffs: [{type: 'speed', static_positions: [{x: 2, y: 0}], random_count: 0}],
            debuffs: [{static_positions: [{x: 0, y: 2}], random_count: 0}],
            dots: {static_positions: [{x: 1, y: 0}], random_count: 0},
            difficulty: 'medium',
        };

        const {useGameInitializer} = await loadHookWithMaze(testMaze);
        const {mazeData, activeDots, enemyPositions, buffPositions, debuffPositions, timerDuration} =
            mountHookAndGetInit(useGameInitializer);

        expect(mazeData).toEqual(testMaze);
        expect(activeDots.size).toBe(1);
        expect(enemyPositions.size).toBe(1);
        expect(buffPositions.size).toBe(1);
        expect(debuffPositions.size).toBe(1);
        expect(timerDuration).toBe(300);
    });

    it('places random dots correctly within allowed positions', async () => {
        const testMaze = {
            cells: [
                // larger maze as required by test...
                new Array(5).fill(0),
                new Array(5).fill(0),
                new Array(5).fill(0),
                new Array(5).fill(0),
                new Array(5).fill(0),
            ],
            player: {start_position: {x: 0, y: 0}},
            enemies: [],
            buffs: [],
            debuffs: [],
            dots: {static_positions: [], random_count: 3},
        };

        const {useGameInitializer} = await loadHookWithMaze(testMaze);
        const {activeDots} = mountHookAndGetInit(useGameInitializer);
        expect(activeDots.size).toBe(3);
        activeDots.forEach((dot: string) => {
            const [x, y] = dot.split('-').map(Number);
            expect(x).toBeGreaterThanOrEqual(0);
            expect(y).toBeGreaterThanOrEqual(0);
            expect(y).toBeLessThan(5);
            expect(x).toBeLessThan(5);
        });
    });

    it('uses fixed seed for RNG when specified', async () => {
        const testMaze = {
            cells: Array.from({length: 10}, () => new Array(10).fill(0)),
            player: {start_position: {x: 0, y: 0}},
            enemies: [],
            buffs: [],
            debuffs: [],
            dots: {static_positions: [], random_count: 50},
            use_fixed_seed: true,
            random_seed: 12345,
        };

        const {useGameInitializer} = await loadHookWithMaze(testMaze);

        function TestComp() {
            // eslint-disable-next-line react-hooks/immutability
            window.__GAME_INIT = useGameInitializer();
            return null;
        }

        // first run: seed Math.random then render
        setupSeededRandom(testMaze.random_seed);
        render(React.createElement(TestComp));
        const firstRunDots = window.__GAME_INIT!.activeDots;
        cleanup();

        // reseed and run again
        setupSeededRandom(testMaze.random_seed);
        render(React.createElement(TestComp));
        const secondRunDots = window.__GAME_INIT!.activeDots;

        expect([...firstRunDots]).toEqual([...secondRunDots]);
    });
});


describe('useGameInitializer - extra coverage', () => {
    it('places random dots only on walls when placement_rules.allowed_on = "wall"', async () => {
        const testMaze = {
            cells: [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 1],
            ],
            player: {start_position: {x: 1, y: 1}},
            enemies: [],
            buffs: [],
            debuffs: [],
            dots: {static_positions: [], random_count: 4},
            placement_rules: {allowed_on: 'wall'},
        };

        const {useGameInitializer} = await loadHookWithMaze(testMaze);
        const init = mountHookAndGetInit(useGameInitializer);

        expect(init.initialTotalDots).toBeGreaterThanOrEqual(1);
        for (const key of init.activeDots) {
            const [x, y] = key.split('-').map(Number);
            expect(testMaze.cells[y][x]).toBe(1); // must be walled
        }
    });

    it('respects avoid_adjacent_walls: no placements adjacent to walls', async () => {
        const testMaze = {
            // center cell at (2,2) is an isolated road surrounded by roads except a wall at (2,1)
            cells: [
                [0, 0, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            player: {start_position: {x: 0, y: 0}},
            enemies: [],
            buffs: [],
            debuffs: [],
            dots: {static_positions: [], random_count: 6},
            placement_rules: {allowed_on: 'road', avoid_adjacent_walls: true},
            use_fixed_seed: true,
            random_seed: 42,
        };

        const {useGameInitializer} = await loadHookWithMaze(testMaze);
        const init = mountHookAndGetInit(useGameInitializer);

        // ensure none of the placed dots are adjacent to any wall cell
        const hasAdjacentToWall = (x: number, y: number) => {
            const adj = [
                [x, y - 1],
                [x, y + 1],
                [x - 1, y],
                [x + 1, y],
            ];
            return adj.some(([ax, ay]) => {
                if (ay < 0 || ay >= testMaze.cells.length || ax < 0 || ax >= testMaze.cells[0].length) return false;
                return testMaze.cells[ay][ax] === 1;
            });
        };

        for (const key of init.activeDots) {
            const [x, y] = key.split('-').map(Number);
            expect(hasAdjacentToWall(x, y)).toBe(false);
        }
    });

    it('places random enemies, buffs and debuffs when random_count > 0 using fixed seed', async () => {
        const testMaze = {
            cells: Array.from({length: 6}, () => new Array(6).fill(0)),
            player: {start_position: {x: 0, y: 0}},
            enemies: [
                {type: 'unknown-enemy', static_positions: [{x: 1, y: 1}], random_count: 2},
            ],
            buffs: [
                {type: 'unknown-buff', static_positions: [{x: 2, y: 2}], random_count: 1},
            ],
            debuffs: [
                {static_positions: [{x: 3, y: 3}], random_count: 1},
            ],
            dots: {static_positions: [], random_count: 0},
            use_fixed_seed: true,
            random_seed: 2024,
        };

        const {useGameInitializer} = await loadHookWithMaze(testMaze);

        // run twice to ensure determinism for a fixed seed
        const first = mountHookAndGetInit(useGameInitializer);
        // capture maps as arrays of keys
        const enemiesFirst = [...first.enemyPositions.keys()];
        const buffsFirst = [...first.buffPositions.keys()];
        const debuffsFirst = [...first.debuffPositions.keys()];

        // cleanup mount and remount (simulate fresh import)
        cleanup();
        vi.resetModules();
        globalThis.__TEST_MAZE_MODULE = {testMaze: testMaze as unknown as MazeData};
        const {useGameInitializer: secondHook} = await import('../useGameInitializer');
        const second = mountHookAndGetInit(secondHook);
        const enemiesSecond = [...second.enemyPositions.keys()];
        const buffsSecond = [...second.buffPositions.keys()];
        const debuffsSecond = [...second.debuffPositions.keys()];

        expect(enemiesFirst).toEqual(enemiesSecond);
        expect(buffsFirst).toEqual(buffsSecond);
        expect(debuffsFirst).toEqual(debuffsSecond);

        // default style fallback for unknown types
        // enemy unknown -> default 'enemy-3'; buff unknown -> 'buff-5'; debuff default -> 'debuff-2'
        const sampleEnemyKey = enemiesFirst.find(k => k !== '1-1');
        if (sampleEnemyKey) {
            expect(first.enemyPositions.get(sampleEnemyKey)).toBe('enemy-3');
        }
        const sampleBuffKey = buffsFirst.find(k => k !== '2-2');
        if (sampleBuffKey) {
            expect(first.buffPositions.get(sampleBuffKey)).toBe('buff-5');
            expect(first.buffMetaAt.get(sampleBuffKey)!.type).toBe('unknown-buff');
        }
        const sampleDebuffKey = debuffsFirst.find(k => k !== '3-3');
        if (sampleDebuffKey) {
            expect(first.debuffPositions.get(sampleDebuffKey)).toBe('debuff-2');
        }
    });

    it('never places dots where player start is occupied', async () => {
        const testMaze = {
            cells: Array.from({length: 4}, () => new Array(4).fill(0)),
            player: {start_position: {x: 1, y: 1}},
            enemies: [],
            buffs: [],
            debuffs: [],
            dots: {static_positions: [], random_count: 5},
            use_fixed_seed: true,
            random_seed: 7,
        };

        const {useGameInitializer} = await loadHookWithMaze(testMaze);
        const init = mountHookAndGetInit(useGameInitializer);

        const startKey = `${testMaze.player.start_position.x}-${testMaze.player.start_position.y}`;
        expect(init.activeDots.has(startKey)).toBe(false);
    });
});


describe('useGameInitializer - branch coverage extras', () => {
    it('returns proper default enemy styles for scorpion and patroller', async () => {
        const testMaze = {
            cells: [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
            ],
            player: {start_position: {x: 0, y: 0}},
            enemies: [
                {type: 'scorpion', static_positions: [{x: 1, y: 1}], random_count: 0},
                {type: 'patroller', static_positions: [{x: 2, y: 2}], random_count: 0},
            ],
            buffs: [],
            debuffs: [],
            dots: {static_positions: [], random_count: 0},
        };

        const {useGameInitializer} = await loadHookWithMaze(testMaze);
        const init = mountHookAndGetInit(useGameInitializer);

        expect(init.enemyPositions.get('1-1')).toBe('enemy-6');
        expect(init.enemyPositions.get('2-2')).toBe('enemy-7');
    });

    it('returns proper default buff styles (teleport, shield, time) and respects style override', async () => {
        const testMaze = {
            cells: [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            player: {start_position: {x: 0, y: 0}},
            enemies: [],
            buffs: [
                {type: 'teleport', static_positions: [{x: 0, y: 0}], random_count: 0},
                {type: 'shield', static_positions: [{x: 1, y: 0}], random_count: 0},
                {type: 'time', static_positions: [{x: 2, y: 0}], random_count: 0},
                {type: 'speed', style: 'custom-buff', static_positions: [{x: 3, y: 0}], random_count: 0},
            ],
            debuffs: [],
            dots: {static_positions: [], random_count: 0},
        };

        const {useGameInitializer} = await loadHookWithMaze(testMaze);
        const init = mountHookAndGetInit(useGameInitializer);

        expect(init.buffPositions.get('0-0')).toBe('buff-6');
        expect(init.buffPositions.get('1-0')).toBe('buff-3');
        expect(init.buffPositions.get('2-0')).toBe('buff-7');
        expect(init.buffPositions.get('3-0')).toBe('custom-buff');

        // metadata preserved for style-override buff
        expect(init.buffMetaAt.get('3-0')!.type).toBe('speed');
    });

    it('uses an explicitly injected maze in preference to __TEST_MAZE_MODULE', async () => {
        // Global test module points at one maze...
        const globalMaze = {
            cells: [[0, 0], [0, 0]],
            player: {start_position: {x: 0, y: 0}},
            enemies: [],
            buffs: [],
            debuffs: [],
            dots: {static_positions: [{x: 1, y: 0}], random_count: 0},
            difficulty: 'easy',
        };
        // ...but the caller passes a different maze explicitly.
        const injectedMaze = {
            cells: [[0, 0, 0], [0, 0, 0]],
            player: {start_position: {x: 0, y: 0}},
            enemies: [],
            buffs: [],
            debuffs: [],
            dots: {static_positions: [{x: 2, y: 1}, {x: 1, y: 1}], random_count: 0},
            difficulty: 'hard',
        };

        const {useGameInitializer} = await loadHookWithMaze(globalMaze);

        function TestComp() {
            // eslint-disable-next-line react-hooks/immutability
            window.__GAME_INIT = useGameInitializer(injectedMaze as unknown as MazeData);
            return null;
        }

        render(React.createElement(TestComp));
        const init = window.__GAME_INIT!;

        // The injected maze wins: its dots, difficulty and timer are used.
        expect(init.mazeData).toEqual(injectedMaze);
        expect(init.difficulty).toBe('hard');
        expect(init.timerDuration).toBe(360); // hard → 6 minutes
        expect(init.initialTotalDots).toBe(2);
        expect(init.activeDots.has('2-1')).toBe(true);
        expect(init.activeDots.has('1-1')).toBe(true);
    });

    it('handles sparse / undefined rows in cells without throwing (hits `if (!row) continue`)', async () => {
        const testMaze = {
            cells: [
                [0, 0],
                undefined,
                [0, 0],
            ],
            player: {start_position: {x: 0, y: 0}},
            enemies: [],
            buffs: [],
            debuffs: [],
            dots: {static_positions: [{x: 1, y: 0}, {x: 0, y: 2}], random_count: 0},
        };

        const {useGameInitializer} = await loadHookWithMaze(testMaze);
        const init = mountHookAndGetInit(useGameInitializer);

        // two static dots placed on existing rows (row 1 undefined should be skipped)
        expect(init.initialTotalDots).toBe(2);
        expect(init.activeDots.has('1-0')).toBe(true);
        expect(init.activeDots.has('0-2')).toBe(true);
    });
});