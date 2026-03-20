"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.greenhouseAdapter = void 0;
const scrapers_cjs_1 = require("../scrapers.cjs");
exports.greenhouseAdapter = {
    sourceType: "greenhouse",
    async scrape(sourceIdentifier, context) {
        const response = await (0, scrapers_cjs_1.fetchJson)(`https://boards-api.greenhouse.io/v1/boards/${sourceIdentifier}/jobs?content=true`, context);
        return response.jobs.map((job) => {
            const salary = (0, scrapers_cjs_1.parseSalary)(job.content);
            return {
                sourceJobId: String(job.id),
                sourceType: "greenhouse",
                title: job.title.trim(),
                location: job.location?.name?.trim() || "Unspecified",
                employmentType: null,
                url: job.absolute_url,
                descriptionSnippet: (0, scrapers_cjs_1.toSnippet)(job.content),
                salaryMin: salary?.min ?? null,
                salaryMax: salary?.max ?? null,
                salaryCurrency: salary?.currency ?? null,
                salaryText: salary?.raw ?? null,
                postDate: job.updated_at ?? null,
            };
        });
    },
};
