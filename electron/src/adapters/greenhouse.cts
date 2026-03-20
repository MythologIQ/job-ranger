import type { ScraperAdapter, ScraperContext, ScrapedJob } from "../scrapers.cjs";
import { fetchJson, toSnippet, parseSalary } from "../scrapers.cjs";

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

export const greenhouseAdapter: ScraperAdapter = {
  sourceType: "greenhouse",
  async scrape(sourceIdentifier: string, context: ScraperContext): Promise<ScrapedJob[]> {
    const response = await fetchJson<GreenhouseResponse>(
      `https://boards-api.greenhouse.io/v1/boards/${sourceIdentifier}/jobs?content=true`,
      context,
    );

    return response.jobs.map((job) => {
      const salary = parseSalary(job.content);
      return {
        sourceJobId: String(job.id),
        sourceType: "greenhouse",
        title: job.title.trim(),
        location: job.location?.name?.trim() || "Unspecified",
        employmentType: null,
        url: job.absolute_url,
        descriptionSnippet: toSnippet(job.content),
        salaryMin: salary?.min ?? null,
        salaryMax: salary?.max ?? null,
        salaryCurrency: salary?.currency ?? null,
        salaryText: salary?.raw ?? null,
        postDate: job.updated_at ?? null,
      };
    });
  },
};
