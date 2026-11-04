-- Preserve all staff IDs, passwords, sessions and patient records.
-- Lab staff retain the existing nurse base role. Department grants ONLY lab routes.
ALTER TABLE clinic_staff ADD COLUMN lab_department TEXT NOT NULL DEFAULT '' CHECK(lab_department IN ('','hormonal','embryology'));
