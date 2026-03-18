# Plan: VETO Remediation

Remediate 12 violations identified in AUDIT_REPORT.md before new implementation can proceed.

## Open Questions

None. All remediation paths are clear from the audit.

---

## Phase 1: Delete Orphan Files

### Affected Files

- `src/hooks/useApi.ts` - DELETE (never imported)
- `src/hooks/useForm.ts` - DELETE (never imported)
- `src/utils/animations.ts` - DELETE (never imported)
- `src/constants/index.ts` - DELETE (never imported)

### Changes

Delete all four orphan files. These contain speculative abstractions that were never integrated.

```bash
rm src/hooks/useApi.ts
rm src/hooks/useForm.ts
rm src/utils/animations.ts
rm src/constants/index.ts
```

If `src/hooks/` or `src/constants/` directories become empty, delete them.

### Unit Tests

None required. Deletion of unused code.

---

## Phase 2: Eliminate Nested Ternaries

### Affected Files

- `src/components/Modal.tsx:37` - Replace nested ternary with lookup
- `src/pages/Dashboard.tsx:48-52` - Extract helper function

### Changes

**Modal.tsx** - Replace line 37:

```typescript
// BEFORE (line 37)
const widthClass =
  size === "sm" ? "max-w-md" : size === "lg" ? "max-w-2xl" : "max-w-lg";

// AFTER
const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

const widthClass = SIZE_CLASSES[size];
```

**Dashboard.tsx** - Extract helper before component (insert around line 15):

```typescript
function formatSourceCoverageMessage(
  browserRequired: number,
  manualReview: number,
): string {
  if (browserRequired > 0) {
    const plural = browserRequired === 1 ? " still needs" : "s still need";
    return `${browserRequired} source${plural} browser-backed automation.`;
  }
  if (manualReview > 0) {
    const plural = manualReview === 1 ? " needs" : "s need";
    return `${manualReview} source${plural} a dedicated adapter or manual review path.`;
  }
  return "Everything in your source list currently has a runnable extraction path.";
}
```

Then replace lines 48-52 in the `stories` array:

```typescript
// BEFORE
: browserRequiredCompanies > 0
  ? `${browserRequiredCompanies} source${browserRequiredCompanies === 1 ? " still needs" : "s still need"} browser-backed automation.`
  : manualReviewCompanies > 0
    ? `${manualReviewCompanies} source${manualReviewCompanies === 1 ? " needs" : "s need"} a dedicated adapter or manual review path.`
    : "Everything in your source list currently has a runnable extraction path.",

// AFTER
: formatSourceCoverageMessage(browserRequiredCompanies, manualReviewCompanies),
```

### Unit Tests

None required. Refactoring preserves behavior exactly.

---

## Phase 3: Split Backend Files

### Affected Files

- `main.cts` (558 lines) - Extract validators and browser loader
- `scrapers.cts` (589 lines) - Extract adapters

### Changes

**Create `validators.cts`** (~120 lines) - Extract from main.cts:

```typescript
// validators.cts
// Lines 17-272 from main.cts: all validate* functions

export function validateExternalUrl(rawUrl: string): string { ... }
export function validateId(rawValue: unknown, label: string): string { ... }
export function validateCompanyDraft(rawValue: unknown): CompanyDraft { ... }
export function validateCompanyUpdate(rawValue: unknown): CompanyUpdate { ... }
export function validateFilterDraft(rawValue: unknown): FilterDraft { ... }
export function validateFilterUpdate(rawValue: unknown): FilterUpdate { ... }
export function validateSettingsUpdate(rawValue: unknown): SettingsUpdate { ... }
// Plus helper functions: isRecord, validateOptionalString, validateBoolean, etc.
```

**Create `browser-loader.cts`** (~90 lines) - Extract from main.cts:

```typescript
// browser-loader.cts
// Lines 274-358 from main.cts: delay + loadPageHtmlInHiddenWindow

import { BrowserWindow } from "electron";
import type { BrowserPageLoaderOptions } from "./backend.cjs";
import { validateExternalUrl } from "./validators.cjs";

export function delay(ms: number): Promise<void> { ... }
export async function loadPageHtmlInHiddenWindow(
  rawUrl: string,
  options: BrowserPageLoaderOptions,
): Promise<string> { ... }
```

**Update `main.cts`** (target: ~200 lines):

```typescript
// main.cts - Keep only:
// - Imports
// - mainWindow/backend globals
// - createWindow()
// - createMenu()
// - requireBackend()
// - registerIpcHandlers()
// - app lifecycle handlers

import { validateExternalUrl, validateId, ... } from "./validators.cjs";
import { loadPageHtmlInHiddenWindow } from "./browser-loader.cjs";
```

**Create `adapters/greenhouse.cts`** (~45 lines):

```typescript
// adapters/greenhouse.cts
import type { ScraperAdapter, ScraperContext, ScrapedJob } from "../scrapers.cjs";

interface GreenhouseResponse { ... }

export const greenhouseAdapter: ScraperAdapter = { ... };
```

**Create `adapters/lever.cts`** (~40 lines):

```typescript
// adapters/lever.cts
import type { ScraperAdapter, ScraperContext, ScrapedJob } from "../scrapers.cjs";

interface LeverPosting { ... }

export const leverAdapter: ScraperAdapter = { ... };
```

**Create `adapters/generic-html.cts`** (~35 lines):

```typescript
// adapters/generic-html.cts
import type { ScraperAdapter } from "../scrapers.cjs";
import { extractJobsFromRemotePage, normalizeUrl } from "../scrapers.cjs";

export function createGenericHtmlAdapter(...): ScraperAdapter { ... }
export const browserRequiredAdapter: ScraperAdapter = { ... };
```

