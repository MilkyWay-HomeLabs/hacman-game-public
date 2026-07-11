import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { SetStateAction } from 'react';
import { useAppEffects } from '../useAppEffects';
import type { MazeData } from '../../types/maze';

type Position = { x: number; y: number };

const mkMaze = () =>
  ({ cells: [[0]], player: { start_position: { x: 1, y: 1 } } } as unknown as MazeData);

describe('useAppEffects', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts timer on first player movement when mazeData is present', () => {
    const initialPlayerPositionRef = { current: { x: 1, y: 1 } as Position };
    const timerIntervalRef = { current: null as number | null };
    const invulnTimeoutRef = { current: null as number | null };
    const resetClearTimeoutRef = { current: null as number | null };

    const setTimerStarted = vi.fn();
    const setTimerSeconds = vi.fn();

    const props = {
      mazeData: mkMaze(),
      initialPlayerPositionRef,
      playerPosition: { x: 1, y: 1 },
      timerStarted: false,
      setTimerStarted,
      timerIntervalRef,
      setTimerSeconds,
      invulnTimeoutRef,
      resetClearTimeoutRef,
      gameOver: false,
      gameWon: false,
      activeDots: new Set<string>(['2-1']),
      setActiveDots: vi.fn(),
      setCollectedDots: vi.fn(),
      hasPlayerEffect: () => false,
      playerEffects: new Map<string, number>(),
      setForcedPlayerPosition: vi.fn(),
      setTeleportSignal: vi.fn(),
      collectedDots: 0,
      setGameWon: vi.fn(),
    };

    const { rerender } = renderHook((p) => useAppEffects(p!), { initialProps: props });

    // move player
    rerender({ ...props, playerPosition: { x: 2, y: 1 } });

    expect(setTimerStarted).toHaveBeenCalledWith(true);
  });

  it('does not start timer if mazeData is falsy', () => {
    const initialPlayerPositionRef = { current: { x: 1, y: 1 } as Position };
    const setTimerStarted = vi.fn();
    const setTimerSeconds = vi.fn();

    const props = {
      mazeData: null,
      initialPlayerPositionRef,
      playerPosition: { x: 2, y: 1 },
      timerStarted: false,
      setTimerStarted,
      timerIntervalRef: { current: null as number | null },
      setTimerSeconds,
      invulnTimeoutRef: { current: null as number | null },
      resetClearTimeoutRef: { current: null as number | null },
      gameOver: false,
      gameWon: false,
      activeDots: new Set<string>(),
      setActiveDots: vi.fn(),
      setCollectedDots: vi.fn(),
      hasPlayerEffect: () => false,
      playerEffects: new Map<string, number>(),
      setForcedPlayerPosition: vi.fn(),
      setTeleportSignal: vi.fn(),
      collectedDots: 0,
      setGameWon: vi.fn(),
    };

    renderHook(() => useAppEffects(props));
    expect(setTimerStarted).not.toHaveBeenCalled();
  });

  it('cleans up timers/timeouts on unmount and nulls refs', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    const timerIntervalRef = { current: 111 as number | null };
    const invulnTimeoutRef = { current: 222 as number | null };
    const resetClearTimeoutRef = { current: 333 as number | null };

    const props = {
      mazeData: mkMaze(),
      initialPlayerPositionRef: { current: { x: 1, y: 1 } as Position },
      playerPosition: { x: 1, y: 1 },
      timerStarted: false,
      setTimerStarted: vi.fn(),
      timerIntervalRef,
      setTimerSeconds: vi.fn(),
      invulnTimeoutRef,
      resetClearTimeoutRef,
      gameOver: false,
      gameWon: false,
      activeDots: new Set<string>(),
      setActiveDots: vi.fn(),
      setCollectedDots: vi.fn(),
      hasPlayerEffect: () => false,
      playerEffects: new Map<string, number>(),
      setForcedPlayerPosition: vi.fn(),
      setTeleportSignal: vi.fn(),
      collectedDots: 0,
      setGameWon: vi.fn(),
    };

    const { unmount } = renderHook(() => useAppEffects(props));
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalledWith(111);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(222);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(333);
    expect(timerIntervalRef.current).toBeNull();
    expect(invulnTimeoutRef.current).toBeNull();
    expect(resetClearTimeoutRef.current).toBeNull();
  });

  it('stops timer and resets flag on gameOver or gameWon', () => {
    const timerIntervalRef = { current: 123 as number | null };
    const setTimerStarted = vi.fn();

    const base = {
      mazeData: mkMaze(),
      initialPlayerPositionRef: { current: { x: 1, y: 1 } as Position },
      playerPosition: { x: 1, y: 1 },
      timerStarted: true,
      setTimerStarted,
      timerIntervalRef,
      setTimerSeconds: vi.fn(),
      invulnTimeoutRef: { current: null as number | null },
      resetClearTimeoutRef: { current: null as number | null },
      activeDots: new Set<string>(),
      setActiveDots: vi.fn(),
      setCollectedDots: vi.fn(),
      hasPlayerEffect: () => false,
      playerEffects: new Map<string, number>(),
      setForcedPlayerPosition: vi.fn(),
      setTeleportSignal: vi.fn(),
      collectedDots: 0,
      setGameWon: vi.fn(),
    };

    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    const { rerender } = renderHook((p) => useAppEffects(p!), {
      initialProps: { ...base, gameOver: false, gameWon: false },
    });

    rerender({ ...base, gameOver: true, gameWon: false });
    expect(clearIntervalSpy).toHaveBeenCalledWith(123);
    expect(timerIntervalRef.current).toBeNull();
    expect(setTimerStarted).toHaveBeenCalledWith(false);

    // reset for next case
    timerIntervalRef.current = 456;
    rerender({ ...base, gameOver: false, gameWon: true });
    expect(clearIntervalSpy).toHaveBeenCalledWith(456);
    expect(timerIntervalRef.current).toBeNull();
  });

  it('collects dot when player steps on active dot', () => {
    const activeDots = new Set<string>(['5-7', '2-2']);
    let collected = 0;

    const setActiveDots = (updater: SetStateAction<Set<string>>) => {
      const next = typeof updater === 'function' ? updater(activeDots) : updater;
      activeDots.clear();
      for (const k of next) activeDots.add(k);
    };
    const setCollectedDots = (updater: SetStateAction<number>) => {
      collected = typeof updater === 'function' ? updater(collected) : updater;
    };

    const props = {
      mazeData: mkMaze(),
      initialPlayerPositionRef: { current: { x: 1, y: 1 } as Position },
      playerPosition: { x: 5, y: 7 },
      timerStarted: false,
      setTimerStarted: vi.fn(),
      timerIntervalRef: { current: null as number | null },
      setTimerSeconds: vi.fn(),
      invulnTimeoutRef: { current: null as number | null },
      resetClearTimeoutRef: { current: null as number | null },
      gameOver: false,
      gameWon: false,
      activeDots,
      setActiveDots,
      setCollectedDots,
      hasPlayerEffect: () => false,
      playerEffects: new Map<string, number>(),
      setForcedPlayerPosition: vi.fn(),
      setTeleportSignal: vi.fn(),
      collectedDots: 0,
      setGameWon: vi.fn(),
    };

    renderHook(() => useAppEffects(props));

    expect(activeDots.has('5-7')).toBe(false);
    expect(collected).toBe(1);
  });

  it('poison drains time while effect is active', () => {
    vi.useFakeTimers();
    let seconds = 3;
    const setTimerSeconds = vi.fn((updater: SetStateAction<number>) => {
      seconds = typeof updater === 'function' ? updater(seconds) : updater;
    });
    const props = {
      mazeData: mkMaze(),
      initialPlayerPositionRef: { current: { x: 1, y: 1 } as Position },
      playerPosition: { x: 1, y: 1 },
      timerStarted: false,
      setTimerStarted: vi.fn(),
      timerIntervalRef: { current: null as number | null },
      setTimerSeconds,
      invulnTimeoutRef: { current: null as number | null },
      resetClearTimeoutRef: { current: null as number | null },
      gameOver: false,
      gameWon: false,
      activeDots: new Set<string>(),
      setActiveDots: vi.fn(),
      setCollectedDots: vi.fn(),
      hasPlayerEffect: (k: string) => k === 'poison',
      playerEffects: new Map<string, number>([['poison', Date.now() + 1000]]),
      setForcedPlayerPosition: vi.fn(),
      setTeleportSignal: vi.fn(),
      collectedDots: 0,
      setGameWon: vi.fn(),
    };
    renderHook(() => useAppEffects(props));
    vi.advanceTimersByTime(1000);
    expect(seconds).toBe(2);
  });

  it('glitch triggers micro-teleport while active', () => {
    vi.useFakeTimers();
    const setForcedPlayerPosition = vi.fn();
    const setTeleportSignal = vi.fn((up: SetStateAction<number>) => (typeof up === 'function' ? up(0) : up));
    const maze = { cells: [[0,0,0],[0,0,0],[0,0,0]], player: { start_position: { x: 1, y: 1 } } } as unknown as MazeData;
    const props = {
      mazeData: maze,
      initialPlayerPositionRef: { current: { x: 1, y: 1 } as Position },
      playerPosition: { x: 1, y: 1 },
      timerStarted: false,
      setTimerStarted: vi.fn(),
      timerIntervalRef: { current: null as number | null },
      setTimerSeconds: vi.fn(),
      invulnTimeoutRef: { current: null as number | null },
      resetClearTimeoutRef: { current: null as number | null },
      gameOver: false,
      gameWon: false,
      activeDots: new Set<string>(),
      setActiveDots: vi.fn(),
      setCollectedDots: vi.fn(),
      hasPlayerEffect: (k: string) => k === 'glitch',
      playerEffects: new Map<string, number>([['glitch', Date.now() + 5000]]),
      setForcedPlayerPosition,
      setTeleportSignal,
      collectedDots: 1,
      setGameWon: vi.fn(),
    };
    renderHook(() => useAppEffects(props));
    vi.advanceTimersByTime(700);
    expect(setForcedPlayerPosition).toHaveBeenCalled();
    expect(setTeleportSignal).toHaveBeenCalled();
  });

  it('sets gameWon when all dots collected and there were some', () => {
    const setGameWon = vi.fn();
    const props = {
      mazeData: mkMaze(),
      initialPlayerPositionRef: { current: { x: 1, y: 1 } as Position },
      playerPosition: { x: 1, y: 1 },
      timerStarted: false,
      setTimerStarted: vi.fn(),
      timerIntervalRef: { current: null as number | null },
      setTimerSeconds: vi.fn(),
      invulnTimeoutRef: { current: null as number | null },
      resetClearTimeoutRef: { current: null as number | null },
      gameOver: false,
      gameWon: false,
      activeDots: new Set<string>(),
      setActiveDots: vi.fn(),
      setCollectedDots: vi.fn(),
      hasPlayerEffect: () => false,
      playerEffects: new Map<string, number>(),
      setForcedPlayerPosition: vi.fn(),
      setTeleportSignal: vi.fn(),
      collectedDots: 10,
      setGameWon,
    };
    renderHook(() => useAppEffects(props));
    expect(setGameWon).toHaveBeenCalledWith(true);
  });
});
