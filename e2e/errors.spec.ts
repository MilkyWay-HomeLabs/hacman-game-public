import { expect, test } from '@playwright/test';
import { entryUrl, mockApi } from './helpers';

test.describe('error paths', () => {
  test('missing galleryId shows a non-retryable "Invalid game link"', async ({ page }) => {
    await mockApi(page);
    await page.goto(entryUrl({ title: 'Gallery 1' })); // no galleryId

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Invalid game link');
    // A bad link can't be fixed by reloading, so there's no retry.
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
  });

  test('a 401 from the levels API shows a retryable error', async ({ page }) => {
    await mockApi(page, { levelsStatus: 401 });
    await page.goto(entryUrl());

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Could not load the game');
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('a 500 from the levels API shows a retryable error', async ({ page }) => {
    await mockApi(page, { levelsStatus: 500 });
    await page.goto(entryUrl());

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Could not load the game');
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
