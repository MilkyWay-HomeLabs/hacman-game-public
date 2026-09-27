import {describe, expect, it} from 'vitest';
import {wrapStep} from '../grid';

describe('wrapStep', () => {
    const maze = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
    ];

    it('steps to an adjacent path cell inside the grid', () => {
        expect(wrapStep(maze, 0, 0, 'right')).toEqual({x: 1, y: 0});
        expect(wrapStep(maze, 0, 0, 'down')).toEqual({x: 0, y: 1});
        expect(wrapStep(maze, 2, 2, 'left')).toEqual({x: 1, y: 2});
        expect(wrapStep(maze, 2, 2, 'up')).toEqual({x: 2, y: 1});
    });

    it('returns null when the target cell is a wall', () => {
        expect(wrapStep(maze, 0, 1, 'right')).toBeNull();
        expect(wrapStep(maze, 1, 0, 'down')).toBeNull();
    });

    it('wraps across every edge onto the opposite side', () => {
        expect(wrapStep(maze, 0, 0, 'left')).toEqual({x: 2, y: 0});
        expect(wrapStep(maze, 2, 0, 'right')).toEqual({x: 0, y: 0});
        expect(wrapStep(maze, 0, 0, 'up')).toEqual({x: 0, y: 2});
        expect(wrapStep(maze, 0, 2, 'down')).toEqual({x: 0, y: 0});
    });

    it('rejects a wrap that lands on a wall', () => {
        const deadEnd = [
            [0, 0, 1],
        ];
        expect(wrapStep(deadEnd, 0, 0, 'left')).toBeNull();
    });

    it('handles empty grids without throwing', () => {
        expect(wrapStep([], 0, 0, 'up')).toBeNull();
        expect(wrapStep([[]], 0, 0, 'left')).toBeNull();
    });
});
