# Job Ranger - Functionality Enhancement Plan

## Executive Summary

**Current State**: Only **2 of 16** detected source types actually work reliably (Greenhouse and Lever via API). The remaining 14 sources rely on generic HTML extraction that fails for JavaScript-rendered ATS platforms.

**Core Problem**: Most modern ATS systems (Workday, iCIMS, SmartRecruiters, Ashby, BambooHR, Taleo) render job listings via client-side JavaScript. The current HTML extraction cannot discover these jobs without browser rendering + proper wait strategies.

---

## Phase 1: Fix Browser Automation (Critical)

### 1.1 Implement Smart Wait Strategies
**Priority**: 🔴 Critical
**Impact**: Enables 8+ additional sources

Current browser automation issues:
- Fixed 2.4-second delay is insufficient for JS-heavy sites
- No element-based waiting
- No detection of dynamic content completion

**Implementation**:
```typescript
// Wait for job listings to appear, not just page load
async function waitForJobContent(webContents: WebContents, maxWaitMs: number): Promise<void> {
  const selectors = [
    '[data-automation-id="jobTitle"]',           // Workday
    '.iCIMS_JobsTable',                          // iCIMS
    '[data-qa="job-title"]',                     // SmartRecruiters
    '.ashby-job-posting-brief-list',             // Ashby
    '.BambooHR-ATS-Jobs-List',                   // BambooHR
    'script[type="application/ld+json"]',        // JSON-LD
    'a[href*="job"], a[href*="career"]',         // Generic job links
  ];

  // Poll until content found or timeout
  await pollForSelector(webContents, selectors, maxWaitMs);
}
```

**Files to modify**:
- `main.cts`: Enhance `loadPageHtmlInHiddenWindow`
- `scrapers.cts`: Add platform-specific wait selectors

### 1.2 Add Infinite Scroll Handling
**Priority**: 🔴 Critical
**Impact**: Captures all jobs, not just first page

Many sites use infinite scroll (LinkedIn, Indeed, Glassdoor):
```typescript
async function scrollToLoadAll(webContents: WebContents, maxScrolls: number = 10): Promise<void> {
  let previousHeight = 0;
  for (let i = 0; i < maxScrolls; i++) {
    const currentHeight = await webContents.executeJavaScript(
      'document.body.scrollHeight'
    );
    if (currentHeight === previousHeight) break;

    await webContents.executeJavaScript(
      'window.scrollTo(0, document.body.scrollHeight)'
    );
    await delay(1500); // Wait for content to load
    previousHeight = currentHeight;
  }
}
```

### 1.3 Add Pagination Detection & Navigation
**Priority**: 🟡 High
**Impact**: Captures jobs beyond first page

For sites with explicit pagination:
```typescript
async function handlePagination(webContents: WebContents): Promise<string[]> {
  const pages: string[] = [];

  // Detect pagination patterns
  const paginationSelectors = [
    '.pagination a',
    '[aria-label="Next page"]',
    'button[data-page]',
    '.pager-next',
  ];

  // Collect all page URLs or click through pages
  // Return array of HTML snapshots
}
```

---

## Phase 2: Platform-Specific Adapters (High Value)

### 2.1 Workday Adapter
**Priority**: 🔴 Critical
**Impact**: Workday powers Fortune 500 careers (Amazon, Walmart, Target, etc.)

Workday uses a specific DOM structure and API patterns:
```typescript
async function scrapeWorkday(context: ScrapeContext): Promise<ScrapedJob[]> {
  // Workday embeds job data in window.__NEXT_DATA__ or specific API calls
  // Look for: /wday/cxs/{tenant}/jobs

  // Strategy 1: Intercept XHR/fetch calls during page load
  // Strategy 2: Parse __NEXT_DATA__ JSON from page
  // Strategy 3: DOM extraction with specific selectors

  const selectors = {
    jobCard: '[data-automation-id="jobItem"]',
    title: '[data-automation-id="jobTitle"]',
    location: '[data-automation-id="locations"]',
    postedDate: '[data-automation-id="postedOn"]',
  };
}
```

### 2.2 iCIMS Adapter
**Priority**: 🟡 High
**Impact**: Popular mid-market ATS

