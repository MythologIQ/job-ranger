# Shadow Genome

This document records failure patterns to prevent repetition.

---

## Failure Entry #1

**Date**: 2026-03-17T00:00:00Z
**Verdict ID**: Entry #2 (GATE TRIBUNAL)
**Failure Mode**: COMPLEXITY_VIOLATION + ORPHAN

### What Failed

Pre-implementation audit of Job Ranger scraper enhancement blueprint. The blueprint itself was sound, but the existing codebase contained violations that would be compounded by new implementation.

### Why It Failed

**Complexity Violations (5 files)**:
- `scrapers.cts` at 589 lines grew organically as adapters were added
- `main.cts` at 558 lines accumulated IPC handlers without extraction
- `AppContext.tsx` at 340 lines combined all state management
- `Companies.tsx` and `Filters.tsx` embedded forms within page components

**Nested Ternaries (3 instances)**:
- Used for conditional class names and template strings
- Appeared clever but violated readability standards

**Orphan Files (4 files)**:
- `useApi.ts`, `useForm.ts`, `animations.ts`, `constants/index.ts`
- Created speculatively but never integrated
- Dead code contributing to cognitive overhead

### Pattern to Avoid

1. **Speculative Abstraction**: Creating utility files before they're needed leads to orphans
2. **Monolithic Growth**: Files that start small can grow beyond limits without active splitting
3. **Clever Ternaries**: Nested ternaries feel concise but fail readability standards
4. **Form-in-Page Anti-Pattern**: Embedding complex forms in page components inflates file size

### Remediation Attempted

Phases 1-4 completed:
1. [x] Delete orphan files - DONE (useApi.ts, useForm.ts, animations.ts, constants/index.ts removed)
2. [x] Split backend files - DONE (validators.cts, browser-loader.cts, adapters/ created)
3. [x] Split frontend context - DONE (useCompanyActions.ts, useFilterActions.ts extracted)
4. [x] Replace nested ternaries - PARTIAL (Modal.tsx, Dashboard.tsx fixed; Companies.tsx missed)
5. [ ] Extract form components - NOT STARTED (Phase 5 was not requested)

---

## Failure Entry #2

**Date**: 2026-03-17T01:00:00Z
**Verdict ID**: Entry #3 (GATE TRIBUNAL Post-Remediation)
**Failure Mode**: INCOMPLETE_REMEDIATION

### What Failed

Re-audit after partial remediation. While 8 of 12 violations were addressed, 4 remain.

### Why It Failed

**Incomplete Scanning**: The nested ternary at Companies.tsx:109-116 was not detected during Phase 2 remediation. It used the same pattern as the fixed violations but was overlooked.

**Phase Scope Limitation**: Phases 1-4 addressed backend splitting and context extraction but did not include Phase 5 (form extraction), which was needed to bring Companies.tsx and Filters.tsx under the 250-line limit.

**Insufficient Backend Split**: scrapers.cts was reduced from 589 to 345 lines but still exceeds limit. The extraction functions (`extractJsonLdJobs`, `extractAnchorJobs`) should have been moved to a separate file.

### Pattern to Avoid

1. **Manual Ternary Scanning**: Grep for the pattern `\? .* \? .* :` but also visually inspect multi-line ternaries that span lines
2. **Incomplete Phase Execution**: When remediation requires multiple phases, estimate which phases are minimally required to clear the gate
3. **Target Overshoot**: When splitting files, aim for 200 lines (80% of limit) to allow for growth

### Remediation Required

1. Fix Companies.tsx:109-116 nested ternary with lookup object
2. Extract CompanyForm.tsx from Companies.tsx
3. Extract FilterForm.tsx from Filters.tsx
4. Extract extractors.cts from scrapers.cts

---

## Failure Entry #3

**Date**: 2026-03-18T00:00:00Z
**Verdict ID**: Entry #8 (GATE TRIBUNAL Phase 1 Verification)
**Failure Mode**: COMPLEXITY_VIOLATION

### What Failed

Phase 1 Browser Automation implementation. The `loadPageHtmlWithOptions` function in `browser-loader.cts` grew to 63 lines during implementation, exceeding the 40-line function limit.

### Why It Failed

**Promise-Based Async Pattern**: The function wraps complex async logic in a Promise executor, which requires:
- Window creation and configuration
- Multiple event handler registrations (`will-navigate`, `did-fail-load`, `did-finish-load`)
- Timeout management
- Cleanup via `finalize()` helper
- Post-load processing (wait for selectors, scroll, extract HTML)

This pattern naturally accumulates lines because all concerns are interleaved in a single function.

**Incremental Growth Blindspot**: The function was at 42 lines before Phase 1, received 21 new lines for smart waits and scroll handling. The violation was introduced during feature addition without splitting.

### Pattern to Avoid

