# Users & Access

After the owner-controlled Cloudflare deployment, sign in as `dr.ahmad` and open **Users & Access** from the patient list sidebar (`/settings/users`). The additive database migration preserves existing passwords and patient records and marks only the original provisioned `mstyle-hamdan` / `dr.ahmad` account as owner. Existing staff do not automatically gain administrator or export privileges.

- Add a staff name, unique username, role, permissions, and a temporary passphrase of at least 14 characters. Confirm with your current administrator password. Share the temporary password privately. Staff must choose their own password before accessing the clinic.
- Doctors and nurses can have no clinical access, view-only access, or permission to view and edit clinical records. Nurses default to view-only. These are whole-record permissions; there are no separate IVF/ANC module restrictions.
- Reception can register patients and read basic patient/contact details and appointment lists. They cannot open clinical records, import clinical notes, or export records.
- Export permission controls encrypted backups and offline record exports. Restoring also requires clinical editing permission. Staff with clinical viewing permission can still view/print what is displayed; this permission does not prevent screenshots or copying visible information.
- Administrators have full clinical, export and user-management access. Only the owner can appoint or change administrators. The owner cannot be deactivated, downgraded, or have their password reset from the staff editor.
- Edit access, reset a temporary password, sign out all devices, or deactivate an account. Each action invalidates all sessions for that user. Deactivation preserves patient records and audit history. Username changes are not supported.
- Submitted ET and cryo corrections continue to require the owner or an administrator's password approval.

## Password recovery

Every user can change their password at `/account/password`. Other sessions are signed out. A nurse/doctor/reception member who forgets their password asks the owner or an administrator to reset a temporary password.

The owner should open **My password & recovery**, confirm the current password, generate recovery codes, and download them immediately. Store this private file separately from the clinic computer. Codes appear only once; the server stores hashes. Generating another set invalidates the old set. Use **Forgot your password?** on the login page (`/recover`) with the owner username and one unused code. Successful recovery invalidates existing sessions and consumes that code. Email reset is not configured.

If the owner loses both the password and all recovery codes, recovery requires an authorized Cloudflare database administrator. Do not delete the owner, patients, or database. Verify ownership before performing an administrative password reset; never commit production credentials or recovery codes to GitHub.

## Deployment and verification

Run the repository's manual **Deploy MStyle to your Cloudflare account** workflow on `main`. Its verification job builds the app and runs both the clinical regression checks and `tests/users-access.mjs`. The deploy job applies D1 migrations before uploading the Worker. Keep the existing D1 and R2 bindings.

Local verification: `pnpm typecheck`, `pnpm build`, `pnpm test:independent`, `node tests/users-access.mjs`. Security tests run the built Worker in isolated Miniflare D1/R2 storage with fictional accounts and patients, including preservation of a pre-migration owner account and patient.


## Hormonal and embryology laboratories

Open **Laboratory panels** in the patient-list sidebar (`/lab`). The owner and clinical staff use their existing accounts; view-only clinical staff cannot save lab entries. Add staff in **Users & Access** with **Hormonal lab** or **Embryology lab**. These accounts have laboratory-only access, no general clinical files, registry, appointments, backups or user management, and must change their temporary password at first login. Existing role changes revoke sessions.

- **Hormonal lab:** saved requested hormones from wife/husband encounters, including β-hCG. Select requested tests, enter actual result date, value, units and reference range, **Save draft**, then **Submit saved draft**. Drafts do not replace the released result. Submission updates the original encounter order and its dispatch status. Corrections retain previous values and the staff identity. The saved report prints one selected encounter; attachments and non-hormonal tests remain in the doctor's existing workflow.
- **Embryology lab:** cycles become available after the doctor records actual OPU. Record ICSI/IVF counts, D1 fertilization and D2–D6 culture against permanent embryo IDs. Cryo supports several embryos in one straw with a grade for each, device ID and tank/canister/position. Fresh ET needs the doctor's confirmed Fresh ET plan. ET/cryo must first be saved as a draft, then submitted. Submitted corrections remain in the existing administrator-approved clinical workflow. Frozen/transferred embryos are protected against conflicting use. Performed FET is displayed against the source embryos; FET planning and thaw/transfer entry stay in the clinical chart in this first release.
- Each save checks the patient revision, preserves unrelated findings/medicines and attachment references, archives the previous snapshot and records a staff audit event. A conflict keeps the form open; refresh and review before retrying.
- Queue searches wife/husband names or the exact record UUID, 20 registered patients per page. Use Next to continue when a page has no lab requests. Reports contain saved entries only and can be printed or saved as PDF from the browser.

Deployment applies `0003_lab_panels.sql` without rebuilding staff tables or changing existing passwords. The constrained `lab_department` column extends the existing nurse base role; lab accounts are denied general clinical access by both stored permissions and the server. No staff accounts are created by deployment. Validation includes `node tests/lab-panels.mjs` with fictional data only.