**Update `scrapers.cts`** (target: ~250 lines):

```typescript
// scrapers.cts - Keep:
// - Types and interfaces (ScrapedJob, ScraperContext, etc.)
// - Detection logic (detectSourceFromUrl)
// - HTML extraction utilities (extractJobsFromHtml, etc.)
// - Export scraperAdapters registry (importing from adapters/)

import { greenhouseAdapter } from "./adapters/greenhouse.cjs";
import { leverAdapter } from "./adapters/lever.cjs";
import { createGenericHtmlAdapter, browserRequiredAdapter } from "./adapters/generic-html.cjs";

export const scraperAdapters: Record<...> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  // ... assembled from imports
};
```

### Unit Tests

- `test/validators.test.ts` - Test validation edge cases (invalid URLs, missing fields)
- `test/adapters/greenhouse.test.ts` - Test Greenhouse API response mapping
- `test/adapters/lever.test.ts` - Test Lever API response mapping

---

## Phase 4: Split Frontend Context

### Affected Files

- `src/context/AppContext.tsx` (340 lines) - Extract action creators

### Changes

**Create `src/context/useCompanyActions.ts`** (~60 lines):

```typescript
// useCompanyActions.ts
import { getDesktopApi } from "../services/api";
import type { CompanyDraft, CompanyUpdate } from "../types";

export function createCompanyActions(
  refresh: () => Promise<void>,
  addToast: (toast: Omit<Toast, "id">) => void,
  setError: (error: string | null) => void,
) {
  return {
    addCompany: async (draft: CompanyDraft) => { ... },
    updateCompany: async (id: string, update: CompanyUpdate) => { ... },
    deleteCompany: async (id: string) => { ... },
    runScraper: async (companyId: string) => { ... },
  };
}
```

**Create `src/context/useFilterActions.ts`** (~45 lines):

```typescript
// useFilterActions.ts
export function createFilterActions(
  refresh: () => Promise<void>,
  addToast: (toast: Omit<Toast, "id">) => void,
  setError: (error: string | null) => void,
) {
  return {
    addFilter: async (draft: FilterDraft) => { ... },
    updateFilter: async (id: string, update: FilterUpdate) => { ... },
    deleteFilter: async (id: string) => { ... },
  };
}
```

**Update `AppContext.tsx`** (target: ~180 lines):

```typescript
// AppContext.tsx - Keep:
// - State declarations
// - refresh() function
// - Toast management
// - Provider with useMemo composing actions from hooks

import { createCompanyActions } from "./useCompanyActions";
import { createFilterActions } from "./useFilterActions";

// In AppProvider:
const companyActions = createCompanyActions(refresh, addToast, setError);
const filterActions = createFilterActions(refresh, addToast, setError);

const value = useMemo<AppState>(() => ({
  ...state,
  ...companyActions,
  ...filterActions,
  // remaining actions
}), [deps]);
```

### Unit Tests

None required. Refactoring preserves behavior exactly.

---

## Phase 5: Extract Form Components

### Affected Files

- `src/pages/Companies.tsx` (280 lines) - Extract CompanyForm
- `src/pages/Filters.tsx` (269 lines) - Extract FilterForm

### Changes

**Create `src/components/CompanyForm.tsx`** (~80 lines):

```typescript
// CompanyForm.tsx
interface CompanyFormProps {
  onSubmit: (data: CompanyFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: CompanyFormData;
}

export function CompanyForm({ onSubmit, onCancel, initialData }: CompanyFormProps) {
  // Form state, handlers, JSX
  // Lines 201-274 from Companies.tsx (the form inside Modal)
}
```

**Update `Companies.tsx`** (target: ~200 lines):

```typescript
// Companies.tsx
import { CompanyForm } from "../components/CompanyForm";

// In Modal:
<Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add job source">
  <CompanyForm
    onSubmit={handleSubmit}
    onCancel={() => setModalOpen(false)}
  />
</Modal>
```

**Create `src/components/FilterForm.tsx`** (~120 lines):

```typescript
// FilterForm.tsx
interface FilterFormProps {
  onSubmit: (data: FilterFormData) => Promise<void>;
  onCancel: () => void;
  companies: Company[];
  initialData?: FilterFormData;
}

export function FilterForm({ onSubmit, onCancel, companies, initialData }: FilterFormProps) {
  // Form state, handlers, JSX
  // Lines 142-259 from Filters.tsx (the form inside Modal)
}
```

**Update `Filters.tsx`** (target: ~150 lines):

```typescript
// Filters.tsx
import { FilterForm } from "../components/FilterForm";

// In Modal:
<Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add filter">
  <FilterForm
    onSubmit={handleSubmit}
    onCancel={() => setModalOpen(false)}
    companies={companies}
  />
</Modal>
```

### Unit Tests

None required. Refactoring preserves behavior exactly.

---

## Summary

| Phase | Violations Addressed | Files Created | Files Modified | Files Deleted |
|-------|---------------------|---------------|----------------|---------------|
| 1 | V9-V12 (orphans) | 0 | 0 | 4 |
| 2 | V6-V8 (ternaries) | 0 | 2 | 0 |
| 3 | V1-V2 (backend size) | 5 | 2 | 0 |
| 4 | V3 (context size) | 2 | 1 | 0 |
| 5 | V4-V5 (page size) | 2 | 2 | 0 |

**Total**: 9 new files, 7 modified files, 4 deleted files

After remediation:
- All files under 250 lines
- Zero nested ternaries
- Zero orphan files
- Ready for `/ql-audit` re-submission

---

*Plan follows Simple Made Easy principles: each extraction is independent, composable, and testable.*
