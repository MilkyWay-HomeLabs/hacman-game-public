// MSW request handlers modelling the Hacman REST API for integration tests.
// The happy-path defaults here mirror the real contract (docs/DEVELOPMENT_PLAN.md,
// Appendix A); individual tests override a handler with `server.use(...)` to exercise
// error paths (401 / 500 / network / timeout).

import { http, HttpResponse } from 'msw';
import { mazeLevelsDto } from '../../api/__tests__/fixtures/mazeLevels';

/** Base URL the API client is pointed at in integration tests (matches `.env`). */
export const API_BASE = 'https://milkyway.test/hacman/api';

/** Version returned by the mocked `GET /v1/version` (distinct from package.json). */
export const MOCK_API_VERSION = '9.9.9';

/** User-gallery record returned by the mocked `GET /v1/user-galleries`. */
export const MOCK_USER_GALLERY = {
  id: 'e2f1a6de-8f43-4b1c-9a2f-4dc6a1b0c111',
  userId: '3f8f5f60-1111-4222-8333-944445555666',
  galleryId: '5250215a-521f-4a8b-aba9-c8325cf47615',
  gallery: {
    id: '5250215a-521f-4a8b-aba9-c8325cf47615',
    title: 'Gallery 1',
    description: 'Mock gallery',
    imageCount: 10,
    galleryId: 1,
  },
  isUnlocked: true,
};

export const handlers = [
  // Three difficulty levels for any gallery.
  http.get(`${API_BASE}/v1/maze/levels/:galleryId`, () => HttpResponse.json(mazeLevelsDto)),

  // Gallery presentation info (numeric image-folder id) for any gallery.
  http.get(`${API_BASE}/v1/user-galleries`, () => HttpResponse.json(MOCK_USER_GALLERY)),

  // Score submission: the backend returns no content on success.
  http.post(`${API_BASE}/v1/level-scores`, () => new HttpResponse(null, { status: 204 })),

  // Public version endpoint.
  http.get(`${API_BASE}/v1/version`, () => HttpResponse.json({ version: MOCK_API_VERSION })),
];
