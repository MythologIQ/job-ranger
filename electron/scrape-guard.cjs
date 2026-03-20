"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkScrapeGuard = checkScrapeGuard;
exports.shouldOpenCircuit = shouldOpenCircuit;
exports.calculateCircuitOpenUntil = calculateCircuitOpenUntil;
function checkScrapeGuard(company, settings, now = new Date()) {
    if (company.circuitOpenUntil) {
        const openUntil = new Date(company.circuitOpenUntil);
        if (now < openUntil) {
            return { canScrape: false, reason: "circuit-open", waitUntil: company.circuitOpenUntil };
        }
    }
    if (company.lastRunStatus === "success" && company.lastRunAt) {
        const lastRun = new Date(company.lastRunAt);
        const cooldownMs = settings.scrapeCooldownMinutes * 60 * 1000;
        const nextAllowed = new Date(lastRun.getTime() + cooldownMs);
        if (now < nextAllowed) {
            return { canScrape: false, reason: "cooldown", waitUntil: nextAllowed.toISOString() };
        }
    }
    return { canScrape: true, reason: "ok", waitUntil: null };
}
function shouldOpenCircuit(consecutiveFailures, threshold) {
    return consecutiveFailures >= threshold;
}
function calculateCircuitOpenUntil(cooldownMinutes, now = new Date()) {
    return new Date(now.getTime() + cooldownMinutes * 60 * 1000).toISOString();
}
