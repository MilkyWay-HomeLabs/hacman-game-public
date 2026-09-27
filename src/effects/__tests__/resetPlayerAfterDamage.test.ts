import type {Mock} from 'vitest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {resetPlayerAfterDamage} from '../resetPlayerAfterDamage';

describe('resetPlayerAfterDamage', () => {
    let mockSetLives: Mock;
    let mockSetForcedPlayerPosition: Mock;
    let mockSetTeleportSignal: Mock;
    let mockSetIsInvulnerable: Mock;
    let resetCounterRef: { current: number };
    let resetInProgressRef: { current: boolean };
    let resetClearTimeoutRef: { current: number | null };
    let invulnerabilityTimeoutRef: { current: number | null };

    beforeEach(() => {
        vi.useFakeTimers();

        mockSetLives = vi.fn();
        mockSetForcedPlayerPosition = vi.fn();
        mockSetTeleportSignal = vi.fn();
        mockSetIsInvulnerable = vi.fn();

        resetCounterRef = {current: 0};
        resetInProgressRef = {current: false};
        resetClearTimeoutRef = {current: null};
        invulnerabilityTimeoutRef = {current: null};
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should decrement lives by 1', () => {
        resetPlayerAfterDamage({
            startPosition: {x: 1, y: 1},
            setLives: mockSetLives,
            setForcedPlayerPosition: mockSetForcedPlayerPosition,
            setTeleportSignal: mockSetTeleportSignal,
            setIsInvulnerable: mockSetIsInvulnerable,
            resetCounterRef,
            resetInProgressRef,
            resetClearTimeoutRef,
            invulnerabilityTimeoutRef
        });

        expect(mockSetLives).toHaveBeenCalledWith(expect.any(Function));

        const updaterFn = mockSetLives.mock.calls[0][0] as (prev: number) => number;
        expect(updaterFn(3)).toBe(2);
    });

    it('should teleport player to start position', () => {
        const startPosition = {x: 5, y: 10};

        resetPlayerAfterDamage({
            startPosition,
            setLives: mockSetLives,
            setForcedPlayerPosition: mockSetForcedPlayerPosition,
            setTeleportSignal: mockSetTeleportSignal,
            setIsInvulnerable: mockSetIsInvulnerable,
            resetCounterRef,
            resetInProgressRef,
            resetClearTimeoutRef,
            invulnerabilityTimeoutRef
        });

        expect(mockSetForcedPlayerPosition).toHaveBeenCalledWith(startPosition);
    });

    it('should increment reset counter and set reset in progress', () => {
        resetPlayerAfterDamage({
            startPosition: {x: 1, y: 1},
            setLives: mockSetLives,
            setForcedPlayerPosition: mockSetForcedPlayerPosition,
            setTeleportSignal: mockSetTeleportSignal,
            setIsInvulnerable: mockSetIsInvulnerable,
            resetCounterRef,
            resetInProgressRef,
            resetClearTimeoutRef,
            invulnerabilityTimeoutRef
        });

        expect(resetCounterRef.current).toBe(1);
        expect(resetInProgressRef.current).toBe(true);
    });

    it('should trigger teleport signal', () => {
        resetPlayerAfterDamage({
            startPosition: {x: 1, y: 1},
            setLives: mockSetLives,
            setForcedPlayerPosition: mockSetForcedPlayerPosition,
            setTeleportSignal: mockSetTeleportSignal,
            setIsInvulnerable: mockSetIsInvulnerable,
            resetCounterRef,
            resetInProgressRef,
            resetClearTimeoutRef,
            invulnerabilityTimeoutRef
        });

        expect(mockSetTeleportSignal).toHaveBeenCalledWith(expect.any(Function));

        const updaterFn = mockSetTeleportSignal.mock.calls[0][0] as (s: number) => number;
        expect(updaterFn(5)).toBe(6);
    });

    it('should set invulnerability immediately', () => {
        resetPlayerAfterDamage({
            startPosition: {x: 1, y: 1},
            setLives: mockSetLives,
            setForcedPlayerPosition: mockSetForcedPlayerPosition,
            setTeleportSignal: mockSetTeleportSignal,
            setIsInvulnerable: mockSetIsInvulnerable,
            resetCounterRef,
            resetInProgressRef,
            resetClearTimeoutRef,
            invulnerabilityTimeoutRef
        });

        expect(mockSetIsInvulnerable).toHaveBeenCalledWith(true);
    });

    it('should clear reset state after 250ms', () => {
        resetPlayerAfterDamage({
            startPosition: {x: 1, y: 1},
            setLives: mockSetLives,
            setForcedPlayerPosition: mockSetForcedPlayerPosition,
            setTeleportSignal: mockSetTeleportSignal,
            setIsInvulnerable: mockSetIsInvulnerable,
            resetCounterRef,
            resetInProgressRef,
            resetClearTimeoutRef,
            invulnerabilityTimeoutRef
        });

        expect(resetInProgressRef.current).toBe(true);
        expect(resetCounterRef.current).toBe(1);

        vi.advanceTimersByTime(250);

        expect(resetInProgressRef.current).toBe(false);
        expect(resetCounterRef.current).toBe(0);
        expect(resetClearTimeoutRef.current).toBeNull();
    });

    it('should remove invulnerability after 1500ms', () => {
        resetPlayerAfterDamage({
            startPosition: {x: 1, y: 1},
            setLives: mockSetLives,
            setForcedPlayerPosition: mockSetForcedPlayerPosition,
            setTeleportSignal: mockSetTeleportSignal,
            setIsInvulnerable: mockSetIsInvulnerable,
            resetCounterRef,
            resetInProgressRef,
            resetClearTimeoutRef,
            invulnerabilityTimeoutRef
        });

        expect(mockSetIsInvulnerable).toHaveBeenCalledWith(true);

        vi.advanceTimersByTime(1500);

        expect(mockSetIsInvulnerable).toHaveBeenCalledWith(false);
        expect(invulnerabilityTimeoutRef.current).toBeNull();
    });

    it('should clear previous reset timeout if exists', () => {
        const previousTimeout = window.setTimeout(() => {
        }, 1000);
        resetClearTimeoutRef.current = previousTimeout;
        const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

        resetPlayerAfterDamage({
            startPosition: {x: 1, y: 1},
            setLives: mockSetLives,
            setForcedPlayerPosition: mockSetForcedPlayerPosition,
            setTeleportSignal: mockSetTeleportSignal,
            setIsInvulnerable: mockSetIsInvulnerable,
            resetCounterRef,
            resetInProgressRef,
            resetClearTimeoutRef,
            invulnerabilityTimeoutRef
        });

        expect(clearTimeoutSpy).toHaveBeenCalledWith(previousTimeout);
    });

    it('should clear previous invulnerability timeout if exists', () => {
        const previousTimeout = window.setTimeout(() => {
        }, 1000);
        invulnerabilityTimeoutRef.current = previousTimeout;
        const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

        resetPlayerAfterDamage({
            startPosition: {x: 1, y: 1},
            setLives: mockSetLives,
            setForcedPlayerPosition: mockSetForcedPlayerPosition,
            setTeleportSignal: mockSetTeleportSignal,
            setIsInvulnerable: mockSetIsInvulnerable,
            resetCounterRef,
            resetInProgressRef,
            resetClearTimeoutRef,
            invulnerabilityTimeoutRef
        });

        expect(clearTimeoutSpy).toHaveBeenCalledWith(previousTimeout);
    });

    it('increments hitsTakenRef when provided (M7-1 telemetry)', () => {
        const hitsTakenRef = {current: 0};

        resetPlayerAfterDamage({
            startPosition: {x: 1, y: 1},
            setLives: mockSetLives,
            setForcedPlayerPosition: mockSetForcedPlayerPosition,
            setTeleportSignal: mockSetTeleportSignal,
            setIsInvulnerable: mockSetIsInvulnerable,
            resetCounterRef,
            resetInProgressRef,
            resetClearTimeoutRef,
            invulnerabilityTimeoutRef,
            hitsTakenRef
        });

        expect(hitsTakenRef.current).toBe(1);
    });

    it('does not throw when hitsTakenRef is omitted', () => {
        expect(() => resetPlayerAfterDamage({
            startPosition: {x: 1, y: 1},
            setLives: mockSetLives,
            setForcedPlayerPosition: mockSetForcedPlayerPosition,
            setTeleportSignal: mockSetTeleportSignal,
            setIsInvulnerable: mockSetIsInvulnerable,
            resetCounterRef,
            resetInProgressRef,
            resetClearTimeoutRef,
            invulnerabilityTimeoutRef
        })).not.toThrow();
    });
});