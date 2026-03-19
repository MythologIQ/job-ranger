import type { CompanySourceType } from "../shared/contracts.cjs";

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
  if (!value) {
    return null;
  }

  const normalized = value.trim().replace(/^\/+|\/+$/g, "");
  return normalized.length > 0 ? normalized : null;
}

export function detectSourceFromUrl(rawUrl: string): SourceDetectionResult {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const segments = parsed.pathname.split("/").filter(Boolean);
    const firstSegment = normalizeToken(segments[0]);

    if (host.endsWith("greenhouse.io")) {
      return {
        sourceType: firstSegment ? "greenhouse" : "unsupported",
        sourceIdentifier: firstSegment,
      };
    }

    if (host.endsWith("lever.co")) {
      return {
        sourceType: firstSegment ? "lever" : "unsupported",
        sourceIdentifier: firstSegment,
      };
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

async function fetchJson<T>(
  url: string,
  context: ScraperContext,
): Promise<T> {
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

export const scraperAdapters: Record<
  Exclude<CompanySourceType, "unsupported">,
  ScraperAdapter
> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
};
