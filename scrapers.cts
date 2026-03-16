import type { CompanySourceType } from "./contracts.cjs";

const genericHtmlSourceTypes = [
  "workday",
  "icims",
  "smartrecruiters",
  "ashby",
  "bamboohr",
  "taleo",
  "oracle",
  "microsoft",
  "generic-html",
] as const;

type RunnableSourceType = Exclude<CompanySourceType, "unsupported">;

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
  readonly sourceType: RunnableSourceType;
  scrape: (sourceIdentifier: string, context: ScraperContext) => Promise<ScrapedJob[]>;
}

function normalizeToken(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().replace(/^\/+|\/+$/g, "");
  return normalized.length > 0 ? normalized : null;
}

function normalizeUrl(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).toString();
  } catch {
    return null;
  }
}

function looksLikeCareersPath(pathname: string): boolean {
  return /\b(career|careers|jobs?|job-search|join-us|opportunit|opening|recruit)/i.test(
    pathname,
  );
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

    if (
      firstSegment &&
      (host === "boards.greenhouse.io" || host === "job-boards.greenhouse.io")
    ) {
      return {
        sourceType: "greenhouse",
        sourceIdentifier: firstSegment,
      };
    }

    if (firstSegment && (host === "jobs.lever.co" || host === "jobs.eu.lever.co")) {
      return {
        sourceType: "lever",
        sourceIdentifier: firstSegment,
      };
    }

    if (
      host === "careers.microsoft.com" ||
      (host.endsWith(".microsoft.com") && (host.startsWith("careers.") || looksLikeCareersPath(pathname)))
    ) {
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

function stripHtml(html: string | null | undefined): string {
  if (!html) {
    return "";
  }

  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function toSnippet(value: string | null | undefined): string {
  const stripped = stripHtml(value);
  if (stripped.length <= 220) {
    return stripped;
  }
  return `${stripped.slice(0, 217).trimEnd()}...`;
}

async function fetchJson<T>(url: string, context: ScraperContext): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= context.retryCount; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), context.timeoutMs);

    try {
      const response = await context.fetchImpl(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": context.userAgent,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} while fetching ${url}`);
      }

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
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": context.userAgent,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} while fetching ${url}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

function absoluteUrl(baseUrl: string, href: string): string | null {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function normalizeJobTitle(value: string): string {
  return stripHtml(value)
    .replace(/\s+/g, " ")
    .trim();
}

function slugFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

function collectJobPostingNodes(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectJobPostingNodes(entry));
  }

  if (typeof value !== "object" || value === null) {
    return [];
  }

  const record = value as Record<string, unknown>;
  const nodeType = record["@type"];
  const graph = record["@graph"];
  const collected = graph ? collectJobPostingNodes(graph) : [];

  if (nodeType === "JobPosting") {
    return [record, ...collected];
  }

  return Object.values(record).flatMap((entry) => collectJobPostingNodes(entry)).concat(collected);
}

function extractJsonLdJobs(baseUrl: string, html: string, sourceType: CompanySourceType): ScrapedJob[] {
  const jobs: ScrapedJob[] = [];
  const seenUrls = new Set<string>();
  const scriptPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(scriptPattern)) {
    const rawBlock = match[1]?.trim();
    if (!rawBlock) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawBlock) as unknown;
      const postings = collectJobPostingNodes(parsed);
      for (const posting of postings) {
        const title = typeof posting.title === "string" ? posting.title.trim() : "";
        const jobUrlRaw = typeof posting.url === "string" ? posting.url : baseUrl;
        const jobUrl = absoluteUrl(baseUrl, jobUrlRaw);
        if (!title || !jobUrl || seenUrls.has(jobUrl)) {
          continue;
        }

        const locationValue = posting.jobLocation;
        let location = "Unspecified";
        if (Array.isArray(locationValue) && locationValue.length > 0) {
          const firstLocation = locationValue[0] as Record<string, unknown>;
          const address = firstLocation.address as Record<string, unknown> | undefined;
          const parts = [
            typeof address?.addressLocality === "string" ? address.addressLocality : null,
            typeof address?.addressRegion === "string" ? address.addressRegion : null,
            typeof address?.addressCountry === "string" ? address.addressCountry : null,
          ].filter((part): part is string => Boolean(part));
          if (parts.length > 0) {
            location = parts.join(", ");
          }
        }

        const description = typeof posting.description === "string" ? posting.description : "";
        const employmentType =
          typeof posting.employmentType === "string" ? posting.employmentType : null;
        const postDate =
          typeof posting.datePosted === "string" ? posting.datePosted : null;

        jobs.push({
          sourceJobId:
            typeof posting.identifier === "string"
              ? posting.identifier
              : slugFromUrl(jobUrl),
          sourceType,
          title,
          location,
          employmentType,
          url: jobUrl,
          descriptionSnippet: toSnippet(description),
          salaryMin: null,
          salaryMax: null,
          salaryCurrency: null,
          salaryText: null,
          postDate,
        });
        seenUrls.add(jobUrl);
      }
    } catch {
      continue;
    }
  }

  return jobs;
}

function isLikelyJobLink(url: string, title: string): boolean {
  const haystack = `${url} ${title}`.toLowerCase();
  const hasPositiveSignal = /(job|career|position|opening|opportunit|requisition|posting|vacanc|role)/.test(
    haystack,
  );
  const hasNegativeSignal = /(benefit|culture|blog|news|investor|privacy|cookie|login|sign-?in|faq|alert|search all jobs)/.test(
    haystack,
  );
  return hasPositiveSignal && !hasNegativeSignal;
}

