# Job Ranger

[![Version](https://img.shields.io/badge/version-1.0.0-0f172a.svg)](#release-status)
[![Platform](https://img.shields.io/badge/platform-Windows%20desktop-2563eb.svg)](#installation)
[![Electron](https://img.shields.io/badge/Electron-28.3.3-47848f.svg)](#technology)
[![React](https://img.shields.io/badge/React-19.2.3-149eca.svg)](#technology)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6.svg)](#technology)
[![License](https://img.shields.io/badge/license-MIT-15803d.svg)](./LICENSE)

Job Ranger is a local-first desktop application for monitoring company career pages, storing results in a local SQLite database, and surfacing the job changes that matter to you without turning your search into a cloud product.

It is built as an Electron shell with a React renderer and an IPC-backed desktop runtime. The current release is intentionally honest about scope: it focuses on personal job monitoring, deterministic extraction, and local persistence rather than sync, accounts, or team workflows.

## Table Of Contents

- [Why Job Ranger Exists](#why-job-ranger-exists)
- [Release Status](#release-status)
- [What The App Does](#what-the-app-does)
- [Feature Status](#feature-status)
- [Installation](#installation)
- [Usage](#usage)
- [Supported Source Types](#supported-source-types)
- [Technology](#technology)
- [Repository Layout](#repository-layout)
- [Development](#development)
- [Packaging](#packaging)
- [Roadmap And Limits](#roadmap-and-limits)
- [Claim Map](#claim-map)
- [Help](#help)
- [License](#license)

## Why Job Ranger Exists

Job searching often degrades into repetitive tab checking, incomplete notes, and missed postings. Job Ranger addresses that loop with a local desktop workflow: track selected companies, run scheduled scrapes, filter noise, and review fresh jobs in one place.

The design center is privacy and operational honesty. The application stores its state locally, opens external links in the user's browser, and distinguishes between supported, detected, browser-required, and unsupported source types instead of pretending every career page is equally automatable.

## Release Status

`implemented`: Job Ranger `v1.0.0` ships as a desktop application with a local Electron IPC backend, SQLite-backed persistence, company/job/filter/settings management, scrape run tracking, notifications settings, and Windows packaging.

`implemented`: The repository also includes backend smoke coverage and an Electron Playwright E2E suite scaffold.

`planned`: Broader cross-platform hardening and deeper browser-backed automation remain active roadmap topics in the planning documents.

## What The App Does

- Tracks companies and career page sources you explicitly add.
- Detects supported and partially supported applicant tracking system patterns.
- Stores companies, jobs, filters, scrape runs, and runtime settings locally.
- Surfaces jobs in a dedicated review interface instead of mixing them into browser tabs.
- Supports saved filters with title, keyword, salary, and location criteria.
- Exposes runtime controls for scrape concurrency, timeout, retries, and cooldown behavior.
- Supports desktop notification preferences and minimize-to-tray behavior.
- Shows local runtime facts such as the database path, SQLite path, and supported adapters.

## Feature Status

| Capability | Status | Notes |
|---|---|---|
| Desktop shell and local backend | `implemented` | Electron main process, preload bridge, IPC handlers, and local data directory are present. |
| Company source management | `implemented` | Companies can be created, updated, deleted, and scraped from the UI and desktop API. |
| Job review workflow | `implemented` | Jobs can be listed and marked seen. |
| Filter management | `implemented` | Filters support title, keyword, salary, and location criteria. |
| Runtime settings | `implemented` | User agent, concurrency, timeout, retries, cooldown, and circuit-breaker settings are stored locally. |
| Desktop notifications and tray behavior | `implemented` | Notification toggles and minimize-to-tray behavior are part of the current UI and desktop runtime. |
| Windows packaging | `implemented` | The build config emits NSIS and portable Windows artifacts. |
| E2E automation suite | `implemented` | A Playwright Electron suite exists in the repo. |
| Cross-platform distribution | `planned` | Windows packaging is configured now; wider distribution hardening is not yet documented as complete. |
| Team sync, cloud backend, accounts | `deferred` | These are outside the current product scope. |

## Installation

### End Users

Use the Windows release artifacts generated from the project packaging flow. The current packaging configuration produces:

- An NSIS installer
- A portable executable

The artifact naming pattern is `Job Ranger-v<version>-x64.<ext>`.

### Developers

Prerequisites:

- Node.js `>=20.19.0`
- Windows development environment for the packaged release flow
- `sqlite3` on `PATH`, or `SQLITE3_PATH` set explicitly for backend execution

Install dependencies:

```bash
npm install
```

## Usage

### 1. Launch The App

For development:

```bash
npm run electron:dev
```

For a packaged Windows build, use the generated installer or portable executable.

### 2. Add A Source

Open `Companies`, choose `Add source`, and provide:

- A company name
- A careers URL
- A polling frequency
- An active/inactive state

### 3. Review Jobs

Use `Jobs` to inspect the current local job set and mark items as seen.

### 4. Add Filters

Use `Filters` to constrain results by:

- Title include or exclude terms
- Keyword include or exclude terms
- Minimum salary
- Location include or exclude terms

### 5. Configure Runtime Behavior

Use `Settings` to tune:

- User agent
- Maximum concurrent scrapes
- Scrape timeout
- Retry count
- Cooldown behavior
- Notification preferences
- Minimize-to-tray behavior

### 6. Inspect Local Runtime Facts

The `Settings` page shows:

- Database path
- SQLite binary path
- Supported source adapters

The desktop app menu also includes `Help -> Open Job Ranger Data Folder`.

## Supported Source Types

Job Ranger classifies source types with explicit support metadata rather than a single binary label.

### `implemented` Source Profiles

| Source Type | Support Label | Extraction Mode |
|---|---|---|
| `greenhouse` | `supported` | `api` |
| `lever` | `supported` | `api` |
| `smartrecruiters` | `supported` | `api` |
| `ashby` | `supported` | `api` |
| `workday` | `detected` | `html` |
| `icims` | `detected` | `html` |
| `bamboohr` | `detected` | `html` |
| `taleo` | `detected` | `html` |
| `oracle` | `detected` | `html` |
| `generic-html` | `detected` | `html` |
| `microsoft` | `browser-required` | `browser` |
| `browser-required` | `browser-required` | `browser` |
| `unsupported` | `manual-review` | `unknown` |

### Practical Reading Of These Labels

- `supported`: implemented adapter path with current runtime support.
- `detected`: the app can classify the source and attempt extraction, but behavior depends on the site's structure.
- `browser-required`: the app recognizes that a browser-backed path is required.
- `manual-review`: the app cannot claim a reliable extraction path.

## Technology

- Electron desktop runtime
- React renderer
- TypeScript across renderer and desktop source
- Local SQLite persistence via desktop backend commands
- Playwright test coverage for Electron UI flows
- Electron Builder for Windows packaging

## Repository Layout

| Path | Purpose |
|---|---|
| `src/` | React renderer and UI state |
| `src/shared/` | Shared contracts consumed across renderer and desktop source |
| `electron/src/` | Electron main process, backend, preload, scraping, validation, and repository code |
| `tests/` | Backend smoke tests and E2E coverage |
| `docs/` | plans, concept notes, and system-state artifacts |
| `public/` | static assets including the application icon |
| `release-v1.0.0/` | current Windows packaging output from the local build workflow |

## Development

Primary commands:

```bash
npm run dev
npm run desktop:compile
npm run desktop:watch
npm run typecheck
npm run build
npm run test
npm run test:unit
npm run test:e2e
npm run repo:health
```

Recommended local sequence:

1. `npm install`
2. `npm run typecheck`
3. `npm run electron:dev`

## Packaging

Windows packaging is configured through Electron Builder and currently targets:

- `nsis`
- `portable`

Packaging commands:

```bash
npm run electron:build
npm run electron:build:win
npm run electron:pack
```

The current builder configuration uses `public/ICON.png` for the Windows icon and names artifacts with the semantic version prefix.

## Roadmap And Limits

### `planned`

- Cross-platform hardening and packaging maturity
- Broader browser automation improvements for dynamic ATS portals
- Additional operational resilience improvements documented in planning artifacts

### `deferred`

- Cloud sync
- Multi-user collaboration
- Resume parsing
- Auto-apply workflows
- Team-oriented workflow features

### `unknown`

- Any production claim beyond the current Windows packaging path that is not explicitly represented in source or release artifacts

## Claim Map

| Claim | Status | Source |
|---|---|---|
| Job Ranger is version `1.0.0`. | `implemented` | `package.json:4` |
| The desktop app exposes company, job, filter, settings, and scrape-run operations over a preload API. | `implemented` | `src/shared/contracts.ts:283` |
| The Electron shell creates a local window, enforces context isolation, and loads the renderer from `dist` in production. | `implemented` | `electron/src/main.cts:23` |
| The application stores data in a local app data directory and initializes a desktop backend on startup. | `implemented` | `electron/src/main.cts:195` |
| Runtime settings include notifications and minimize-to-tray controls. | `implemented` | `src/shared/contracts.ts:259`, `src/pages/Settings.tsx:160` |
| The desktop menu includes a Help entry for opening the local data folder. | `implemented` | `electron/src/main.cts:110` |
| The app classifies source support levels rather than treating every source as fully supported. | `implemented` | `src/shared/contracts.ts:18`, `src/shared/contracts.ts:33` |
| Backend smoke coverage exercises persistence, source detection, and concurrency protection. | `implemented` | `tests/backend-smoke-test.cjs:115` |
| An Electron Playwright E2E suite exists for dashboard, navigation, companies, filters, settings, and notifications flows. | `implemented` | `tests/e2e/app.spec.ts:39` |
| Windows packaging targets NSIS and portable artifacts. | `implemented` | `electron-builder.json:17` |
| Desktop notifications and system tray behavior are part of the documented system state. | `implemented` | `docs/SYSTEM_STATE.md:76` |
| Cross-platform support is complete. | `unknown` | Current packaging config documents Windows targets only. |
| Application tracking is part of the shipped product. | `planned` | `docs/planning/PLAN.md:282` |

## Help

For user-facing setup, troubleshooting, and operational guidance, see [HELP.md](./HELP.md).

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).

