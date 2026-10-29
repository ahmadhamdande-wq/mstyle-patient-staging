# MStyle independent clinic — initial migration package

Based on MStyle Personal version 66, commit 6c29b6475d46da608281d901886243a189a3e8db.

This is a separate source checkout for Dr Ahmad Hamdan’s own Cloudflare account.
It has NOT been deployed to that account and contains NO patient database or attachments.
No original clinic site or live record has been modified.

## Implemented and tested locally

- Independent password login; no ChatGPT identity headers or authentication dependency.
- Hashed session tokens, 8-hour sessions, Secure/HttpOnly/SameSite cookies, logout revocation.
- Salted PBKDF2 password hashes; account and IP login throttling.
- Existing online clinical workflows retained; standalone Cloudflare Worker/Vite build.
- Doctor/admin access; nurse clinical read-only; reception demographic list and registration only.
- Reception cannot open clinical snapshots, generated patient pages or backups.
- Nurse cannot save records or change prescription/catalog endpoints.
- Clinic tenant ownership remains separate from staff identity.
- Authenticated offline HTML patient export, printable to PDF using a browser.
- Password-encrypted AES-256-GCM backups containing current records, revisions,
  medication catalog and every attachment referenced by current/history snapshots.
  Appointments and prescription defaults/templates remain inside the patient snapshots.
- Restore into EMPTY clinics only, with attachment hash validation and atomic SQL batch.
- Existing conflict protection and tenant record isolation retained.

## Explicit limits / remaining work

This is a tested foundation, NOT a complete production release.

- Initial backup maximum: 16 MB unencrypted payload. Larger exports fail explicitly.
  Restore maximum: 200 database rows. Large-clinic streaming backup is not implemented.
- Restore needs a fresh database without colliding patient/revision IDs. No merge or overwrite.
- Staff identity/password tables are intentionally excluded from clinical exports.
- No staff administration UI yet; provision staff using the local script below.
- Nurse field-level edits and reception appointment booking UI are not implemented yet.
  They are denied rather than broadly enabled.
- Offline output is a readable full record using original section labels, not a polished
  clinical summary or a server-generated PDF. Original PDF attachments remain in backups.
- Login has a modern new screen; full clinical interface redesign remains to be done.
- No email password recovery, MFA, scheduled external backup or active-session management UI.
- No migration from the old v1 JSON export yet. Test a complete export/migration path before
  moving existing patient data. Do not use an incomplete export as the sole backup.
- Optional report-image AI import may need independent provider configuration.
- A production security/clinical review and real-account end-to-end checks remain necessary.

## Local verification (fictional records only)

Node >=22.13; pnpm version is pinned in package.json.

    pnpm install --frozen-lockfile
    pnpm typecheck
    pnpm build
    pnpm test:independent

The test launches two isolated D1/R2 runtimes. It tests login, spoofed-header rejection,
saving, conflicting edits, cross-clinic access, role restrictions, origin rejection,
encrypted export, restoration into the second database, binary file integrity, offline
export, clinical HTML access, and revoked sessions. It does not contact production.
Legacy database.mjs tests still assume ChatGPT identity and are superseded for auth by
independent-verification.mjs. Clinical calculation/unit test sources are preserved.

## Cloudflare account setup (owner-controlled)

Keep Squarespace domain/DNS unchanged during testing.

1. Authenticate locally with `pnpm exec wrangler login` using YOUR Cloudflare account.
2. Create a database: `pnpm exec wrangler d1 create mstyle-clinic-db`.
3. Set its returned database_id in wrangler.jsonc. Set account_id to your own Cloudflare
   account ID. The all-zero ID is deliberately a non-deployable placeholder.
4. Create private file storage: `pnpm exec wrangler r2 bucket create mstyle-clinic-files`.
   R2 may require account activation/billing; do not enable public bucket access.
5. Apply migrations: `pnpm db:migrate:remote`.
6. Provision your initial doctor account (below). Keep the owner ID stable for all staff.
7. Run typecheck, build, and independent tests. Deploy with `pnpm deploy`.
8. Verify login, patient save/reopen, upload, backup download and restore against fictional
   records on the actual account. Confirm the Worker runtime limits fit password hashing.
9. Connect the custom clinic subdomain only after the independent environment works.
   Do not change main website/email DNS records during application setup.

## Provision a staff account safely (macOS terminal)

Choose ONE stable clinic owner ID, such as a newly generated UUID. It is not the staff ID.
Every authorized staff member of this clinic must use the same owner ID.
New clinic IDs do not automatically gain access to old ChatGPT-hosted records; migration
must explicitly map those records to the new owner and attachment prefix.

Use a hidden password prompt; no plaintext password is written into the repository:

    read -s MSTYLE_STAFF_PASSWORD
    export MSTYLE_STAFF_PASSWORD
    node scripts/provision-staff.mjs YOUR_CLINIC_OWNER_ID doctor doctor
    unset MSTYLE_STAFF_PASSWORD
    pnpm exec wrangler d1 execute DB --remote --file staff-bootstrap.sql
    rm staff-bootstrap.sql

The third argument is role: doctor, admin, nurse or reception.
The generated SQL contains only salted hashes and must still be kept private.
There is no public signup or first-user setup endpoint.
To disable a staff account, set its clinic_staff.active to 0 in D1; existing sessions then
stop working. Password reset currently requires an administrator-managed database update.

## GitHub / automatic builds

Repository: ahmadhamdande-wq/mstyle-clinic (PRIVATE).
Upload source, package.json, pnpm-lock.yaml, configs and migrations.
Never upload node_modules, dist, .wrangler, staff-bootstrap.sql, passwords, tokens or records.
Cloudflare Workers Builds: build command `pnpm build`; deploy command `pnpm deploy`.
Configure D1/R2 and bootstrap the first account before allowing real staff use.
Keep deployment secrets in the hosting provider, not source files.

Copyright © 2026 Dr Ahmad Hamdan. All rights reserved.
