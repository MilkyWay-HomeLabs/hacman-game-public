import {act, renderHook} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {useGameState} from '../useGameState';

describe('useGameState', () => {
    it('returns initial state values correctly', () => {
        const {result} = renderHook(() => useGameState());
        expect(result.current.playerDirection).toBe('right');
        expect(result.current.lives).toBe(3);
        expect(result.current.gameOver).toBe(false);
        expect(result.current.difficulty).toBe('medium');
        expect(result.current.timerDuration).toBe(300);
    });

    it('updates player direction correctly when setPlayerDirection is called', () => {
        const {result} = renderHook(() => useGameState());
        act(() => result.current.setPlayerDirection('left'));
        expect(result.current.playerDirection).toBe('left');
    });

    it('calculates collected dots based on active dots and initial total dots', () => {
        const {result} = renderHook(() => useGameState());
        const initialTotal = result.current.initialTotalDots;
        act(() => {
            result.current.setActiveDots(new Set(['1,1', '2,2']));
        });
        const expected = Math.max(0, initialTotal - 2);
        expect(result.current.collectedDots).toBe(expected);
    });

    it('sets game over state correctly when setGameOver is called', () => {
        const {result} = renderHook(() => useGameState());
        act(() => result.current.setGameOver(true));
        expect(result.current.gameOver).toBe(true);
    });

    it('updates timer seconds correctly when setTimerSeconds is called', () => {
        const {result} = renderHook(() => useGameState());
        act(() => result.current.setTimerSeconds(120));
        expect(result.current.timerSeconds).toBe(120);
    });

    it('updates difficulty level correctly when setDifficulty is called', () => {
        const {result} = renderHook(() => useGameState());
        act(() => result.current.setDifficulty('hard'));
        expect(result.current.difficulty).toBe('hard');
    });

    it('toggles invulnerability state with setIsInvulnerable', () => {
        const {result} = renderHook(() => useGameState());
        act(() => result.current.setIsInvulnerable(true));
        expect(result.current.isInvulnerable).toBe(true);
        act(() => result.current.setIsInvulnerable(false));
        expect(result.current.isInvulnerable).toBe(false);
    });

    it('updates teleport signal correctly when setTeleportSignal is called', () => {
        const {result} = renderHook(() => useGameState());
        act(() => result.current.setTeleportSignal(5));
        expect(result.current.teleportSignal).toBe(5);
    });

    it('updates imageIndex when setCollectedDots is used', () => {
        const {result} = renderHook(() => useGameState());
        const previousIndex = result.current.imageIndex;
        act(() => {
            result.current.setCollectedDots(5);
        });
        expect(typeof result.current.imageIndex).toBe('number');
        expect(result.current.imageIndex).not.toBe(previousIndex);
    });

    it('does not make collectedDots negative when active dots change', () => {
        const {result} = renderHook(() => useGameState());
        act(() => {
            result.current.setActiveDots(new Set(['1,1']));
        });
        expect(result.current.collectedDots).toBeGreaterThanOrEqual(0);
    });
});