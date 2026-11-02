# Patient history and first-visit layout

The patient file retains the original chief complaint first, all history editors, past tests, HSG, laparoscopy reports/attachments, hysteroscopy and genetics. Desktop history columns have equal widths; phones use one column. The mobile header remains sticky.

**Submit history** saves through the existing patient-file and online-save path. It displays recorded findings and hides empty/non-applicable history groups. It does not create or update an encounter. **Edit history** restores every original history section and its editing controls. **Past tests & reports** reveals the past-investigation sections, including laparoscopy and its attachment controls.

Normal and negative past investigation results are recorded findings. Their dates and reports remain visible; they must not be filtered as absent disease history. No stored clinical values or attachments are deleted by the display filter.

**First visit · Examination & ultrasound** appears after history as a separate section, containing general examination, pelvic examination, ultrasound and assessment/plan. **Save first visit** explicitly links these findings to the first-visit encounter summary, including C/C, vitals, examination, ultrasound/attachments, diagnosis and plan. Repeated saves and a correction to the first-visit date update that same encounter, preserving unrelated encounters. Independent edits made in the encounter cannot be overwritten by stale patient-file values. The chief complaint is not automatically marked confirmed. Simply viewing or submitting history never creates a visit.

Pregnancy-chart, procedure-request and final-report cards remain directly accessible below this section. ANC keeps its existing chart, date/visit links, reports and original validated save path; this correction does not change ANC data or controls. Duplicate FHR entry stays consolidated under ultrasound, with legacy values retained.

Verification uses fictional records, normal/negative past-test regression checks, separate history-submit and first-visit save checks, type checking, production build and existing clinical regressions. Publish through the owner-controlled manual Cloudflare deployment workflow on main. No database migration is required.
