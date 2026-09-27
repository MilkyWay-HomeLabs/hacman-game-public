// Integration tests for the API client layer, exercised end-to-end through MSW:
// real http.ts → mazeApi/scoresApi/versionApi → mocked network. Covers the happy
// paths and the error paths the plan calls out (401 / 500 / network / timeout).

import { afterEach, describe, expect, it, vi } from 'vitest';
import { delay, http, HttpResponse } from 'msw';
import { API_BASE, MOCK_API_VERSION } from '../../test-utils/msw/handlers';
import { server, startMockServer } from '../../test-utils/msw/server';
import { getMazeLevels } from '../../api/mazeApi';
import { submitLevelScore } from '../../api/scoresApi';
import { getAppVersion, PACKAGE_VERSION } from '../../api/versionApi';
import { request, setUnauthorizedHandler } from '../../api/http';
import { ApiError } from '../../api/types';

startMockServer();

const GALLERY_ID = '5250215a-521f-4a8b-aba9-c8325cf47615';

describe('getMazeLevels (integration)', () => {
  it('maps the three difficulty levels from the API payload', async () => {
    const levels = await getMazeLevels(GALLERY_ID);
    expect(levels.map((l) => l.difficulty)).toEqual(['easy', 'medium', 'hard']);
    expect(levels[0].width).toBe(5);
  });

  it('throws ApiError(401) on an unauthorized response', async () => {
    server.use(
      http.get(`${API_BASE}/v1/maze/levels/:galleryId`, () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );
    await expect(getMazeLevels(GALLERY_ID)).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    });
  });

  it('throws ApiError(500) on a server error', async () => {
    server.use(
      http.get(`${API_BASE}/v1/maze/levels/:galleryId`, () =>
        HttpResponse.json({ message: 'Boom' }, { status: 500 }),
      ),
    );
    await expect(getMazeLevels(GALLERY_ID)).rejects.toMatchObject({ status: 500, message: 'Boom' });
  });

  it('throws a network ApiError when the transport fails', async () => {
    server.use(http.get(`${API_BASE}/v1/maze/levels/:galleryId`, () => HttpResponse.error()));
    await expect(getMazeLevels(GALLERY_ID)).rejects.toMatchObject({
      status: 0,
      isNetworkError: true,
    });
  });
});

describe('request timeout / abort (integration)', () => {
  it('surfaces an aborted (timed-out) request as a network ApiError', async () => {
    server.use(
      http.get(`${API_BASE}/v1/slow`, async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );

    const controller = new AbortController();
    const pending = request('/v1/slow', { signal: controller.signal });
    // Simulate a client-side timeout firing while the server never responds.
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'ApiError', isNetworkError: true });
  });
});

describe('submitLevelScore (integration)', () => {
  it('POSTs the uppercased difficulty and rounded time, then resolves', async () => {
    let captured: unknown;
    server.use(
      http.post(`${API_BASE}/v1/level-scores`, async ({ request }) => {
        captured = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(
      submitLevelScore({ galleryId: GALLERY_ID, difficulty: 'hard', timeMs: 12345.6 }),
    ).resolves.toEqual({ newlyUnlockedAchievements: [] });

    expect(captured).toEqual({
      galleryId: GALLERY_ID,
      difficulty: 'HARD',
      timeMs: 12346,
      enemiesDefeated: 0,
      buffsCollected: 0,
      hitsTaken: 0,
    });
  });

  it('throws ApiError(500) when the submission fails', async () => {
    server.use(
      http.post(`${API_BASE}/v1/level-scores`, () =>
        HttpResponse.json({ message: 'nope' }, { status: 500 }),
      ),
    );
    await expect(
      submitLevelScore({ galleryId: GALLERY_ID, difficulty: 'easy', timeMs: 1000 }),
    ).rejects.toMatchObject({ status: 500 });
  });
});

describe('getAppVersion (integration)', () => {
  it('returns the live version from the endpoint', async () => {
    await expect(getAppVersion()).resolves.toBe(MOCK_API_VERSION);
  });

  it('falls back to the build-time package version on a server error', async () => {
    server.use(http.get(`${API_BASE}/v1/version`, () => new HttpResponse(null, { status: 500 })));
    await expect(getAppVersion()).resolves.toBe(PACKAGE_VERSION);
  });
});

describe('unauthorized handler (integration)', () => {
  afterEach(() => setUnauthorizedHandler(null));

  it('invokes the registered handler on a 401 before rejecting', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    server.use(
      http.get(`${API_BASE}/v1/maze/levels/:galleryId`, () =>
        HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    );

    await expect(getMazeLevels(GALLERY_ID)).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
