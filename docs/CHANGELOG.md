# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.1] - 2026-09-26

### Fixed
- On prod, finishing a game and clicking "Deploy" redirected to `milkyway.test` instead of `milkyway.lab`. Root cause: `buildReturnUrl`'s host allow-list defaulted to a hardcoded `'milkyway.test'`, and the app never overrode it -- so even a correctly-configured `VITE_NEBULA_RETURN_URL=https://milkyway.lab/...` (set correctly by `deploy-prod.yml`) failed the allow-list check and fell through to the hardcoded literal fallback. `allowedHost` is now derived from `VITE_API_BASE_URL`'s own hostname (always set, always correct per environment) via the new `hostnameOf` helper, so the fix works identically on `milkyway.test` and `milkyway.lab` without a new env var.
- `.env.production.example` (and the local `.env.production`) had stray `milkyway.test` values for `VITE_RESOURCES_URL`/`VITE_API_BASE_URL`/`VITE_NEBULA_RETURN_URL` -- corrected to `milkyway.lab`. `deploy-prod.yml`'s own build step already overrides these with the correct values, so this was not the actual cause of the bug above, but was still wrong and misleading for anyone building locally from this template.

## [1.4.0] - 2026-09-25

### Added
- `submitLevelScore` now returns the parsed `POST /v1/level-scores` response body (previously discarded), exposing `newlyUnlockedAchievements` -- achievements the backend reports as leveled-up by this submission (M7-3). `useScoreSubmission` surfaces the list as `newlyUnlockedAchievements`, reset at the start of every submit attempt.
- `WinScreen` renders an "Achievement Unlocked" entry per newly-unlocked achievement, styled with the existing matrix theme tokens. Renders nothing when the list is empty (the common case).

## [1.3.0] - 2026-09-25

### Added
- Opt-in gameplay-telemetry counters on the score-submission payload (`POST /v1/level-scores`):
  `enemiesDefeated`, `buffsCollected`, `hitsTaken`. Backward compatible — omitted counters
  default to 0 on the wire, and every existing caller of `submitLevelScore`/`useScoreSubmission`
  keeps working unchanged. Counters are captured at the same win instant as `timeMs`, mirroring
  its existing latest/captured-ref pattern. Lays the groundwork for a second tier of
  server-side achievements (combat/power-up/survival categories) that the backend does not yet
  consume.

## [1.2.2] - 2026-07-11

### Added
- `LICENSE` (Apache License 2.0) and `NOTICE` files. Set `license` and `author`
  in `package.json`; updated the README License section (author + organization)
  and switched the license badge to Apache 2.0.

### Fixed
- Test suite no longer depends on a local `.env` (now git-ignored, absent in CI).
  `vitest.config.ts` pins the `VITE_*` values the tests exercise via `test.env`, so
  the `App` return-URL test resolves the Nebula fallback deterministically instead of
  falling back to the origin root.

## [1.2.1] - 2026-07-11

### Added
- Status/tech badges to `README.md` (version, React 19, TypeScript, Vite,
  Vitest, coverage gate, license, and CI workflow status).
- `.env.production.example` template documenting the production `VITE_*`
  variables, mirroring `.env.example`.

### Changed
- CI: dropped the redundant `dist/` artifact upload from `deploy-test.yml` (the
  deploy consumes `dist/` locally on the self-hosted runner, so the upload only
  spent shared Actions storage quota and could fail the deploy when the quota was
  full). The Playwright report in `pr-check.yml` now uploads only on failure with
  a 3-day retention.
- Moved project documentation (`API.md`, `ARCHITECTURE.md`, `CHANGELOG.md`,
  `DEPLOYMENT.md`, `TESTING.md`) under `docs/`, alongside `DEVELOPMENT_PLAN.md`.
  `README.md` stays at the repository root; links updated accordingly.

### Removed
- Stopped tracking local environment and tooling files in git: `.env`,
  `.env.production`, and `CLAUDE.md` are now git-ignored (committed templates
  `.env.example` / `.env.production.example` remain). Existing clones keep their
  local copies; the deploy host must provide its own `.env.production`.