1. **Promise Executor Bloat**: When using `new Promise()` with complex logic, extract the executor body to a named async function
2. **Event Handler Grouping**: Extract event handler setup into a dedicated helper function
3. **Pre-Commit Line Check**: Before claiming implementation complete, verify ALL functions <= 40 lines
4. **Growth Budget**: When adding to existing functions, check if the addition exceeds remaining budget

### Remediation Required

1. Extract post-load processing into `extractHtmlAfterLoad(webContents, options): Promise<string>`
2. Extract event wiring into `setupBrowserWindowEvents(window, handlers): void`
3. Keep `loadPageHtmlWithOptions` as orchestration only (< 25 lines)

---

## Failure Entry #4

**Date**: 2026-03-18T01:00:00Z
**Verdict ID**: Entry #9 (GATE TRIBUNAL V1 Remediation Plan Audit)
**Failure Mode**: PLAN_ARITHMETIC_ERROR

### What Failed

Remediation plan for `loadPageHtmlWithOptions` (plan-v1-remediation.md) contained incorrect line count estimate.

### Why It Failed

**Optimistic Approximation**: The plan claimed the refactored function would be "~40 lines" without doing precise arithmetic:
- Current function: 63 lines
- Lines removed (117-137): 21 lines
- Lines added (new handler): 6 lines
- Actual result: 63 - 21 + 6 = **48 lines**

The "~40" estimate was off by 8 lines (20% error), which is significant when the limit is exactly 40.

**Insufficient Extraction**: The plan correctly identified `extractHtmlAfterLoad` as extractable (16 lines), but failed to account for the remaining overhead in the orchestrator function.

### Pattern to Avoid

1. **Do the Math**: Never use "~" approximations for line counts. Calculate exactly: `current - removed + added`
2. **Buffer for Safety**: When planning refactors, target 80% of limit (32 lines) not 100% (40 lines)
3. **Verify Before Submitting**: Count the lines in the proposed code blocks and verify they add up

### Remediation Required

Revise plan to extract additional logic:
1. Move `finalize` helper to module scope (saves ~9 lines from function body)
2. OR extract event handler setup into helper function
3. Target: ≤35 lines for `loadPageHtmlWithOptions` (not "~40")

---

## Failure Entry #5

**Date**: 2026-03-18T16:00:00Z
**Verdict ID**: Entry #24 (GATE TRIBUNAL Phase 5 Plan)
**Failure Mode**: COMPLEXITY_VIOLATION + MISSING_MIGRATION + INCOMPLETE_PLAN

### What Failed

Phase 5 (Notifications & System Tray) plan submitted with:
1. Pre-existing codebase violation (validators.cts exceeds 250 lines)
2. Projected violation (main.cts would exceed 250 lines after additions)
3. Missing database migration for new Settings fields
4. Unresolved open questions (architectural decisions deferred)

### Why It Failed

**Accumulated Technical Debt**: validators.cts grew to 264 lines during previous phases without being split. The Phase 4 remediation focused on the immediate violations but did not proactively address validators.cts, which was close to the limit.

**Plan-Time Blindspot**: The plan estimated main.cts changes (~40 lines for tray + notifications) without checking that main.cts is already at 217 lines. Simple arithmetic: 217 + 40 = 257 > 250.

**Migration Omission**: The plan adds 4 new boolean fields to Settings (notificationsEnabled, notifyOnNewJobs, notifyOnMatchedJobs, minimizeToTray) but does not specify how these persist. Phase 4 introduced migration v3 for circuit breaker; Phase 5 needs migration v4 for notification settings.

**Deferred Decisions**: The plan explicitly listed "Open Questions" at the top:
1. Notification grouping strategy
2. Tray icon badge behavior

These are implementation-affecting decisions that cannot remain open when submitting for audit.

### Pattern to Avoid

1. **Pre-Flight Size Check**: Before starting a plan, run `wc -l` on all files that will be modified. If any are >200 lines, plan includes remediation.

2. **Migration Accounting**: Any plan that adds fields to persisted interfaces MUST include migration specification. Checklist:
   - Is the interface persisted to SQLite?
   - If yes, add migration entry
   - If no, document why not needed

3. **No Open Questions in Plans**: A plan is not ready for audit if it contains unresolved architectural questions. Either:
   - Resolve them before submitting
   - Submit separate research request to explore options
   - Make a decision and document the rationale

4. **Arithmetic Verification**: When estimating post-change file sizes:
   - Current lines + added lines - removed lines = projected lines
   - If projected > 200, plan extraction to new module
   - If projected > 250, VETO is guaranteed

### Remediation Required

1. Pre-Phase 5: Split validators.cts into domain-specific modules OR extract settings validation
2. Plan revision: Create tray-notifications.cts module (~60 lines) to keep main.cts under limit
3. Add migration v4 to migrations.cts for notification/tray settings columns
4. Resolve open questions:
   - Notification grouping: Single notification per company scrape ("N new jobs at Company")
   - Tray badge: No badge (tooltip only) - defer badge complexity to future phase

---

*Shadow Genome updated. Pattern documented for future avoidance.*
