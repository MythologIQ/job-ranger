# Plan: Phase 2 - API Adapters (SmartRecruiters, Ashby)

## Open Questions

None. Both platforms expose public JSON APIs with clear endpoint patterns.

## Phase 1: SmartRecruiters API Adapter

### Affected Files

- `adapters/smartrecruiters.cts` - NEW: API adapter (~40 lines)
- `scrapers.cts` - MODIFY: Import and register adapter (2 lines changed)
- `source-profiles.cts` - MODIFY: Update extraction mode to "api" (1 line changed)

### Changes

**1. Create `adapters/smartrecruiters.cts`** (38 lines):

```typescript
import type { ScraperAdapter, ScraperContext, ScrapedJob } from "../scrapers.cjs";
import { fetchJson, toSnippet } from "../scrapers.cjs";

interface SmartRecruitersPosting {
  id: string;
  uuid: string;
  name: string;
  refNumber?: string;
  company?: { identifier: string; name: string };
  location?: { city?: string; region?: string; country?: string; remote?: boolean };
  department?: { label?: string };
  releasedDate?: string;
  experienceLevel?: { label?: string };
}

interface SmartRecruitersResponse {
  content: SmartRecruitersPosting[];
  totalFound: number;
}

export const smartrecruitersAdapter: ScraperAdapter = {
  sourceType: "smartrecruiters",
  async scrape(sourceIdentifier: string, context: ScraperContext): Promise<ScrapedJob[]> {
    const companyId = extractCompanyId(sourceIdentifier);
    const response = await fetchJson<SmartRecruitersResponse>(
      `https://api.smartrecruiters.com/v1/companies/${companyId}/postings?limit=100`,
      context,
    );

    return response.content.map((job) => ({
      sourceJobId: job.uuid,
      sourceType: "smartrecruiters",
      title: job.name.trim(),
      location: formatLocation(job.location),
      employmentType: job.experienceLevel?.label ?? null,
      url: `https://jobs.smartrecruiters.com/${companyId}/${job.uuid}`,
      descriptionSnippet: "",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryText: null,
      postDate: job.releasedDate ?? null,
    }));
  },
};

function extractCompanyId(urlOrId: string): string {
  try {
    const url = new URL(urlOrId);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments[0] ?? urlOrId;
  } catch {
    return urlOrId;
  }
}

function formatLocation(loc?: SmartRecruitersPosting["location"]): string {
  if (!loc) return "Unspecified";
  const parts = [loc.city, loc.region, loc.country].filter(Boolean);
  if (loc.remote) parts.push("Remote");
  return parts.join(", ") || "Unspecified";
}
```

**2. Update `scrapers.cts`**:

Add import at line 4:
```typescript
import { smartrecruitersAdapter } from "./adapters/smartrecruiters.cjs";
```

Update `scraperAdapters` (line 208):
```typescript
smartrecruiters: smartrecruitersAdapter,
```

**3. Update `source-profiles.cts`** (line 48):
```typescript
extractionMode: "api",
supportLevel: "supported",
summary: "Structured posting API adapter.",
```

### Unit Tests

- `adapters/smartrecruiters.test.ts` - Test JSON parsing, location formatting, company ID extraction

## Phase 2: Ashby API Adapter

### Affected Files

- `adapters/ashby.cts` - NEW: API adapter (~35 lines)
- `scrapers.cts` - MODIFY: Import and register adapter (2 lines changed)
- `source-profiles.cts` - MODIFY: Update extraction mode to "api" (1 line changed)

### Changes

**1. Create `adapters/ashby.cts`** (35 lines):

```typescript
import type { ScraperAdapter, ScraperContext, ScrapedJob } from "../scrapers.cjs";
import { fetchJson, toSnippet } from "../scrapers.cjs";

interface AshbyJob {
  id: string;
  title: string;
  location: string;
  department?: string;
  employmentType?: string;
  descriptionPlain?: string;
  publishedAt?: string;
  jobUrl: string;
  compensation?: {
    compensationTierSummary?: string;
  };
}

interface AshbyResponse {
  apiVersion: string;
  jobs: AshbyJob[];
}

export const ashbyAdapter: ScraperAdapter = {
  sourceType: "ashby",
  async scrape(sourceIdentifier: string, context: ScraperContext): Promise<ScrapedJob[]> {
    const boardName = extractBoardName(sourceIdentifier);
    const response = await fetchJson<AshbyResponse>(
      `https://api.ashbyhq.com/posting-api/job-board/${boardName}?includeCompensation=true`,
      context,
    );

    return response.jobs.map((job) => ({
      sourceJobId: job.id,
      sourceType: "ashby",
      title: job.title.trim(),
      location: job.location?.trim() || "Unspecified",
      employmentType: job.employmentType ?? null,
      url: job.jobUrl,
      descriptionSnippet: toSnippet(job.descriptionPlain),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryText: job.compensation?.compensationTierSummary ?? null,
      postDate: job.publishedAt ?? null,
    }));
  },
};

function extractBoardName(urlOrName: string): string {
  try {
    const url = new URL(urlOrName);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments[0] ?? urlOrName;
  } catch {
    return urlOrName;
  }
}
```

**2. Update `scrapers.cts`**:

Add import at line 5:
```typescript
import { ashbyAdapter } from "./adapters/ashby.cjs";
```

Update `scraperAdapters` (line 209):
```typescript
ashby: ashbyAdapter,
```

**3. Update `source-profiles.cts`** (line 56):
```typescript
extractionMode: "api",
supportLevel: "supported",
summary: "Structured job board API adapter with compensation data.",
```

### Unit Tests

- `adapters/ashby.test.ts` - Test JSON parsing, board name extraction, compensation field handling

## Phase 3: Remove genericHtmlSourceTypes entries

### Affected Files

- `scrapers.cts` - MODIFY: Remove smartrecruiters and ashby from genericHtmlSourceTypes

### Changes

Update `genericHtmlSourceTypes` (lines 10-20):
```typescript
export const genericHtmlSourceTypes = [
  "workday",
  "icims",
  "bamboohr",
  "taleo",
  "oracle",
  "microsoft",
  "generic-html",
] as const;
```

### Unit Tests

None. Compilation verification only.

---

## Summary

| Metric | Current | Phase 2 Target |
|--------|---------|----------------|
| API-backed sources | 2 (Greenhouse, Lever) | 4 (+SmartRecruiters, +Ashby) |
| Working sources | 2/16 | 4/16 |

**New Files**:
- `adapters/smartrecruiters.cts` (~55 lines)
- `adapters/ashby.cts` (~50 lines)

**Modified Files**:
- `scrapers.cts` (4 lines changed)
- `source-profiles.cts` (4 lines changed)

**Section 4 Razor Compliance**:
- All new functions ≤40 lines
- All new files ≤250 lines
- No nested ternaries
- Follows existing adapter pattern (Greenhouse, Lever)
