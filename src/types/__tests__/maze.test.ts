import {describe, expect, it} from 'vitest';
import type {Buff, Debuff, Dots, Enemy, MazeData, PlacementRules, Player,} from '../maze';

describe('MazeData', () => {
    it('creates a valid MazeData object with all required fields', () => {
        const maze: MazeData = {
            width: 10,
            height: 10,
            random_seed: 12345,
            player: {
                start_position: {x: 0, y: 0},
                direction: 'up',
            },
            placement_rules: {
                allowed_on: 'road',
                avoid_adjacent_walls: true,
            },
            cells: Array.from({length: 10}, () => Array(10).fill(0)),
            enemies: [],
            buffs: [],
            debuffs: [],
            dots: {
                static_positions: [],
                random_count: 0,
            },
        };

        expect(maze.width).toBe(10);
        expect(maze.height).toBe(10);
        expect(maze.player.start_position).toEqual({x: 0, y: 0});
        expect(maze.placement_rules.allowed_on).toBe('road');
    });

    it('allows optional fields in Enemy, Buff, and Debuff objects', () => {
        const enemy: Enemy = {
            type: 'ghost',
            id: 'enemy-1',
            static_positions: [{x: 1, y: 1}],
            random_count: 2,
            notes: 'Spawns near the player',
            style: 'enemy-1',
        };

        const buff: Buff = {
            type: 'speed',
            id: 'buff-1',
            static_positions: [{x: 2, y: 2}],
            random_count: 1,
            description: 'Increases player speed',
            style: 'buff-1',
            effect: {speed: 2},
            rules: {pickupBy: ['player'], destroyOnTouch: true},
        };

        const debuff: Debuff = {
            type: 'poison',
            id: 'debuff-1',
            static_positions: [{x: 3, y: 3}],
            random_count: 1,
            style: 'debuff-1',
            effect: {health: -10},
            rules: {pickupBy: ['player'], destroyOnTouch: false},
        };

        expect(enemy.notes).toBe('Spawns near the player');
        expect(buff.description).toBe('Increases player speed');
        expect(debuff.effect.health).toBe(-10);
    });

    it('handles empty arrays for static_positions and random_count of zero', () => {
        const dots: Dots = {
            static_positions: [],
            random_count: 0,
        };

        expect(dots.static_positions).toHaveLength(0);
        expect(dots.random_count).toBe(0);
    });

    it('preserves runtime values that may not conform to compile-time types', () => {
        const player: Player = {
            start_position: {x: 0, y: 0},
            direction: 'invalid_direction' as unknown as Player['direction'],
        };

        expect(player.direction).toBe('invalid_direction');
    });

    it('represents PlacementRules correctly with both flags', () => {
        const rules: PlacementRules = {
            allowed_on: 'road',
            avoid_adjacent_walls: false,
        };

        expect(rules.allowed_on).toBe('road');
        expect(rules.avoid_adjacent_walls).toBe(false);
    });
});