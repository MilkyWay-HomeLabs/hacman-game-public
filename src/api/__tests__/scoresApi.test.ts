import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { submitLevelScore } from '../scoresApi';
import { ApiError } from '../types';
import type { Difficulty } from '../../types/maze';

const BASE = 'https://api.example.test/hacman/api';

function jsonResponse(data: unknown, status = 200): Response {
  // 204/205/304 must have a null body per the Fetch spec.
  const bodyless = data === null || status === 204 || status === 205 || status === 304;
  return new Response(bodyless ? null : JSON.stringify(data), {
    status,
    headers: bodyless ? undefined : { 'content-type': 'application/json' },
  });
}

function fetchMock() {
  const mock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', mock);
  return mock;
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', BASE);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('submitLevelScore', () => {
  it('POSTs to /v1/level-scores with uppercase difficulty and a normalized time', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ accepted: true }, 201));

    await submitLevelScore({ galleryId: 'g-1', difficulty: 'medium', timeMs: 4567.8 });

    const [url, init] = mock.mock.calls[0];
    expect(url).toBe(`${BASE}/v1/level-scores`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      galleryId: 'g-1',
      difficulty: 'MEDIUM',
      timeMs: 4568,
    });
  });

  it.each<[Difficulty, string]>([
    ['easy', 'EASY'],
    ['medium', 'MEDIUM'],
    ['hard', 'HARD'],
  ])('maps difficulty %s to %s', async (internal, api) => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse(null, 204));

    await submitLevelScore({ galleryId: 'g-1', difficulty: internal, timeMs: 1000 });

    expect(JSON.parse(mock.mock.calls[0][1]?.body as string).difficulty).toBe(api);
  });

  it('clamps a negative time to zero', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse(null, 204));

    await submitLevelScore({ galleryId: 'g-1', difficulty: 'easy', timeMs: -5 });

    expect(JSON.parse(mock.mock.calls[0][1]?.body as string).timeMs).toBe(0);
  });

  it('resolves on an empty 204 response', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse(null, 204));

    await expect(
      submitLevelScore({ galleryId: 'g-1', difficulty: 'hard', timeMs: 10 }),
    ).resolves.toBeUndefined();
  });

  it('rejects with ApiError on a server error and does not swallow it', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ message: 'boom' }, 500));

    const err = await submitLevelScore({ galleryId: 'g-1', difficulty: 'easy', timeMs: 10 }).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
  });

  it('throws TypeError without calling the network on invalid input', async () => {
    const mock = fetchMock();

    await expect(
      submitLevelScore({ galleryId: '', difficulty: 'easy', timeMs: 10 }),
    ).rejects.toBeInstanceOf(TypeError);
    await expect(
      submitLevelScore({ galleryId: 'g-1', difficulty: 'easy', timeMs: Number.NaN }),
    ).rejects.toBeInstanceOf(TypeError);
    expect(mock).not.toHaveBeenCalled();
  });
});
