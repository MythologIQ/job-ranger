import type { ScraperAdapter, ScraperContext, ScrapedJob } from "../scrapers.cjs";
import { fetchJson } from "../scrapers.cjs";

interface SmartRecruitersPosting {
  id: string;
  uuid: string;
  name: string;
  refNumber?: string;
  company?: { identifier: string; name: string };
  location?: { city?: string; region?: string; country?: string; remote?: boolean };
  department?: { label?: string };
  releasedDate?: string;
  experienceLevel?: { label?: string };
}

interface SmartRecruitersResponse {
  content: SmartRecruitersPosting[];
  totalFound: number;
}

export const smartrecruitersAdapter: ScraperAdapter = {
  sourceType: "smartrecruiters",
  async scrape(sourceIdentifier: string, context: ScraperContext): Promise<ScrapedJob[]> {
    const companyId = extractCompanyId(sourceIdentifier);
    const response = await fetchJson<SmartRecruitersResponse>(
      `https://api.smartrecruiters.com/v1/companies/${companyId}/postings?limit=100`,
      context,
    );

    return response.content.map((job) => ({
      sourceJobId: job.uuid,
      sourceType: "smartrecruiters",
      title: job.name.trim(),
      location: formatLocation(job.location),
      employmentType: job.experienceLevel?.label ?? null,
      url: `https://jobs.smartrecruiters.com/${companyId}/${job.uuid}`,
      descriptionSnippet: "",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryText: null,
      postDate: job.releasedDate ?? null,
    }));
  },
};

function extractCompanyId(urlOrId: string): string {
  try {
    const url = new URL(urlOrId);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments[0] ?? urlOrId;
  } catch {
    return urlOrId;
  }
}

function formatLocation(loc?: SmartRecruitersPosting["location"]): string {
  if (!loc) return "Unspecified";
  const parts = [loc.city, loc.region, loc.country].filter(Boolean);
  if (loc.remote) parts.push("Remote");
  return parts.join(", ") || "Unspecified";
}
