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
  /**
   * Opt-in gameplay-telemetry counters (M7-1). Optional here so existing callers are
   * unaffected; always sent as concrete numbers on the wire (defaulted to 0).
   */
  enemiesDefeated?: number;
  buffsCollected?: number;
  hitsTaken?: number;
}

/** Wire payload for `POST /v1/level-scores`. */
interface LevelScorePayload {
  galleryId: string;
  difficulty: ApiDifficulty;
  timeMs: number;
  enemiesDefeated: number;
  buffsCollected: number;
  hitsTaken: number;
}

/** One achievement that crossed a new threshold as a direct result of this submission (M7-3). */
export interface UnlockedAchievement {
  code: string;
  name: string;
  description: string;
  iconUrl: string | null;
  /** The level (1-5) just reached, not the achievement's maximum. */
  level: number;
}

/** Wire response body for `POST /v1/level-scores`. */
interface LevelScoreResponse {
  newlyUnlockedAchievements?: UnlockedAchievement[];
}

export interface SubmitLevelScoreResult {
  /** Empty on every submission that didn't cross a new achievement threshold. */
  newlyUnlockedAchievements: UnlockedAchievement[];
}

/**
 * Submit a completed level's result. Auth is via httpOnly cookies (HTTP client).
 *
 * @throws {TypeError} when inputs are invalid (empty gallery id or non-finite time).
 * @throws {ApiError} on any HTTP/transport failure.
 */
export async function submitLevelScore(submission: LevelScoreSubmission): Promise<SubmitLevelScoreResult> {
  const { galleryId, difficulty, timeMs, enemiesDefeated, buffsCollected, hitsTaken } = submission;

  if (!galleryId) {
    throw new TypeError('submitLevelScore: galleryId is required.');
  }
  if (!Number.isFinite(timeMs)) {
    throw new TypeError('submitLevelScore: timeMs must be a finite number.');
  }

  // Normalize each counter to a non-negative integer; undefined (an omitted, non-telemetry
  // caller) defaults to 0 rather than being sent as undefined/NaN.
  const normalizeCount = (n: number | undefined): number =>
    Number.isFinite(n) ? Math.max(0, Math.round(n as number)) : 0;

  const payload: LevelScorePayload = {
    galleryId,
    difficulty: toApiDifficulty(difficulty),
    // Normalize to a non-negative integer number of milliseconds.
    timeMs: Math.max(0, Math.round(timeMs)),
    enemiesDefeated: normalizeCount(enemiesDefeated),
    buffsCollected: normalizeCount(buffsCollected),
    hitsTaken: normalizeCount(hitsTaken),
  };

  const response = await httpPost<LevelScoreResponse>('/v1/level-scores', payload);

  return { newlyUnlockedAchievements: response?.newlyUnlockedAchievements ?? [] };
}
