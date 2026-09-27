# Architecture

## Table of contents

1. [Overview](#overview)
2. [High-level flow](#high-level-flow)
3. [Frontend structure](#frontend-structure)
4. [Authentication](#authentication)
5. [API integration](#api-integration)
6. [Game engine](#game-engine)
7. [State management](#state-management)
8. [Styling](#styling)

## Overview

Hacman Game App is a client-side React 19 + TypeScript SPA built with Vite. It is launched from a
gallery context, loads maze levels from the Hacman REST API, lets the player pick a difficulty,
plays the maze, and reports the result back before returning to the Nebula gallery.

## High-level flow

```
Nebula gallery
    │  opens ?galleryId=<uuid>&title=<title>
    ▼
GameContainer ──► useGameBootstrap ──► GET /v1/maze/levels/{galleryId}   (3 levels: EASY/MEDIUM/HARD)
    │                                        │
    │  loading                               ├─ params error  → ErrorScreen ("Invalid game link", no retry)
    │  (LoadingScreen)                       └─ API error 401/500/timeout → ErrorScreen (retryable)
    ▼
DifficultyDialog  ──select──►  App (game)
    │                             │  play (keyboard / swipe / D-pad)
    │                             ▼
    │                         all dots collected → win
    │                             │  useScoreSubmission (once)
    │                             ▼
    │                         POST /v1/level-scores { galleryId, difficulty, timeMs }
    │                             │
    ▼                             ▼
  (out of lives/time →        WinScreen → "Deploy"
   GameOverScreen, retry)         │  buildReturnUrl (referrer → VITE_NEBULA_RETURN_URL+galleryId)
                                  ▼
                            return to the Nebula gallery
```

Edge/error paths: missing/invalid `galleryId` short-circuits to a non-retryable error screen (no
request is made); an API/transport failure yields a retryable error screen; a lost game shows the
Game Over overlay with retry.

## Frontend structure

| Path | Responsibility |
|---|---|
| `src/main.tsx` | Entry point; renders `GameContainer`. |
| `src/GameContainer.tsx` | Orchestrates `loading → difficulty → playing`; hosts the global version footer. |
| `src/App.tsx` | The game view; wires the game hooks and routes the Play/GameOver/Win screens. |
| `src/api/` | REST client — `http.ts`, `types.ts` (`ApiError`), `mazeApi.ts`, `scoresApi.ts`, `versionApi.ts`, and `mappers/maze.ts` (DTO → `MazeData`). |
| `src/hooks/` | Game + flow hooks: bootstrap, initializer, state, movement, enemies, collisions, effects, magnet, timer, enemy pickups, score submission, responsive cell size, app version. |
| `src/screens/` | Full-screen states: `LoadingScreen`, `ErrorScreen`, `PlayScreen`, `GameOverScreen`, `WinScreen`. |
| `src/component/` | Presentational: `DifficultyDialog`, `MazeGrid`, `SidePanel`, `RightPanel`, `TouchControls`, `AppFooter`. |
| `src/domain/` | Pure domain logic — `score.ts` (timer durations, elapsed time, formatting). |
| `src/effects/` | Buff/debuff effect application. |
| `src/utils/` | Helpers — `queryParams.ts`, `returnUrl.ts`, `dots.ts`, `mazeGenerator.ts`. |
| `src/types/` | Domain types (`MazeData`, entities). |
| `src/style/` | Design tokens (`tokens.css`), reset, and entity styles. |

## Authentication

Andromeda (provider) via the Nebula gateway. Tokens are stored in `httpOnly` cookies on
`milkyway.test` and sent automatically with cross-origin API requests (`credentials: 'include'`).
The client never reads or writes tokens. An expired token yields `401`; `http.ts` exposes a
pluggable unauthorized handler (`setUnauthorizedHandler`) for future token-refresh / Nebula-redirect
wiring.

## API integration

See [API.md](API.md). Base URL: `https://milkyway.test/hacman/api` (from `VITE_API_BASE_URL`).
Every request goes through `request()` in `src/api/http.ts`, which sends cookies, parses JSON, and
normalizes non-2xx responses and transport failures into `ApiError` (`status`, `body`,
`isNetworkError`).

## Game engine

The maze is a `number[][]` grid (`0` = road, `1` = wall). Entities (player, enemies, buffs,
debuffs, dots) are placed from static positions plus optional random placement seeded by a
Mulberry32 PRNG (`src/hooks/useGameInitializer.ts`). The win condition is "all dots collected";
losing occurs on running out of lives or time. Input (keyboard, swipe, on-screen D-pad) funnels
through a single `move(direction)` command in `usePlayerMovement`.

## State management

React hooks + local component state (no external store). `GameContainer` owns the entry state
machine; `App` composes the game hooks and renders one of the `screens/`. Time/score arithmetic is
centralized in the pure `src/domain/score.ts`. The board scales to the viewport via
`useResponsiveCellSize`.

## Styling

Theme is **Matrix** (phosphor green on black, monospace, terminal glow). All colors, spacing,
radii, typography, and glows come from design tokens in `src/style/tokens.css`; components and
screens consume `var(--token)` rather than hard-coded values.
