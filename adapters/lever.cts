import type { ScraperAdapter, ScraperContext, ScrapedJob } from "../scrapers.cjs";
import { fetchJson, toSnippet, parseSalary } from "../scrapers.cjs";

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

export const leverAdapter: ScraperAdapter = {
  sourceType: "lever",
  async scrape(sourceIdentifier: string, context: ScraperContext): Promise<ScrapedJob[]> {
    const response = await fetchJson<LeverPosting[]>(
      `https://api.lever.co/v0/postings/${sourceIdentifier}?mode=json`,
      context,
    );

    return response.map((job) => {
      const description = job.descriptionPlain ?? job.description;
      const salary = parseSalary(description);
      return {
        sourceJobId: job.id,
        sourceType: "lever",
        title: job.text.trim(),
        location: job.categories?.location?.trim() || "Unspecified",
        employmentType: job.categories?.commitment?.trim() || null,
        url: job.hostedUrl,
        descriptionSnippet: toSnippet(description),
        salaryMin: salary?.min ?? null,
        salaryMax: salary?.max ?? null,
        salaryCurrency: salary?.currency ?? null,
        salaryText: salary?.raw ?? null,
        postDate: job.createdAt ? new Date(job.createdAt).toISOString() : null,
      };
    });
  },
};
