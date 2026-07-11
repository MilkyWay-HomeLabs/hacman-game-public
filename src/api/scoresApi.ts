// Level scores client: submits a completed game's result. The backend computes the
// score from the elapsed time, so the client only sends the raw inputs.

import type { Difficulty } from '../types/maze';
import { httpPost } from './http';
import { type ApiDifficulty, toApiDifficulty } from './mappers/maze';

export interface LevelScoreSubmission {
  galleryId: string;
  /** Internal difficulty casing; converted to the API's UPPERCASE form on submit. */
  difficulty: Difficulty;
  /** Elapsed play time in milliseconds. */
  timeMs: number;
}

/** Wire payload for `POST /v1/level-scores`. */
interface LevelScorePayload {
  galleryId: string;
  difficulty: ApiDifficulty;
  timeMs: number;
}

/**
 * Submit a completed level's result. Auth is via httpOnly cookies (HTTP client).
 *
 * @throws {TypeError} when inputs are invalid (empty gallery id or non-finite time).
 * @throws {ApiError} on any HTTP/transport failure.
 */
export async function submitLevelScore(submission: LevelScoreSubmission): Promise<void> {
  const { galleryId, difficulty, timeMs } = submission;

  if (!galleryId) {
    throw new TypeError('submitLevelScore: galleryId is required.');
  }
  if (!Number.isFinite(timeMs)) {
    throw new TypeError('submitLevelScore: timeMs must be a finite number.');
  }

  const payload: LevelScorePayload = {
    galleryId,
    difficulty: toApiDifficulty(difficulty),
    // Normalize to a non-negative integer number of milliseconds.
    timeMs: Math.max(0, Math.round(timeMs)),
  };

  await httpPost<unknown>('/v1/level-scores', payload);
}
