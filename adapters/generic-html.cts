import type { ScraperAdapter, ScraperContext, ScrapedJob } from "../scrapers.cjs";
import { extractJobsFromRemotePage, normalizeUrl, genericHtmlSourceTypes } from "../scrapers.cjs";

export function createGenericHtmlAdapter(
  sourceType: (typeof genericHtmlSourceTypes)[number],
  preferBrowser = false,
): ScraperAdapter {
  return {
    sourceType,
    async scrape(sourceIdentifier: string, context: ScraperContext): Promise<ScrapedJob[]> {
      const normalizedUrl = normalizeUrl(sourceIdentifier);
      if (!normalizedUrl) {
        throw new Error(`Invalid source URL for ${sourceType}`);
      }

      return extractJobsFromRemotePage(normalizedUrl, sourceType, context, preferBrowser);
    },
  };
}

export const browserRequiredAdapter: ScraperAdapter = {
  sourceType: "browser-required",
  async scrape(sourceIdentifier: string, context: ScraperContext): Promise<ScrapedJob[]> {
    const normalizedUrl = normalizeUrl(sourceIdentifier);
    if (!normalizedUrl) {
      throw new Error("Invalid source URL for browser-backed extraction.");
    }
    if (!context.loadPageHtml) {
      throw new Error("Browser-backed extraction is not available in this environment.");
    }

    return extractJobsFromRemotePage(normalizedUrl, "browser-required", context, true);
  },
};
