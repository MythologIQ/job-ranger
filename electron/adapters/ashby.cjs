"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ashbyAdapter = void 0;
const scrapers_cjs_1 = require("../scrapers.cjs");
exports.ashbyAdapter = {
    sourceType: "ashby",
    async scrape(sourceIdentifier, context) {
        const boardName = extractBoardName(sourceIdentifier);
        const response = await (0, scrapers_cjs_1.fetchJson)(`https://api.ashbyhq.com/posting-api/job-board/${boardName}?includeCompensation=true`, context);
        return response.jobs.map((job) => ({
            sourceJobId: job.id,
            sourceType: "ashby",
            title: job.title.trim(),
            location: job.location?.trim() || "Unspecified",
            employmentType: job.employmentType ?? null,
            url: job.jobUrl,
            descriptionSnippet: (0, scrapers_cjs_1.toSnippet)(job.descriptionPlain),
            salaryMin: null,
            salaryMax: null,
            salaryCurrency: null,
            salaryText: job.compensation?.compensationTierSummary ?? null,
            postDate: job.publishedAt ?? null,
        }));
    },
};
function extractBoardName(urlOrName) {
    try {
        const url = new URL(urlOrName);
        const segments = url.pathname.split("/").filter(Boolean);
        return segments[0] ?? urlOrName;
    }
    catch {
        return urlOrName;
    }
}
