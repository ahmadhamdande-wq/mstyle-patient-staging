## Current status — 15 October 2026

Mstyle Personal is now the sole active clinic. The two center demos and New Style personal have closed notices; their source and records are retained. Future changes apply only here unless reactivation is explicitly requested.

# MStyle edition

MStyle is a separate edition of Dr Hamdan's clinic program. The existing New Style personal and center copies remain available and unchanged by this build.

- One clinical command bar groups original actions in dropdowns.
- Wife and Husband are two sheets within the same couple file.
- Patient history stays expanded in the established order.
- Requests/results/reports open in working panels over the expanded patient sheet.
- ANC retains all clinical findings and BP in its visit table.
- IVF retains stage navigation, medication colors, daily editing, saved schedules and alerts.
- Existing edit/save, online retry, printing and attachments remain in use.

## Storage

Each edition currently has a separate data store. The MStyle personal program uses its own owner-scoped D1/R2 database; the MStyle center demo stores its demo records locally in the browser at its own origin. No patient records have been copied from New Style, and no credentials are stored in source. A future shared-record interface can support choosing either layout without changing the clinical record.

## Edition links

New Style personal: https://hamdan-personal-clinic.c5ynhkxyd8.chatgpt.site
New Style center: https://hamdan-patient-history-demo.c5ynhkxyd8.chatgpt.site
MStyle personal: https://hamdan-mstyle-personal.c5ynhkxyd8.chatgpt.site
MStyle center: https://hamdan-mstyle-center.c5ynhkxyd8.chatgpt.site

The MStyle sites start owner-private. Existing New Style audiences have not changed.

## Updates synchronized — 14 October 2026

Compared all shared clinical assets and server files with the latest New Style personal and center copies. All 13–14 October functional fixes are present, including trigger-only saving and confirmed OPU scheduling/arrival printouts, compact gonadotropin entries, and linked patient/treatment navigation.

Added compact initial ANC ultrasound (scan GA, CRL, fetal heart, fetus count, heartbeat and notes), clear dating approval, BP alerts at systolic ≥140 or diastolic ≥90 with severe-range indication, and the patient/encounter-scoped saved-results side panel. MStyle toolbar provides separate View encounter results and Enter/edit results commands. Expanded patient history, Wife/Husband sheets, MStyle menus and Mac styling remain independent. No clinical records were transferred between editions.

Validation: shared functional asset parity, JavaScript parsing, MStyle toolbar/mobile/ANC assembly, trigger save, OPU scheduling/print, scan field save/reopen, BP thresholds, result scoping and existing report/summary checks passed. Browser visual verification was unavailable.

## Clinic workflow update — 14 October 2026

Added a green Add to chart action beside each gonadotropin entry, with draft feedback before saving. The summary injection shortcut was removed; saved IVF setup stays dark blue in one desktop row. Hormone results can save without units, retaining empty units and withholding unit-dependent clinical thresholds until units are known.

Only the OI chart table expands in the corner-controlled dialog. Patient history is available in a right-edge slideout on patient records, ANC, IVF, OI, transfer and other encounters, with separate wife/husband views. The history uses saved clinical fields and preserves important flags. A Patient list button is visible in the top action bar on all MStyle screens. Patient-file treatment buttons open their saved episodes; FET/ET routing carries the exact course ID and ANC uses its latest linked encounter. Navigation retains the existing unsaved-change guard.

Validation: draft injection action, number-only hormone save/reopen and subsequent unit-aware alerts, table-only expansion/collapse, history content, section assembly, active ANC/IVF and FET navigation, existing ANC results/persistence, OPU print and MStyle toolbar checks passed. Browser visual verification was unavailable.

## Approved clinic workflow update 15 October 2026

Applied to Mstyle Personal only. Contact identity now retains file number, patient mobile, city, district, address and email. The home patient list includes searchable mobile/address and compact new-couple input. Reminder preferences and patient consent are stored only; no messaging service, automated task or sending is configured.

Section Edit actions are available from one Edit toolbar menu, invoking their original handlers. Existing section data, save/leave guards and dynamic rows remain intact. Cervical assessment uses its original controls and per-encounter save handlers directly inside the ANC ultrasound card.

OPU and folliculometry side shortcuts open day/week tables with stable file number, patient name, mobile, date/time, arrival and cycle-derived fertilisation/PGT procedure. Both local appointment manager and clinic-wide page print exactly the selected list/period. Confirmed trigger requirements and the two-hour OPU arrival calculation are retained.

Specialist Consultation is available beside Procedures. Referrals retain person, patient record and source encounter; include an editable saved-history summary and selected completed results; print saved dated letters; and retain reply attachments, recommendations and Requested/Awaiting reply/Completed status. They use the owner-scoped snapshot and R2 attachment workflow. No consultation letters are sent externally.

Validation includes source parsing, contact and referral logic, day/week list contents, toolbar routing, direct cervical field placement, existing trigger/OPU/procedure/ANC regressions, private database save/reopen, attachment round-trip and owner isolation. Browser visual and physical-printer verification are unavailable.