function extractAnchorJobs(baseUrl: string, html: string, sourceType: CompanySourceType): ScrapedJob[] {
  const jobs: ScrapedJob[] = [];
  const seenUrls = new Set<string>();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const href = match[1];
    const title = normalizeJobTitle(match[2] ?? "");
    const jobUrl = absoluteUrl(baseUrl, href);

    if (!jobUrl || title.length < 3 || seenUrls.has(jobUrl)) {
      continue;
    }

    if (!isLikelyJobLink(jobUrl, title)) {
      continue;
    }

    jobs.push({
      sourceJobId: slugFromUrl(jobUrl),
      sourceType,
      title,
      location: "Unspecified",
      employmentType: null,
      url: jobUrl,
      descriptionSnippet: `Extracted from ${new URL(baseUrl).hostname}`,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryText: null,
      postDate: null,
    });
    seenUrls.add(jobUrl);
  }

  return jobs;
}

function mergeJobs(primary: ScrapedJob[], secondary: ScrapedJob[]): ScrapedJob[] {
  const merged = [...primary];
  const seenIds = new Set(primary.map((job) => job.sourceJobId));

  for (const job of secondary) {
    if (seenIds.has(job.sourceJobId)) {
      continue;
    }
    merged.push(job);
    seenIds.add(job.sourceJobId);
  }

  return merged;
}

export function extractJobsFromHtml(
  baseUrl: string,
  html: string,
  sourceType: CompanySourceType,
): ScrapedJob[] {
  const jsonLdJobs = extractJsonLdJobs(baseUrl, html, sourceType);
  const anchorJobs = extractAnchorJobs(baseUrl, html, sourceType);
  return mergeJobs(jsonLdJobs, anchorJobs).slice(0, 200);
}

async function extractJobsFromRemotePage(
  url: string,
  sourceType: CompanySourceType,
  context: ScraperContext,
  preferBrowser = false,
): Promise<ScrapedJob[]> {
  const loaders: Array<() => Promise<string>> = [];

  if (preferBrowser && context.loadPageHtml) {
    loaders.push(() => context.loadPageHtml!(url));
  }

  loaders.push(() => fetchText(url, context));

  if (!preferBrowser && context.loadPageHtml) {
    loaders.push(() => context.loadPageHtml!(url));
  }

  let lastError: Error | null = null;

  for (const loadHtml of loaders) {
    try {
      const html = await loadHtml();
      const jobs = extractJobsFromHtml(url, html, sourceType);
      if (jobs.length > 0) {
        return jobs;
      }
      lastError = new Error(
        "No job listings were extracted from this page. A dedicated adapter may still be required.",
      );
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("Failed to extract job listings from the source page.");
}

interface GreenhouseResponse {
  jobs: Array<{
    id: number;
    title: string;
    location?: { name?: string };
    absolute_url: string;
    content?: string;
    updated_at?: string;
  }>;
}

const greenhouseAdapter: ScraperAdapter = {
  sourceType: "greenhouse",
  async scrape(sourceIdentifier, context) {
    const response = await fetchJson<GreenhouseResponse>(
      `https://boards-api.greenhouse.io/v1/boards/${sourceIdentifier}/jobs?content=true`,
      context,
    );

    return response.jobs.map((job) => ({
      sourceJobId: String(job.id),
      sourceType: "greenhouse",
      title: job.title.trim(),
      location: job.location?.name?.trim() || "Unspecified",
      employmentType: null,
      url: job.absolute_url,
      descriptionSnippet: toSnippet(job.content),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryText: null,
      postDate: job.updated_at ?? null,
    }));
  },
};

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  descriptionPlain?: string;
  description?: string;
  categories?: {
    location?: string;
    commitment?: string;
  };
  createdAt?: number;
}

const leverAdapter: ScraperAdapter = {
  sourceType: "lever",
  async scrape(sourceIdentifier, context) {
    const response = await fetchJson<LeverPosting[]>(
      `https://api.lever.co/v0/postings/${sourceIdentifier}?mode=json`,
      context,
    );

    return response.map((job) => ({
      sourceJobId: job.id,
      sourceType: "lever",
      title: job.text.trim(),
      location: job.categories?.location?.trim() || "Unspecified",
      employmentType: job.categories?.commitment?.trim() || null,
      url: job.hostedUrl,
      descriptionSnippet: toSnippet(job.descriptionPlain ?? job.description),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryText: null,
      postDate: job.createdAt ? new Date(job.createdAt).toISOString() : null,
    }));
  },
};

function createGenericHtmlAdapter(
  sourceType: (typeof genericHtmlSourceTypes)[number],
  preferBrowser = false,
): ScraperAdapter {
  return {
    sourceType,
    async scrape(sourceIdentifier, context) {
      const normalizedUrl = normalizeUrl(sourceIdentifier);
      if (!normalizedUrl) {
        throw new Error(`Invalid source URL for ${sourceType}`);
      }

      return extractJobsFromRemotePage(normalizedUrl, sourceType, context, preferBrowser);
    },
  };
}

const browserRequiredAdapter: ScraperAdapter = {
  sourceType: "browser-required",
  async scrape(sourceIdentifier, context) {
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

export const scraperAdapters: Record<Exclude<CompanySourceType, "unsupported">, ScraperAdapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  workday: createGenericHtmlAdapter("workday"),
  icims: createGenericHtmlAdapter("icims"),
  smartrecruiters: createGenericHtmlAdapter("smartrecruiters"),
  ashby: createGenericHtmlAdapter("ashby"),
  bamboohr: createGenericHtmlAdapter("bamboohr"),
  taleo: createGenericHtmlAdapter("taleo"),
  oracle: createGenericHtmlAdapter("oracle"),
  microsoft: createGenericHtmlAdapter("microsoft", true),
  "generic-html": createGenericHtmlAdapter("generic-html"),
  "browser-required": browserRequiredAdapter,
};
