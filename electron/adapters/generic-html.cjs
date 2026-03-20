"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.browserRequiredAdapter = void 0;
exports.createGenericHtmlAdapter = createGenericHtmlAdapter;
const scrapers_cjs_1 = require("../scrapers.cjs");
function createGenericHtmlAdapter(sourceType, preferBrowser = false) {
    return {
        sourceType,
        async scrape(sourceIdentifier, context) {
            const normalizedUrl = (0, scrapers_cjs_1.normalizeUrl)(sourceIdentifier);
            if (!normalizedUrl) {
                throw new Error(`Invalid source URL for ${sourceType}`);
            }
            return (0, scrapers_cjs_1.extractJobsFromRemotePage)(normalizedUrl, sourceType, context, preferBrowser);
        },
    };
}
exports.browserRequiredAdapter = {
    sourceType: "browser-required",
    async scrape(sourceIdentifier, context) {
        const normalizedUrl = (0, scrapers_cjs_1.normalizeUrl)(sourceIdentifier);
        if (!normalizedUrl) {
            throw new Error("Invalid source URL for browser-backed extraction.");
        }
        if (!context.loadPageHtml) {
            throw new Error("Browser-backed extraction is not available in this environment.");
        }
        return (0, scrapers_cjs_1.extractJobsFromRemotePage)(normalizedUrl, "browser-required", context, true);
    },
};
