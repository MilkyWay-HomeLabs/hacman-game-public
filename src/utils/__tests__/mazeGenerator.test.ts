import {describe, expect, it} from 'vitest';
import {MazeGenerator} from '../mazeGenerator';

describe('MazeGenerator additional coverage', () => {
    it('returns all walls when maze is too small (start outside bounds)', () => {
        const g1 = new MazeGenerator(1, 5);
        const m1 = g1.generate();
        expect(m1.flat().every((c) => c === 1)).toBe(true);

        const g2 = new MazeGenerator(5, 1);
        const m2 = g2.generate();
        expect(m2.flat().every((c) => c === 1)).toBe(true);

        // zero-dimension side cases should not throw and should be arrays of walls
        const g3 = new MazeGenerator(0, 0);
        const m3 = g3.generate();
        expect(Array.isArray(m3)).toBe(true);
    });

    it('placeRandomObjects does not place on initially occupied positions and mutates the set', () => {
        const gen = new MazeGenerator(7, 7, 123);
        gen.generate();
        const occupied = new Set(['1,1', '2,2']);
        const initialOccupied = new Set(occupied); // keep a copy of initial to assert avoidance
        const placed = gen.placeRandomObjects(5, occupied);

        // none of the placed positions come from the initially occupied set
        expect(placed.every(({x, y}) => !initialOccupied.has(`${x},${y}`))).toBe(true);

        // the occupied set must now include newly placed positions
        for (const p of placed) {
            expect(occupied.has(`${p.x},${p.y}`)).toBe(true);
        }

        // no duplicates in placed
        const coords = placed.map((p) => `${p.x},${p.y}`);
        expect(new Set(coords).size).toBe(coords.length);

        expect(placed.length).toBeLessThanOrEqual(5);
    });

    it('buildMazeData selects deterministic random dots for same seed and merges static positions', () => {
        const seed = 4242;
        const g1 = new MazeGenerator(9, 9, seed);
        const g2 = new MazeGenerator(9, 9, seed);

        g1.generate();
        g2.generate();

        const cfg = {
            player: {start_position: {x: 1, y: 1}, direction: 'up'},
            enemies: [],
            buffs: [],
            debuffs: [],
            dots: {
                static_positions: [{x: 1, y: 1}],
                random_count: 6,
            },
        };

        const d1 = g1.buildMazeData(cfg);
        const d2 = g2.buildMazeData(cfg);

        // same seed -> identical selection of random positions
        expect(d1.dots.static_positions).toEqual(d2.dots.static_positions);

        // random_seed propagated correctly
        expect(d1.random_seed).toBe(seed);
        expect(d2.random_seed).toBe(seed);

        // static_positions includes the explicitly provided one
        expect(d1.dots.static_positions.some((p) => p.x === 1 && p.y === 1)).toBe(true);

        // random_count preserved in a result
        expect(d1.dots.random_count).toBe(6);
    });

    it('buildMazeData handles when random_count exceeds available path cells', () => {
        const g = new MazeGenerator(3, 3, 999);
        g.generate();
        const pathCells = g.getFreeRoadCells();
        // request more random dots than available path cells
        const cfg = {
            player: {start_position: {x: 1, y: 1}, direction: 'left'},
            enemies: [],
            buffs: [],
            debuffs: [],
            dots: {
                static_positions: [],
                random_count: pathCells.length + 10,
            },
        };

        const md = g.buildMazeData(cfg);

        // the implementation should clamp selection to available cells
        // resulting static_positions length should equal the number of available path cells
        expect(md.dots.static_positions.length).toBe(pathCells.length);
        expect(md.dots.random_count).toBe(cfg.dots.random_count);
    });
});