"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scraperAdapters = exports.genericHtmlSourceTypes = exports.parseSalary = exports.getSelectorsForSource = exports.PLATFORM_SELECTORS = exports.extractJobsFromHtml = exports.toSnippet = void 0;
exports.normalizeUrl = normalizeUrl;
exports.detectSourceFromUrl = detectSourceFromUrl;
exports.fetchJson = fetchJson;
exports.extractJobsFromRemotePage = extractJobsFromRemotePage;
const greenhouse_cjs_1 = require("./adapters/greenhouse.cjs");
const lever_cjs_1 = require("./adapters/lever.cjs");
const smartrecruiters_cjs_1 = require("./adapters/smartrecruiters.cjs");
const ashby_cjs_1 = require("./adapters/ashby.cjs");
const generic_html_cjs_1 = require("./adapters/generic-html.cjs");
const extractors_cjs_1 = require("./extractors.cjs");
Object.defineProperty(exports, "toSnippet", { enumerable: true, get: function () { return extractors_cjs_1.toSnippet; } });
Object.defineProperty(exports, "extractJobsFromHtml", { enumerable: true, get: function () { return extractors_cjs_1.extractJobsFromHtml; } });
const platform_selectors_cjs_1 = require("./platform-selectors.cjs");
Object.defineProperty(exports, "PLATFORM_SELECTORS", { enumerable: true, get: function () { return platform_selectors_cjs_1.PLATFORM_SELECTORS; } });
Object.defineProperty(exports, "getSelectorsForSource", { enumerable: true, get: function () { return platform_selectors_cjs_1.getSelectorsForSource; } });
const salary_parser_cjs_1 = require("./salary-parser.cjs");
Object.defineProperty(exports, "parseSalary", { enumerable: true, get: function () { return salary_parser_cjs_1.parseSalary; } });
exports.genericHtmlSourceTypes = [
    "workday",
    "icims",
    "bamboohr",
    "taleo",
    "oracle",
    "microsoft",
    "generic-html",
];
function normalizeToken(value) {
    if (!value)
        return null;
    const normalized = value.trim().replace(/^\/+|\/+$/g, "");
    return normalized.length > 0 ? normalized : null;
}
function normalizeUrl(rawUrl) {
    try {
        return new URL(rawUrl).toString();
    }
    catch {
        return null;
    }
}
function looksLikeCareersPath(pathname) {
    return /\b(career|careers|jobs?|job-search|join-us|opportunit|opening|recruit)/i.test(pathname);
}
function isKnownBrowserPortal(host) {
    return (host.includes("linkedin.com") ||
        host.includes("indeed.com") ||
        host.includes("glassdoor.com") ||
        host.includes("monster.com"));
}
function detectSourceFromUrl(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        const normalizedUrl = parsed.toString();
        const host = parsed.hostname.toLowerCase();
        const pathname = parsed.pathname.toLowerCase();
        const segments = parsed.pathname.split("/").filter(Boolean);
        const firstSegment = normalizeToken(segments[0]);
        if (firstSegment && (host === "boards.greenhouse.io" || host === "job-boards.greenhouse.io")) {
            return { sourceType: "greenhouse", sourceIdentifier: firstSegment };
        }
        if (firstSegment && (host === "jobs.lever.co" || host === "jobs.eu.lever.co")) {
            return { sourceType: "lever", sourceIdentifier: firstSegment };
        }
        if (host === "careers.microsoft.com" ||
            (host.endsWith(".microsoft.com") && (host.startsWith("careers.") || looksLikeCareersPath(pathname)))) {
            return { sourceType: "microsoft", sourceIdentifier: normalizedUrl };
        }
        if (host.includes("myworkdayjobs.com") || host.includes("workday.com")) {
            return { sourceType: "workday", sourceIdentifier: normalizedUrl };
        }
        if (host.includes("icims.com")) {
            return { sourceType: "icims", sourceIdentifier: normalizedUrl };
        }
        if (host.includes("smartrecruiters.com")) {
            return { sourceType: "smartrecruiters", sourceIdentifier: normalizedUrl };
        }
        if (host.endsWith("ashbyhq.com")) {
            return { sourceType: "ashby", sourceIdentifier: normalizedUrl };
        }
        if (host.includes("bamboohr.com")) {
            return { sourceType: "bamboohr", sourceIdentifier: normalizedUrl };
        }
        if (host.includes("taleo.net") || host.includes("oraclecloud.com")) {
            return { sourceType: "taleo", sourceIdentifier: normalizedUrl };
        }
        if (host.endsWith("oracle.com") && (looksLikeCareersPath(pathname) || pathname.startsWith("/careers"))) {
            return { sourceType: "oracle", sourceIdentifier: normalizedUrl };
        }
        if (isKnownBrowserPortal(host)) {
            return { sourceType: "browser-required", sourceIdentifier: normalizedUrl };
        }
        if (host.startsWith("careers.") || looksLikeCareersPath(pathname)) {
            return { sourceType: "generic-html", sourceIdentifier: normalizedUrl };
        }
    }
    catch {
        return { sourceType: "unsupported", sourceIdentifier: null };
    }
    return { sourceType: "unsupported", sourceIdentifier: null };
}
async function fetchJson(url, context) {
    let lastError = null;
    for (let attempt = 0; attempt <= context.retryCount; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), context.timeoutMs);
        try {
            const response = await context.fetchImpl(url, {
                headers: { Accept: "application/json", "User-Agent": context.userAgent },
                signal: controller.signal,
            });
            if (!response.ok)
                throw new Error(`HTTP ${response.status} while fetching ${url}`);
            return (await response.json());
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
        }
        finally {
            clearTimeout(timeout);
        }
    }
    throw lastError ?? new Error(`Failed to fetch ${url}`);
}
async function fetchText(url, context) {
    let lastError = null;
    for (let attempt = 0; attempt <= context.retryCount; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), context.timeoutMs);
        try {
            const response = await context.fetchImpl(url, {
                headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": context.userAgent },
                signal: controller.signal,
            });
            if (!response.ok)
                throw new Error(`HTTP ${response.status} while fetching ${url}`);
            return await response.text();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
        }
        finally {
            clearTimeout(timeout);
        }
    }
    throw lastError ?? new Error(`Failed to fetch ${url}`);
}
async function extractJobsFromRemotePage(url, sourceType, context, preferBrowser = false) {
    const loaders = [];
    if (preferBrowser && context.loadPageHtml)
        loaders.push(() => context.loadPageHtml(url));
    loaders.push(() => fetchText(url, context));
    if (!preferBrowser && context.loadPageHtml)
        loaders.push(() => context.loadPageHtml(url));
    let lastError = null;
    for (const loadHtml of loaders) {
        try {
            const html = await loadHtml();
            const jobs = (0, extractors_cjs_1.extractJobsFromHtml)(url, html, sourceType);
            if (jobs.length > 0)
                return jobs;
            lastError = new Error("No job listings extracted. A dedicated adapter may be required.");
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
        }
    }
    throw lastError ?? new Error("Failed to extract job listings from the source page.");
}
exports.scraperAdapters = {
    greenhouse: greenhouse_cjs_1.greenhouseAdapter,
    lever: lever_cjs_1.leverAdapter,
    smartrecruiters: smartrecruiters_cjs_1.smartrecruitersAdapter,
    ashby: ashby_cjs_1.ashbyAdapter,
    workday: (0, generic_html_cjs_1.createGenericHtmlAdapter)("workday"),
    icims: (0, generic_html_cjs_1.createGenericHtmlAdapter)("icims"),
    bamboohr: (0, generic_html_cjs_1.createGenericHtmlAdapter)("bamboohr"),
    taleo: (0, generic_html_cjs_1.createGenericHtmlAdapter)("taleo"),
    oracle: (0, generic_html_cjs_1.createGenericHtmlAdapter)("oracle"),
    microsoft: (0, generic_html_cjs_1.createGenericHtmlAdapter)("microsoft", true),
    "generic-html": (0, generic_html_cjs_1.createGenericHtmlAdapter)("generic-html"),
    "browser-required": generic_html_cjs_1.browserRequiredAdapter,
};
