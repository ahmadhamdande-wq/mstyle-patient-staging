ALTER TABLE clinic_staff ADD COLUMN recovery_email TEXT NOT NULL DEFAULT '';
CREATE TABLE clinic_access_tokens(token_hash TEXT PRIMARY KEY,kind TEXT NOT NULL,subject_id TEXT NOT NULL,email TEXT NOT NULL,version INTEGER NOT NULL,expires INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0);
CREATE INDEX clinic_access_tokens_subject ON clinic_access_tokens(subject_id,kind);
CREATE TABLE clinic_portal_accounts(id TEXT PRIMARY KEY,owner TEXT NOT NULL,patient_id TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password_hash TEXT,salt TEXT,active INTEGER NOT NULL DEFAULT 1,verified INTEGER NOT NULL DEFAULT 0,auth_version INTEGER NOT NULL DEFAULT 1,created TEXT NOT NULL,UNIQUE(owner,patient_id));
CREATE TABLE clinic_portal_sessions(token_hash TEXT PRIMARY KEY,account_id TEXT NOT NULL,auth_version INTEGER NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE clinic_portal_releases(id TEXT PRIMARY KEY,owner TEXT NOT NULL,patient_id TEXT NOT NULL,kind TEXT NOT NULL,source_id TEXT NOT NULL,fingerprint TEXT NOT NULL,payload TEXT NOT NULL,released_by TEXT NOT NULL,released_at TEXT NOT NULL,UNIQUE(owner,patient_id,kind,source_id));
CREATE INDEX clinic_portal_releases_patient ON clinic_portal_releases(owner,patient_id);
CREATE TABLE clinic_portal_requests(id TEXT PRIMARY KEY,owner TEXT NOT NULL,patient_id TEXT NOT NULL,requested_date TEXT NOT NULL,note TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Pending',created TEXT NOT NULL);
