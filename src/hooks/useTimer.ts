import * as React from 'react';
import {useEffect} from 'react';

type UseTimerParams = {
    timerStarted: boolean;
    setTimerStarted: (v: boolean) => void;
    setTimerSeconds: (fn: (n: number) => number) => void;
    timerIntervalRef: ReturnType<typeof React.useRef<number | null>>;
    onTimeExpired?: () => void;
};

/**
 * Custom hook to manage a countdown timer.
 *
 * @param {Object} params - The parameters for the hook.
 * @param {boolean} params.timerStarted - Indicates whether the timer is active.
 * @param {function(boolean): void} params.setTimerStarted - Function to update the timer's active state.
 * @param {function(function(number): number): void} params.setTimerSeconds - Function to update the remaining seconds.
 * @param {React.MutableRefObject<number | null>} params.timerIntervalRef - A ref to store the timer's interval ID.
 * @param {function(): void} [params.onTimeExpired] - Optional callback to execute when the timer reaches zero.
 */
export function useTimer({
                             timerStarted,
                             setTimerStarted,
                             setTimerSeconds,
                             timerIntervalRef,
                             onTimeExpired
                         }: UseTimerParams) {
    useEffect(() => {
        // Exit early if the timer is not started or if an interval already exists.
        if (!timerStarted) return;
        if (timerIntervalRef.current) return;

        // Start the timer interval.
        timerIntervalRef.current = window.setInterval(() => {
            setTimerSeconds(prev => {
                // If the timer reaches zero, clear the interval, stop the timer, and call the expiration callback.
                if (prev <= 1) {
                    if (timerIntervalRef.current) {
                        clearInterval(timerIntervalRef.current);
                        timerIntervalRef.current = null;
                    }
                    setTimerStarted(false);
                    onTimeExpired?.();
                    return 0;
                }
                // Decrement the timer by one second.
                return prev - 1;
            });
        }, 1000);

        // Cleanup function to clear the interval when the component unmounts or dependencies change.
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timerStarted]);
}