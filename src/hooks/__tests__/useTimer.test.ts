import {act, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useTimer} from '../useTimer';

describe('useTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('does not start the timer if timerStarted is false', () => {
        const setTimerStarted = vi.fn();
        const setTimerSeconds = vi.fn();
        const timerIntervalRef = {current: null};

        renderHook(() =>
            useTimer({
                timerStarted: false,
                setTimerStarted,
                setTimerSeconds,
                timerIntervalRef,
            })
        );

        expect(timerIntervalRef.current).toBeNull();
        expect(setTimerStarted).not.toHaveBeenCalled();
        expect(setTimerSeconds).not.toHaveBeenCalled();
    });

    it('decrements the timer every second when started', () => {
        const setTimerStarted = vi.fn();
        const setTimerSeconds = vi.fn((fn) => fn(10));
        const timerIntervalRef = {current: null};

        renderHook(() =>
            useTimer({
                timerStarted: true,
                setTimerStarted,
                setTimerSeconds,
                timerIntervalRef,
            })
        );

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(setTimerSeconds).toHaveBeenCalledTimes(3);
        expect(setTimerStarted).not.toHaveBeenCalled();
    });

    it('stops the timer when it reaches zero', () => {
        const setTimerStarted = vi.fn();
        const setTimerSeconds = vi.fn((fn) => fn(1));
        const timerIntervalRef = {current: null};
        const onTimeExpired = vi.fn();

        renderHook(() =>
            useTimer({
                timerStarted: true,
                setTimerStarted,
                setTimerSeconds,
                timerIntervalRef,
                onTimeExpired,
            })
        );

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(setTimerSeconds).toHaveBeenCalledTimes(1);
        expect(setTimerStarted).toHaveBeenCalledWith(false);
        expect(onTimeExpired).toHaveBeenCalled();
        expect(timerIntervalRef.current).toBeNull();
    });
    it('clears the interval on unmount', () => {
        const setTimerStarted = vi.fn();
        const setTimerSeconds = vi.fn();
        const timerIntervalRef = {current: null};

        const {unmount} = renderHook(() =>
            useTimer({
                timerStarted: true,
                setTimerStarted,
                setTimerSeconds,
                timerIntervalRef,
            })
        );

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        unmount();

        expect(timerIntervalRef.current).toBeNull();
    });
});