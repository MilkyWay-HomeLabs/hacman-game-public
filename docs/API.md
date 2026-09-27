# API

> The authoritative source is the Swagger UI:
> `https://milkyway.test/hacman/api/swagger/index.html`. This page documents the endpoints the app
> consumes.

## Base URL

```
https://milkyway.test/hacman/api
```

All endpoints are versioned under `/v1/`. Authenticated endpoints rely on `httpOnly` cookies sent
automatically with the request (`credentials: 'include'`); no manual `Authorization` header.

## Endpoints

### GET `/api/v1/version` — public

Returns the application/API version. No authorization required.

### GET `/api/v1/maze/levels/{galleryId}` — authenticated

Returns an array of **3 maze levels** for the gallery (`difficulty`: `EASY`, `MEDIUM`, `HARD`).

- **Path param:** `galleryId` (UUID).
- **Response:** `MazeLevelDto[]` — mapped to the app's `MazeData` model (see
  `src/api/mappers/maze.ts`).

Key DTO shape (abridged):

```jsonc
{
  "id": 13,
  "galleryId": "<uuid>",
  "difficulty": "EASY",            // EASY | MEDIUM | HARD
  "width": 25, "height": 27,
  "randomSeed": 4,
  "placementAllowedOn": "road",
  "placementAvoidAdjWalls": false,
  "cells": [[1,0,...], ...],        // 0 = road, 1 = wall
  "playerStartX": 12, "playerStartY": 13, "playerDirection": "right",
  "dots":    { "static": [[x,y], ...], "random_count": 0 },
  "enemies": [{ "type", "id", "style", "positions": [[x,y]], "random_count", "notes" }],
  "buffs":   [{ "type", "id", "style", "positions", "random_count", "effect", "rules" }],
  "debuffs": [{ "type", "id", "style", "positions", "random_count", "effect", "rules" }]
}
```

### POST `/api/v1/level-scores` — authenticated

Submits the result after a win. The backend computes the score from the time.

- **Request body:**

```json
{
  "galleryId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "difficulty": "EASY",
  "timeMs": 0
}
```

- `difficulty` is **UPPERCASE** (`EASY` | `MEDIUM` | `HARD`).
- `timeMs` is the **elapsed** play time in milliseconds (the difficulty's timer duration minus the
  time remaining at the win), a non-negative integer. The backend computes the score from it.

## Notes

- CORS must allow credentials for `milkyway.test`.
- Invalid/expired tokens → `401`; the client should trigger refresh/redirect.
