"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSettingsUpdate = validateSettingsUpdate;
const common_cjs_1 = require("./common.cjs");
function validateSettingsUpdate(rawValue) {
    if (!(0, common_cjs_1.isRecord)(rawValue)) {
        throw new Error("Settings payload must be an object.");
    }
    const update = {};
    const userAgent = (0, common_cjs_1.validateOptionalString)(rawValue.userAgent, "User agent");
    if (userAgent !== undefined) {
        if (!userAgent) {
            throw new Error("User agent cannot be empty.");
        }
        update.userAgent = userAgent;
    }
    if (rawValue.maxConcurrentScrapes !== undefined) {
        update.maxConcurrentScrapes = (0, common_cjs_1.validateFiniteNumber)(rawValue.maxConcurrentScrapes, "Max concurrent scrapes");
    }
    if (rawValue.scrapeTimeoutMs !== undefined) {
        update.scrapeTimeoutMs = (0, common_cjs_1.validateFiniteNumber)(rawValue.scrapeTimeoutMs, "Scrape timeout");
    }
    if (rawValue.retryCount !== undefined) {
        update.retryCount = (0, common_cjs_1.validateFiniteNumber)(rawValue.retryCount, "Retry count");
    }
    if (rawValue.notificationsEnabled !== undefined) {
        update.notificationsEnabled = (0, common_cjs_1.validateOptionalBoolean)(rawValue.notificationsEnabled, "Notifications enabled");
    }
    if (rawValue.notifyOnNewJobs !== undefined) {
        update.notifyOnNewJobs = (0, common_cjs_1.validateOptionalBoolean)(rawValue.notifyOnNewJobs, "Notify on new jobs");
    }
    if (rawValue.notifyOnMatchedJobs !== undefined) {
        update.notifyOnMatchedJobs = (0, common_cjs_1.validateOptionalBoolean)(rawValue.notifyOnMatchedJobs, "Notify on matched jobs");
    }
    if (rawValue.minimizeToTray !== undefined) {
        update.minimizeToTray = (0, common_cjs_1.validateOptionalBoolean)(rawValue.minimizeToTray, "Minimize to tray");
    }
    return update;
}
