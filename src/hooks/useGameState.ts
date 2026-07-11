// File: `src/hooks/useGameState.ts`
import { useEffect, useState, useRef } from 'react';
import type { Buff, Debuff, MazeData } from '../types/maze';
import { useGameInitializer } from './useGameInitializer';

export function useGameState(injectedMaze?: MazeData | null) {
  const init = useGameInitializer(injectedMaze);

  // Player
  const [playerDirection, setPlayerDirection] = useState<'right'|'left'|'up'|'down'>('right');
  const [forcedPlayerPosition, setForcedPlayerPosition] = useState<{x:number;y:number}|null>(null);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [frozenUntil, setFrozenUntil] = useState(0);

  // Maze & pickups
  const [mazeData, setMazeData] = useState<MazeData|null>(null);
  const [activeDots, setActiveDots] = useState<Set<string>>(new Set());
  const [collectedDots, setCollectedDots] = useState(0);
  const [initialTotalDots, setInitialTotalDots] = useState(0);

  // Enemies / buffs / debuffs
  const [enemyPositions, setEnemyPositions] = useState<Map<string,string>>(new Map());
  const [buffPositions, setBuffPositions] = useState<Map<string,string>>(new Map());
  const [buffMetaAt, setBuffMetaAt] = useState<Map<string, Buff>>(new Map());
  const [debuffPositions, setDebuffPositions] = useState<Map<string,string>>(new Map());
  const [debuffMetaAt, setDebuffMetaAt] = useState<Map<string, Debuff>>(new Map());

  // Game flow
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('easy');

  // Timer - make it writable and update from initializer
  const [timerDuration, setTimerDuration] = useState<number>(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);

  // UI
  const [imageIndex, setImageIndex] = useState(0);
  const [teleportSignal, setTeleportSignal] = useState(0);

  // Refs
  const resetCounterRef = useRef(0);
  const invulnTimeoutRef = useRef<number|null>(null);
  const resetInProgressRef = useRef(false);
  const resetClearTimeoutRef = useRef<number|null>(null);
  const timerIntervalRef = useRef<number|null>(null);
  const initialPlayerPositionRef = useRef({x:1,y:1});

  // Init effect (move from App.tsx). Synchronizes the memoized initializer output into
  // component state — an intentional external-source → state sync, not a render cascade.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!init.mazeData) return;
    setMazeData(init.mazeData);
    setActiveDots(init.activeDots);
    setEnemyPositions(init.enemyPositions);
    setBuffPositions(init.buffPositions);
    setDebuffPositions(init.debuffPositions);
    setBuffMetaAt(init.buffMetaAt);
    setDebuffMetaAt(init.debuffMetaAt);
    setInitialTotalDots(init.initialTotalDots);
    setDifficulty(init.difficulty);
    setTimerDuration(init.timerDuration ?? 0);
    setTimerSeconds(init.timerDuration ?? 0);
  }, [init]);

  // imageIndex updater (moved)
  useEffect(() => {
    if (initialTotalDots === 0) return;
    const progress = Math.min(1, collectedDots / initialTotalDots);
    setImageIndex(Math.min(10, Math.floor(progress * 10)));
  }, [collectedDots, initialTotalDots]);

  // Derive collected dots from the source of truth (activeDots + initialTotalDots)
  // This guarantees consistency even if multiple features modify dots concurrently.
  useEffect(() => {
    if (initialTotalDots <= 0) return;
    setCollectedDots(Math.max(0, initialTotalDots - activeDots.size));
  }, [activeDots, initialTotalDots]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return {
    // state values
    playerDirection, setPlayerDirection,
    forcedPlayerPosition, setForcedPlayerPosition,
    isInvulnerable, setIsInvulnerable,
    frozenUntil, setFrozenUntil,

    mazeData, activeDots, setActiveDots, collectedDots, setCollectedDots, initialTotalDots,
    enemyPositions, setEnemyPositions,
    buffPositions, setBuffPositions, buffMetaAt, setBuffMetaAt,
    debuffPositions, setDebuffPositions, debuffMetaAt, setDebuffMetaAt,

    lives, setLives, gameOver, setGameOver, gameWon, setGameWon, difficulty, setDifficulty,

    timerDuration, setTimerDuration, timerSeconds, setTimerSeconds, timerStarted, setTimerStarted, timerIntervalRef,

    imageIndex, teleportSignal, setTeleportSignal,

    // refs for other hooks
    resetCounterRef, invulnTimeoutRef, resetInProgressRef, resetClearTimeoutRef, initialPlayerPositionRef
  } as const;
}