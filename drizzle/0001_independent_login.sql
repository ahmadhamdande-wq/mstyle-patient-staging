CREATE TABLE IF NOT EXISTS clinic_staff (id TEXT PRIMARY KEY, owner TEXT NOT NULL, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, salt TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('doctor','admin','nurse','reception')), active INTEGER NOT NULL DEFAULT 1, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS clinic_sessions (token_hash TEXT PRIMARY KEY, staff_id TEXT NOT NULL REFERENCES clinic_staff(id), expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS clinic_sessions_expiry ON clinic_sessions(expires);
CREATE TABLE IF NOT EXISTS clinic_login_attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS clinic_audit (id TEXT PRIMARY KEY, staff_id TEXT NOT NULL, owner TEXT NOT NULL, action TEXT NOT NULL, created TEXT NOT NULL);
