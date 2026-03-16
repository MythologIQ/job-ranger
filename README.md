# Job Ranger Desktop

Job Ranger is now scoped as an honest desktop MVP: an Electron + React app with a local SQLite-backed backend exposed through IPC.

## What Works

- Local persistence for companies, jobs, filters, scrape runs, and runtime settings
- Real job ingestion for supported Greenhouse and Lever board URLs
- Local scheduler with per-company frequency and concurrency controls
- Renderer state backed by Electron IPC instead of fake REST calls or in-memory mocks
- Truthful UI messaging around unsupported sources and deferred features

## Intentionally Out Of Scope

- Remote API or cloud backend
- Generic arbitrary-site scraping
- Notification delivery, multi-user auth, and sync
- Cross-platform production hardening beyond the current Windows-first remediation pass

## Architecture

- `src/` contains the renderer UI
- `main.cts`, `preload.cts`, `backend.cts`, `repository.cts`, `sqlite.cts`, and `scrapers.cts` define the desktop backend source
- `electron/` is generated output from `npm run desktop:compile`
- `shared/contracts.ts` contains renderer-facing domain contracts
- `contracts.cts` mirrors the desktop compile contracts used by Electron source

## Development

Requirements:

- Node.js `>=20.19.0`
- `sqlite3.exe` available on `PATH`, or `SQLITE3_PATH` set explicitly

Commands:

- `npm run typecheck`
- `npm run desktop:compile`
- `npm run dev`
- `npm run electron:dev`
- `npm test`
- `npm run repo:health`

## Supported Source URLs

- `https://boards.greenhouse.io/<board>`
- `https://jobs.lever.co/<board>`

Unsupported URLs can still be saved, but the app will mark them unsupported and will not fake successful scrapes.


