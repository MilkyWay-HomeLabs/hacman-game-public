// Maze levels client: fetches all three difficulty levels for a gallery and maps
// them to the internal `MazeData` shape the game engine consumes.

import type { MazeData } from '../types/maze';
import { httpGet } from './http';
import {
  type ApiDifficulty,
  type MazeLevelDto,
  mapMazeLevel,
} from './mappers/maze';

/** The three difficulties the API is contracted to return, exactly once each. */
const REQUIRED_DIFFICULTIES: readonly ApiDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

/** Thrown when the maze-levels payload does not match the expected 3-level contract. */
export class MazeLevelsResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MazeLevelsResponseError';
    Object.setPrototypeOf(this, MazeLevelsResponseError.prototype);
  }
}

function assertValidLevels(payload: unknown): asserts payload is MazeLevelDto[] {
  if (!Array.isArray(payload)) {
    throw new MazeLevelsResponseError('Expected an array of maze levels.');
  }

  const seen = new Set<string>();
  for (const level of payload) {
    const difficulty = (level as { difficulty?: unknown })?.difficulty;
    if (typeof difficulty !== 'string') {
      throw new MazeLevelsResponseError('A maze level is missing its difficulty.');
    }
    if (seen.has(difficulty)) {
      throw new MazeLevelsResponseError(`Duplicate maze level difficulty: ${difficulty}.`);
    }
    seen.add(difficulty);
  }

  const missing = REQUIRED_DIFFICULTIES.filter((d) => !seen.has(d));
  if (missing.length > 0 || seen.size !== REQUIRED_DIFFICULTIES.length) {
    throw new MazeLevelsResponseError(
      `Expected exactly ${REQUIRED_DIFFICULTIES.join(', ')} levels but got ${[...seen].join(', ') || 'none'}.`,
    );
  }
}

/**
 * Fetch the three maze levels (EASY, MEDIUM, HARD) for a gallery and map them to
 * `MazeData`. Auth is via httpOnly cookies (handled by the HTTP client).
 *
 * @throws {ApiError} on HTTP/transport failures.
 * @throws {MazeLevelsResponseError} when the payload is not the expected 3-level set.
 */
export async function getMazeLevels(galleryId: string): Promise<MazeData[]> {
  const payload = await httpGet<unknown>(`/v1/maze/levels/${encodeURIComponent(galleryId)}`);
  assertValidLevels(payload);
  return payload.map(mapMazeLevel);
}
