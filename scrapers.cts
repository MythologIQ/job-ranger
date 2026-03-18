import type { CompanySourceType } from "./contracts.cjs";
import { greenhouseAdapter } from "./adapters/greenhouse.cjs";
import { leverAdapter } from "./adapters/lever.cjs";
import { smartrecruitersAdapter } from "./adapters/smartrecruiters.cjs";
import { ashbyAdapter } from "./adapters/ashby.cjs";
import { createGenericHtmlAdapter, browserRequiredAdapter } from "./adapters/generic-html.cjs";
import { toSnippet, extractJobsFromHtml } from "./extractors.cjs";
import { PLATFORM_SELECTORS, getSelectorsForSource } from "./platform-selectors.cjs";
import { parseSalary } from "./salary-parser.cjs";

export { toSnippet, extractJobsFromHtml, PLATFORM_SELECTORS, getSelectorsForSource, parseSalary };

export const genericHtmlSourceTypes = [
  "workday",
  "icims",
  "bamboohr",
  "taleo",
  "oracle",
  "microsoft",
  "generic-html",
] as const;

export interface ScrapedJob {
  sourceJobId: string;
  sourceType: CompanySourceType;
  title: string;
  location: string;
  employmentType: string | null;
  url: string;
  descriptionSnippet: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryText: string | null;
  postDate: string | null;
}

export interface ScraperContext {
  fetchImpl: typeof fetch;
  userAgent: string;
  timeoutMs: number;
  retryCount: number;
  loadPageHtml?: (url: string) => Promise<string>;
}

export interface SourceDetectionResult {
  sourceType: CompanySourceType;
  sourceIdentifier: string | null;
}

export interface ScraperAdapter {
  readonly sourceType: Exclude<CompanySourceType, "unsupported">;
  scrape: (sourceIdentifier: string, context: ScraperContext) => Promise<ScrapedJob[]>;
}

function normalizeToken(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/^\/+|\/+$/g, "");
  return normalized.length > 0 ? normalized : null;
}

export function normalizeUrl(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).toString();
  } catch {
    return null;
  }
}

function looksLikeCareersPath(pathname: string): boolean {
  return /\b(career|careers|jobs?|job-search|join-us|opportunit|opening|recruit)/i.test(pathname);
}

function isKnownBrowserPortal(host: string): boolean {
  return (
    host.includes("linkedin.com") ||
    host.includes("indeed.com") ||
    host.includes("glassdoor.com") ||
    host.includes("monster.com")
  );
}

export function detectSourceFromUrl(rawUrl: string): SourceDetectionResult {
  try {
    const parsed = new URL(rawUrl);
    const normalizedUrl = parsed.toString();
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    const segments = parsed.pathname.split("/").filter(Boolean);
    const firstSegment = normalizeToken(segments[0]);

    if (firstSegment && (host === "boards.greenhouse.io" || host === "job-boards.greenhouse.io")) {
      return { sourceType: "greenhouse", sourceIdentifier: firstSegment };
    }
    if (firstSegment && (host === "jobs.lever.co" || host === "jobs.eu.lever.co")) {
      return { sourceType: "lever", sourceIdentifier: firstSegment };
    }
    if (host === "careers.microsoft.com" ||
        (host.endsWith(".microsoft.com") && (host.startsWith("careers.") || looksLikeCareersPath(pathname)))) {
      return { sourceType: "microsoft", sourceIdentifier: normalizedUrl };
    }
    if (host.includes("myworkdayjobs.com") || host.includes("workday.com")) {
      return { sourceType: "workday", sourceIdentifier: normalizedUrl };
    }
    if (host.includes("icims.com")) {
      return { sourceType: "icims", sourceIdentifier: normalizedUrl };
    }
    if (host.includes("smartrecruiters.com")) {
      return { sourceType: "smartrecruiters", sourceIdentifier: normalizedUrl };
    }
    if (host.endsWith("ashbyhq.com")) {
      return { sourceType: "ashby", sourceIdentifier: normalizedUrl };
    }
    if (host.includes("bamboohr.com")) {
      return { sourceType: "bamboohr", sourceIdentifier: normalizedUrl };
    }
    if (host.includes("taleo.net") || host.includes("oraclecloud.com")) {
      return { sourceType: "taleo", sourceIdentifier: normalizedUrl };
    }
    if (host.endsWith("oracle.com") && (looksLikeCareersPath(pathname) || pathname.startsWith("/careers"))) {
      return { sourceType: "oracle", sourceIdentifier: normalizedUrl };
    }
    if (isKnownBrowserPortal(host)) {
      return { sourceType: "browser-required", sourceIdentifier: normalizedUrl };
    }
    if (host.startsWith("careers.") || looksLikeCareersPath(pathname)) {
      return { sourceType: "generic-html", sourceIdentifier: normalizedUrl };
    }
  } catch {
    return { sourceType: "unsupported", sourceIdentifier: null };
  }
  return { sourceType: "unsupported", sourceIdentifier: null };
}


export async function fetchJson<T>(url: string, context: ScraperContext): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= context.retryCount; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), context.timeoutMs);
    try {
      const response = await context.fetchImpl(url, {
        headers: { Accept: "application/json", "User-Agent": context.userAgent },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} while fetching ${url}`);
      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

async function fetchText(url: string, context: ScraperContext): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= context.retryCount; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), context.timeoutMs);
    try {
      const response = await context.fetchImpl(url, {
        headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": context.userAgent },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} while fetching ${url}`);
      return await response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`);
}


export async function extractJobsFromRemotePage(
  url: string,
  sourceType: CompanySourceType,
  context: ScraperContext,
  preferBrowser = false,
): Promise<ScrapedJob[]> {
  const loaders: Array<() => Promise<string>> = [];
  if (preferBrowser && context.loadPageHtml) loaders.push(() => context.loadPageHtml!(url));
  loaders.push(() => fetchText(url, context));
  if (!preferBrowser && context.loadPageHtml) loaders.push(() => context.loadPageHtml!(url));

  let lastError: Error | null = null;
  for (const loadHtml of loaders) {
    try {
      const html = await loadHtml();
      const jobs = extractJobsFromHtml(url, html, sourceType);
      if (jobs.length > 0) return jobs;
      lastError = new Error("No job listings extracted. A dedicated adapter may be required.");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  throw lastError ?? new Error("Failed to extract job listings from the source page.");
}

export const scraperAdapters: Record<Exclude<CompanySourceType, "unsupported">, ScraperAdapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  smartrecruiters: smartrecruitersAdapter,
  ashby: ashbyAdapter,
  workday: createGenericHtmlAdapter("workday"),
  icims: createGenericHtmlAdapter("icims"),
  bamboohr: createGenericHtmlAdapter("bamboohr"),
  taleo: createGenericHtmlAdapter("taleo"),
  oracle: createGenericHtmlAdapter("oracle"),
  microsoft: createGenericHtmlAdapter("microsoft", true),
  "generic-html": createGenericHtmlAdapter("generic-html"),
  "browser-required": browserRequiredAdapter,
};
