"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leverAdapter = void 0;
const scrapers_cjs_1 = require("../scrapers.cjs");
exports.leverAdapter = {
    sourceType: "lever",
    async scrape(sourceIdentifier, context) {
        const response = await (0, scrapers_cjs_1.fetchJson)(`https://api.lever.co/v0/postings/${sourceIdentifier}?mode=json`, context);
        return response.map((job) => {
            const description = job.descriptionPlain ?? job.description;
            const salary = (0, scrapers_cjs_1.parseSalary)(description);
            return {
                sourceJobId: job.id,
                sourceType: "lever",
                title: job.text.trim(),
                location: job.categories?.location?.trim() || "Unspecified",
                employmentType: job.categories?.commitment?.trim() || null,
                url: job.hostedUrl,
                descriptionSnippet: (0, scrapers_cjs_1.toSnippet)(description),
                salaryMin: salary?.min ?? null,
                salaryMax: salary?.max ?? null,
                salaryCurrency: salary?.currency ?? null,
                salaryText: salary?.raw ?? null,
                postDate: job.createdAt ? new Date(job.createdAt).toISOString() : null,
            };
        });
    },
};
