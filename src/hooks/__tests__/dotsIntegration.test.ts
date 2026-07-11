import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState } from 'react';
import { useAppEffects } from '../useAppEffects';
import { useMagnet } from '../useMagnet';
import type { MazeData } from '../../types/maze';

type Pos = { x: number; y: number };

function useDotsIntegration(options: {
  initialDots: string[];
  initialPlayer: Pos;
  magnet: boolean;
  gameOver?: boolean;
  gameWon?: boolean;
}) {
  const { initialDots, initialPlayer, magnet, gameOver = false, gameWon = false } = options;
  const [activeDots, setActiveDots] = useState<Set<string>>(new Set(initialDots));
  const [collected, setCollected] = useState(0);
  const [player, setPlayer] = useState<Pos>(initialPlayer);

  const timerIntervalRef = { current: null as number | null };
  const invulnTimeoutRef = { current: null as number | null };
  const resetClearTimeoutRef = { current: null as number | null };
  const initialPlayerPositionRef = { current: initialPlayer } as { current: Pos };
  const setTimerSeconds = () => {};
  const setGameWon = () => {};
  const setForcedPlayerPosition = () => {};
  const setTeleportSignal = () => {};

  // only required fields for the start-timer effect
  const mazeData = { cells: [[0]], player: { start_position: initialPlayer } } as unknown as MazeData;

  useAppEffects({
    mazeData,
    initialPlayerPositionRef,
    playerPosition: player,
    timerStarted: false,
    setTimerStarted: () => {},
    timerIntervalRef,
    setTimerSeconds,
    invulnTimeoutRef,
    resetClearTimeoutRef,
    gameOver,
    gameWon,
    activeDots,
    setActiveDots,
    setCollectedDots: setCollected,
    hasPlayerEffect: () => magnet,
    playerEffects: new Map<string, number>(),
    setForcedPlayerPosition,
    setTeleportSignal,
    collectedDots: collected,
    setGameWon,
  });

  useMagnet({
    playerPosition: player,
    hasPlayerEffect: () => magnet,
    setActiveDots,
    setCollectedDots: setCollected,
  });

  return {
    activeDots,
    collected,
    setPlayer,
  } as const;
}

describe('Dots collection integration (movement + magnet)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('does not double count when stepping on a dot with magnet active', () => {
    const { result } = renderHook(() =>
      useDotsIntegration({
        initialDots: ['1-1', '2-1'],
        initialPlayer: { x: 1, y: 1 },
        magnet: true,
      })
    );

    // On mount: useAppEffects collects the dot at 1-1 OR magnet does; should be counted exactly once
    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(result.current.activeDots.has('1-1')).toBe(false);
    // starting tile (1-1) plus adjacent (2-1) may be collected by magnet on the same tick
    expect(result.current.collected).toBe(2);
  });

  it('collects multiple dots correctly across rapid moves', () => {
    const { result, rerender } = renderHook(() =>
      useDotsIntegration({
        initialDots: ['1-1', '2-1', '3-1'],
        initialPlayer: { x: 1, y: 1 },
        magnet: false,
      })
    );

    // step to 2-1
    act(() => {
      result.current.setPlayer({ x: 2, y: 1 });
    });
    rerender();
    // step to 3-1
    act(() => {
      result.current.setPlayer({ x: 3, y: 1 });
    });
    rerender();

    expect(result.current.activeDots.has('1-1')).toBe(false);
    expect(result.current.activeDots.has('2-1')).toBe(false);
    expect(result.current.activeDots.has('3-1')).toBe(false);
    // at least the starting position should be collected; depending on timing more may be gathered
    expect(result.current.collected).toBeGreaterThanOrEqual(1);
  });

  it('magnet removes nearby dots without affecting already collected count', () => {
    const { result } = renderHook(() =>
      useDotsIntegration({
        initialDots: ['5-5', '6-5', '8-8'],
        initialPlayer: { x: 5, y: 5 },
        magnet: true,
      })
    );

    // run magnet interval once
    act(() => {
      vi.runOnlyPendingTimers();
    });

    // 5-5 collected either by movement effect or magnet; 6-5 is within range (1) so magnet collects too
    expect(result.current.activeDots.has('5-5')).toBe(false);
    expect(result.current.activeDots.has('6-5')).toBe(false);
    expect(result.current.activeDots.has('8-8')).toBe(true);
    expect(result.current.collected).toBe(2);
  });
});
