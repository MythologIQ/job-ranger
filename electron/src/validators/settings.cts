import type { SettingsUpdate } from "../../../src/shared/contracts.js";
import {
  isRecord,
  validateFiniteNumber,
  validateOptionalBoolean,
  validateOptionalString,
} from "./common.cjs";

export function validateSettingsUpdate(rawValue: unknown): SettingsUpdate {
  if (!isRecord(rawValue)) {
    throw new Error("Settings payload must be an object.");
  }

  const update: SettingsUpdate = {};
  const userAgent = validateOptionalString(rawValue.userAgent, "User agent");
  if (userAgent !== undefined) {
    if (!userAgent) {
      throw new Error("User agent cannot be empty.");
    }
    update.userAgent = userAgent;
  }
  if (rawValue.maxConcurrentScrapes !== undefined) {
    update.maxConcurrentScrapes = validateFiniteNumber(
      rawValue.maxConcurrentScrapes,
      "Max concurrent scrapes",
    );
  }
  if (rawValue.scrapeTimeoutMs !== undefined) {
    update.scrapeTimeoutMs = validateFiniteNumber(
      rawValue.scrapeTimeoutMs,
      "Scrape timeout",
    );
  }
  if (rawValue.retryCount !== undefined) {
    update.retryCount = validateFiniteNumber(rawValue.retryCount, "Retry count");
  }
  if (rawValue.notificationsEnabled !== undefined) {
    update.notificationsEnabled = validateOptionalBoolean(
      rawValue.notificationsEnabled,
      "Notifications enabled",
    );
  }
  if (rawValue.notifyOnNewJobs !== undefined) {
    update.notifyOnNewJobs = validateOptionalBoolean(
      rawValue.notifyOnNewJobs,
      "Notify on new jobs",
    );
  }
  if (rawValue.notifyOnMatchedJobs !== undefined) {
    update.notifyOnMatchedJobs = validateOptionalBoolean(
      rawValue.notifyOnMatchedJobs,
      "Notify on matched jobs",
    );
  }
  if (rawValue.minimizeToTray !== undefined) {
    update.minimizeToTray = validateOptionalBoolean(
      rawValue.minimizeToTray,
      "Minimize to tray",
    );
  }
  return update;
}
