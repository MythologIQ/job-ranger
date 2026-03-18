export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_identifier TEXT,
        frequency_minutes INTEGER NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        last_run_at TEXT,
        last_run_status TEXT NOT NULL DEFAULT 'idle',
        last_error_message TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        source_job_id TEXT NOT NULL,
        source_type TEXT NOT NULL,
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        employment_type TEXT,
        url TEXT NOT NULL,
        description_snippet TEXT NOT NULL,
        salary_min REAL,
        salary_max REAL,
        salary_currency TEXT,
        salary_text TEXT,
        post_date TEXT,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_new INTEGER NOT NULL DEFAULT 1,
        matched_filter_count INTEGER NOT NULL DEFAULT 0,
        UNIQUE (company_id, source_job_id)
      );

      CREATE TABLE IF NOT EXISTS filters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
        title_include TEXT NOT NULL DEFAULT '[]',
        title_exclude TEXT NOT NULL DEFAULT '[]',
        keywords_include TEXT NOT NULL DEFAULT '[]',
        keywords_exclude TEXT NOT NULL DEFAULT '[]',
        salary_min REAL,
        location_include TEXT NOT NULL DEFAULT '[]',
        location_exclude TEXT NOT NULL DEFAULT '[]',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS scrape_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        status TEXT NOT NULL,
        jobs_found_count INTEGER NOT NULL DEFAULT 0,
        jobs_matched_count INTEGER NOT NULL DEFAULT 0,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_last_seen_at ON jobs(last_seen_at DESC);
      CREATE INDEX IF NOT EXISTS idx_scrape_runs_company_id ON scrape_runs(company_id);
      CREATE INDEX IF NOT EXISTS idx_scrape_runs_started_at ON scrape_runs(started_at DESC);
    `,
  },
  {
    version: 2,
    name: "circuit_breaker",
    sql: `
      ALTER TABLE companies ADD COLUMN consecutive_failures INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE companies ADD COLUMN circuit_open_until TEXT;
    `,
  },
];
