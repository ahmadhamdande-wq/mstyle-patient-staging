# IVF workflow decisions

Stage navigation remains above the chart: Setup, Stimulation, Trigger, OPU, ICSI, Culture, ET / LPS, Cryo and deferred FET. ICSI, Culture and Cryo use separate tab panels with Edit, Save and printable reports, on both the OI and OPU screens. ET / LPS is its own tab within the original retrieval cycle.

## Implemented laboratory records

- Actual saved OPU is Day 0. ICSI / insemination records procedure date/time, embryologist, method (ICSI, IVF or split), sperm source/preparation/findings, injected and inseminated counts and notes. Retrieved and maturity counts come from OPU.
- Saving the procedure creates stable IDs scoped to the source cycle. Existing IDs are never removed by reducing a treatment count.
- Culture has D1 fertilization and D2–D6 assessment tabs. Unassessed days/rows stay blank. D1 supports 2PN, 0PN, 1PN, ≥3PN and degeneration. Later days record stage, cells, fragmentation, grade and notes. Each saved assessment has date/time and embryologist.
- A culture matrix reviews each embryo across all days and shows its recorded destination. Final disposition / corrections require a reason and retain history.
- Actual fresh ET selects embryo IDs from the same ledger and requires the selected count to match the recorded transfer count. Each selected embryo has a saved stage and grade at transfer, prefilled from that day’s culture when available and editable before recording. The ET details section is visible by default. Existing historical transfers without grading remain preserved. Its culture day assessment must exist. Frozen or finally disposed embryos cannot be used for fresh ET.
- Cryo records each embryo ID with actual freezing date/time, culture day, grade, device / straw, storage location, embryologist, method and notes. Culture assessment must precede freezing. Fresh transfer and freezing remaining embryos can coexist.
- Incorrect cryo entries may be voided with a reason; this is a recording correction, not a warming workflow. IDs and previous records remain in history.
- Dates, counts, cycle identity and exclusive transfer/freezing allocation are checked. Changes retain stage-specific history. Failed online saving keeps the editor available for retry. Tab/cycle changes guard unsaved entries.
- Legacy aggregate culture, frozen and transferred totals remain visible without invented per-embryo mappings. Identified inventory is reported separately when prior aggregate frozen totals exist. The previous culture summary and legacy courses are retained.

## Fresh ET / LPS

Fresh ET planning and LPS belong to the original OI/retrieval cycle. The actual saved OPU date is the automatic start for newly prescribed LPS. No drug, dose, route, frequency or duration is assumed. Fresh ET can be planned for D2–D6; performed ET is explicitly recorded. Extra post-ET medicines have a distinct schedule anchored to ET day or an entered number of days later.

Existing medicine dates remain recorded. If actual OPU or ET dates are corrected, resaving the continuation plan requires confirmation before moving existing medicine dates. Legacy separate fresh-ET courses remain retained; the integrated plan can read them. New identified fresh transfers use the integrated ET / LPS tab.

## Deferred

- Detailed FET chart redesign.
- Warming, inventory reservation and later FET embryo allocation / consumption.
- Mapping old aggregate frozen totals to individual stored embryo identities; no identities or storage locations are inferred.

## Post-OPU workflow refinement · 17 October 2026

- Only the slim stage navigation is displayed. Green with a checkmark means a saved completed stage. Culture finishes when every identified embryo has a final allocation/disposition; Cryo finishes when freezing is recorded and no embryo remains unallocated. A pending stage is not marked complete merely by opening it.
- ICSI procedure date defaults to the actual saved OPU date. Procedure time is entered separately, never assumed from OPU time. Existing procedure times are retained. The OPU date appears in the report.
- Setup transfer plan is provisional. Actual OPU can be completed with an Undecided plan. The OPU tab has a separate post-OPU decision box for Fresh ET / Freeze all / No transfer, with confirming doctor, notes, save/retry and correction history. New performed fresh transfers require confirmation; unchanged historical transfers remain retained.
- D2 displays the recorded D1 fertilization finding and initially focuses on recorded 2PN IDs. All other findings remain accessible; results and blank findings are never invented or overwritten by the filter.
- Cryopreservation is available on every existing culture day, D1–D6, including 2PN freezing on D1. A saved assessment must precede freezing. Freezing and fresh ET remain mutually exclusive for the same ID.
- A new, untouched monitoring encounter after recorded OPU does not block laboratory editing. Actual unsaved OI field changes continue to block stage saves/navigation until saved.

