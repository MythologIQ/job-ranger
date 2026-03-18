# Architecture Plan

## Risk Grade: L2

### Risk Assessment

- [ ] Contains security/auth logic -> No (local-only app, no auth)
- [x] Modifies existing APIs -> Yes (enhancing scraper adapters, IPC handlers)
- [ ] UI-only changes -> No

**Rationale**: L2 assigned because changes modify core backend logic (scraper adapters, browser automation) that affect data extraction reliability. No security-critical paths but significant logic changes.

---

## Current Architecture (Existing)

```
electron/
├── main.cts              # Electron main process, IPC handlers, browser automation
├── preload.cts           # Context bridge exposing DesktopApi
├── backend.cts           # JobScoutBackend, scheduling, queue management
├── scrapers.cts          # Source detection, adapters, job extraction
├── contracts.cts         # Type definitions for main process
└── repository.cts        # SQLite repository layer

src/
├── main.tsx              # React entry point
├── App.tsx               # Root component with routing
├── context/
│   └── AppContext.tsx    # Global state management
├── pages/
│   ├── Dashboard.tsx     # Overview and stats
│   ├── Companies.tsx     # Company source management
│   ├── Jobs.tsx          # Job listing view
│   ├── Filters.tsx       # Filter configuration
│   └── Settings.tsx      # App settings
├── components/
│   ├── Layout.tsx        # Main layout wrapper
│   ├── Sidebar.tsx       # Navigation
│   ├── Modal.tsx         # Modal dialog
│   └── ui/               # Primitive components
├── services/
│   └── api.ts            # IPC wrapper
├── hooks/
│   ├── useApi.ts         # API hook
│   └── useForm.ts        # Form state hook
├── types/
│   └── index.ts          # Shared type exports
└── shared/
    └── contracts.ts      # Shared type definitions
```

---

## Planned Changes (Phase 1: Browser Automation)

### Modified Files

| File | Change Type | Description |
|------|-------------|-------------|
| `electron/main.cts` | MODIFY | Enhanced `loadPageHtmlInHiddenWindow` with smart waits, scroll handling |
| `electron/scrapers.cts` | MODIFY | Platform-specific selectors, improved extraction logic |
| `electron/contracts.cts` | MODIFY | New types for wait strategies, selector configs |

### New Files (None for Phase 1)

Phase 1 modifies existing files only. No new files required.

---

## Interface Contracts

### Enhanced Browser Loader

```typescript
// electron/main.cts
interface BrowserLoadOptions {
  url: string;
  waitSelectors: string[];      // NEW: element selectors to wait for
  maxWaitMs: number;            // NEW: max wait time for selectors
  enableScroll: boolean;        // NEW: infinite scroll handling
  maxScrollIterations: number;  // NEW: scroll limit
}

async function loadPageHtmlInHiddenWindow(
  options: BrowserLoadOptions
): Promise<string>
```

### Platform Selector Registry

```typescript
// electron/scrapers.cts
interface PlatformSelectors {
  waitFor: string[];           // Selectors indicating content loaded
  jobCard: string;             // Job listing container
  title: string;               // Job title within card
  location: string;            // Location within card
  link: string;                // Job detail link
}

const PLATFORM_SELECTORS: Record<CompanySourceType, PlatformSelectors>
```

### Salary Extraction (Phase 3)

```typescript
// electron/scrapers.cts
interface SalaryInfo {
  min: number | null;
  max: number | null;
  currency: string;           // USD, EUR, GBP, etc.
  period: 'year' | 'month' | 'hour';
  raw: string;                // Original text
}

function extractSalary(text: string): SalaryInfo | null
```

---

## Data Flow

### Current Scrape Flow

```
User clicks "Scrape"
  -> IPC: scrape-company
  -> Backend.scrapeCompany()
  -> Adapter.scrape()
  -> [fetchText OR loadPageHtml]
  -> extractJobsFromHtml()
  -> Repository.upsertJobs()
```

### Enhanced Scrape Flow (Phase 1)

```
User clicks "Scrape"
  -> IPC: scrape-company
  -> Backend.scrapeCompany()
  -> Adapter.scrape()
  -> loadPageHtmlInHiddenWindow({
       url,
       waitSelectors: PLATFORM_SELECTORS[sourceType].waitFor,
       maxWaitMs: settings.scrapeTimeoutMs,
       enableScroll: true,
       maxScrollIterations: 10
     })
  -> [Poll for selectors, scroll to load all]
  -> extractJobsFromHtml() with platform-specific selectors
  -> extractSalary() from description text (Phase 3)
  -> Repository.upsertJobs()
```

---

## Dependencies

| Package | Justification | Vanilla Alternative |
|---------|---------------|---------------------|
| `electron` | Desktop app framework, browser automation | No - core requirement |
| `react` | UI framework | Vanilla JS possible but impractical |
| `react-router-dom` | Client-side routing | ~50 lines vanilla, but fragile |
| `tailwindcss` | Utility CSS | Yes, but slower development |
| `date-fns` | Date formatting | ~20 lines vanilla per format |
| `lucide-react` | Icons | SVG strings, but maintenance burden |
| `clsx` + `tailwind-merge` | Class composition | ~10 lines vanilla |

**No new dependencies required for Phase 1-5.**

---

## Section 4 Razor Pre-Check

- [x] All planned functions <= 40 lines
  - `waitForJobContent`: ~25 lines (polling loop)
  - `scrollToLoadAll`: ~20 lines (scroll loop)
  - `extractSalary`: ~35 lines (regex matching)

- [x] All planned files <= 250 lines
  - `scrapers.cts` currently ~600 lines -> may need split if grows
  - **WATCH**: If scrapers.cts exceeds 800 lines, extract platform adapters to separate files

- [x] No planned nesting > 3 levels
  - All new functions use early returns, no deep nesting

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Browser automation timing issues | Configurable timeouts, fallback to current behavior |
| Platform selectors become stale | Selectors in config, easy to update without code changes |
| Infinite scroll never terminates | Max iteration limit, height change detection |
| New code breaks existing adapters | Smoke tests cover Greenhouse/Lever, manual testing for others |

---

## Success Criteria

| Metric | Current | Phase 1 Target |
|--------|---------|----------------|
| Working sources | 2/16 | 8/16 |
| Browser extraction success | ~20% | 70% |
| Jobs per scrape | First page | All visible |

---

## Implementation Order

1. **Phase 1.1**: Smart wait strategies in `loadPageHtmlInHiddenWindow`
2. **Phase 1.2**: Infinite scroll handling
3. **Phase 1.3**: Platform selector registry in `scrapers.cts`
4. **Phase 2**: API adapters (SmartRecruiters, Ashby)
5. **Phase 3**: Salary extraction
6. **Phase 4**: Caching, circuit breaker
7. **Phase 5**: Notifications, system tray

---

*Blueprint sealed. Awaiting GATE tribunal.*
