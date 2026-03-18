# Plan: Final Remediation (4 Remaining Violations)

## Open Questions

None. All changes are mechanical extractions with clear boundaries.

---

## Phase 1: Fix Nested Ternary + Extract Badge Utility

### Affected Files

- `src/pages/Companies.tsx` - Replace nested ternary with lookup, reduce by ~5 lines
- `src/types/index.ts` - Add badge class helper (if not present)

### Changes

**Companies.tsx:109-116** - Replace nested ternary:

```typescript
// BEFORE (lines 109-116)
const badgeClass =
  profile.supportLevel === "supported"
    ? "soft-badge-success"
    : profile.supportLevel === "detected"
      ? "soft-badge-info"
      : profile.supportLevel === "browser-required"
        ? "soft-badge-warning"
        : "soft-badge-danger";

// AFTER
const SUPPORT_BADGE_CLASSES: Record<string, string> = {
  supported: "soft-badge-success",
  detected: "soft-badge-info",
  "browser-required": "soft-badge-warning",
  "manual-review": "soft-badge-danger",
};
const badgeClass = SUPPORT_BADGE_CLASSES[profile.supportLevel] ?? "soft-badge-danger";
```

Move `SUPPORT_BADGE_CLASSES` to module scope (above component) to avoid recreation on each render.

---

## Phase 2: Extract Form Components

### Affected Files

- `src/components/CompanyForm.tsx` - NEW (~75 lines)
- `src/components/FilterForm.tsx` - NEW (~125 lines)
- `src/pages/Companies.tsx` - Remove form, import component (~205 lines after)
- `src/pages/Filters.tsx` - Remove form, import component (~145 lines after)

### Changes

**CompanyForm.tsx** - Extract lines 201-275 from Companies.tsx:

```typescript
import { useState } from "react";
import type { CompanyDraft } from "../types";

interface CompanyFormProps {
  onSubmit: (draft: CompanyDraft) => Promise<void>;
  onCancel: () => void;
}

const defaultForm: CompanyDraft = {
  name: "",
  url: "",
  frequencyMinutes: 1440,
  isActive: true,
};

export function CompanyForm({ onSubmit, onCancel }: CompanyFormProps) {
  const [formData, setFormData] = useState(defaultForm);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      {/* Form fields from Companies.tsx lines 203-273 */}
    </form>
  );
}
```

**FilterForm.tsx** - Extract lines 141-266 from Filters.tsx:

```typescript
import { useState } from "react";
import type { Company, FilterDraft } from "../types";

interface FilterFormProps {
  companies: Company[];
  onSubmit: (draft: FilterDraft) => Promise<void>;
  onCancel: () => void;
}

function parseTags(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function FilterForm({ companies, onSubmit, onCancel }: FilterFormProps) {
  // State and handlers from Filters.tsx
}
```

**Companies.tsx** - Update to use extracted form:

```typescript
// Remove: defaultForm, form state, handleSubmit form logic
// Add import:
import { CompanyForm } from "../components/CompanyForm";

// In Modal:
<Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add job source">
  <CompanyForm
    onSubmit={async (draft) => {
      await addCompany(draft);
      setModalOpen(false);
    }}
    onCancel={() => setModalOpen(false)}
  />
</Modal>
```

**Filters.tsx** - Update to use extracted form:

```typescript
// Remove: emptyDraft, parseTags, draft state, handleSubmit
// Add import:
import { FilterForm } from "../components/FilterForm";

// In Modal:
<Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create filter">
  <FilterForm
    companies={companies}
    onSubmit={async (draft) => {
      await addFilter(draft);
      setModalOpen(false);
    }}
    onCancel={() => setModalOpen(false)}
  />
</Modal>
```

---

## Phase 3: Extract HTML Extractors from Scrapers

### Affected Files

- `extractors.cts` - NEW (~150 lines)
- `scrapers.cts` - Remove extraction functions (~195 lines after)

### Changes

**extractors.cts** - Extract functions from scrapers.cts:

```typescript
import type { CompanySourceType } from "./contracts.cjs";
import type { ScrapedJob } from "./scrapers.cjs";

// Move these functions from scrapers.cts:
// - stripHtml (lines 130-142)
// - toSnippet (lines 144-147) - keep export
// - absoluteUrl (line 191-192)
// - normalizeJobTitle (lines 195-197)
// - slugFromUrl (lines 199-204)
// - collectJobPostingNodes (lines 206-214)
// - extractJsonLdJobs (lines 216-260)
// - isLikelyJobLink (lines 262-267)
// - extractAnchorJobs (lines 269-294)
// - extractJobsFromHtml (lines 296-305) - keep export

export { toSnippet, extractJobsFromHtml };
```

**scrapers.cts** - Update imports:

```typescript
import { toSnippet, extractJobsFromHtml } from "./extractors.cjs";

// Remove: stripHtml, absoluteUrl, normalizeJobTitle, slugFromUrl,
//         collectJobPostingNodes, extractJsonLdJobs, isLikelyJobLink,
//         extractAnchorJobs, extractJobsFromHtml

// Keep: interfaces, normalizeToken, normalizeUrl, looksLikeCareersPath,
//       isKnownBrowserPortal, detectSourceFromUrl, fetchJson, fetchText,
//       extractJobsFromRemotePage, scraperAdapters
```

---

## Expected Line Counts After Remediation

| File | Before | After | Status |
|------|--------|-------|--------|
| scrapers.cts | 345 | ~195 | PASS |
| Companies.tsx | 280 | ~205 | PASS |
| Filters.tsx | 269 | ~145 | PASS |
| CompanyForm.tsx | NEW | ~75 | PASS |
| FilterForm.tsx | NEW | ~125 | PASS |
| extractors.cts | NEW | ~150 | PASS |

All files under 250 line limit. No nested ternaries remaining.

---

## Unit Tests

None required for this remediation - these are pure extractions with no logic changes. Existing functionality preserved through interface boundaries.
