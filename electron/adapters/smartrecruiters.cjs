"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartrecruitersAdapter = void 0;
const scrapers_cjs_1 = require("../scrapers.cjs");
exports.smartrecruitersAdapter = {
    sourceType: "smartrecruiters",
    async scrape(sourceIdentifier, context) {
        const companyId = extractCompanyId(sourceIdentifier);
        const response = await (0, scrapers_cjs_1.fetchJson)(`https://api.smartrecruiters.com/v1/companies/${companyId}/postings?limit=100`, context);
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
function extractCompanyId(urlOrId) {
    try {
        const url = new URL(urlOrId);
        const segments = url.pathname.split("/").filter(Boolean);
        return segments[0] ?? urlOrId;
    }
    catch {
        return urlOrId;
    }
}
function formatLocation(loc) {
    if (!loc)
        return "Unspecified";
    const parts = [loc.city, loc.region, loc.country].filter(Boolean);
    if (loc.remote)
        parts.push("Remote");
    return parts.join(", ") || "Unspecified";
}
