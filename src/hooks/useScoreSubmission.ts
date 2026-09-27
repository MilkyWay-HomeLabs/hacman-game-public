// Automatic score submission on win. Submits exactly once when the game is won,
// capturing the elapsed time at that moment, and exposes submitting/success/error
// states plus a retry for the error case. Never blocks the UI.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../types/maze';
import {
  submitLevelScore,
  type LevelScoreSubmission,
  type SubmitLevelScoreResult,
  type UnlockedAchievement,
} from '../api/scoresApi';

export type ScoreSubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface UseScoreSubmissionParams {
  /** Becomes true when the player wins; the trigger for a single submission. */
  won: boolean;
  galleryId?: string | null;
  difficulty: Difficulty;
  /** Elapsed play time in milliseconds (captured at the moment of winning). */
  timeMs: number;
  /**
   * Opt-in gameplay-telemetry counters (M7-1), captured at the same win instant as `timeMs`.
   * Optional -- omitted counters default to 0 on the wire, so existing callers are unaffected.
   */
  enemiesDefeated?: number;
  buffsCollected?: number;
  hitsTaken?: number;
  /** Injectable submit fn (defaults to the real API client). */
  submit?: (submission: LevelScoreSubmission) => Promise<SubmitLevelScoreResult>;
}

export interface ScoreSubmissionResult {
  status: ScoreSubmissionStatus;
  error: string | null;
  retry: () => void;
  /** Achievements unlocked by this submission (M7-3). Empty until the submission succeeds. */
  newlyUnlockedAchievements: UnlockedAchievement[];
}

export function useScoreSubmission({
  won,
  galleryId,
  difficulty,
  timeMs,
  enemiesDefeated = 0,
  buffsCollected = 0,
  hitsTaken = 0,
  submit = submitLevelScore,
}: UseScoreSubmissionParams): ScoreSubmissionResult {
  const [status, setStatus] = useState<ScoreSubmissionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<UnlockedAchievement[]>([]);

  const submittedRef = useRef(false);
  // Track the latest values so we can freeze them all at the instant of winning.
  const latestTimeMsRef = useRef(timeMs);
  const capturedTimeMsRef = useRef(timeMs);
  const latestEnemiesDefeatedRef = useRef(enemiesDefeated);
  const capturedEnemiesDefeatedRef = useRef(enemiesDefeated);
  const latestBuffsCollectedRef = useRef(buffsCollected);
  const capturedBuffsCollectedRef = useRef(buffsCollected);
  const latestHitsTakenRef = useRef(hitsTaken);
  const capturedHitsTakenRef = useRef(hitsTaken);

  // Declared before the win effect so the latest values are recorded first on the win render.
  useEffect(() => {
    latestTimeMsRef.current = timeMs;
    latestEnemiesDefeatedRef.current = enemiesDefeated;
    latestBuffsCollectedRef.current = buffsCollected;
    latestHitsTakenRef.current = hitsTaken;
  }, [timeMs, enemiesDefeated, buffsCollected, hitsTaken]);

  const run = useCallback(async () => {
    if (!galleryId) return;
    setStatus('submitting');
    setError(null);
    setNewlyUnlockedAchievements([]);
    try {
      const result = await submit({
        galleryId,
        difficulty,
        timeMs: capturedTimeMsRef.current,
        enemiesDefeated: capturedEnemiesDefeatedRef.current,
        buffsCollected: capturedBuffsCollectedRef.current,
        hitsTaken: capturedHitsTakenRef.current,
      });
      setNewlyUnlockedAchievements(result.newlyUnlockedAchievements);
      setStatus('success');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to submit score.');
      setStatus('error');
    }
  }, [galleryId, difficulty, submit]);

  useEffect(() => {
    if (!won || submittedRef.current || !galleryId) return;
    submittedRef.current = true;
    capturedTimeMsRef.current = latestTimeMsRef.current;
    capturedEnemiesDefeatedRef.current = latestEnemiesDefeatedRef.current;
    capturedBuffsCollectedRef.current = latestBuffsCollectedRef.current;
    capturedHitsTakenRef.current = latestHitsTakenRef.current;
    // Fire-and-forget: submit exactly once on the win transition (guarded by
    // submittedRef). `run` updates status asynchronously, off the effect's sync path.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run();
  }, [won, galleryId, run]);

  const retry = useCallback(() => {
    // Only meaningful after a failure; never triggers a second successful submit.
    if (status === 'submitting' || status === 'success') return;
    void run();
  }, [status, run]);

  return { status, error, retry, newlyUnlockedAchievements };
}
