# Patient registry development preview

Development branch only. This is not the published clinic version.

- Compact blue/teal sidebar, registry filters, and a registration-details review panel.
- Existing clinical-file, current-visit, offline-copy, appointments, and registration links remain connected to their existing destinations.
- Demo preparation is now an explicit action, instead of a POST and second registry fetch on every home-page visit.
- Image import loads only when registration opens.
- Clinical HTML and API data remain no-store. Content-versioned JavaScript/CSS responses use private browser caching; static requests still pass existing authorization. Requests without the correct content version remain no-store.
- Tests cover cache header boundaries, authentication, saving, backup/restore, and the existing IVF injection workflows.

No measured live speed improvement is claimed. The next performance step is a browser trace with fictional records on the owner's deployment, followed by clinical-page rendering and attachment-loading measurements.

The standalone HTML preview uses fictional records and supports search, IVF/ANC filtering, and patient review. Clinical/administrative navigation in that preview is illustrative; the development application's original links remain operational.

This first phase covers the registry/workspace landing page. Persistent navigation within the clinical history, IVF and ANC pages is future work, after visual approval and navigation/unsaved-change tests.