## [1.2.0] - 2026-07-10

### Added
- Per-difficulty player glide speed via `playerSpeedForDifficulty` in a new
  `src/domain/speed.ts` module: easy 4, medium 4.5, hard 5 cells/sec (faster than
  before, and scaling up with difficulty). `usePlayerMovement` accepts a
  `baseSpeedCellsPerSec` prop that paces the glide; the timed `speed` buff still
  multiplies it 1.5x.
- `enemySpeedMultiplierForDifficulty` in `src/domain/speed.ts`, replacing the
  inline difficulty→multiplier map in `App.tsx` so player and enemy speed
  scaling share one source of truth.

### Fixed
- Enemy deadlock in `useEnemiesController`: enemies re-picked their direction
  only at dead-ends or 3-way junctions, so two enemies meeting head-on in a
  straight corridor locked forever — sometimes parked on dot cells the player
  could no longer reach. Blocked enemies now re-route to a walkable, currently
  free neighbor (`pickUnblockedDirection`) instead of stalling.

## [1.1.0] - 2026-07-05

### Added
- `.env.example` documenting `VITE_*` variables.
- Project documentation skeletons: `ARCHITECTURE.md`, `API.md`, `DEPLOYMENT.md`, `TESTING.md`,
  `CHANGELOG.md`, and `docs/DEVELOPMENT_PLAN.md`.
- Real `README.md` replacing the default Vite template.
- Typed environment configuration: `VITE_API_BASE_URL` and `VITE_NEBULA_RETURN_URL` in
  `.env`, `.env.production`, and `.env.example`, with an `ImportMetaEnv` interface in
  `src/vite-env.d.ts`.
- Base HTTP client (`src/api/http.ts`, `src/api/types.ts`) for the Hacman REST API:
  cookie-based auth (`credentials: 'include'`), JSON handling, an `ApiError` model, and a
  pluggable `401` handler for later token-refresh/Nebula-redirect wiring.
- Maze levels client (`src/api/mazeApi.ts`) with `getMazeLevels(galleryId)` and a DTO →
  `MazeData` mapper (`src/api/mappers/maze.ts`) per Appendix A: tuple → `{x,y}`, field
  renames/nesting, difficulty lowercasing, and validation that exactly EASY/MEDIUM/HARD
  are present (`MazeLevelsResponseError`).
- Level scores client (`src/api/scoresApi.ts`) with `submitLevelScore({ galleryId,
  difficulty, timeMs })`: maps difficulty to the API's UPPERCASE casing
  (`toApiDifficulty`), normalizes `timeMs`, and validates inputs before submitting.
- Version client (`src/api/versionApi.ts`) with `getAppVersion()` reading
  `GET /v1/version`, falling back to the build-time `PACKAGE_VERSION`. The version is
  injected from `package.json` via a `__APP_VERSION__` global defined in `vite.config.ts`
  (mirrored in `vitest.config.ts`).
- Game entry URL parsing (`src/utils/queryParams.ts`): `parseGameEntryParams` validates the
  `galleryId` UUID and safely collapses the double-encoded `title`, returning a discriminated
  result with `missing-gallery-id` / `invalid-gallery-id` errors for the entry screen.
- Entry bootstrap flow: `useGameBootstrap` (`src/hooks/useGameBootstrap.ts`) parses the entry
  URL and fetches the gallery's maze levels (`loading → ready | error`, distinguishing param
  vs. API errors), plus `LoadingScreen` and `ErrorScreen` components (`src/screens/`).
- Accessible `DifficultyDialog` (`src/component/DifficultyDialog.tsx`): `role=dialog` +
  `aria-modal`, focus moved to the first option, focus trap, and ESC-to-cancel; renders the
  EASY/MEDIUM/HARD options present in the fetched levels.
- `GameContainer` (`src/GameContainer.tsx`) wires the `loading → difficulty → playing` state
  machine: it bootstraps the levels, shows the difficulty dialog, then hands the chosen maze to
  the game. It is now the app root (`main.tsx`).
