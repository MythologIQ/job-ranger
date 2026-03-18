# SYSTEM STATE SNAPSHOT

**Sealed**: 2026-03-18T18:00:00Z
**Session**: Phase 5 Notifications & System Tray Implementation
**Status**: COMPLETE

---

## Core Backend Files

| File | Lines | Purpose |
|------|-------|---------|
| main.cts | 229 | Electron main process entry, tray integration |
| backend.cts | 553 | IPC handlers, backend API, guard integration |
| scrapers.cts | 217 | Adapter registry and ScrapedJob interface |
| contracts.cts | 214 | Type definitions and contracts |
| extractors.cts | 144 | HTML extraction utilities with salary parsing |
| browser-loader.cts | 181 | Puppeteer browser automation |
| platform-selectors.cts | 65 | ATS platform CSS selectors |
| source-profiles.cts | 126 | Source type profiles and metadata |
| salary-parser.cts | 79 | Salary text parsing utilities |
| scrape-guard.cts | 45 | Caching and circuit breaker pure functions |
| tray-notifications.cts | 62 | System tray and notification logic |
| repository.cts | 603 | SQLite data access layer |
| sqlite.cts | ~100 | Database connection management |
| migrations.cts | 103 | Database migrations (v1: initial, v2: circuit breaker) |
| preload.cts | ~40 | Electron preload script |

## Validator Files

| File | Lines | Purpose |
|------|-------|---------|
| validators.cts | 17 | Re-export facade |
| validators/common.cts | 102 | Shared validation utilities |
| validators/company.cts | 59 | Company validation |
| validators/filter.cts | 84 | Filter validation |
| validators/settings.cts | 62 | Settings validation (incl. notification fields) |

## Adapter Files

| File | Lines | Source Type | Extraction Mode | Salary Parsing |
|------|-------|-------------|-----------------|----------------|
| adapters/greenhouse.cts | 41 | greenhouse | api | Yes |
| adapters/lever.cts | 44 | lever | api | Yes |
| adapters/smartrecruiters.cts | 62 | smartrecruiters | api | No (API lacks) |
| adapters/ashby.cts | 57 | ashby | api | Via salaryText |
| adapters/generic-html.cts | ~80 | generic-html, browser-required | html/browser | Via extractors |

## Frontend Files

| File | Lines | Purpose |
|------|-------|---------|
| src/pages/Settings.tsx | 249 | Settings page with notification UI |
| src/pages/Dashboard.tsx | ~200 | Dashboard overview |
| src/pages/Companies.tsx | ~200 | Company management |
| src/pages/Filters.tsx | ~125 | Filter management |
| src/pages/Jobs.tsx | ~250 | Job listings |
| src/context/AppContext.tsx | ~200 | App state provider |
| src/context/useCompanyActions.ts | ~80 | Company action hooks |
| src/context/useFilterActions.ts | ~80 | Filter action hooks |
| src/components/CompanyForm.tsx | 99 | Company form modal |
| src/components/FilterForm.tsx | 164 | Filter form modal |
| shared/contracts.ts | 312 | Frontend type definitions |

## Test Files

| File | Lines | Coverage |
|------|-------|----------|
| tests/tray-notifications.test.cjs | 72 | shouldMinimizeToTray function |
| tests/scrape-guard.test.cjs | 97 | checkScrapeGuard, shouldOpenCircuit, calculateCircuitOpenUntil |
| tests/salary-parser.test.cjs | 50 | parseSalary function |
| tests/backend.test.cjs | ~150 | Backend integration |

## Phase 5 Features

### System Tray

| Feature | Implementation | Description |
|---------|----------------|-------------|
| Tray icon | tray-notifications.cts:createTray | 16x16 icon from ICON.png |
| Context menu | tray-notifications.cts | "Open Job Ranger", separator, "Quit" |
| Click handler | tray-notifications.cts:30 | Shows main window |
| Minimize to tray | main.cts:75-81 | Optional close-to-tray behavior |

### Desktop Notifications

| Feature | Configuration | Description |
|---------|---------------|-------------|
| Master toggle | Settings.notificationsEnabled | Enables/disables all notifications |
| New jobs | Settings.notifyOnNewJobs | Notify on any new jobs found |
| Matched jobs | Settings.notifyOnMatchedJobs | Notify when jobs match filters |
| Minimize to tray | Settings.minimizeToTray | Close to tray instead of quit |

### Notification Functions

| Function | Lines | Purpose |
|----------|-------|---------|
| createTray | 21 | Initialize system tray |
| showJobNotification | 24 | Display notification based on settings |
| shouldMinimizeToTray | 3 | Check minimize-to-tray eligibility |

## Settings Interface (Extended)

```typescript
interface Settings {
  userAgent: string;
  maxConcurrentScrapes: number;
  scrapeTimeoutMs: number;
  retryCount: number;
  scrapeCooldownMinutes: number;
  circuitBreakerThreshold: number;
  circuitBreakerCooldownMinutes: number;
  notificationsEnabled: boolean;      // Phase 5
  notifyOnNewJobs: boolean;           // Phase 5
  notifyOnMatchedJobs: boolean;       // Phase 5
  minimizeToTray: boolean;            // Phase 5
}
```

## Section 4 Razor Compliance

- All Phase 5 functions: ≤40 lines (max: showJobNotification at 24 lines)
- All Phase 5 files: ≤250 lines (max: Settings.tsx at 249 lines)
- validators.cts remediated: 264 -> 17 lines (split into 4 domain modules)
- main.cts: 229 lines (under 250 limit with tray integration)
- Nesting depth: ≤3
- Nested ternaries: 0 in Phase 5 code

## Build Status

- TypeScript: PASS
- Unit Tests: PASS (tray-notifications.test.cjs, scrape-guard.test.cjs, salary-parser.test.cjs)
- No console.log statements in production code
- No security stubs
- No orphan files

---

*Snapshot represents verified system state at session close.*
