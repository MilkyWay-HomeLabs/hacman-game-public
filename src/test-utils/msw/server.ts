// MSW server for integration tests, plus a helper that registers its lifecycle.
//
// Scoped intentionally: rather than a global setup file, integration test files call
// `startMockServer()` at the top of their `describe` so the network mock is active only
// where it's wanted — the 300+ unit tests that stub `fetch` directly are untouched.

import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { API_BASE, handlers } from './handlers';

export const server = setupServer(...handlers);

/**
 * Wire the MSW server (and a consistent `VITE_API_BASE_URL`) into the calling test file.
 * Any request that no handler matches fails the test, so drift from the API contract is
 * caught rather than silently returning `undefined`.
 */
export function startMockServer() {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  beforeEach(() => vi.stubEnv('VITE_API_BASE_URL', API_BASE));
  afterEach(() => {
    server.resetHandlers();
    vi.unstubAllEnvs();
  });
  afterAll(() => server.close());
}
