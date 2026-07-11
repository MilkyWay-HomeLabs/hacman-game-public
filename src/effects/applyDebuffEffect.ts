import type {Debuff, MazeData} from '../types/maze';
import * as React from "react";
import {resetPlayerAfterDamage} from "./resetPlayerAfterDamage";

/**
 * Parameters for the `applyDebuffEffect` function.
 */
interface ApplyDebuffEffectParams {
    posKey: string; // The key identifying the player's position in the maze.
    debuffMetaAt: Map<string, Debuff>; // Metadata about debuffs applied at specific positions.
    debuffPositions: Map<string, string>; // Map of positions to debuff types.
    mazeData: MazeData | null; // Data about the maze, including player information.
    isInvulnerable: boolean; // Whether the player is currently invulnerable.
    lives: number; // The number of lives the player has.
    nowMs: () => number; // Function to get the current timestamp in milliseconds.
    hasPlayerEffect: (kind: string) => boolean; // Checks if the player has a specific effect.
    addPlayerEffect: (kind: string, durationMs: number) => void; // Adds an effect to the player for a duration.
    setLives: React.Dispatch<React.SetStateAction<number>>; // Updates the player's lives.
    setFrozenUntil: React.Dispatch<React.SetStateAction<number>>; // Sets the timestamp until the player is frozen.
    setPlayerEffects: React.Dispatch<React.SetStateAction<Map<string, number>>>; // Updates the player's effects.
    setForcedPlayerPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>; // Sets the player's forced position.
    setTeleportSignal: React.Dispatch<React.SetStateAction<number>>; // Triggers a teleport signal.
    setGameOver: React.Dispatch<React.SetStateAction<boolean>>; // Ends the game.
    setIsInvulnerable: React.Dispatch<React.SetStateAction<boolean>>; // Sets the player's invulnerability state.
    resetCounterRef: { current: number }; // Reference to the reset counter.
    resetInProgressRef: { current: boolean }; // Reference to the reset progress state.
    resetClearTimeoutRef: { current: number | null }; // Reference to the reset timeout ID.
    invulnTimeoutRef: { current: number | null }; // Reference to the invulnerability timeout ID.
}

/**
 * Applies a debuff effect to the player based on their position and the current game state.
 *
 * @param params - The parameters required to apply the debuff effect.
 */
export const applyDebuffEffect = ({
                                      posKey,
                                      debuffMetaAt,
                                      debuffPositions,
                                      mazeData,
                                      isInvulnerable,
                                      lives,
                                      nowMs = () => Date.now(),
                                      hasPlayerEffect,
                                      addPlayerEffect,
                                      setLives,
                                      setFrozenUntil,
                                      setPlayerEffects,
                                      setForcedPlayerPosition,
                                      setTeleportSignal,
                                      setGameOver,
                                      setIsInvulnerable,
                                      resetCounterRef,
                                      resetInProgressRef,
                                      resetClearTimeoutRef,
                                      invulnTimeoutRef
                                  }: ApplyDebuffEffectParams) => {
    // Retrieve metadata and style information for the current position.
    const meta = debuffMetaAt?.get?.(posKey);
    const rawStyle = debuffPositions?.get?.(posKey) ?? meta?.style ?? meta?.type ?? '';

    // Map of raw styles to debuff types.
    const debuffMap: Record<string, string> = {
        'debuff-1': 'poison', 'poison': 'poison',
        'debuff-2': 'slow', 'slow': 'slow',
        'debuff-3': 'blind', 'blind': 'blind',
        'debuff-4': 'burn', 'burn': 'burn',
        'debuff-5': 'drain', 'drain': 'drain',
        'debuff-6': 'confuse', 'confuse': 'confuse',
        'debuff-8': 'freeze', 'freeze': 'freeze',
        'debuff-7': 'spike', 'spike': 'spike',
        'debuff-9': 'rust', 'rust': 'rust',
        'debuff-10': 'glitch', 'glitch': 'glitch',
        'teleport': 'teleport'
    };

    // Determine the debuff type from the raw style or metadata.
    let kindFromStyle: string | null = null;
    if (typeof rawStyle === 'string' && rawStyle.length > 0) {
        if (debuffMap[rawStyle]) {
            kindFromStyle = debuffMap[rawStyle];
        } else {
            const found = Object.keys(debuffMap).find(key => rawStyle.includes(key));
            if (found) kindFromStyle = debuffMap[found];
        }
    }
    if (!kindFromStyle && meta?.type && debuffMap[meta.type]) {
        kindFromStyle = debuffMap[meta.type];
    }

    // Exit if no debuff type is determined or the player is invulnerable.
    if (!kindFromStyle) return;
    if (isInvulnerable) return;

    // Attempt to stamp the debuff's last-trigger time. Legacy behavior: this overwrites the
    // meta entry with a timestamp (the entry is deleted by the caller right after), hence the
    // deliberate widening cast rather than a `Debuff` value.
    try {
        if (debuffMetaAt && typeof debuffMetaAt.set === 'function') {
            const now = typeof nowMs === 'function' ? nowMs() : Date.now();
            (debuffMetaAt as unknown as Map<string, number>).set(posKey, now);
        }
    } catch {
        // Ignore errors when updating metadata.
    }

    // Define actions for each debuff type.
    const debuffActions: Record<string, () => void> = {
        poison: () => addPlayerEffect?.('poison', 6000),
        slow: () => addPlayerEffect?.('slow', 6000),
        blind: () => addPlayerEffect?.('blind', 6000),
        burn: () => addPlayerEffect?.('burn', 3000),
        drain: () => {
            if (typeof setPlayerEffects === 'function') {
                setPlayerEffects((prev) => {
                    const t = typeof nowMs === 'function' ? nowMs() : Date.now();
                    const src = prev instanceof Map
                        ? prev as Map<string, number>
                        : new Map<string, number>(Object.entries(prev ?? {}) as Iterable<[string, number]>);
                    const next = new Map<string, number>();
                    for (const [k, exp] of src.entries()) {
                        const key = String(k);
                        if (exp > t) {
                            const remain = exp - t;
                            next.set(key, t + Math.max(0, Math.floor(remain * 0.6)));
                        } else {
                            next.set(key, exp);
                        }
                    }
                    return next;
                });
            }
        },
        confuse: () => addPlayerEffect?.('confuse', 5000),
        freeze: () => setFrozenUntil?.((typeof nowMs === 'function' ? nowMs() : Date.now()) + 2000),
        spike: () => {
            if (hasPlayerEffect?.('shield') || hasPlayerEffect?.('damage') || isInvulnerable) return;

            const start = mazeData?.player?.start_position ?? {x: 1, y: 1};

            if (lives > 1) {
                resetPlayerAfterDamage?.({
                    startPosition: start,
                    setLives,
                    setForcedPlayerPosition,
                    setTeleportSignal,
                    setIsInvulnerable,
                    resetCounterRef,
                    resetInProgressRef,
                    resetClearTimeoutRef,
                    invulnerabilityTimeoutRef: invulnTimeoutRef
                });
            } else {
                setLives?.(0);
                setGameOver?.(true);
            }
        },
        rust: () => addPlayerEffect?.('slow', 2000),
        glitch: () => addPlayerEffect?.('glitch', 6000),
        teleport: () => setTeleportSignal?.((s) => s + 1)
    };

    // Execute the action for the determined debuff type.
    debuffActions[kindFromStyle]?.();
};