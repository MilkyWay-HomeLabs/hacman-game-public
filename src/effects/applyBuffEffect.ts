import type {Buff, Debuff, MazeData} from '../types/maze';
import * as React from "react";

/**
 * Parameters for the `applyBuffEffect` function.
 */
interface ApplyBuffEffectParams {
    posKey: string; // Key representing the position of the buff.
    buffMetaAt: Map<string, Buff>; // Metadata for buffs at specific positions.
    buffPositions: Map<string, string>; // Map of positions to buff styles.
    playerPosition: { x: number; y: number }; // Current position of the player.
    mazeData: MazeData | null; // Data representing the maze, or null if unavailable.
    addPlayerEffect: (kind: string, durationMs: number) => void; // Function to add a player effect.
    setLives: React.Dispatch<React.SetStateAction<number>>; // Function to update the player's lives.
    setTimerSeconds?: React.Dispatch<React.SetStateAction<number>>; // Optional: some callers (collisions) don't wire the timer.
    setForcedPlayerPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>; // Function to set the player's position.
    setTeleportSignal: React.Dispatch<React.SetStateAction<number>>; // Function to trigger a teleport signal.
    setDebuffPositions: React.Dispatch<React.SetStateAction<Map<string, string>>>; // Function to update debuff positions.
    setDebuffMetaAt: React.Dispatch<React.SetStateAction<Map<string, Debuff>>>; // Function to update debuff metadata.
    enemiesApi: {
        freezeInRadius: (px: number, py: number, range: number, durationMs: number) => void; // Function to freeze enemies within a radius.
    };
}

/**
 * Applies the effect of a buff based on its type and the current game state.
 *
 * @param params - The parameters required to apply the buff effect.
 */
export const applyBuffEffect = ({
                                    posKey,
                                    buffMetaAt,
                                    buffPositions,
                                    playerPosition,
                                    mazeData,
                                    addPlayerEffect,
                                    setLives,
                                    setTimerSeconds,
                                    setForcedPlayerPosition,
                                    setTeleportSignal,
                                    setDebuffPositions,
                                    setDebuffMetaAt,
                                    enemiesApi
                                }: ApplyBuffEffectParams) => {
    // Retrieve metadata and style for the current position.
    const meta = buffMetaAt.get(posKey);
    const style = buffPositions.get(posKey) || meta?.style || '';

    // Tokenize the style string into individual classes or keys.
    const tokens = style.toString().trim().split(/\s+/).filter(Boolean);

    // Determine the type of buff based on the style or metadata.
    const buffType = (() => {
        const types = {
            'buff-1': 'health', 'buff-2': 'speed', 'buff-3': 'shield',
            'buff-4': 'damage', 'buff-5': 'emp', 'buff-6': 'teleport',
            'buff-7': 'time', 'buff-8': 'invisibility', 'buff-9': 'magnet',
            'buff-10': 'random'
        };
        return Object.entries(types).find(([key, type]) =>
            tokens.includes(key) || meta?.type === type
        )?.[1] || null;
    })();

    // Exit if no valid buff type is found.
    if (!buffType) return;

    // Define actions for each buff type.
    const actions: Record<string, () => void> = {
        health: () => setLives(prev => Math.min(prev + 1, 9)), // Increase lives, max 9.
        speed: () => addPlayerEffect('speed', 8000), // Apply speed effect for 8000 ms.
        shield: () => addPlayerEffect('shield', 6000), // Apply shield effect for 6000 ms.
        damage: () => addPlayerEffect('damage', 7000), // Apply damage effect for 7000 ms.
        emp: () => {
            // EMP effect: remove nearby debuffs and freeze enemies.
            const EMP_RANGE = 4, EMP_FREEZE_MS = 2500;
            const {x: px, y: py} = playerPosition;

            setDebuffPositions(prev => {
                const next = new Map(prev);
                prev.forEach((_, k) => {
                    const [sx, sy] = k.split('-').map(Number);
                    if (Math.abs(sx - px) + Math.abs(sy - py) <= EMP_RANGE) {
                        next.delete(k);
                        setDebuffMetaAt(dm => {
                            const dmNext = new Map(dm);
                            dmNext.delete(k);
                            return dmNext;
                        });
                    }
                });
                return next;
            });

            enemiesApi.freezeInRadius(px, py, EMP_RANGE, EMP_FREEZE_MS);
        },
        teleport: () => {
            // Teleport effect: move a player to a random empty cell.
            if (!mazeData) return;
            const candidates = mazeData.cells.flatMap((row, y) =>
                row.map((cell, x) => (cell === 0 ? {x, y} : null)).filter(Boolean)
            );
            if (candidates.length) {
                const dest = candidates[Math.floor(Math.random() * candidates.length)];
                setForcedPlayerPosition(dest);
                setTeleportSignal(s => s + 1);
            }
        },
        time: () => setTimerSeconds?.(prev => prev + 20), // Add 20 seconds to the timer.
        invisibility: () => addPlayerEffect('invisibility', 6000), // Apply invisibility for 6000 ms.
        magnet: () => addPlayerEffect('magnet', 8000), // Apply magnet effect for 8000ms.
        random: () => {
            // Random effect: pick and apply a random buff.
            const pool = ['speed', 'shield', 'damage', 'teleport', 'time', 'invisibility', 'magnet', 'health'];
            const pick = pool[Math.floor(Math.random() * pool.length)];
            actions[pick]?.();
        }
    };

    // Execute the action corresponding to the determined buff type.
    actions[buffType]?.();
};