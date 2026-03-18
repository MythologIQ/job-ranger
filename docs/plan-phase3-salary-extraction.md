# Plan: Phase 3 - Salary Extraction

## Open Questions

- Should we support non-USD currencies beyond the initial set (USD, EUR, GBP, CAD, AUD)?
- Should we extract hourly rates and convert to annual equivalents?

---

## Phase 1: Create Salary Parser Module

### Affected Files

- `salary-parser.cts` (NEW) - Salary text parsing utilities

### Changes

Create `salary-parser.cts` with pure functions for extracting salary information from text:

```typescript
// salary-parser.cts

export interface ParsedSalary {
  min: number | null;
  max: number | null;
  currency: string;
  period: "year" | "month" | "hour";
  raw: string;
}

const CURRENCY_PATTERNS: Record<string, RegExp> = {
  USD: /\$|USD|U\.S\.|US\s*dollars?/i,
  EUR: /\u20AC|EUR|euros?/i,
  GBP: /\u00A3|GBP|pounds?/i,
  CAD: /CA\$|CAD|canadian\s*dollars?/i,
  AUD: /AU\$|AUD|australian\s*dollars?/i,
};

const PERIOD_PATTERNS: Record<string, RegExp> = {
  year: /\b(year|yr|annual|p\.?a\.?|per\s*annum)\b/i,
  month: /\b(month|mo|monthly)\b/i,
  hour: /\b(hour|hr|hourly)\b/i,
};

function detectCurrency(text: string): string {
  for (const [code, pattern] of Object.entries(CURRENCY_PATTERNS)) {
    if (pattern.test(text)) return code;
  }
  return "USD";
}

function detectPeriod(text: string): "year" | "month" | "hour" {
  for (const [period, pattern] of Object.entries(PERIOD_PATTERNS)) {
    if (pattern.test(text)) return period as "year" | "month" | "hour";
  }
  return "year";
}

function parseNumericValue(text: string): number | null {
  const cleaned = text.replace(/[$\u20AC\u00A3,\s]/g, "");
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*[kK]?/);
  if (!match) return null;
  let value = parseFloat(match[1]);
  if (/[kK]/.test(cleaned)) value *= 1000;
  return isFinite(value) ? value : null;
}

export function parseSalary(text: string | null | undefined): ParsedSalary | null {
  if (!text) return null;

  const rangeMatch = text.match(
    /[$\u20AC\u00A3]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?[kK]?)\s*[-\u2013\u2014to]+\s*[$\u20AC\u00A3]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?[kK]?)/
  );

  if (rangeMatch) {
    return {
      min: parseNumericValue(rangeMatch[1]),
      max: parseNumericValue(rangeMatch[2]),
      currency: detectCurrency(text),
      period: detectPeriod(text),
      raw: rangeMatch[0],
    };
  }

  const singleMatch = text.match(
    /[$\u20AC\u00A3]\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?[kK]?)/
  );

  if (singleMatch) {
    const value = parseNumericValue(singleMatch[1]);
    return {
      min: value,
      max: value,
      currency: detectCurrency(text),
      period: detectPeriod(text),
      raw: singleMatch[0],
    };
  }

  return null;
}
```

### Unit Tests

- `tests/salary-parser.test.cjs`
  - Range formats: "$100,000 - $150,000", "100k-150k", "$80K to $120K"
  - Single values: "$120,000", "$150k"
  - Currency detection: EUR, GBP, CAD, AUD symbols
  - Period detection: "per year", "monthly", "hourly"
  - Edge cases: null input, empty string, no salary text

---

## Phase 2: Integrate Into Extractors

### Affected Files

- `extractors.cts` - Add salary extraction to JSON-LD and anchor extraction
- `salary-parser.cts` - Export from module

### Changes

Update `extractors.cts` to use `parseSalary`:

```typescript
// Add import
import { parseSalary } from "./salary-parser.cjs";

// In extractJsonLdJobs, after line 82:
const salaryFromDescription = parseSalary(
  typeof posting.description === "string" ? posting.description : ""
);

// Update job object:
salaryMin: salaryFromDescription?.min ?? null,
salaryMax: salaryFromDescription?.max ?? null,
salaryCurrency: salaryFromDescription?.currency ?? null,
salaryText: salaryFromDescription?.raw ?? null,
```

No changes to `extractAnchorJobs` - anchor extraction lacks description context.

### Unit Tests

- Update `tests/extractors.test.cjs` (if exists)
  - JSON-LD with salary in description extracts values
  - JSON-LD without salary returns null fields

---

## Phase 3: Enhance API Adapters

### Affected Files

- `adapters/greenhouse.cts` - Extract salary from job.content
- `adapters/lever.cts` - Extract salary from descriptionPlain
- `scrapers.cts` - Export parseSalary for adapters

### Changes

Update `scrapers.cts` to re-export:

```typescript
export { parseSalary } from "./salary-parser.cjs";
```

Update `adapters/greenhouse.cts`:

```typescript
import { fetchJson, toSnippet, parseSalary } from "../scrapers.cjs";

// In scrape function, after line 29:
const salary = parseSalary(job.content);

// Update return object:
salaryMin: salary?.min ?? null,
salaryMax: salary?.max ?? null,
salaryCurrency: salary?.currency ?? null,
salaryText: salary?.raw ?? null,
```

Update `adapters/lever.cts`:

```typescript
import { fetchJson, toSnippet, parseSalary } from "../scrapers.cjs";

// In scrape function:
const description = job.descriptionPlain ?? job.description;
const salary = parseSalary(description);

// Update return object:
salaryMin: salary?.min ?? null,
salaryMax: salary?.max ?? null,
salaryCurrency: salary?.currency ?? null,
salaryText: salary?.raw ?? null,
```

### Unit Tests

- `tests/salary-parser.test.cjs` - Already covered by Phase 1
- Integration verification via existing smoke tests

---

## Summary

| Phase | Files Changed | New Files | Lines Added |
|-------|---------------|-----------|-------------|
| 1 | 0 | salary-parser.cts (~60) | ~60 |
| 2 | extractors.cts | 0 | ~10 |
| 3 | scrapers.cts, greenhouse.cts, lever.cts | 0 | ~15 |

**Total estimated**: ~85 lines across 5 files

All functions remain under 40 lines. No new dependencies.
