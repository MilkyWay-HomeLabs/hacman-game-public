# Hacman Game App

[![Version](https://img.shields.io/badge/version-1.2.2-blue.svg)](docs/CHANGELOG.md)
[![Coverage gate](https://img.shields.io/badge/coverage-%E2%89%A580%25-brightgreen.svg)](docs/TESTING.md)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![Vitest](https://img.shields.io/badge/tested%20with-Vitest-6e9f18.svg?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

A web-based maze/labyrinth game (React 19 + TypeScript + Vite). The player clears a maze of dots
while avoiding enemies and using buffs/debuffs. The app is launched from a gallery context, fetches
its maze levels from the Hacman REST API, lets the player pick a difficulty, and reports the result
back to the API before returning to the gallery.

> **Language:** all code and documentation in this repository are written in English.

## Status

Active development.

## Quick start

```bash
# Install dependencies
npm install

# Start the dev server (https://milkyway.test/dev/hacman/game/)
npm run dev

# Run tests
npm run test:run

# Check coverage (threshold: 80%)
npm run test:coverage

# End-to-end tests (Playwright, Chromium)
npm run test:e2e

# Production build
npm run build

# Preview a production build locally
npm run preview

# Lint
npm run lint
```

## Entry URL

The game is opened with a gallery context:

```
https://milkyway.test/hacman/game/play?galleryId=<uuid>&title=<gallery title>
```

- `galleryId` (required): UUID of the gallery — used to fetch maze levels.
- `title` (required): human-readable gallery title.

## Environment variables

Copy [`.env.example`](.env.example) to `.env` (dev), or [`.env.production.example`](.env.production.example)
to `.env.production` (prod build). Only `VITE_`-prefixed variables are exposed to the client bundle;
never store secrets. `.env` and `.env.production` are git-ignored — only the `*.example` templates
are committed.

| Variable | Purpose |
|---|---|
| `VITE_BASE_PATH` | Base path the app is served from (`/dev/hacman/game/` or `/hacman/game/`). |
| `VITE_API_BASE_URL` | Hacman REST API base URL (`https://milkyway.test/hacman/api`). |
| `VITE_NEBULA_RETURN_URL` | Fallback return URL to the Nebula gallery after a game. |
| `VITE_RESOURCES_URL` | Static resources host. |

## Documentation

| Document | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, components, data flow. |
| [docs/API.md](docs/API.md) | REST API endpoints (Swagger is the source of truth). |
| [docs/TESTING.md](docs/TESTING.md) | Testing approach and how to run tests. |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Version history. |

## Authentication

Authentication is handled by the external Andromeda system via the Nebula gateway. Tokens live in
`httpOnly` cookies on `milkyway.test` and are sent automatically with API requests (the app never
reads or sets tokens directly). See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for the
full license text and the [NOTICE](NOTICE) file for additional information.

### Author

Szymon Derleta
GitHub: [@szymonderleta](https://github.com/szymonderleta)

### Project

Organization: [@MilkyWay-HomeLabs](https://github.com/MilkyWay-HomeLabs)
