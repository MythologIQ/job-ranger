const assert = require("assert");
const {
  checkScrapeGuard,
  shouldOpenCircuit,
  calculateCircuitOpenUntil,
} = require("../electron/scrape-guard.cjs");

const baseSettings = {
  userAgent: "Test/1.0",
  maxConcurrentScrapes: 2,
  scrapeTimeoutMs: 20000,
  retryCount: 1,
  scrapeCooldownMinutes: 30,
  circuitBreakerThreshold: 3,
  circuitBreakerCooldownMinutes: 60,
};

const baseCompany = {
  id: "1",
  name: "Test Co",
  url: "https://example.com",
  sourceType: "greenhouse",
  sourceIdentifier: "test",
  frequencyMinutes: 60,
  isActive: true,
  lastRunAt: null,
  lastRunStatus: "idle",
  lastErrorMessage: null,
  consecutiveFailures: 0,
  circuitOpenUntil: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

// checkScrapeGuard returns "ok" for fresh company
const freshResult = checkScrapeGuard(baseCompany, baseSettings);
assert.strictEqual(freshResult.canScrape, true);
assert.strictEqual(freshResult.reason, "ok");
assert.strictEqual(freshResult.waitUntil, null);

// checkScrapeGuard returns "cooldown" when within cooldown period
const recentSuccess = {
  ...baseCompany,
  lastRunAt: new Date().toISOString(),
  lastRunStatus: "success",
};
const cooldownResult = checkScrapeGuard(recentSuccess, baseSettings);
assert.strictEqual(cooldownResult.canScrape, false);
assert.strictEqual(cooldownResult.reason, "cooldown");
assert.ok(cooldownResult.waitUntil !== null);

// checkScrapeGuard returns "circuit-open" when circuit is open
const futureTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const circuitOpen = {
  ...baseCompany,
  circuitOpenUntil: futureTime,
};
const circuitResult = checkScrapeGuard(circuitOpen, baseSettings);
assert.strictEqual(circuitResult.canScrape, false);
assert.strictEqual(circuitResult.reason, "circuit-open");
assert.strictEqual(circuitResult.waitUntil, futureTime);

// checkScrapeGuard allows scrape after cooldown expires
const pastTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const expiredCooldown = {
  ...baseCompany,
  lastRunAt: pastTime,
  lastRunStatus: "success",
};
const expiredResult = checkScrapeGuard(expiredCooldown, baseSettings);
assert.strictEqual(expiredResult.canScrape, true);
assert.strictEqual(expiredResult.reason, "ok");

// checkScrapeGuard allows scrape after circuit closes
const expiredCircuit = {
  ...baseCompany,
  circuitOpenUntil: pastTime,
};
const closedResult = checkScrapeGuard(expiredCircuit, baseSettings);
assert.strictEqual(closedResult.canScrape, true);
assert.strictEqual(closedResult.reason, "ok");

// shouldOpenCircuit returns true when threshold reached
assert.strictEqual(shouldOpenCircuit(3, 3), true);
assert.strictEqual(shouldOpenCircuit(5, 3), true);

// shouldOpenCircuit returns false below threshold
assert.strictEqual(shouldOpenCircuit(0, 3), false);
assert.strictEqual(shouldOpenCircuit(2, 3), false);

// calculateCircuitOpenUntil returns correct future timestamp
const now = new Date("2026-03-18T12:00:00Z");
const openUntil = calculateCircuitOpenUntil(60, now);
assert.strictEqual(openUntil, "2026-03-18T13:00:00.000Z");

console.log("All scrape-guard tests passed!");
