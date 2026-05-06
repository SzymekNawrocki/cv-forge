CREATE TABLE IF NOT EXISTS jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT,
    company     TEXT,
    tech_stack  TEXT,        -- JSON array stored as text
    salary_min  INTEGER,
    salary_max  INTEGER,
    currency    TEXT,
    contact_email TEXT,
    source_url  TEXT,
    raw_text    TEXT,
    status      TEXT NOT NULL DEFAULT 'new',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
