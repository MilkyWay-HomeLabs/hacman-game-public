import React, {useEffect} from 'react';

/**
 * Custom React hook that implements the logic for a "magnet" effect in a game.
 * The magnet effect attracts and collects dots within a certain range of the players.
 *
 * @param {Object} options - The options object containing the required parameters.
 * @param {{x: number, y: number}} options.playerPosition - The current position of the player.
 * @param {(kind: string) => boolean} options.hasPlayerEffect - A function to check if the player has a specific effect(e.g.,"magnet").
 * @param {React.Dispatch<React.SetStateAction<Set<string>>>} options.setActiveDots - A state setter for the set of active dots on the board.
 * @param {React.Dispatch<React.SetStateAction<number>>} options.setCollectedDots - A state setter for the total number of collected dots.
 */
export function useMagnet(options: {
    playerPosition: { x: number; y: number };
    hasPlayerEffect: (kind: string) => boolean;
    setActiveDots: React.Dispatch<React.SetStateAction<Set<string>>>;
    setCollectedDots: React.Dispatch<React.SetStateAction<number>>;
}) {
    const {playerPosition, hasPlayerEffect, setActiveDots, setCollectedDots} = options;

    useEffect(() => {
        // Exit early if the player does not have the "magnet" effect
        if (!hasPlayerEffect('magnet')) return;

        const range = 3; // The range within which the magnet effect is applied

        /**
         * Applies the magnet effect by removing dots within range and updating the collected dots count.
         */
        const applyMagnet = () => {
            const px = playerPosition.x, py = playerPosition.y;
            setActiveDots(prev => {
                const next = new Set(prev);
                let removed = 0;
                for (const key of prev) {
                    const [x, y] = key.split('-').map(Number);
                    // Check if the dot is within the magnet range
                    if (Math.abs(x - px) + Math.abs(y - py) <= range) {
                        if (next.delete(key)) removed += 1; // Remove the dot and increment the count
                    }
                }
                if (removed > 0) {
                    setCollectedDots(prev => prev + removed);
                }
                return next;
            });
        };

        applyMagnet(); // Apply the magnet effect immediately

        // Set up an interval to repeatedly apply the magnet effect
        const id = window.setInterval(applyMagnet, 200);

        // Clean up the interval when the effect is no longer needed
        return () => window.clearInterval(id);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerPosition.x, playerPosition.y, /* hasPlayerEffect intentionally external */]);
}