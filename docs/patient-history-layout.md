# Patient history and ANC entry layout

The wife patient file starts with the original chief-complaint editor and saved summary. Multiple complaints, complaint details, infertility type and duration keep their existing data fields. The C/C summary uses clear 22px text and a quiet teal emphasis.

Submitted history uses two equal-width columns on desktop and one column on phones. Negative/empty history groups and zero-only summary rows are hidden in saved view. Edit restores the original controls; no clinical values are deleted to make the page compact. Long positive histories can expand naturally.

Current examination, pelvic examination, ultrasound and assessment/plan are grouped at the end of the overview. Pregnancy chart, procedure requests and report links remain available in a disclosure above this section.

**Save this visit** explicitly saves the entered examination to the selected visit date and creates an encounter summary. It includes C/C, vital measurements, clinical examination, ultrasound findings/attachments, diagnosis and plan. Saving again updates that linked encounter. Changing the date creates a separate dated encounter. Merely viewing/rendering the file never creates an encounter. If the linked encounter has been edited separately, the patient file refuses to overwrite it; use **View encounter summary** to review it. The chief complaint is not automatically marked as confirmed in the encounter.

ANC retains the existing pregnancy chart, dating approval, visit/date links, reports, medication column, cervical assessment and ultrasound/biometry controls. Compact coloured entry boxes group symptoms/C/C, examination and plan/comments; ultrasound uses its original editor. Save continues through the original validated ANC save path and online-save check.

Duplicate FHR inputs are hidden in active examination entry, with FHR shown in ultrasound only. Previously saved examination FHR values remain in storage and appear as previous recordings in the ultrasound summary. Ultrasound measurements are never invented from those legacy values.

Verification: `node tests/history-visit-design.mjs`, the existing ANC and clinical regression checks, type checking, production build, isolated built-Worker authentication/backup tests, and browser checks with fictional records. Publish through the existing manual Cloudflare deployment workflow on main; this change requires no new database migration.
