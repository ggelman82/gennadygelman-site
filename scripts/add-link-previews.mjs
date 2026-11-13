// Adds link-preview (Open Graph / Twitter card) tags, a canonical link and,
// where missing, a meta description to every public page.
// Safe to re-run: it only adds tags a page does not already have.
//
//   node scripts/add-link-previews.mjs
//
// The title comes from each page's <title>; the description from its
// <meta name="description">, or from FALLBACK_DESC below when it has none.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const ORIGIN = 'https://gennadygelman.com';
const SITE = 'Gennady Gelman, MD';
const IMAGE = `${ORIGIN}/og-image.png`;
const IMAGE_ALT = 'Gennady Gelman, MD. Guides, tools and ideas from a family doctor.';

// Pages with no <meta name="description"> of their own.
const FALLBACK_DESC = {
  '/tools/cv-risk/': 'Paste an Epic SmartPhrase; get PREVENT risk, lipid targets and risk enhancers.',
  '/tools/lab-analyzer/': 'Paste lab results; get calculated relationships and pattern-level interpretation.',
  '/tools/raf-calculator/': 'V28 risk adjustment from demographics and an Epic-style problem list.',
  '/tools/immunizations/': 'Paste an Epic immunization history and date of birth to review what is due.',
  '/tools/diabetes-type/': 'Autoantibodies, C-peptide and family history to sort the type of diabetes.',
  '/kiloday/': 'A rational alternative to birthdays: celebrate every 1,000 days.',
  '/medicolalia/no-1/': 'Migraines: the headache is only half the story. Where the word comes from and what it tells us.',
};

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const unesc = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function* pages(dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* pages(p);
    else if (name === 'index.html') yield p;
  }
}

let changed = 0, skipped = 0;
for (const file of pages(ROOT)) {
  let html = readFileSync(file, 'utf8');
  const head = html.slice(0, html.search(/<\/head>/i));
  // Redirect stubs and pages kept out of search get no preview.
  if (/http-equiv=["']?refresh/i.test(head) || /name=["']?robots["']?[^>]*noindex/i.test(head)) { skipped++; continue; }

  const titleM = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleM) { skipped++; continue; }

  const dir = relative(ROOT, join(file, '..')).split(sep).join('/');
  const path = dir ? `/${dir}/` : '/';
  const url = ORIGIN + path;

  let title = unesc(titleM[1].trim()).replace(/\s+-\s+Gennady Gelman$/, '');
  if (path === '/') title = SITE;

  const descM = head.match(/<meta\s+name=["']?description["']?\s+content="([^"]*)"/i);
  const desc = descM ? unesc(descM[1]) : FALLBACK_DESC[path];
  if (!desc) { console.warn(`no description, skipped: ${path}`); skipped++; continue; }

  const has = re => re.test(head);
  const add = [];
  if (!descM) add.push(`<meta name="description" content="${esc(desc)}">`);
  if (!has(/rel=["']?canonical/i)) add.push(`<link rel="canonical" href="${url}">`);
  const og = (prop, content) => { if (!has(new RegExp(`property=["']?${prop}["'\\s>]`, 'i'))) add.push(`<meta property="${prop}" content="${esc(content)}">`); };
  og('og:type', path.startsWith('/medicolalia/no-') ? 'article' : 'website');
  og('og:site_name', SITE);
  og('og:title', title);
  og('og:description', desc);
  og('og:url', url);
  og('og:image', IMAGE);
  og('og:image:width', '1200');
  og('og:image:height', '630');
  og('og:image:alt', IMAGE_ALT);
  if (!has(/name=["']?twitter:card/i)) add.push('<meta name="twitter:card" content="summary_large_image">');

  if (!add.length) continue;
  // Put the tags right after <title>, or at the end of <head> when the title sits outside it.
  const titleInHead = /<\/title>/i.test(head);
  html = titleInHead
    ? html.replace(/<\/title>/i, m => `${m}\n${add.join('\n')}`)
    : html.replace(/<\/head>/i, m => `\n${add.join('\n')}\n${m}`);
  writeFileSync(file, html);
  changed++;
  console.log(`${path}  +${add.length}`);
}
console.log(`\n${changed} pages updated, ${skipped} skipped (redirects, noindex).`);
