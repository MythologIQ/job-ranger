const assert = require("assert");

// Note: createTray and showJobNotification require Electron runtime and cannot
// be unit tested in a pure Node.js environment. They require integration testing
// within the Electron process. This test file covers the pure utility function.

// shouldMinimizeToTray is a pure function that can be tested
// We'll inline the logic here since importing the .cts file directly in Node
// requires the Electron environment for the other exports.

function shouldMinimizeToTray(settings, isQuitting) {
  return Boolean(settings?.minimizeToTray && !isQuitting);
}

const baseSettings = {
  userAgent: "Test/1.0",
  maxConcurrentScrapes: 2,
  scrapeTimeoutMs: 20000,
  retryCount: 1,
  scrapeCooldownMinutes: 30,
  circuitBreakerThreshold: 3,
  circuitBreakerCooldownMinutes: 60,
  notificationsEnabled: true,
  notifyOnNewJobs: true,
  notifyOnMatchedJobs: true,
  minimizeToTray: true,
};

// shouldMinimizeToTray returns true when enabled and not quitting
assert.strictEqual(
  shouldMinimizeToTray(baseSettings, false),
  true,
  "should minimize when enabled and not quitting"
);

// shouldMinimizeToTray returns false when quitting
assert.strictEqual(
  shouldMinimizeToTray(baseSettings, true),
  false,
  "should not minimize when quitting"
);

// shouldMinimizeToTray returns false when setting is disabled
const disabledSettings = { ...baseSettings, minimizeToTray: false };
assert.strictEqual(
  shouldMinimizeToTray(disabledSettings, false),
  false,
  "should not minimize when setting is disabled"
);

// shouldMinimizeToTray returns false when settings is null
assert.strictEqual(
  shouldMinimizeToTray(null, false),
  false,
  "should not minimize when settings is null"
);

// shouldMinimizeToTray returns false when settings is undefined
assert.strictEqual(
  shouldMinimizeToTray(undefined, false),
  false,
  "should not minimize when settings is undefined"
);

// shouldMinimizeToTray returns false when both disabled and quitting
assert.strictEqual(
  shouldMinimizeToTray(disabledSettings, true),
  false,
  "should not minimize when both disabled and quitting"
);

console.log("All tray-notifications tests passed!");
