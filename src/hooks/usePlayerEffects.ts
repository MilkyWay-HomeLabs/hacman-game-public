import {type Dispatch, type SetStateAction, useEffect, useState} from 'react';

/** Public API returned by {@link usePlayerEffects}. */
export interface PlayerEffectsApi {
    playerEffects: Map<string, number>;
    setPlayerEffects: Dispatch<SetStateAction<Map<string, number>>>;
    hasPlayerEffect: (kind: string) => boolean;
    addPlayerEffect: (kind: string, durationMs: number) => void;
}

/**
 * Custom React hook for managing player effects.
 *
 * This hook maintains a map of player effects, where each effect is associated with an expiry time.
 * It provides methods to add new effects, check if an effect is active, and automatically cleans up expired effects.
 *
 * @param {Map<string, number>} [initial=new Map()] - The initial map of player effects.
 * @returns {Object} - An object containing:
 *   - `playerEffects` {Map<string, number>} - The current map of player effects.
 *   - `setPlayerEffects` {Function} - A state setter for manually updating the player effects.
 *   - `hasPlayerEffect` {Function} - A function to check if a specific effect is active.
 *   - `addPlayerEffect` {Function} - A function to add a new effect with a specified duration.
 */
export function usePlayerEffects(initial: Map<string, number> = new Map<string, number>()): PlayerEffectsApi {
    // State to store the map of player effects.
    const [playerEffects, setPlayerEffects] = useState<Map<string, number>>(initial);

    // Helper function to get the current timestamp in milliseconds.
    const nowMs = () => Date.now();

    /**
     * Adds a new player effect with a specified duration.
     *
     * @param {string} kind - The name of the effect.
     * @param {number} durationMs - The duration of the effect in milliseconds.
     */
    const addPlayerEffect = (kind: string, durationMs: number) => {
        setPlayerEffects(prev => {
            const next = new Map(prev);
            next.set(kind, nowMs() + Math.max(0, durationMs)); // Ensure non-negative duration.
            return next;
        });
    };

    /**
     * Checks if a specific player effect is currently active.
     *
     * @param {string} kind - The name of the effect to check.
     * @returns {boolean} - `true` if the effect is active, `false` otherwise.
     */
    const hasPlayerEffect = (kind: string): boolean => {
        const exp = playerEffects.get(kind);
        return typeof exp === 'number' && exp > nowMs();
    };

    // Automatically cleans up expired effects every 250 ms.
    useEffect(() => {
        const clearExpired = () => {
            setPlayerEffects(prev => {
                let changed = false;
                const t = nowMs();
                const next = new Map(prev);
                for (const [k, v] of prev) {
                    if (v <= t) { // Remove effects that have expired.
                        next.delete(k);
                        changed = true;
                    }
                }
                return changed ? next : prev; // Only update state if changes occurred.
            });
        };
        const id = window.setInterval(clearExpired, 250); // Set an interval for cleanup.
        return () => window.clearInterval(id); // Clear interval on component unmount.
    }, []);

    // Return the state and utility functions for managing player effects.
    return {playerEffects, setPlayerEffects, hasPlayerEffect, addPlayerEffect};
}