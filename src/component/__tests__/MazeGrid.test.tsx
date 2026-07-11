import {describe, expect, it} from 'vitest';
import {render} from '@testing-library/react';
import MazeGrid from '../MazeGrid';
import type {MazeData} from '../../types/maze';

const mockMazeData = {
    width: 3,
    cells: [
        [0, 1, 0],
        [0, 0, 1],
        [1, 0, 0],
    ],
} as unknown as MazeData;

const mockPlayerPosition = {x: 1, y: 1};

describe('MazeGrid component', () => {
    it('renders the correct number of cells for the maze', () => {
        const {container} = render(
            <MazeGrid
                mazeData={mockMazeData}
                playerPosition={mockPlayerPosition}
                playerDirection="right"
                isInvulnerable={false}
                enemyPositions={new Map()}
                buffPositions={new Map()}
                debuffPositions={new Map()}
                activeDots={new Set()}
            />
        );
        expect(container.querySelectorAll('.maze-grid > .cell').length).toBe(9);
    });

    it('applies wall and path classes to cells', () => {
        const {container} = render(
            <MazeGrid
                mazeData={mockMazeData}
                playerPosition={mockPlayerPosition}
                playerDirection="right"
                isInvulnerable={false}
                enemyPositions={new Map()}
                buffPositions={new Map()}
                debuffPositions={new Map()}
                activeDots={new Set()}
            />
        );
        const cells = Array.from(container.querySelectorAll('.maze-grid > .cell'));
        expect(cells[0].className).toContain('path');
        expect(cells[1].className).toContain('wall');
    });

    it('renders the player with direction and invulnerability classes when present', () => {
        const {container} = render(
            <MazeGrid
                mazeData={mockMazeData}
                playerPosition={mockPlayerPosition}
                playerDirection="up"
                isInvulnerable={true}
                enemyPositions={new Map()}
                buffPositions={new Map()}
                debuffPositions={new Map()}
                activeDots={new Set()}
            />
        );
        const player = container.querySelector('.player');
        expect(player).toBeTruthy();
        expect(player?.className).toContain('up');
        expect(player?.className).toContain('invulnerable');
        // The sprite is an overlay inside the cell: the cell keeps its own
        // path background and the entity renders as an SVG child.
        expect(player?.closest('.cell')?.className).toContain('path');
        expect(player?.querySelector('svg')).toBeTruthy();
    });

    it('renders enemies, buffs, and debuffs with their provided style classes', () => {
        const enemyPositions = new Map([['0-0', 'red']]);
        const buffPositions = new Map([['1-1', 'speed']]);
        const debuffPositions = new Map([['2-2', 'slow']]);
        const {container} = render(
            <MazeGrid
                mazeData={mockMazeData}
                playerPosition={mockPlayerPosition}
                playerDirection="right"
                isInvulnerable={false}
                enemyPositions={enemyPositions}
                buffPositions={buffPositions}
                debuffPositions={debuffPositions}
                activeDots={new Set()}
            />
        );
        expect(container.querySelector('.enemy.red')).toBeTruthy();
        expect(container.querySelector('.buff.speed')).toBeTruthy();
        expect(container.querySelector('.debuff.slow')).toBeTruthy();
        // Each entity is an SVG sprite inside a cell that keeps its own tile class.
        expect(container.querySelector('.enemy.red svg')).toBeTruthy();
        expect(container.querySelector('.buff.speed svg')).toBeTruthy();
        expect(container.querySelector('.debuff.slow svg')).toBeTruthy();
        expect(container.querySelector('.enemy.red')?.closest('.cell')).toBeTruthy();
    });

    it('renders active dots at the specified positions', () => {
        const activeDots = new Set(['0-0', '2-2']);
        const {container} = render(
            <MazeGrid
                mazeData={mockMazeData}
                playerPosition={mockPlayerPosition}
                playerDirection="right"
                isInvulnerable={false}
                enemyPositions={new Map()}
                buffPositions={new Map()}
                debuffPositions={new Map()}
                activeDots={activeDots}
            />
        );
        expect(container.querySelectorAll('.dot').length).toBe(2);
    });

    it('renders no cells when mazeData has no cells', () => {
        const emptyMaze = {width: 0, cells: []} as unknown as MazeData;
        const {container} = render(
            <MazeGrid
                mazeData={emptyMaze}
                playerPosition={mockPlayerPosition}
                playerDirection="right"
                isInvulnerable={false}
                enemyPositions={new Map()}
                buffPositions={new Map()}
                debuffPositions={new Map()}
                activeDots={new Set()}
            />
        );
        expect(container.querySelectorAll('.maze-grid > .cell').length).toBe(0);
    });
});