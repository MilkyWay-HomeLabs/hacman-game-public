import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MazeData } from '../../types/maze';

vi.mock('../../component/MazeGrid', () => ({
  default: (props: { cellSize: number }) => (
    <div data-testid="maze-grid" data-cell-size={props.cellSize} />
  ),
}));
vi.mock('../../component/RightPanel', () => ({
  default: (props: { lives: number; timeLeft: number | null }) => (
    <div data-testid="right-panel" data-lives={props.lives} data-time-left={String(props.timeLeft)} />
  ),
}));

import { PlayScreen } from '../PlayScreen';

const mazeData = {
  width: 3,
  height: 3,
  cells: [],
  player: { start_position: { x: 1, y: 1 }, direction: 'right' },
} as unknown as MazeData;

const baseProps = {
  mazeData,
  playerPosition: { x: 1, y: 1 },
  playerDirection: 'right' as const,
  isInvulnerable: false,
  enemyPositions: new Map<string, string>(),
  buffPositions: new Map<string, string>(),
  debuffPositions: new Map<string, string>(),
  activeDots: new Set<string>(),
  cellSize: 16,
  timeLeft: 42,
  totalTime: 300,
  lives: 3,
  imageIndex: 0,
  initialTotalDots: 10,
  collectedDots: 4,
  gameWon: false,
  onDeploy: vi.fn(),
  formatTime: (s: number) => String(s),
};

describe('PlayScreen', () => {
  it('renders the maze grid and the status panel with the passed props', () => {
    render(<PlayScreen {...baseProps} />);

    expect(screen.getByTestId('maze-grid')).toHaveAttribute('data-cell-size', '16');
    const panel = screen.getByTestId('right-panel');
    expect(panel).toHaveAttribute('data-lives', '3');
    expect(panel).toHaveAttribute('data-time-left', '42');
  });
});
