import {describe, expect, it} from 'vitest';
import {mazeStats} from '../mazeStats';
import {mapMazeLevel} from '../../api/mappers/maze';
import {easyLevelDto, mediumLevelDto} from '../../api/__tests__/fixtures/mazeLevels';
import type {MazeData} from '../../types/maze';

describe('mazeStats', () => {
    it('reports board size and per-kind entity counts', () => {
        const stats = mazeStats(mapMazeLevel(easyLevelDto));
        expect(stats).toEqual({
            width: 5,
            height: 5,
            enemyCount: 1,
            buffCount: 1,
            debuffCount: 1,
        });
    });

    it('counts zero for a level without entities', () => {
        const stats = mazeStats(mapMazeLevel(mediumLevelDto));
        expect(stats.enemyCount).toBe(0);
        expect(stats.buffCount).toBe(0);
        expect(stats.debuffCount).toBe(0);
    });

    it('sums static placements with random spawns and ignores negative random counts', () => {
        const maze = mapMazeLevel(easyLevelDto);
        const patched: MazeData = {
            ...maze,
            enemies: [
                {...maze.enemies[0], static_positions: [{x: 1, y: 1}, {x: 2, y: 1}], random_count: 3},
                {...maze.enemies[0], static_positions: [], random_count: -5},
            ],
        };
        expect(mazeStats(patched).enemyCount).toBe(5); // 2 static + 3 random; -5 ignored
    });
});
