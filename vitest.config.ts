import {defineConfig} from 'vitest/config';
// import react from '@vitejs/plugin-react';
import {readFileSync} from 'node:fs';
import * as path from 'path';

// Mirror the build-time version injection (see vite.config.ts) so tests exercise the
// same `__APP_VERSION__` global the app relies on.
const pkg = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string };

export default defineConfig({
    // plugins: [react()],
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        // Pin the VITE_* config the tests exercise so the suite is deterministic and
        // independent of a local `.env` (which is git-ignored and absent in CI).
        env: {
            VITE_API_BASE_URL: 'https://milkyway.test/hacman/api',
            VITE_RESOURCES_URL: 'https://milkyway.test/resources',
            VITE_NEBULA_RETURN_URL: 'https://milkyway.test/nebula/app/',
        },
        include: ['**/__tests__/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                '**/*.config.{js,ts}',
                '**/__tests__/**',
                '**/dist/**',
                // Non-runtime / test scaffolding — nothing to unit-test here.
                '**/*.d.ts',
                'src/main.tsx',        // app entry (bootstrap only)
                'src/test/**',         // static dev maze + type shims
                'src/test-utils/**',   // test setup + MSW handlers/server
                'e2e/**'               // Playwright specs (run separately)
            ],
            // Hard gate: CI (`npm run test:coverage`) fails the build below 80%.
            thresholds: {
                statements: 80,
                branches: 80,
                functions: 80,
                lines: 80
            },
            reportsDirectory: './coverage'
        }
    }
});