```typescript
// iCIMS uses iframe embedding and specific class names
const selectors = {
  jobList: '.iCIMS_JobsTable, .iCIMS_JobsGrid',
  jobRow: '.iCIMS_JobRow, .iCIMS_GridItem',
  title: '.iCIMS_JobTitle, .title',
  location: '.iCIMS_JobLocation',
};
```

### 2.3 SmartRecruiters Adapter
**Priority**: 🟡 High
**Impact**: Modern ATS used by Visa, LinkedIn, Bosch

```typescript
// SmartRecruiters has a public API
const apiUrl = `https://api.smartrecruiters.com/v1/companies/${companyId}/postings`;
// Returns JSON with job listings
```

### 2.4 Ashby Adapter
**Priority**: 🟢 Medium
**Impact**: Popular with tech startups

```typescript
// Ashby uses GraphQL API
const graphqlEndpoint = 'https://api.ashbyhq.com/posting-api/job-board/{boardId}';
```

### 2.5 LinkedIn Jobs API Alternative
**Priority**: 🟢 Medium
**Impact**: LinkedIn blocks scrapers aggressively

Options:
1. Use official LinkedIn API (requires partnership)
2. RSS feeds for company pages (limited)
3. Accept "Browser Required - Manual" designation

---

## Phase 3: Data Extraction Improvements

### 3.1 Salary Extraction
**Priority**: 🟡 High
**Impact**: Key filter feature currently non-functional

```typescript
function extractSalary(text: string): SalaryInfo | null {
  const patterns = [
    // $80,000 - $120,000
    /\$\s*([\d,]+)\s*[-–to]\s*\$?\s*([\d,]+)/i,
    // $80k - $120k
    /\$\s*([\d]+)k\s*[-–to]\s*\$?\s*([\d]+)k/i,
    // €50.000 - €70.000 (European)
    /[€£]\s*([\d.,]+)\s*[-–to]\s*[€£]?\s*([\d.,]+)/i,
    // $80,000/year, $80,000 per year
    /\$\s*([\d,]+)\s*(?:\/|\s*per\s*)(year|month|hour)/i,
  ];

  // Extract currency, min, max, period
  // Normalize to annual for comparison
}
```

**Files to modify**:
- `scrapers.cts`: Add `extractSalary()` function
- Update all extraction paths to call salary extractor

### 3.2 Location Normalization
**Priority**: 🟢 Medium
**Impact**: Better location filtering

```typescript
function normalizeLocation(raw: string): LocationInfo {
  // "San Francisco, CA, USA" → { city: "San Francisco", state: "CA", country: "USA", remote: false }
  // "Remote (US)" → { remote: true, country: "USA" }
  // "Hybrid - NYC" → { city: "New York", hybrid: true }
}
```

### 3.3 Employment Type Normalization
**Priority**: 🟢 Low
**Impact**: Minor UX improvement

Standardize: "Full-time", "Part-time", "Contract", "Intern", "Temporary"

---

## Phase 4: Reliability & Resilience

### 4.1 Request Caching
**Priority**: 🟡 High
**Impact**: Faster re-scrapes, reduced rate limiting

```typescript
// Cache successful HTML/API responses for 1 hour
// Use ETag/Last-Modified headers when available
// SQLite table: request_cache (url, response, etag, cached_at)
```

### 4.2 Circuit Breaker Pattern
**Priority**: 🟢 Medium
**Impact**: Prevents wasted resources on failing sources

```typescript
// Track failure rate per source
// If >3 consecutive failures, pause scraping for that source
// Auto-resume after cooldown period
// Notify user of persistent failures
```

### 4.3 User-Agent Rotation
**Priority**: 🟢 Medium
**Impact**: Reduces bot detection

```typescript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...',
  // Rotate per request or per session
];
```

### 4.4 Proxy Support
**Priority**: 🟢 Low
**Impact**: Bypass rate limiting for power users

Add settings for:
- HTTP/SOCKS proxy configuration
- Per-source proxy rules

---

## Phase 5: Value-Add Features

### 5.1 Desktop Notifications
**Priority**: 🟡 High
**Impact**: Core UX for job alerts

```typescript
// Use Electron's Notification API
import { Notification } from 'electron';

