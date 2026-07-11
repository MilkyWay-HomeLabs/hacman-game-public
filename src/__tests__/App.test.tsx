import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// App is now a thin router over the in-game screens; mock the screens so these tests
// focus on which screen App renders and how it wires the retry / deploy handlers.
vi.mock('../screens/PlayScreen', () => ({
  PlayScreen: () => <div data-testid="play-screen" />,
}));
vi.mock('../screens/GameOverScreen', () => ({
  GameOverScreen: (props: { onRetry: () => void }) => (
    <button data-testid="game-over" onClick={props.onRetry}>
      retry
    </button>
  ),
}));
vi.mock('../screens/WinScreen', () => ({
  WinScreen: (props: { onDeploy: () => void; scoreStatus: string }) => (
    <button data-testid="win" data-status={props.scoreStatus} onClick={props.onDeploy}>
      deploy
    </button>
  ),
}));
vi.mock('../component/TouchControls', () => ({
  TouchControls: () => <div data-testid="touch-controls" />,
}));

// Mock all hooks used by App. Return simple, controllable defaults.
vi.mock('../hooks/useGameState', () => ({ useGameState: vi.fn() }));
vi.mock('../hooks/usePlayerMovement', () => ({
  usePlayerMovement: vi.fn(() => ({ position: { x: 1, y: 1 }, move: vi.fn() })),
}));
vi.mock('../hooks/useEnemiesController', () => ({
  useEnemiesController: vi.fn(() => ({})),
}));
vi.mock('../hooks/usePlayerEffects.ts', () => ({
  usePlayerEffects: vi.fn(() => ({
    playerEffects: new Map(),
    hasPlayerEffect: () => false,
    addPlayerEffect: () => undefined,
  })),
}));
vi.mock('../hooks/useMagnet.ts', () => ({ useMagnet: vi.fn(() => undefined) }));
vi.mock('../hooks/useTimer.ts', () => ({ useTimer: vi.fn(() => undefined) }));
vi.mock('../hooks/useAppEffects.ts', () => ({ useAppEffects: vi.fn(() => undefined) }));
vi.mock('../hooks/useCollisionHandler', () => ({
  useCollisionHandler: vi.fn(() => undefined),
}));
vi.mock('../hooks/useEnemyPickups.ts', () => ({ default: vi.fn(() => undefined) }));
vi.mock('../hooks/useScoreSubmission.ts', () => ({
  useScoreSubmission: vi.fn(() => ({ status: 'idle', error: null, retry: vi.fn() })),
}));

let mockUseGameState: ReturnType<typeof vi.fn>;

const baseState = {
  playerDirection: 'down',
  setPlayerDirection: vi.fn(),
  forcedPlayerPosition: null,
  setForcedPlayerPosition: vi.fn(),
  isInvulnerable: false,
  setIsInvulnerable: vi.fn(),
  mazeData: { player: { start_position: { x: 1, y: 1 } }, cells: [] },
  activeDots: new Set<string>(),
  setActiveDots: vi.fn(),
  collectedDots: 0,
  setCollectedDots: vi.fn(),
  initialTotalDots: 0,
  enemyPositions: new Map(),
  setEnemyPositions: vi.fn(),
  buffPositions: new Map(),
  setBuffPositions: vi.fn(),
  buffMetaAt: new Map(),
  setBuffMetaAt: vi.fn(),
  debuffPositions: new Map(),
  setDebuffPositions: vi.fn(),
  debuffMetaAt: new Map(),
  setDebuffMetaAt: vi.fn(),
  lives: 3,
  setLives: vi.fn(),
  gameOver: false,
  setGameOver: vi.fn(),
  gameWon: false,
  setGameWon: vi.fn(),
  imageIndex: 0,
  teleportSignal: 0,
  setTeleportSignal: vi.fn(),
  timerSeconds: 0,
  setTimerSeconds: vi.fn(),
  timerStarted: false,
  setTimerStarted: vi.fn(),
  frozenUntil: 0,
  difficulty: 'easy',
  timerIntervalRef: { current: null },
  timerDuration: 300,
  resetCounterRef: { current: 0 },
  invulnTimeoutRef: { current: null },
  resetInProgressRef: { current: false },
  resetClearTimeoutRef: { current: null },
  initialPlayerPositionRef: { current: { x: 1, y: 1 } },
};

beforeEach(async () => {
  const mod = await import('../hooks/useGameState');
  mockUseGameState = mod.useGameState as unknown as ReturnType<typeof vi.fn>;
  mockUseGameState.mockReturnValue({ ...baseState });
  document.body.innerHTML = '';
});

describe('App', () => {
  it('renders the play screen when mazeData is present', async () => {
    const { default: App } = await import('../App');
    render(<App />);
    expect(screen.getByText('Maze Matrix')).toBeInTheDocument();
    expect(screen.getByTestId('play-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('game-over')).toBeNull();
    expect(screen.queryByTestId('win')).toBeNull();
  });

  it('shows the Game Over screen and Retry reloads the page', async () => {
    mockUseGameState.mockReturnValue({ ...baseState, gameOver: true });

    // @ts-expect-error override read-only location for the test
    delete window.location;
    const reloadMock = vi.fn();
    // @ts-expect-error minimal location stub
    window.location = { reload: reloadMock, origin: 'http://localhost' };

    const { default: App } = await import('../App');
    render(<App />);

    fireEvent.click(screen.getByTestId('game-over'));
    expect(reloadMock).toHaveBeenCalled();
  });

  it('shows the Win screen and Deploy returns to a host-validated URL', async () => {
    mockUseGameState.mockReturnValue({ ...baseState, gameWon: true, imageIndex: 2 });

    // @ts-expect-error override read-only location for the test
    delete window.location;
    const locationObj: { href: string; origin: string } = { href: '', origin: 'http://localhost' };
    // @ts-expect-error minimal location stub
    window.location = locationObj;

    const { default: App } = await import('../App');
    render(<App />);

    fireEvent.click(screen.getByTestId('win'));

    // With no same-host referrer, buildReturnUrl falls back to the configured Nebula
    // return URL on the allowed host (no open redirect, no legacy result=win params).
    expect(locationObj.href).toBe('https://milkyway.test/nebula/app/');
  });
});
