import { defineConfig, devices } from '@playwright/test';

// E2E runs against a production build served by `vite preview`, so the base path and
// bundle match what ships. `vite build` runs in production mode, so the base comes from
// `.env.production` (VITE_BASE_PATH=/hacman/game/).
const PORT = 4173;
const BASE_PATH = '/hacman/game/';
const baseURL = `http://localhost:${PORT}${BASE_PATH}`;

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