## Shared-straw freezing · 17 October 2026

- The slim stage bar is immediately below the saved cycle setup card, at the former staging-strip position. The duplicate old strip remains removed; completion colors and stage navigation are retained.
- Cryo has D2–D6 day controls, a list of selectable embryo IDs and an individual freezing grade for each selected embryo. Multiple embryos can share one straw / device ID, actual freezing date/time, tank, canister/cane, position/goblet, embryologist, method and notes.
- Day selection supplies the expected date from actual OPU; the actual freezing time is entered explicitly. Existing D1/2PN cryo records remain readable and correctable.
- All selected embryos validate before one cycle update is written. One invalid embryo or missing grade prevents a partial batch save. Retries update the same embryo allocations and do not duplicate inventory.
- Saved inventory and reports group embryos by straw and location while preserving individual IDs, grades and history. A whole straw can be reopened for correction. Location changes for an existing straw require selecting all its recorded embryos together.
- Existing individual cryo records and free-text locations remain readable without inferred location components. Incorrect individual records may still be voided with a reason; other embryos sharing that straw remain recorded.
- Warming and later FET reservation/consumption remain deferred.


### Active culture after recorded outcomes
Culture day lists hide IDs with recorded 0PN, degeneration, arrest, performed fresh transfer, freezing, or final disposition from their recorded day onward. Show ended / transferred embryos reveals preserved history; original-day observations remain correctable through Edit, while later legacy observations are read-only and retained during saves. New observations, freezing and transfers reject ended candidates. Only exact linked transfer IDs are removed; aggregate legacy transfer counts show a prompt to link IDs in ET / LPS. No patient IDs, physical disposal or clinical outcomes are inferred. Mixed D3 freezing and continued D5 culture remain independent per ID.

### Numbered retrievals and embryo accumulation
Patient file and IVF chart buttons show numbered cycles with separate stimulation-completed/lab-pending and fully completed states. Regular cycle saves persist stable patient-scoped numbering; archived cycles retain their place. Saved cycles can start or join an ongoing accumulation plan. A next collection action creates a distinct planned cycle and IVF encounter with no copied injections, OPU or lab outcomes; online retry reuses that cycle. Each retrieval retains original embryo IDs. Combined inventory shows cycle-qualified IDs, freezing day/grade, straw and location. Collection completion requires finalized lab outcomes for linked nonarchived retrievals. FET preparation can select frozen embryo identities across the linked plan, stores source snapshots, rejects duplicate reservations and previously performed FET use, and validates selected count and timing at performed transfer. Planning does not record warming. Historic aggregate counts remain unlinked rather than inventing embryo identities. All original cycle/ANC/lab records are retained.

### Long agonist CD21 and historical stimulation dates
Long agonist setup records the preceding actual LMP separately from the next period. CD21 is calculated as that preceding LMP +20 days; agonist drug/dose/unit/route is explicitly Planned or Given, with an actual administration date required for Given. Saving this plan is possible while SD1 is unknown and creates no scan or gonadotropin administration. Next-period CD2/CD3, 14 days after recorded agonist, or manual start produce a proposal; the doctor explicitly confirms SD1. If the next period/CD is unknown, an independently confirmed SD1 uses stimulation days without inventing an LMP/CD. One compact preceding-cycle CD21 agonist column appears immediately before SD1 on desktop, mobile and reports, with actual dates and no intervening blank columns. Historical charts anchor on saved stimulationStart, and changing cycle/date resets prior week offset. Date corrections retain actual scheduled doses and observations, require review when changing an established SD1, and cannot shift SD1 after recorded trigger/OPU/lab. Pending plan edits block chart/stage navigation and offer online retry. Antagonist and its existing down-regulation-by-date/CD flow are unchanged.
