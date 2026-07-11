// Automatic score submission on win. Submits exactly once when the game is won,
// capturing the elapsed time at that moment, and exposes submitting/success/error
// states plus a retry for the error case. Never blocks the UI.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Difficulty } from '../types/maze';
import { submitLevelScore, type LevelScoreSubmission } from '../api/scoresApi';

export type ScoreSubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface UseScoreSubmissionParams {
  /** Becomes true when the player wins; the trigger for a single submission. */
  won: boolean;
  galleryId?: string | null;
  difficulty: Difficulty;
  /** Elapsed play time in milliseconds (captured at the moment of winning). */
  timeMs: number;
  /** Injectable submit fn (defaults to the real API client). */
  submit?: (submission: LevelScoreSubmission) => Promise<void>;
}

export interface ScoreSubmissionResult {
  status: ScoreSubmissionStatus;
  error: string | null;
  retry: () => void;
}

export function useScoreSubmission({
  won,
  galleryId,
  difficulty,
  timeMs,
  submit = submitLevelScore,
}: UseScoreSubmissionParams): ScoreSubmissionResult {
  const [status, setStatus] = useState<ScoreSubmissionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const submittedRef = useRef(false);
  // Track the latest time so we can freeze it at the instant of winning.
  const latestTimeMsRef = useRef(timeMs);
  const capturedTimeMsRef = useRef(timeMs);

  // Declared before the win effect so the latest time is recorded first on the win render.
  useEffect(() => {
    latestTimeMsRef.current = timeMs;
  }, [timeMs]);

  const run = useCallback(async () => {
    if (!galleryId) return;
    setStatus('submitting');
    setError(null);
    try {
      await submit({ galleryId, difficulty, timeMs: capturedTimeMsRef.current });
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

  return { status, error, retry };
}
