import type { Company, Settings } from "../../src/shared/contracts.js";

export interface ScrapeGuardResult {
  canScrape: boolean;
  reason: "ok" | "cooldown" | "circuit-open";
  waitUntil: string | null;
}

export function checkScrapeGuard(
  company: Company,
  settings: Settings,
  now: Date = new Date(),
): ScrapeGuardResult {
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

export function shouldOpenCircuit(
  consecutiveFailures: number,
  threshold: number,
): boolean {
  return consecutiveFailures >= threshold;
}

export function calculateCircuitOpenUntil(
  cooldownMinutes: number,
  now: Date = new Date(),
): string {
  return new Date(now.getTime() + cooldownMinutes * 60 * 1000).toISOString();
}
