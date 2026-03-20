"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobScoutBackend = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const contracts_cjs_1 = require("./contracts.cjs");
const migrations_cjs_1 = require("./migrations.cjs");
const repository_cjs_1 = require("./repository.cjs");
const scrapers_cjs_1 = require("./scrapers.cjs");
const sqlite_cjs_1 = require("./sqlite.cjs");
const scrape_guard_cjs_1 = require("./scrape-guard.cjs");
const defaultSettings = {
    userAgent: "Job Ranger Desktop/1.0",
    maxConcurrentScrapes: 2,
    scrapeTimeoutMs: 20000,
    retryCount: 1,
    scrapeCooldownMinutes: 30,
    circuitBreakerThreshold: 3,
    circuitBreakerCooldownMinutes: 60,
    notificationsEnabled: false,
    notifyOnNewJobs: true,
    notifyOnMatchedJobs: true,
    minimizeToTray: false,
};
function normalizeList(items) {
    return items.map((item) => item.trim()).filter(Boolean);
}
function matchesFilter(job, filter) {
    if (!filter.isActive) {
        return false;
    }
    const haystack = `${job.title} ${job.descriptionSnippet}`.toLowerCase();
    const location = job.location.toLowerCase();
    const title = job.title.toLowerCase();
    const containsAll = (terms, target) => terms.every((term) => target.includes(term.toLowerCase()));
    const containsNone = (terms, target) => terms.every((term) => !target.includes(term.toLowerCase()));
    if (!containsAll(filter.titleInclude, title)) {
        return false;
    }
    if (!containsNone(filter.titleExclude, title)) {
        return false;
    }
    if (!containsAll(filter.keywordsInclude, haystack)) {
        return false;
    }
    if (!containsNone(filter.keywordsExclude, haystack)) {
        return false;
    }
    if (filter.salaryMin && (!job.salaryMin || job.salaryMin < filter.salaryMin)) {
        return false;
    }
    if (filter.locationInclude.length > 0 && !containsAll(filter.locationInclude, location)) {
        return false;
    }
    if (!containsNone(filter.locationExclude, location)) {
        return false;
    }
    return true;
}
class JobScoutBackend {
    options;
    sqliteBinaryPath = "";
    sqlite;
    repository;
    fetchImpl;
    schedulerEnabled;
    browserPageLoader;
    timers = new Map();
    pendingQueue = [];
    queuedCompanyIds = new Set();
    inFlightCompanyIds = new Set();
    scrapeListeners = new Map();
    runningScrapes = 0;
    databasePath;
    constructor(options) {
        this.options = options;
        this.databasePath = node_path_1.default.join(this.options.dataDirectory, "jobscout.sqlite3");
        this.fetchImpl = this.options.fetchImpl ?? fetch;
        this.schedulerEnabled = this.options.schedulerEnabled ?? true;
        this.browserPageLoader = this.options.browserPageLoader;
    }
    async initialize() {
        await node_fs_1.promises.mkdir(this.options.dataDirectory, { recursive: true });
        this.sqliteBinaryPath =
            this.options.sqliteBinaryPath ?? (await (0, sqlite_cjs_1.resolveSqliteBinary)());
        this.sqlite = new sqlite_cjs_1.SqliteClient(this.databasePath, this.sqliteBinaryPath);
        this.repository = new repository_cjs_1.JobScoutRepository(this.sqlite);
        await this.runMigrations();
        await this.repository.updateSettings(defaultSettings, {});
        if (this.schedulerEnabled) {
            await this.reschedule();
        }
    }
    async dispose() {
        for (const timer of this.timers.values()) {
            clearInterval(timer);
        }
        this.timers.clear();
        this.pendingQueue.length = 0;
        this.queuedCompanyIds.clear();
        this.inFlightCompanyIds.clear();
        this.scrapeListeners.clear();
    }
    async getSystemStatus(platform) {
        return {
            backend: "electron-ipc",
            platform,
            databasePath: this.databasePath,
            sqliteBinaryPath: this.sqliteBinaryPath,
            supportedSources: Object.values(contracts_cjs_1.sourceProfiles)
                .filter((profile) => profile.canRun)
                .map((profile) => profile.type),
        };
    }
    async listCompanies() {
        return this.repository.listCompanies();
    }
    async createCompany(draft) {
        const normalizedDraft = {
            ...draft,
            name: draft.name.trim(),
            url: draft.url.trim(),
            frequencyMinutes: Math.max(15, Math.floor(draft.frequencyMinutes)),
        };
        const detected = (0, scrapers_cjs_1.detectSourceFromUrl)(normalizedDraft.url);
        const company = await this.repository.createCompany(normalizedDraft, detected.sourceType, detected.sourceIdentifier);
        await this.reschedule();
        return company;
    }
    async updateCompany(id, update) {
        const current = await this.repository.getCompanyById(id);
        if (!current) {
            throw new Error(`Company ${id} not found`);
        }
        const nextUrl = update.url?.trim() ?? current.url;
        const detected = (0, scrapers_cjs_1.detectSourceFromUrl)(nextUrl);
        const company = await this.repository.updateCompany(id, {
            ...update,
            frequencyMinutes: update.frequencyMinutes === undefined
                ? undefined
                : Math.max(15, Math.floor(update.frequencyMinutes)),
        }, detected.sourceType, detected.sourceIdentifier);
        await this.reschedule();
        return company;
    }
    async deleteCompany(id) {
        await this.repository.deleteCompany(id);
        await this.reschedule();
    }
    async listJobs() {
        return this.repository.listJobs();
    }
    async markJobSeen(id) {
        return this.repository.markJobSeen(id);
    }
    async listFilters() {
        return this.repository.listFilters();
    }
    async createFilter(draft) {
        return this.repository.createFilter({
            ...draft,
            name: draft.name.trim(),
            titleInclude: normalizeList(draft.titleInclude),
            titleExclude: normalizeList(draft.titleExclude),
            keywordsInclude: normalizeList(draft.keywordsInclude),
            keywordsExclude: normalizeList(draft.keywordsExclude),
            locationInclude: normalizeList(draft.locationInclude),
            locationExclude: normalizeList(draft.locationExclude),
        });
    }
    async updateFilter(id, update) {
        return this.repository.updateFilter(id, {
            ...update,
            titleInclude: update.titleInclude ? normalizeList(update.titleInclude) : undefined,
            titleExclude: update.titleExclude ? normalizeList(update.titleExclude) : undefined,
            keywordsInclude: update.keywordsInclude
                ? normalizeList(update.keywordsInclude)
                : undefined,
            keywordsExclude: update.keywordsExclude
                ? normalizeList(update.keywordsExclude)
                : undefined,
            locationInclude: update.locationInclude
                ? normalizeList(update.locationInclude)
                : undefined,
            locationExclude: update.locationExclude
                ? normalizeList(update.locationExclude)
                : undefined,
        });
    }
    async deleteFilter(id) {
        await this.repository.deleteFilter(id);
    }
    async getSettings() {
        return this.repository.getSettings(defaultSettings);
    }
    async updateSettings(update) {
        const nextSettings = await this.repository.updateSettings(defaultSettings, update);
        await this.reschedule();
        return nextSettings;
    }
    async listRecentScrapeRuns(limit = 10) {
        return this.repository.listRecentScrapeRuns(limit);
    }
    async runCompanyScrape(companyId) {
        return this.enqueueScrape(companyId);
    }
    async runMigrations() {
        await this.sqlite.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL);");
        const appliedRows = await this.sqlite.queryAll("SELECT version FROM schema_migrations ORDER BY version ASC;");
        const applied = new Set(appliedRows.map((row) => row.version));
        for (const migration of migrations_cjs_1.migrations) {
            if (applied.has(migration.version)) {
                continue;
            }
            await this.sqlite.exec(migration.sql);
            await this.sqlite.exec((0, sqlite_cjs_1.sql) `
          INSERT INTO schema_migrations (version, name, applied_at)
          VALUES (${migration.version}, ${migration.name}, ${new Date().toISOString()});
        `);
        }
    }
    async reschedule() {
        if (!this.schedulerEnabled) {
            return;
        }
        for (const timer of this.timers.values()) {
            clearInterval(timer);
        }
        this.timers.clear();
        const companies = await this.repository.listCompanies();
        for (const company of companies) {
            if (!company.isActive) {
                continue;
            }
            const intervalMs = Math.max(15, company.frequencyMinutes) * 60 * 1000;
            const timer = setInterval(() => {
                void this.enqueueScheduledScrape(company.id);
            }, intervalMs);
            this.timers.set(company.id, timer);
        }
    }
    async enqueueScheduledScrape(companyId) {
        if (this.queuedCompanyIds.has(companyId) || this.inFlightCompanyIds.has(companyId)) {
            return;
        }
        this.pendingQueue.push({ companyId });
        this.queuedCompanyIds.add(companyId);
        try {
            await this.processQueue();
        }
        catch {
            this.dropPendingScrape(companyId);
        }
    }
    enqueueScrape(companyId) {
        const promise = new Promise((resolve, reject) => {
            const listeners = this.scrapeListeners.get(companyId) ?? [];
            listeners.push({ resolve, reject });
            this.scrapeListeners.set(companyId, listeners);
        });
        if (!this.queuedCompanyIds.has(companyId) && !this.inFlightCompanyIds.has(companyId)) {
            this.pendingQueue.push({ companyId });
            this.queuedCompanyIds.add(companyId);
        }
        void this.processQueue().catch((error) => {
            this.dropPendingScrape(companyId);
            this.rejectScrapeListeners(companyId, error);
        });
        return promise;
    }
    async processQueue() {
        const settings = await this.getSettings();
        while (this.runningScrapes < settings.maxConcurrentScrapes &&
            this.pendingQueue.length > 0) {
            const next = this.pendingQueue.shift();
            if (!next) {
                return;
            }
            this.queuedCompanyIds.delete(next.companyId);
            this.inFlightCompanyIds.add(next.companyId);
            this.runningScrapes += 1;
            void this.performScrape(next.companyId)
                .then((run) => {
                this.resolveScrapeListeners(next.companyId, run);
            })
                .catch((error) => {
                this.rejectScrapeListeners(next.companyId, error);
            })
                .finally(async () => {
                this.inFlightCompanyIds.delete(next.companyId);
                this.runningScrapes -= 1;
                await this.processQueue();
            });
        }
    }
    resolveScrapeListeners(companyId, run) {
        const listeners = this.scrapeListeners.get(companyId) ?? [];
        this.scrapeListeners.delete(companyId);
        for (const listener of listeners) {
            listener.resolve(run);
        }
    }
    rejectScrapeListeners(companyId, error) {
        const listeners = this.scrapeListeners.get(companyId) ?? [];
        this.scrapeListeners.delete(companyId);
        for (const listener of listeners) {
            listener.reject(error);
        }
    }
    dropPendingScrape(companyId) {
        const queueIndex = this.pendingQueue.findIndex((entry) => entry.companyId === companyId);
        if (queueIndex >= 0) {
            this.pendingQueue.splice(queueIndex, 1);
        }
        this.queuedCompanyIds.delete(companyId);
    }
    async performScrape(companyId) {
        const company = await this.repository.getCompanyById(companyId);
        if (!company) {
            throw new Error(`Company ${companyId} not found`);
        }
        const run = await this.repository.createScrapeRun(companyId);
        const startedAt = new Date().toISOString();
        const profile = (0, contracts_cjs_1.getSourceProfile)(company.sourceType);
        const settings = await this.getSettings();
        const guard = (0, scrape_guard_cjs_1.checkScrapeGuard)(company, settings);
        if (!guard.canScrape) {
            const message = guard.reason === "cooldown"
                ? `Scrape skipped: cooldown until ${guard.waitUntil}`
                : `Scrape skipped: circuit open until ${guard.waitUntil}`;
            return this.repository.finalizeScrapeRun(run.id, "skipped", 0, 0, message);
        }
        if (!company.sourceIdentifier) {
            const message = "No source identifier could be derived from this URL.";
            await this.repository.setCompanyRunState(companyId, "unsupported", startedAt, message);
            return this.repository.finalizeScrapeRun(run.id, "unsupported", 0, 0, message);
        }
        if (!(0, contracts_cjs_1.canRunSourceType)(company.sourceType)) {
            const message = `${profile.label} was detected, but no reliable extraction path is available yet.`;
            await this.repository.setCompanyRunState(companyId, "unsupported", startedAt, message);
            return this.repository.finalizeScrapeRun(run.id, "unsupported", 0, 0, message);
        }
        if (profile.extractionMode === "browser" && !this.browserPageLoader) {
            const message = "Browser-backed extraction is not available in this environment.";
            await this.repository.setCompanyRunState(companyId, "unsupported", startedAt, message);
            return this.repository.finalizeScrapeRun(run.id, "unsupported", 0, 0, message);
        }
        try {
            const adapter = scrapers_cjs_1.scraperAdapters[company.sourceType];
            if (!adapter) {
                throw new Error(`${profile.label} does not have a configured scraper adapter.`);
            }
            const scrapedJobs = await adapter.scrape(company.sourceIdentifier, {
                fetchImpl: this.fetchImpl,
                userAgent: settings.userAgent,
                timeoutMs: settings.scrapeTimeoutMs,
                retryCount: settings.retryCount,
                loadPageHtml: this.browserPageLoader
                    ? (url) => this.browserPageLoader(url, {
                        timeoutMs: settings.scrapeTimeoutMs,
                        userAgent: settings.userAgent,
                    })
                    : undefined,
            });
            const filters = await this.repository.listFilters();
            const relevantFilters = filters.filter((filter) => !filter.companyId || filter.companyId === company.id);
            let matchedCount = 0;
            for (const scrapedJob of scrapedJobs) {
                const matchedFilterCount = relevantFilters.filter((filter) => matchesFilter(scrapedJob, filter)).length;
                if (matchedFilterCount > 0) {
                    matchedCount += 1;
                }
                await this.repository.upsertJob({
                    companyId: company.id,
                    sourceJobId: scrapedJob.sourceJobId,
                    sourceType: scrapedJob.sourceType,
                    title: scrapedJob.title,
                    location: scrapedJob.location,
                    employmentType: scrapedJob.employmentType,
                    url: scrapedJob.url,
                    descriptionSnippet: scrapedJob.descriptionSnippet,
                    salaryMin: scrapedJob.salaryMin,
                    salaryMax: scrapedJob.salaryMax,
                    salaryCurrency: scrapedJob.salaryCurrency,
                    salaryText: scrapedJob.salaryText,
                    postDate: scrapedJob.postDate,
                    lastSeenAt: new Date().toISOString(),
                    matchedFilterCount,
                });
            }
            await this.repository.deactivateMissingJobs(company.id, scrapedJobs.map((job) => job.sourceJobId));
            await this.repository.resetFailures(company.id);
            await this.repository.setCompanyRunState(company.id, "success", startedAt, null);
            return this.repository.finalizeScrapeRun(run.id, "success", scrapedJobs.length, matchedCount, null);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown scrape failure";
            await this.repository.incrementFailures(company.id);
            const updated = await this.repository.getCompanyById(company.id);
            if (updated && (0, scrape_guard_cjs_1.shouldOpenCircuit)(updated.consecutiveFailures, settings.circuitBreakerThreshold)) {
                const openUntil = (0, scrape_guard_cjs_1.calculateCircuitOpenUntil)(settings.circuitBreakerCooldownMinutes);
                await this.repository.openCircuit(company.id, openUntil);
            }
            await this.repository.setCompanyRunState(company.id, "failure", startedAt, message);
            return this.repository.finalizeScrapeRun(run.id, "failure", 0, 0, message);
        }
    }
}
exports.JobScoutBackend = JobScoutBackend;
