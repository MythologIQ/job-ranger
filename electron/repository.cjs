"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobScoutRepository = void 0;
const sqlite_cjs_1 = require("./sqlite.cjs");
function parseJsonArray(value) {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
            ? parsed.filter((item) => typeof item === "string")
            : [];
    }
    catch {
        return [];
    }
}
function mapCompany(row) {
    return {
        id: String(row.id),
        name: row.name,
        url: row.url,
        sourceType: row.source_type,
        sourceIdentifier: row.source_identifier,
        frequencyMinutes: row.frequency_minutes,
        isActive: Boolean(row.is_active),
        lastRunAt: row.last_run_at,
        lastRunStatus: row.last_run_status,
        lastErrorMessage: row.last_error_message,
        consecutiveFailures: row.consecutive_failures ?? 0,
        circuitOpenUntil: row.circuit_open_until ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function mapJob(row) {
    return {
        id: String(row.id),
        companyId: String(row.company_id),
        sourceJobId: row.source_job_id,
        sourceType: row.source_type,
        title: row.title,
        location: row.location,
        employmentType: row.employment_type,
        url: row.url,
        descriptionSnippet: row.description_snippet,
        salaryMin: row.salary_min,
        salaryMax: row.salary_max,
        salaryCurrency: row.salary_currency,
        salaryText: row.salary_text,
        postDate: row.post_date,
        createdAt: row.created_at,
        lastSeenAt: row.last_seen_at,
        isActive: Boolean(row.is_active),
        isNew: Boolean(row.is_new),
        matchedFilterCount: row.matched_filter_count,
    };
}
function mapFilter(row) {
    return {
        id: String(row.id),
        name: row.name,
        companyId: row.company_id ? String(row.company_id) : null,
        titleInclude: parseJsonArray(row.title_include),
        titleExclude: parseJsonArray(row.title_exclude),
        keywordsInclude: parseJsonArray(row.keywords_include),
        keywordsExclude: parseJsonArray(row.keywords_exclude),
        salaryMin: row.salary_min,
        locationInclude: parseJsonArray(row.location_include),
        locationExclude: parseJsonArray(row.location_exclude),
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function mapScrapeRun(row) {
    return {
        id: String(row.id),
        companyId: String(row.company_id),
        startedAt: row.started_at,
        finishedAt: row.finished_at,
        status: row.status,
        jobsFoundCount: row.jobs_found_count,
        jobsMatchedCount: row.jobs_matched_count,
        errorMessage: row.error_message,
    };
}
function serializeArray(value) {
    return JSON.stringify(value.filter(Boolean));
}
class JobScoutRepository {
    sqlite;
    constructor(sqlite) {
        this.sqlite = sqlite;
    }
    async listCompanies() {
        const rows = await this.sqlite.queryAll("SELECT * FROM companies ORDER BY name COLLATE NOCASE ASC;");
        return rows.map(mapCompany);
    }
    async getCompanyById(id) {
        const row = await this.sqlite.queryOne((0, sqlite_cjs_1.sql) `SELECT * FROM companies WHERE id = ${id} LIMIT 1;`);
        return row ? mapCompany(row) : null;
    }
    async createCompany(draft, sourceType, sourceIdentifier) {
        const now = new Date().toISOString();
        const row = await this.sqlite.queryOne((0, sqlite_cjs_1.sql) `
        INSERT INTO companies (
          name,
          url,
          source_type,
          source_identifier,
          frequency_minutes,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          ${draft.name.trim()},
          ${draft.url.trim()},
          ${sourceType},
          ${sourceIdentifier},
          ${draft.frequencyMinutes},
          ${draft.isActive},
          ${now},
          ${now}
        )
        RETURNING *;
      `);
        if (!row) {
            throw new Error("Failed to create company");
        }
        return mapCompany(row);
    }
    async updateCompany(id, update, sourceType, sourceIdentifier) {
        const existing = await this.getCompanyById(id);
        if (!existing) {
            throw new Error(`Company ${id} not found`);
        }
        const row = await this.sqlite.queryOne((0, sqlite_cjs_1.sql) `
        UPDATE companies
        SET
          name = ${update.name?.trim() ?? existing.name},
          url = ${update.url?.trim() ?? existing.url},
          source_type = ${sourceType},
          source_identifier = ${sourceIdentifier},
          frequency_minutes = ${update.frequencyMinutes ?? existing.frequencyMinutes},
          is_active = ${update.isActive ?? existing.isActive},
          updated_at = ${new Date().toISOString()}
        WHERE id = ${id}
        RETURNING *;
      `);
        if (!row) {
            throw new Error(`Failed to update company ${id}`);
        }
        return mapCompany(row);
    }
    async setCompanyRunState(id, status, lastRunAt, errorMessage) {
        await this.sqlite.exec((0, sqlite_cjs_1.sql) `
        UPDATE companies
        SET
          last_run_at = ${lastRunAt},
          last_run_status = ${status},
          last_error_message = ${errorMessage},
          updated_at = ${new Date().toISOString()}
        WHERE id = ${id};
      `);
    }
    async deleteCompany(id) {
        await this.sqlite.exec((0, sqlite_cjs_1.sql) `DELETE FROM companies WHERE id = ${id};`);
    }
    async incrementFailures(companyId) {
        await this.sqlite.exec((0, sqlite_cjs_1.sql) `
      UPDATE companies
      SET consecutive_failures = consecutive_failures + 1
      WHERE id = ${companyId};
    `);
    }
    async resetFailures(companyId) {
        await this.sqlite.exec((0, sqlite_cjs_1.sql) `
      UPDATE companies
      SET consecutive_failures = 0, circuit_open_until = NULL
      WHERE id = ${companyId};
    `);
    }
    async openCircuit(companyId, until) {
        await this.sqlite.exec((0, sqlite_cjs_1.sql) `
      UPDATE companies
      SET circuit_open_until = ${until}
      WHERE id = ${companyId};
    `);
    }
    async listJobs() {
        const rows = await this.sqlite.queryAll("SELECT * FROM jobs ORDER BY is_new DESC, last_seen_at DESC, title COLLATE NOCASE ASC;");
        return rows.map(mapJob);
    }
    async markJobSeen(id) {
        const row = await this.sqlite.queryOne((0, sqlite_cjs_1.sql) `
        UPDATE jobs
        SET is_new = 0
        WHERE id = ${id}
        RETURNING *;
      `);
        if (!row) {
            throw new Error(`Job ${id} not found`);
        }
        return mapJob(row);
    }
    async upsertJob(input) {
        const row = await this.sqlite.queryOne((0, sqlite_cjs_1.sql) `
        INSERT INTO jobs (
          company_id,
          source_job_id,
          source_type,
          title,
          location,
          employment_type,
          url,
          description_snippet,
          salary_min,
          salary_max,
          salary_currency,
          salary_text,
          post_date,
          created_at,
          last_seen_at,
          is_active,
          is_new,
          matched_filter_count
        ) VALUES (
          ${input.companyId},
          ${input.sourceJobId},
          ${input.sourceType},
          ${input.title},
          ${input.location},
          ${input.employmentType},
          ${input.url},
          ${input.descriptionSnippet},
          ${input.salaryMin},
          ${input.salaryMax},
          ${input.salaryCurrency},
          ${input.salaryText},
          ${input.postDate},
          ${input.lastSeenAt},
          ${input.lastSeenAt},
          1,
          1,
          ${input.matchedFilterCount}
        )
        ON CONFLICT (company_id, source_job_id) DO UPDATE SET
          source_type = excluded.source_type,
          title = excluded.title,
          location = excluded.location,
          employment_type = excluded.employment_type,
          url = excluded.url,
          description_snippet = excluded.description_snippet,
          salary_min = excluded.salary_min,
          salary_max = excluded.salary_max,
          salary_currency = excluded.salary_currency,
          salary_text = excluded.salary_text,
          post_date = excluded.post_date,
          last_seen_at = excluded.last_seen_at,
          is_active = 1,
          matched_filter_count = excluded.matched_filter_count
        RETURNING *;
      `);
        if (!row) {
            throw new Error(`Failed to upsert job ${input.sourceJobId}`);
        }
        return mapJob(row);
    }
    async deactivateMissingJobs(companyId, sourceJobIds) {
        if (sourceJobIds.length === 0) {
            await this.sqlite.exec((0, sqlite_cjs_1.sql) `UPDATE jobs SET is_active = 0 WHERE company_id = ${companyId};`);
            return;
        }
        const idsClause = sourceJobIds.map((id) => (0, sqlite_cjs_1.toSqlLiteral)(id)).join(", ");
        await this.sqlite.exec(`UPDATE jobs SET is_active = 0 WHERE company_id = ${(0, sqlite_cjs_1.toSqlLiteral)(companyId)} AND source_job_id NOT IN (${idsClause});`);
    }
    async listFilters() {
        const rows = await this.sqlite.queryAll("SELECT * FROM filters ORDER BY is_active DESC, name COLLATE NOCASE ASC;");
        return rows.map(mapFilter);
    }
    async createFilter(draft) {
        const now = new Date().toISOString();
        const row = await this.sqlite.queryOne((0, sqlite_cjs_1.sql) `
        INSERT INTO filters (
          name,
          company_id,
          title_include,
          title_exclude,
          keywords_include,
          keywords_exclude,
          salary_min,
          location_include,
          location_exclude,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          ${draft.name.trim()},
          ${draft.companyId},
          ${serializeArray(draft.titleInclude)},
          ${serializeArray(draft.titleExclude)},
          ${serializeArray(draft.keywordsInclude)},
          ${serializeArray(draft.keywordsExclude)},
          ${draft.salaryMin},
          ${serializeArray(draft.locationInclude)},
          ${serializeArray(draft.locationExclude)},
          ${draft.isActive},
          ${now},
          ${now}
        )
        RETURNING *;
      `);
        if (!row) {
            throw new Error("Failed to create filter");
        }
        return mapFilter(row);
    }
    async updateFilter(id, update) {
        const current = (await this.listFilters()).find((filter) => filter.id === id);
        if (!current) {
            throw new Error(`Filter ${id} not found`);
        }
        const row = await this.sqlite.queryOne((0, sqlite_cjs_1.sql) `
        UPDATE filters
        SET
          name = ${update.name?.trim() ?? current.name},
          company_id = ${update.companyId ?? current.companyId},
          title_include = ${serializeArray(update.titleInclude ?? current.titleInclude)},
          title_exclude = ${serializeArray(update.titleExclude ?? current.titleExclude)},
          keywords_include = ${serializeArray(update.keywordsInclude ?? current.keywordsInclude)},
          keywords_exclude = ${serializeArray(update.keywordsExclude ?? current.keywordsExclude)},
          salary_min = ${update.salaryMin ?? current.salaryMin},
          location_include = ${serializeArray(update.locationInclude ?? current.locationInclude)},
          location_exclude = ${serializeArray(update.locationExclude ?? current.locationExclude)},
          is_active = ${update.isActive ?? current.isActive},
          updated_at = ${new Date().toISOString()}
        WHERE id = ${id}
        RETURNING *;
      `);
        if (!row) {
            throw new Error(`Failed to update filter ${id}`);
        }
        return mapFilter(row);
    }
    async deleteFilter(id) {
        await this.sqlite.exec((0, sqlite_cjs_1.sql) `DELETE FROM filters WHERE id = ${id};`);
    }
    async createScrapeRun(companyId) {
        const row = await this.sqlite.queryOne((0, sqlite_cjs_1.sql) `
        INSERT INTO scrape_runs (company_id, started_at, status)
        VALUES (${companyId}, ${new Date().toISOString()}, ${"running"})
        RETURNING *;
      `);
        if (!row) {
            throw new Error(`Failed to create scrape run for company ${companyId}`);
        }
        return mapScrapeRun(row);
    }
    async finalizeScrapeRun(id, status, jobsFoundCount, jobsMatchedCount, errorMessage) {
        const row = await this.sqlite.queryOne((0, sqlite_cjs_1.sql) `
        UPDATE scrape_runs
        SET
          finished_at = ${new Date().toISOString()},
          status = ${status},
          jobs_found_count = ${jobsFoundCount},
          jobs_matched_count = ${jobsMatchedCount},
          error_message = ${errorMessage}
        WHERE id = ${id}
        RETURNING *;
      `);
        if (!row) {
            throw new Error(`Failed to finalize scrape run ${id}`);
        }
        return mapScrapeRun(row);
    }
    async listRecentScrapeRuns(limit = 10) {
        const rows = await this.sqlite.queryAll(`SELECT * FROM scrape_runs ORDER BY started_at DESC LIMIT ${Math.max(1, Math.floor(limit))};`);
        return rows.map(mapScrapeRun);
    }
    async getSettings(defaultSettings) {
        const rows = await this.sqlite.queryAll("SELECT key, value_json FROM settings;");
        const settings = { ...defaultSettings };
        for (const row of rows) {
            settings[row.key] = JSON.parse(row.value_json);
        }
        return settings;
    }
    async updateSettings(defaultSettings, update) {
        const nextSettings = { ...(await this.getSettings(defaultSettings)), ...update };
        const updatedAt = new Date().toISOString();
        for (const [key, value] of Object.entries(nextSettings)) {
            await this.sqlite.exec((0, sqlite_cjs_1.sql) `
          INSERT INTO settings (key, value_json, updated_at)
          VALUES (${key}, ${JSON.stringify(value)}, ${updatedAt})
          ON CONFLICT(key) DO UPDATE SET
            value_json = excluded.value_json,
            updated_at = excluded.updated_at;
        `);
        }
        return nextSettings;
    }
}
exports.JobScoutRepository = JobScoutRepository;
