# Job Ranger Help

This help file is written for people using or evaluating the desktop application, not just building the repository.

## Quick Start

### Install Or Launch

- If you are using a packaged Windows release, run the installer or portable executable.
- If you are running from source, start the desktop shell with `npm run electron:dev`.

### Add Your First Source

1. Open `Companies`.
2. Select `Add source`.
3. Enter a company name and a careers URL.
4. Choose a polling frequency.
5. Save the source.

### Review Jobs

Open `Jobs` to see locally stored results. Mark jobs as seen after review to keep the queue manageable.

### Tighten Signal With Filters

Open `Filters` to define criteria such as:

- job title terms
- keyword terms
- location terms
- minimum salary

### Tune Behavior

Open `Settings` to adjust:

- scrape concurrency
- scrape timeout
- retry count
- notifications
- minimize-to-tray behavior

## What Job Ranger Is Designed To Do

`implemented`: Monitor selected company career pages from a local desktop application.

`implemented`: Store companies, jobs, filters, scrape history, and settings in local application storage.

`implemented`: Surface support status honestly when a source is supported, detected, browser-required, or unsupported.

`deferred`: Replace your browser, apply for jobs automatically, or sync your search state to a cloud account.

## Supported Source Guidance

### Best Current Fit

The clearest adapter-backed source types in the current codebase are:

- Greenhouse
- Lever
- SmartRecruiters
- Ashby

### Detected Or Conditional Fit

The app can also classify and attempt handling for:

- Workday
- iCIMS
- BambooHR
- Taleo
- Oracle Careers
- generic HTML career pages

### Browser-Required Or Manual Review

Some sources are recognized but not guaranteed to work as a straightforward API or static HTML scrape path:

- Microsoft Careers
- browser-required portals
- unsupported or deceptive sources

## Troubleshooting

### The App Opens But No Jobs Appear

Check these first:

- The source URL is a real careers page, not a marketing or company home page.
- The source is marked as a supported or detected source type.
- The source is active.
- The most recent scrape run does not show an unsupported or failure state.

### The App Says A Source Is Unsupported

That is intentional behavior. Job Ranger classifies uncertain or deceptive URLs as unsupported instead of fabricating a successful scrape result.

### Notifications Do Not Appear

Confirm all of the following:

- `Enable desktop notifications` is turned on.
- The specific notification subtype you want is turned on.
- Your operating system is allowing notifications for the application.

### Closing The Window Exits Instead Of Going To Tray

Enable `Minimize to system tray on close` in `Settings`.

### I Want To Find The Local Data Folder

Use the desktop menu:

- `Help`
- `Open Job Ranger Data Folder`

You can also inspect the `Database path` and `SQLite binary` values shown in the `Desktop backend facts` section of the `Settings` page.

### Development Build Fails Around SQLite

The desktop backend expects a working `sqlite3` binary. If it is not on `PATH`, set `SQLITE3_PATH` explicitly before running backend or packaging commands.

### Development Build Fails On Node Version

The repository declares `Node.js >=20.19.0`. If your local Node runtime is older, upgrade before relying on Vite or the full repo health flow.

## FAQ

### Does Job Ranger Upload My Data To A Remote Service?

The current product shape is local-first. The desktop runtime stores state locally and uses network access for job source retrieval, not for cloud account sync.

### Does It Support Team Collaboration?

No. That is outside the present scope.

### Does It Auto-Apply To Jobs?

No. The current product is focused on discovery and review.

### Is It Cross-Platform?

`implemented`: the repository contains a desktop runtime that can be developed beyond Windows.

`planned`: broad cross-platform hardening and distribution maturity.

`implemented`: Windows packaging is the documented release path today.

### Is The E2E Suite Part Of The Repo?

Yes. The repository includes a Playwright Electron E2E suite for key navigation and settings flows, alongside backend smoke coverage.

## Operator Notes

### Useful Commands

```bash
npm run typecheck
npm run build
npm run test
npm run repo:health
npm run electron:dev
npm run electron:build:win
```

### Current Packaged Outputs

Windows packaging is configured for:

- NSIS installer
- portable executable

Artifact names follow:

```text
Job Ranger-v<version>-x64.<ext>
```

## Status Snapshot

| Area | Status |
|---|---|
| Desktop runtime | `implemented` |
| Local persistence | `implemented` |
| Filtering workflow | `implemented` |
| Notifications settings | `implemented` |
| Tray behavior | `implemented` |
| Windows packaging | `implemented` |
| Cross-platform distribution maturity | `planned` |
| Cloud sync | `deferred` |
| Auto-apply workflows | `deferred` |

## More Reading

- [README.md](./README.md)
- [docs/CONCEPT.md](./docs/CONCEPT.md)
- [docs/SYSTEM_STATE.md](./docs/SYSTEM_STATE.md)
- [docs/planning/PLAN.md](./docs/planning/PLAN.md)
