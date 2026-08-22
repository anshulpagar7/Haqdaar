-- Haqdaar · SQLite schema
-- Personal data is deliberately minimal: we never receive ID numbers (they are
-- masked on the client before upload) and saved applications self-expire.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS scheme (
  id             TEXT PRIMARY KEY,
  name_en        TEXT NOT NULL,
  name_hi        TEXT NOT NULL,
  name_mr        TEXT NOT NULL,
  authority      TEXT NOT NULL,
  level          TEXT NOT NULL CHECK (level IN ('central','state')),
  state          TEXT,
  benefit_json   TEXT NOT NULL,
  criteria_json  TEXT NOT NULL,
  documents_json TEXT NOT NULL,
  apply_json     TEXT NOT NULL,
  how_to_json    TEXT,
  deadline       TEXT,
  clause_text    TEXT NOT NULL,
  source_url     TEXT,
  last_verified  TEXT,
  verified       INTEGER NOT NULL DEFAULT 0,
  active         INTEGER NOT NULL DEFAULT 1,
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_scheme_state  ON scheme(state);
CREATE INDEX IF NOT EXISTS idx_scheme_active ON scheme(active);

CREATE TABLE IF NOT EXISTS attribute (
  key        TEXT PRIMARY KEY,
  def_json   TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- An application the citizen chose to save, retrievable by reference code.
-- Expires automatically; contains no identity numbers.
CREATE TABLE IF NOT EXISTS application (
  reference     TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at    TEXT NOT NULL,
  lang          TEXT NOT NULL DEFAULT 'en',
  profile_json  TEXT NOT NULL,
  docs_json     TEXT NOT NULL,
  eligible_json TEXT NOT NULL,
  total_value   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_app_expires ON application(expires_at);

-- Anonymous telemetry. No profile values, only shapes and counts.
CREATE TABLE IF NOT EXISTS event (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  kind         TEXT NOT NULL,
  questions    INTEGER,
  matched      INTEGER,
  total_value  INTEGER,
  scheme_id    TEXT
);
CREATE INDEX IF NOT EXISTS idx_event_kind ON event(kind);

CREATE TABLE IF NOT EXISTS audit (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  action     TEXT NOT NULL,
  target     TEXT,
  detail     TEXT
);
