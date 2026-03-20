import type { ScraperAdapter, ScraperContext, ScrapedJob } from "../scrapers.cjs";
import { fetchJson, toSnippet } from "../scrapers.cjs";

interface AshbyJob {
  id: string;
  title: string;
  location: string;
  department?: string;
  employmentType?: string;
  descriptionPlain?: string;
  publishedAt?: string;
  jobUrl: string;
  compensation?: {
    compensationTierSummary?: string;
  };
}

interface AshbyResponse {
  apiVersion: string;
  jobs: AshbyJob[];
}

export const ashbyAdapter: ScraperAdapter = {
  sourceType: "ashby",
  async scrape(sourceIdentifier: string, context: ScraperContext): Promise<ScrapedJob[]> {
    const boardName = extractBoardName(sourceIdentifier);
    const response = await fetchJson<AshbyResponse>(
      `https://api.ashbyhq.com/posting-api/job-board/${boardName}?includeCompensation=true`,
      context,
    );

    return response.jobs.map((job) => ({
      sourceJobId: job.id,
      sourceType: "ashby",
      title: job.title.trim(),
      location: job.location?.trim() || "Unspecified",
      employmentType: job.employmentType ?? null,
      url: job.jobUrl,
      descriptionSnippet: toSnippet(job.descriptionPlain),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryText: job.compensation?.compensationTierSummary ?? null,
      postDate: job.publishedAt ?? null,
    }));
  },
};

function extractBoardName(urlOrName: string): string {
  try {
    const url = new URL(urlOrName);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments[0] ?? urlOrName;
  } catch {
    return urlOrName;
  }
}
