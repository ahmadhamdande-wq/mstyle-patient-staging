# New Style — baseline checkpoint

The clinical screens are unchanged at this checkpoint.
Previous published version: 45.
Original source: 6bf7ef76d8f4d293945c328d242c1e78e33cabe2.

New Style development starts from this preserved state.

## New Style implementation

Preserved baseline version: 46. Source: 665f79b4b1cb75740c3024f582b87658d76a7b28.

- Compact square corners and paper-style yellow OI grid; blue gonadotropin, cyan down regulation, green events and red alerts. Separate injection rows; horizontal desktop and stacked mobile.
- Start OI-only or IVF from patient file and encounter even when the chief complaint differs. Open latest course or create a separate new course; saved new-course URLs retain their linked course after reload.
- Back and Go to patient file navigation with unsaved-entry and online-save guards, including OPU, FET and ET/LPS screens. No duplicate patient-file button on the files themselves.
- Injection regimens retain dose, route, dates, number of days, instructions and editable time. New-entry defaults are 08:00 down regulation and 18:00 gonadotropins (Baghdad time); old regimens keep unspecified time. Comma doses such as 0,25 save as 0.25. Saved chart prescriptions are previewable and printable.
- E2–P4–LH current-visit requests stay drafts until Save check-up; next-visit profile selects those three tests. Earlier visits, records and ANC links remain stored.
- Cycle summary stages and collapsible saved change history. Clinician label is entered clinical data, not proof of authenticated staff identity.

## Optional image transcription

The personal program has an authenticated /api/ai-import endpoint using the OpenAI Responses API with strict JSON schema, image inputs and store:false. It requires private server runtime secrets OPENAI_API_KEY and OPENAI_IMPORT_MODEL. Neither is configured by this edition. Do not place keys in HTML, JavaScript, patient records or exported copies. The center demo displays connection status only and has no AI credentials/backend.

The clinician explicitly consents to sending selected images, reviews an editable draft, selects individual fields, then applies them to an unsaved form. Nothing is saved automatically, no diagnosis or dose is inferred, and invalid/unclear dates are flagged. Existing-patient identity changes require confirmation. A separate secure API setup is required before live transcription can be tested.

## Verification

Node logic fixtures cover chart save/reopen, independent injection doses/times and printable content, changed regimens, on-demand course creation, repeated new-course URL reopening, scoped navigation, save failure guards, explicit AI draft review and extraction validation. Build, private database ownership/attachments/version-conflict checks, ANC summaries/reports and previous treatment/prescription-group regressions are checked before publication. No live browser visual/physical printer verification or live AI call was available in this environment.

## Treatment and ANC update — 11 October 2026

- One Start treatment action offers Start OI for IVF and Start OI only, plus new/continue course; older duplicate chart buttons removed. Available regardless of chief complaint, including saved/read-only files.
- Trigger injections use a separate saved category, dropdown and Add drug field, while retaining original triggers and the existing date/time, dose and confirmed OPU workflow.
- OI start date plus starting cycle day calculates LMP (start date − (CD − 1) days). The source is explicitly labelled calculated. Correcting LMP updates the starting CD. No historical entered LMP is changed merely by viewing a saved chart.
- Edit ANC chart opens initial dating and saved findings/ultrasound editors. Successful save returns compact summaries; failed online saving remains editable. Ended pregnancy history is retained.
- Verified new form save/reopen, calculated/edited dating source, trigger lists, new treatment choices and ANC edit/save with Node fixtures; existing ANC and prescription regressions passed. Browser visual QA remains unavailable.
