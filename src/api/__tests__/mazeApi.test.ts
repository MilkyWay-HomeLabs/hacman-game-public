import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMazeLevels, MazeLevelsResponseError } from '../mazeApi';
import { ApiError } from '../types';
import { easyLevelDto, mazeLevelsDto, mediumLevelDto } from './fixtures/mazeLevels';

const BASE = 'https://api.example.test/hacman/api';

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
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

describe('getMazeLevels', () => {
  it('requests the levels endpoint with an encoded galleryId', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse(mazeLevelsDto));

    await getMazeLevels('a/b c');

    expect(mock.mock.calls[0][0]).toBe(`${BASE}/v1/maze/levels/a%2Fb%20c`);
  });

  it('returns three mapped MazeData objects in EASY/MEDIUM/HARD order', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse(mazeLevelsDto));

    const levels = await getMazeLevels('g-1');

    expect(levels).toHaveLength(3);
    expect(levels.map((l) => l.difficulty)).toEqual(['easy', 'medium', 'hard']);
    expect(levels[0].player.start_position).toEqual({ x: 1, y: 1 });
  });

  it('throws MazeLevelsResponseError when the payload is not an array', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ oops: true }));

    await expect(getMazeLevels('g-1')).rejects.toBeInstanceOf(MazeLevelsResponseError);
  });

  it('throws MazeLevelsResponseError when a difficulty is missing', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse([easyLevelDto, mediumLevelDto]));

    await expect(getMazeLevels('g-1')).rejects.toBeInstanceOf(MazeLevelsResponseError);
  });

  it('throws MazeLevelsResponseError on a duplicate difficulty', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse([easyLevelDto, easyLevelDto, mediumLevelDto]));

    await expect(getMazeLevels('g-1')).rejects.toBeInstanceOf(MazeLevelsResponseError);
  });

  it('propagates ApiError from the HTTP layer on non-2xx', async () => {
    const mock = fetchMock();
    mock.mockResolvedValue(jsonResponse({ message: 'nope' }, 401));

    const err = await getMazeLevels('g-1').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
  });
});