function notifyNewJobs(jobs: Job[], filterName: string): void {
  new Notification({
    title: `${jobs.length} new jobs matched "${filterName}"`,
    body: jobs.slice(0, 3).map(j => j.title).join('\n'),
  }).show();
}
```

### 5.2 System Tray Integration
**Priority**: 🟢 Medium
**Impact**: Background operation without window

```typescript
// Run scrapes in background
// Show notification badge for new jobs
// Quick actions: pause/resume, view new jobs
```

### 5.3 Job Application Tracking
**Priority**: 🟢 Medium
**Impact**: Complete job search workflow

Add fields:
- Application status: Interested, Applied, Interview, Offer, Rejected
- Application date
- Notes
- Contacts

### 5.4 Export Functionality
**Priority**: 🟢 Low
**Impact**: Data portability

- Export jobs to CSV/JSON
- Export for spreadsheet tracking

### 5.5 Cross-Platform Support
**Priority**: 🟢 Medium
**Impact**: macOS/Linux users

**Current issues**:
- SQLite resolution via `where.exe` (Windows-only)
- Hardcoded paths

**Fix**:
```typescript
function findSqliteBinary(): string {
  if (process.platform === 'win32') {
    return findWithWhere('sqlite3');
  } else {
    // macOS: /usr/bin/sqlite3 or brew install
    // Linux: /usr/bin/sqlite3 or apt install
    return findWithWhich('sqlite3');
  }
}
```

---

## Implementation Priority Matrix

| Phase | Item | Priority | Effort | Impact | Dependency |
|-------|------|----------|--------|--------|------------|
| 1.1 | Smart Wait Strategies | 🔴 Critical | Medium | High | None |
| 1.2 | Infinite Scroll | 🔴 Critical | Medium | High | 1.1 |
| 1.3 | Pagination | 🟡 High | Medium | Medium | 1.1 |
| 2.1 | Workday Adapter | 🔴 Critical | High | Very High | 1.1 |
| 2.2 | iCIMS Adapter | 🟡 High | Medium | High | 1.1 |
| 2.3 | SmartRecruiters API | 🟡 High | Low | High | None |
| 2.4 | Ashby GraphQL | 🟢 Medium | Low | Medium | None |
| 3.1 | Salary Extraction | 🟡 High | Medium | High | None |
| 3.2 | Location Normalization | 🟢 Medium | Low | Medium | None |
| 4.1 | Request Caching | 🟡 High | Medium | Medium | None |
| 4.2 | Circuit Breaker | 🟢 Medium | Low | Medium | None |
| 5.1 | Desktop Notifications | 🟡 High | Low | High | None |
| 5.2 | System Tray | 🟢 Medium | Medium | Medium | 5.1 |
| 5.3 | Application Tracking | 🟢 Medium | Medium | Medium | None |
| 5.5 | Cross-Platform | 🟢 Medium | Medium | Medium | None |

---

## Recommended Implementation Order

### Sprint 1: Browser Automation Fixes (Highest ROI)
1. Smart wait strategies with platform-specific selectors
2. Infinite scroll handling
3. Test against Workday, iCIMS, SmartRecruiters

### Sprint 2: API-Based Adapters (Quick Wins)
1. SmartRecruiters public API
2. Ashby GraphQL API
3. Verify Lever adapter works

### Sprint 3: Data Quality
1. Salary extraction from descriptions
2. Location normalization
3. Request caching

### Sprint 4: User Experience
1. Desktop notifications for new matched jobs
2. System tray for background operation
3. Application status tracking

### Sprint 5: Platform & Resilience
1. Cross-platform SQLite resolution
2. Circuit breaker pattern
3. User-agent rotation

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Working source types | 2/16 (12.5%) | 12/16 (75%) |
| Salary extraction rate | 0% | 60%+ |
| Jobs captured per scrape | First page only | All pages |
| Scrape success rate | Unknown | 90%+ |
| Time to job alert | Manual check | < 30 minutes |

---

## Technical Debt to Address

1. **Test Coverage**: Browser automation is untested; add Playwright/Puppeteer test suite
2. **Error Messages**: Improve user-facing error descriptions
3. **Logging**: Add structured logging for debugging scrape failures
4. **Type Safety**: Some `any` types in scraper code need proper typing
5. **Documentation**: API adapter implementations need inline documentation

---

## Out of Scope (Confirm with User)

- AI-assisted job matching/recommendations
- Resume parsing/matching
- Auto-apply functionality
- Multi-user/team features
- Cloud sync
