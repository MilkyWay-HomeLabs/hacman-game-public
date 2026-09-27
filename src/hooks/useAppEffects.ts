import { type Dispatch, type SetStateAction, type MutableRefObject, useEffect } from 'react';
import type { MazeData } from '../types/maze';

type Position = { x: number; y: number };

type Args = {
    // movement/timer
    mazeData: MazeData | null;
    initialPlayerPositionRef: MutableRefObject<Position>;
    playerPosition: Position;
    timerStarted: boolean;
    setTimerStarted: Dispatch<SetStateAction<boolean>>;
    timerIntervalRef: MutableRefObject<number | null>;
    setTimerSeconds: Dispatch<SetStateAction<number>>;

    // lifecycle cleanup refs
    invulnTimeoutRef: MutableRefObject<number | null>;
    resetClearTimeoutRef: MutableRefObject<number | null>;

    // game state gates
    gameOver: boolean;
    gameWon: boolean;

    // dots state
    activeDots: Set<string>;
    setActiveDots: Dispatch<SetStateAction<Set<string>>>;
    setCollectedDots: Dispatch<SetStateAction<number>>;

    // effects / pickups
    hasPlayerEffect: (name: string) => boolean;
    playerEffects: Map<string, number>;

    // teleport helpers
    setForcedPlayerPosition: Dispatch<SetStateAction<Position | null>>;
    setTeleportSignal: Dispatch<SetStateAction<number>>;

    // win
    collectedDots: number;
    setGameWon: Dispatch<SetStateAction<boolean>>;
};

export function useAppEffects({
    mazeData,
    initialPlayerPositionRef,
    playerPosition,
    timerStarted,
    setTimerStarted,
    timerIntervalRef,
    setTimerSeconds,
    invulnTimeoutRef,
    resetClearTimeoutRef,
    gameOver,
    gameWon,
    activeDots,
    setActiveDots,
    setCollectedDots,
    hasPlayerEffect,
    playerEffects,
    setForcedPlayerPosition,
    setTeleportSignal,
    collectedDots,
    setGameWon,
}: Args) {
    // Start timer on first player movement
    useEffect(() => {
        if (!mazeData) return;
        const startPos = initialPlayerPositionRef.current;
        const moved = playerPosition.x !== startPos.x || playerPosition.y !== startPos.y;

        if (moved && !timerStarted) {
            setTimerStarted(true);
        }
    }, [playerPosition, timerStarted, mazeData, initialPlayerPositionRef, setTimerStarted]);

    // Cleanup on unmounting
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
            if (invulnTimeoutRef.current) {
                clearTimeout(invulnTimeoutRef.current);
                invulnTimeoutRef.current = null;
            }
            if (resetClearTimeoutRef.current) {
                clearTimeout(resetClearTimeoutRef.current);
                resetClearTimeoutRef.current = null;
            }
        };
    }, [timerIntervalRef, invulnTimeoutRef, resetClearTimeoutRef]);

    // Stop the timer and freeze movement on game over or win
    useEffect(() => {
        if ((gameOver || gameWon) && timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            setTimerStarted(false);
        }
    }, [gameOver, gameWon, timerIntervalRef, setTimerStarted]);

    // Checking if a player goes on dot (atomic removal → increment only if removed)
    useEffect(() => {
        if (gameOver || gameWon) return;
        const dotKey = `${playerPosition.x}-${playerPosition.y}`;
        let removed = 0;
        setActiveDots(prev => {
            const next = new Set(prev);
            if (next.delete(dotKey)) removed = 1;
            return next;
        });
        if (removed > 0) {
            setCollectedDots(prev => prev + removed);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerPosition.x, playerPosition.y, gameOver, gameWon]);

    // Poison: drains time while active
    useEffect(() => {
        if (!hasPlayerEffect('poison')) return;
        const id = window.setInterval(() => {
            setTimerSeconds(prev => Math.max(0, prev - 1));
        }, 1000);
        return () => window.clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerEffects]);

    // Glitch: occasional micro-teleport while active
    useEffect(() => {
        if (!hasPlayerEffect('glitch') || !mazeData) return;
        const dirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
        ];
        const id = window.setInterval(() => {
            const { x, y } = playerPosition;
            const options = dirs
                .map(d => ({ x: x + d.dx, y: y + d.dy }))
                .filter(p => mazeData.cells[p.y]?.[p.x] === 0);
            if (options.length > 0) {
                const p = options[Math.floor(Math.random() * options.length)];
                setForcedPlayerPosition(p);
                setTeleportSignal(s => s + 1);
            }
        }, 700);
        return () => window.clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerEffects, mazeData, playerPosition.x, playerPosition.y]);

    // Win condition: all dots collected → Hacked!! overlay
    useEffect(() => {
        if (gameOver || gameWon) return;
        const totalRemaining = activeDots.size;
        if (totalRemaining === 0 && (activeDots.size + collectedDots) > 0) {
            setGameWon(true);
        }
    }, [activeDots, collectedDots, gameOver, gameWon, setGameWon]);
}
