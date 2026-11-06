# gennadygelman.com

Source for Gennady Gelman, MD's personal site.

- `main`: the live site (being migrated from ChatGPT Sites to GitHub Pages).
- `backup-2026-11-05`: untouched snapshot of the site as served by ChatGPT Sites on November 5, 2026.

Personal site, not affiliated with any employer.

## Patient topic pages

Each patient topic has its own page (`/patients/visit/`, `/patients/sick/`, `/patients/weight/`, `/patients/books/`, `/patients/apps/`; vaccines is hand-built at `/patients/vaccines/`). They are generated from the `PSECTIONS` list in `index.html`, which also drives the homepage tiles, search and the clinician QR codes. After editing a topic there, run:

    node scripts/build-patient-pages.mjs

Old links such as `gennadygelman.com/#p-weight` or `/#visit` (printed QR codes, texts) redirect to the matching page.