- Automatic score submission on win: `useScoreSubmission` (`src/hooks/useScoreSubmission.ts`)
  submits `{ galleryId, difficulty, timeMs }` exactly once when the game is won (guarded against
  double submission), with `submitting/success/error` states and retry. Wired into `App` (the win
  overlay shows status/retry); `galleryId` is threaded from `GameContainer`.
- Return-to-Nebula: `buildReturnUrl` (`src/utils/returnUrl.ts`) resolves the post-game
  destination from `document.referrer`, falling back to `VITE_NEBULA_RETURN_URL` + `galleryId`,
  host-validated against `milkyway.test` (and subdomains) to prevent an open redirect.
- Matrix design-token system: `src/style/tokens.css` (palette, semantic aliases, glows, spacing,
  radii, typography) + `reset.css`, consumed via `var(--token)` across the app; later extended
  with a game-board palette so the maze/player sprite are token-driven (no hard-coded hex).
- Responsive board: `useResponsiveCellSize` scales the maze to the viewport (no horizontal scroll
  from 360–1920px); replaces the fixed cell size.
- Touch controls: swipe gestures + an on-screen D-pad (`TouchControls`) on coarse-pointer devices,
  sharing a single `move(direction)` command path with the keyboard.
- Version in the UI: `useAppVersion` + `AppFooter` show the running version (live `GET /v1/version`,
  falling back to the build-time `package.json` value) as global footer chrome.
- Integration tests (MSW): `src/test-utils/msw/` handlers + scoped server; API-client and flow
  tests covering 401/500/network/timeout and bootstrap → selection → submit.
- E2E tests (Playwright, Chromium): `e2e/` happy-path (entry → selection → play → win → submit →
  return) and error scenarios (missing `galleryId`, 401, 500); `test:e2e` scripts.
- CI/CD: `pr-check.yml` (`verify` = lint → typecheck → coverage gate → build, plus an `e2e` job)
  and `deploy-test.yml` (build → deploy to TEST via host Compose → Prometheus metrics → smoke).
- Prometheus metrics: the deploy writes a scraped text-format `metrics` file
  (`hacman_front_build_info`, `hacman_front_deploy_timestamp_seconds`, `hacman_front_up`).

### Changed
- Decomposed `App` into `src/screens/` (`PlayScreen`/`GameOverScreen`/`WinScreen`); `App` now
  orchestrates hooks and routes screens.
- Strict typing pass: cleared all ESLint errors to 0 and made the CI `Lint` step a hard gate.
- Centralized time/score arithmetic in a pure `src/domain/score.ts` (timer durations, elapsed
  time, formatting), consumed by `App` and `useGameInitializer`.
- Enforced an **80%** coverage gate via `coverage.thresholds` in `vitest.config.ts`
  (`test:coverage` fails the build below it).
- Aligned `package.json` version to `1.0.1`.
- `vite.config.ts` now derives the build `base` from `VITE_BASE_PATH` (via `loadEnv`) instead
  of a hardcoded path, so production builds use the correct base.
- Widened `Debuff.effect`/`Buff.effect` to a structured `EffectSpec` and added an optional
  `difficulty` to `MazeData` in `src/types/maze.ts`.
- `useGameInitializer(mazeData?)` now accepts an optional externally-provided maze (API-sourced),
  keeping the static `testMaze` as a dev/test fallback; threaded through `useGameState(mazeData?)`.
  Removed a redundant, result-discarding `useGameInitializer()` call from `App.tsx`.
- `App` now accepts an optional `mazeData` prop (the selected level) and is rendered by
  `GameContainer` rather than directly from `main.tsx`; without the prop it still falls back to
  the dev `testMaze`.
- `App`'s "Deploy" button now returns the player to the Nebula gallery via `buildReturnUrl`,
  replacing the legacy `VITE_FRONT_APP_URL` result-payload logic (and the last `import.meta as any`).

## [1.0.1]

- Release version bump.

## [1.0.0]

- Initial version.
