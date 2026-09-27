# Testing

## Stack

- **Unit / component / integration:** [Vitest](https://vitest.dev/) + Testing Library + jsdom.
- **Integration (network):** [MSW](https://mswjs.io/) — the real API client stack against a mocked network.
- **E2E:** [Playwright](https://playwright.dev/) (Chromium) against a production preview build.

## Commands

```bash
npm test              # Vitest watch mode
npm run test:run      # Vitest single run (CI)
npm run test:coverage # single run + coverage, fails below the 80% gate
npm run test:ui       # Vitest UI + coverage
npm run coverage:open # open coverage/index.html
npm run test:e2e      # Playwright E2E (builds + previews, then drives Chromium)
npm run test:e2e:ui   # Playwright UI mode

# Single Vitest file
npm test -- src/domain/__tests__/score.test.ts
```

## Layout

| Kind | Location | Notes |
|---|---|---|
| Unit / component | `src/**/__tests__/*.test.{ts,tsx}` | Next to the code under test. |
| Integration (MSW) | `src/__tests__/integration/*.integration.test.ts(x)` | Real clients/hooks + `src/test-utils/msw/`. |
| E2E (Playwright) | `e2e/*.spec.ts` | `playwright.config.ts`; API mocked with `page.route`. |

Vitest config (`vitest.config.ts`): jsdom environment, globals enabled, v8 coverage (text/JSON/HTML
in `./coverage`). Vitest matches `**/__tests__/**/*.test.*`, so it never picks up the E2E specs.

## Integration tests (MSW)

`src/test-utils/msw/` provides request handlers (GET maze levels, POST level-scores, GET version)
and a scoped `startMockServer()` helper. Covered:

- API clients through the real `http.ts`: happy paths plus **401 / 500 / network / abort-timeout**,
  the unauthorized handler, and version fallback.
- Flow: bootstrap → difficulty selection (real `getMazeLevels`) and score submit-on-win
  (real `useScoreSubmission`) including failure-then-retry.

## E2E scenarios (Playwright)

The suite builds the app, serves it via `vite preview`, and mocks the API at the network level.

- **Happy path:** entry (`galleryId`) → difficulty selection → play → win → score POST asserted →
  return to the (stubbed) Nebula gallery; version footer from the API.
- **Errors:** missing `galleryId` (non-retryable), 401, and 500 (retryable).

## Coverage policy

Minimum **80%** (statements/branches/functions/lines), enforced by `coverage.thresholds` in
`vitest.config.ts`. `npm run test:coverage` — run in the CI `verify` job — fails the build below the
gate. Non-runtime files (`*.d.ts`, `src/main.tsx`, `src/test/**`, `src/test-utils/**`, `e2e/**`) are
excluded from the measurement.

## Current state

- **349** unit/integration tests across 42 Vitest files.
- **5** Playwright E2E tests (2 specs), green locally and on the self-hosted runner.
- Coverage comfortably above the 80% gate (≈95% statements).

## Troubleshooting

- **E2E port conflict** (`http://localhost:4173/... is already used`): a stray `vite preview` is
  bound to 4173. Find and kill it: `pgrep -af 'vite preview'`.
- **No coverage output:** ensure `@vitest/coverage-v8` is installed (`npm ci`).
- **IDE doesn't detect tests:** run from the terminal (`npm test`); use an npm run-configuration
  rather than native integration.
