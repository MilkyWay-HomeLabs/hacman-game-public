import type { Page } from '@playwright/test';
import { API_GLOB, GALLERY_ID, winnableLevels } from './fixtures';

/** Entry URL (relative to baseURL, which already carries the app base path). */
export function entryUrl(params: Record<string, string> = { galleryId: GALLERY_ID, title: 'Gallery 1' }) {
  const search = new URLSearchParams(params).toString();
  return `?${search}`;
}

export interface MockApiOptions {
  /** HTTP status for GET maze levels (200 = the winnable fixture). */
  levelsStatus?: number;
}

/**
 * Intercept every Hacman API call at the network level:
 * - GET maze levels → the winnable fixture (or an error status)
 * - POST level scores → 204
 * - GET version → a stub
 * Also stubs the Nebula return URL so the "Deploy" navigation resolves in-test.
 */
export async function mockApi(page: Page, { levelsStatus = 200 }: MockApiOptions = {}): Promise<void> {
  await page.route(`${API_GLOB}/maze/levels/**`, (route) => {
    if (levelsStatus !== 200) {
      return route.fulfill({ status: levelsStatus, json: { message: `error ${levelsStatus}` } });
    }
    return route.fulfill({ status: 200, json: winnableLevels });
  });

  await page.route(`${API_GLOB}/level-scores`, (route) =>
    route.fulfill({ status: 204, body: '' }),
  );

  await page.route(`${API_GLOB}/version`, (route) =>
    route.fulfill({ status: 200, json: { version: 'e2e' } }),
  );

  // The built app's VITE_NEBULA_RETURN_URL points at milkyway.test, which won't resolve
  // in the test browser — stub it so the return navigation lands on a real response.
  await page.route('**/nebula/app/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Nebula</h1>' }),
  );
}
