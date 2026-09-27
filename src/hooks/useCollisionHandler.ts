import {type Dispatch, type SetStateAction, useEffect} from 'react';
import type {Buff, Debuff, MazeData} from '../types/maze';
import type {EnemiesAPI} from './useEnemiesController';
import {applyBuffEffect, applyDebuffEffect, resetPlayerAfterDamage} from '../effects';

// Local alias to avoid using deprecated React.MutableRefObject
type MutableRef<T> = { current: T };

type Args = {
    playerPosition: { x: number; y: number };
    mazeData: MazeData | null;
    enemyPositions: Map<string, string>;
    buffPositions: Map<string, string>;
    debuffPositions: Map<string, string>;
    buffMetaAt: Map<string, Buff>;
    debuffMetaAt: Map<string, Debuff>;
    hasPlayerEffect: (k: string) => boolean;
    addPlayerEffect: (k: string, exp: number) => void;
    enemiesApi: EnemiesAPI;
    // setters & refs (use proper Dispatch/SetStateAction so updater callbacks are allowed)
    setLives: Dispatch<SetStateAction<number>>;
    setGameOver: Dispatch<SetStateAction<boolean>>;
    setForcedPlayerPosition: Dispatch<SetStateAction<{ x: number; y: number } | null>>;
    setTeleportSignal: Dispatch<SetStateAction<number>>;
    setIsInvulnerable: Dispatch<SetStateAction<boolean>>;
    resetCounterRef: MutableRef<number>;
    resetInProgressRef: MutableRef<boolean>;
    resetClearTimeoutRef: MutableRef<number | null>;
    invulnTimeoutRef: MutableRef<number | null>;
    setBuffPositions: Dispatch<SetStateAction<Map<string, string>>>;
    setBuffMetaAt: Dispatch<SetStateAction<Map<string, Buff>>>;
    setDebuffPositions: Dispatch<SetStateAction<Map<string, string>>>;
    setDebuffMetaAt: Dispatch<SetStateAction<Map<string, Debuff>>>;
    setEnemyPositions: Dispatch<SetStateAction<Map<string, string>>>;
    lives: number;
    isInvulnerable: boolean;
    gameOver: boolean;
    gameWon: boolean;
    // Gameplay-telemetry counters (M7-1), all optional -- existing callers/tests that don't
    // care about telemetry are unaffected.
    enemiesDefeatedRef?: MutableRef<number>;
    buffsCollectedRef?: MutableRef<number>;
    hitsTakenRef?: MutableRef<number>;
};

export function useCollisionHandler(args: Args) {
    useEffect(() => {
        const {
            playerPosition, mazeData, enemyPositions, buffPositions, debuffPositions,
            buffMetaAt, debuffMetaAt, hasPlayerEffect, addPlayerEffect, enemiesApi,
            setLives, setGameOver, setForcedPlayerPosition, setTeleportSignal, setIsInvulnerable,
            resetCounterRef, resetInProgressRef, resetClearTimeoutRef, invulnTimeoutRef,
            setBuffPositions, setBuffMetaAt, setDebuffPositions, setDebuffMetaAt, setEnemyPositions,
            lives, isInvulnerable, gameOver, gameWon,
            enemiesDefeatedRef, buffsCollectedRef, hitsTakenRef
        } = args;
        if (!mazeData || gameOver || gameWon) return;
        const key = `${playerPosition.x}-${playerPosition.y}`;

        const start = mazeData.player.start_position;
        const justReset = (playerPosition.x === start.x && playerPosition.y === start.y && resetCounterRef.current > 0);

        if (!justReset && enemyPositions.has(key)) {
            if (resetInProgressRef.current || isInvulnerable) return;
            if (hasPlayerEffect('invisibility')) return;
            if (hasPlayerEffect('damage')) {
                const [ex, ey] = key.split('-').map(Number);
                try {
                    enemiesApi.destroyAt(ex, ey);
                } catch {
                    // Best-effort: ignore if no enemy runtime is present at that cell.
                }
                if (enemiesDefeatedRef) enemiesDefeatedRef.current += 1;
                setEnemyPositions(prev => {
                    const next = new Map(prev);
                    next.delete(key);
                    return next;
                });
                return;
            }
            if (hasPlayerEffect('shield')) return;
            if (lives > 1) {
                resetPlayerAfterDamage({
                    startPosition: start,
                    setLives,
                    setForcedPlayerPosition,
                    setTeleportSignal,
                    setIsInvulnerable,
                    resetCounterRef,
                    resetInProgressRef,
                    resetClearTimeoutRef,
                    invulnerabilityTimeoutRef: invulnTimeoutRef,
                    hitsTakenRef
                });
                return;
            } else {
                if (hitsTakenRef) hitsTakenRef.current += 1;
                setLives(0);
                try {
                    setGameOver(true);
                } catch {
                    // Defensive: setter is always present at runtime; ignore if a stub throws.
                }
                return;
            }
        }

        // buff collision
        if (buffPositions.has(key)) {
            setBuffPositions(prev => {
                const next = new Map(prev);
                next.delete(key);
                return next;
            });
            setBuffMetaAt(prev => {
                const next = new Map(prev);
                next.delete(key);
                return next;
            });
            if (buffsCollectedRef) buffsCollectedRef.current += 1;
            applyBuffEffect({
                posKey: key,
                buffMetaAt,
                buffPositions,
                playerPosition,
                mazeData,
                addPlayerEffect,
                setLives,
                setTeleportSignal,
                setForcedPlayerPosition,
                setDebuffPositions,
                setDebuffMetaAt,
                enemiesApi
            });
        }

        // debuff collision
        if (debuffPositions.has(key)) {
            setDebuffPositions(prev => {
                const next = new Map(prev);
                next.delete(key);
                return next;
            });
            setDebuffMetaAt(prev => {
                const next = new Map(prev);
                next.delete(key);
                return next;
            });
            applyDebuffEffect({
                posKey: key, debuffMetaAt, debuffPositions, mazeData, isInvulnerable, lives,
                nowMs: Date.now, hasPlayerEffect, addPlayerEffect, setLives,
                setFrozenUntil: () => {}, setPlayerEffects: () => {},
                setForcedPlayerPosition, setTeleportSignal, setGameOver, setIsInvulnerable, resetCounterRef, resetInProgressRef, resetClearTimeoutRef, invulnTimeoutRef,
                hitsTakenRef
            });
        }

    }, [
        args.playerPosition.x, args.playerPosition.y,
        args.enemyPositions, args.buffPositions, args.debuffPositions,
        args.mazeData, args.gameOver, args.gameWon, args.lives, args.isInvulnerable
    ]);
}