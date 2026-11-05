# Internal laboratory, next visits and patient access

This update stays in the independent owner-controlled Cloudflare application. No live accounts, patient records or email settings are created by the source change.

## Staff workflow

- In a patient, husband, encounter or IVF screen, choose **Internal lab / next visit** in the shared header. Save existing edits before opening it. Select the correct saved wife/husband encounter. Internal test requests remain available after the clinical file is saved.
- Existing general test/investigation selection also has **Edit requests** inside the encounter Orders tab. It unlocks the order section without unlocking the history/examination.
- All tests in an internal request share the request date/time. The hormonal laboratory selects the requested tests, enters results with one shared actual result date/time, saves a draft, then submits it.
- The laboratory catalogue uses the owner-supplied reference values and corrected units (LH/FSH IU/L; TSH mIU/L). The supplied ranges came from a female report; husband requests retain the units but leave the reference range blank for the laboratory to enter its appropriate range. These are laboratory catalogue ranges, not an automatic clinical interpretation. The IVF chart shows numeric hormone values; units stay in the entry box.
- Submitted E2, P4, LH and FSH results fill the matching dated, actual monitoring encounter. They do not create an attended visit. Results received before monitoring remain pending synchronization until that encounter is recorded. Existing differing clinician values are preserved and marked **Conflict**. Review the result and edit the chart explicitly to reconcile. Server synchronization requests a safe reopen of the file.
- A doctor approves the next IVF date and its future tests. The planned encounter and laboratory tasks remain **Time pending reception**. Reception confirms time from Appointments; it cannot change the approved date through this action. Patient portal alerts and the laboratory schedule update after time confirmation. Scheduling does not complete a visit or enter a result.
- To change an approved future date, the doctor selects the original visit, cancels its future appointment/pending tests, then approves a new date. Completed results remain in their original encounter; cancellation is unavailable after attendance.
- Reception sees patient appointment requests separately and marks them reviewed/declined. A portal request does not create an approved appointment automatically.

## Embryology

The panel includes a read-only patient history summary, especially obstetric history, and the husband's saved SFA summary. **Semen preparation** records source, method, sample number, post-preparation volume, concentration, motility, normal/abnormal forms, comments, performing embryologist and witness. It stays linked to the retrieval cycle and husband. Performing names may be entered independently from the logged-in account; the saving account is retained in the audit trail. The OPU and confirmed transfer/freeze-all decision remain visible. Only available normally fertilized 2PN embryos can be selected after D1; excluded historical entries remain accessible.

## Owner-controlled account recovery

In **Users & Access → Username / recovery email**, the owner can change a username or register the staff recovery email after confirming the administrator password. Existing role controls, deactivation and temporary passwords remain available. A username must still be unique. The owner may register their own recovery email without removing owner protection.

Staff use **Forgot username or password?** on the login page. Only active accounts with an owner-registered recovery email can receive instructions. Password links expire after 30 minutes, are single-use and are tied to the current account email/version. Resetting a password invalidates previous sessions. Owner recovery codes remain available as a separate fallback.

## Patient portal

Staff open **Internal lab / next visit → Patient portal · email & result release** for a scoped patient. Only the owner registers/changes/deactivates the patient email, with current administrator password confirmation. The owner then explicitly sends the setup link. The patient verifies access to that mailbox by setting a password through the link.

Patients sign in at `/portal` with a separate patient cookie/session. Staff cookies do not grant patient access; patient cookies do not grant staff access. The portal does not return the clinical snapshot, internal embryo details or husband results. It shows:

- Explicitly released wife laboratory results, units, references, result date/time and approved PDF/image attachments.
- A concise clinician-authored and approved IVF summary.
- GA weeks/days from an explicitly released active ANC pregnancy's approved EDD. Changed dating or a closed pregnancy withdraws that dating until reviewed.
- Appointments, reception-confirmed time alerts, and appointment/reschedule requests subject to clinic approval.

Each lab release is bound to the exact result reviewed. Corrected results disappear from the portal until approved again. Clinicians may withdraw releases. Reports require patient authentication and an active matching release on each request. In-app portal alerts refresh every minute while the page is visible; browser push/SMS/email appointment notifications are not configured by this update.

## Email delivery configuration

Configure the Cloudflare Worker secrets `RESEND_API_KEY` and `EMAIL_FROM` using an owner-verified sending address/domain. The code calls Resend's official send-email endpoint. No API key or sender is committed. Email setup/reset links cannot be delivered until this is configured. Public recovery responses remain generic to avoid disclosing registered emails; the owner's explicit invitation action reports delivery/configuration failures. Owner temporary passwords and existing recovery codes remain available.

Deploy through the repository's existing **Deploy MStyle to your Cloudflare account** workflow. The workflow applies additive migration `0004_portal_workflow.sql` before deploying. It adds recovery-email, token, separate portal-account/session, release and patient-request tables. No patient data exports are committed.

## Verification

`npm run typecheck`, `npm run build`, `node tests/clinic-workflow.mjs`, `node tests/lab-panels.mjs`, plus the existing IVF, embryology, history, security, loading and independent application regression checks. Integration fixtures use fictional records and isolated local D1/R2 only. Actual external email delivery requires configuration and a controlled owner test after deployment.
