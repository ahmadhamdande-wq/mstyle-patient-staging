-- Additive migration: patient records and existing passwords are unchanged.
ALTER TABLE clinic_staff ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
ALTER TABLE clinic_staff ADD COLUMN is_owner INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clinic_staff ADD COLUMN clinical_access TEXT NOT NULL DEFAULT '';
ALTER TABLE clinic_staff ADD COLUMN can_export INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clinic_staff ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clinic_staff ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clinic_sessions ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0;
-- This is the original account provisioned by create-doctor.yml, not the first person to visit a page.
UPDATE clinic_staff SET is_owner=1, display_name='Dr Ahmad Hamdan' WHERE owner='mstyle-hamdan' AND username='dr.ahmad';
CREATE TABLE clinic_recovery_codes (id TEXT PRIMARY KEY, staff_id TEXT NOT NULL REFERENCES clinic_staff(id), code_hash TEXT NOT NULL UNIQUE, used_at TEXT, created TEXT NOT NULL);
CREATE INDEX clinic_recovery_staff ON clinic_recovery_codes(staff_id);
