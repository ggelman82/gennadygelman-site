# gennadygelman.com

Source for Gennady Gelman, MD's personal site.

- `main`: the live site (being migrated from ChatGPT Sites to GitHub Pages).
- `backup-2026-11-05`: untouched snapshot of the site as served by ChatGPT Sites on November 5, 2026.

Personal site, not affiliated with any employer.

## Patient topic pages

Each patient topic has its own page (`/patients/visit/`, `/patients/sick/`, `/patients/weight/`, `/patients/books/`, `/patients/ai/`, `/patients/apps/`; vaccines is hand-built at `/patients/vaccines/`). They are generated from the `PSECTIONS` list in `index.html`, which also drives the homepage tiles, search and the clinician QR codes. After editing a topic there, run:

    node scripts/build-patient-pages.mjs

Old links such as `gennadygelman.com/#p-weight` or `/#visit` (printed QR codes, texts) redirect to the matching page.

## Card icons

Card icons come from `scripts/glyphs.json` (48×48 two-color SVG glyphs: strokes use `currentColor`, shapes with `class="f"` take the card's accent). In `PSECTIONS`, give an item `ic:'<glyph name>'` to show one.

## Link previews and sitemap

After adding or removing a page, run:

    node scripts/readable-text.mjs
    node scripts/add-link-previews.mjs
    node scripts/build-sitemap.mjs
    node scripts/build-search-index.mjs

The first raises small text on the patient pages to a 16px floor (12px for the small uppercase labels); the second adds link-preview tags to any page missing them; the third rewrites `sitemap.xml` and `robots.txt`; the fourth rebuilds `search-index.json`, which powers the search box on every page (`js/search.js`). A new hand-built page also needs `<script src="/js/search.js?v=1" defer></script>` before `</body>`. Run `readable-text.mjs` again after `build-patient-pages.mjs`, which regenerates pages at the old sizes.

## Clinician hub

The clinician tiles live in the home page's clinician view (`/#clinician`). `/tools/` redirects there. `/professional/` is a separate library page with its own content.
