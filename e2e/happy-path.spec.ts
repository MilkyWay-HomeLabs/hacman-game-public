import { expect, test } from '@playwright/test';
import { GALLERY_ID } from './fixtures';
import { entryUrl, mockApi } from './helpers';

test.describe('happy path', () => {
  test('entry → selection → play → win → submit → return to Nebula', async ({ page }) => {
    await mockApi(page);

    // Entry: a valid galleryId brings up the difficulty selection.
    await page.goto(entryUrl());
    await expect(page.getByRole('dialog', { name: /difficulty/i })).toBeVisible();
    await expect(page.getByText('Gallery 1')).toBeVisible();

    // Selection: start the EASY level; the game board (title) renders.
    await page.getByRole('button', { name: /^Easy/ }).click();
    await expect(page.getByRole('heading', { name: 'Maze Matrix' })).toBeVisible();

    // The score submission fires once on win — assert the POST payload.
    const scoreRequest = page.waitForRequest(
      (r) => r.url().includes('/level-scores') && r.method() === 'POST',
    );

    // Play → win: two dots sit to the right of the player; hold the key and
    // glide over both (movement is continuous while a direction is held).
    await page.keyboard.down('ArrowRight');
    await expect(page.getByText('Hacked', { exact: true })).toBeVisible();
    await page.keyboard.up('ArrowRight');

    // Submit: the captured request carries the gallery + uppercased difficulty.
    const request = await scoreRequest;
    expect(request.postDataJSON()).toMatchObject({ galleryId: GALLERY_ID, difficulty: 'EASY' });
    await expect(page.getByText('Score submitted')).toBeVisible();

    // Return: Deploy navigates back to the (stubbed) Nebula gallery.
    await page.getByRole('button', { name: 'Deploy' }).click();
    await expect(page).toHaveURL(/nebula\/app/);
  });

  test('shows the version footer from the API', async ({ page }) => {
    await mockApi(page);
    await page.goto(entryUrl());
    // versionApi returns the stubbed "e2e" value; the footer normalizes to a leading "v".
    await expect(page.getByText('ve2e')).toBeVisible();
  });
});
