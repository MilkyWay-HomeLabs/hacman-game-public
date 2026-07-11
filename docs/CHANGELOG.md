# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.2] - 2026-07-11

### Added
- Licensed under the Apache License 2.0 (`LICENSE` + `NOTICE`).

## [1.2.0]

### Added
- Per-difficulty player glide speed (`src/domain/speed.ts`): easy 4, medium 4.5,
  hard 5 cells/sec, scaling up with difficulty. The timed `speed` buff multiplies it 1.5x.
- Per-difficulty enemy speed scaling sharing one source of truth with the player.

### Fixed
- Enemy deadlock: two enemies meeting head-on in a straight corridor could lock
  forever and park on dot cells the player could no longer reach. Blocked enemies
  now re-route to a walkable, currently free neighbor instead of stalling.

## [1.1.0]

### Added
- REST API integration for the Hacman API: cookie-based auth HTTP client
  (`credentials: 'include'`), maze-levels client with a DTO → `MazeData` mapper,
  level-scores submission, and a version client with a build-time fallback.
- Game entry flow: entry-URL parsing/validation (`galleryId` UUID + `title`),
  bootstrap hook that fetches the gallery's maze levels, and loading/error screens.
- Accessible difficulty dialog (`role=dialog`, focus trap, ESC-to-cancel) showing
  the EASY/MEDIUM/HARD levels present in the fetched data.
- Automatic score submission on win (guarded against double submission, with
  submitting/success/error states and retry).
- Return-to-gallery after a game via a host-validated URL (prevents open redirects).
- Matrix-themed design-token system (palette, spacing, radii, typography) consumed
  via CSS variables across the app and the game board.
- Responsive board that scales the maze to the viewport (360–1920px) and touch
  controls (swipe gestures + on-screen D-pad) sharing one command path with the keyboard.
- App version displayed in the UI footer (live `GET /v1/version`, falling back to the
  build-time `package.json` value).
- Test suite: unit tests, MSW-backed integration tests, and Playwright E2E for the
  critical flows, with an enforced 80% coverage gate.

### Changed
- Decomposed the app into dedicated screens (play / game over / win) and centralized
  time/score arithmetic in a pure domain module.
- Continuous movement with buffered turns and Pac-Man-style edge wraparound.
- Entities rendered as SVG sprites over the cell background.

## [1.0.1]

- Release version bump.

## [1.0.0]

- Initial version.
