// Writes /sitemap.xml listing every public page, and /robots.txt pointing to it.
// Re-run after adding or removing a page:
//
//   node scripts/build-sitemap.mjs
//
// Redirect stubs and pages marked noindex are left out.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const ORIGIN = 'https://gennadygelman.com';

function* pages(dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* pages(p);
    else if (name === 'index.html') yield p;
  }
}

const urls = [];
for (const file of pages(ROOT)) {
  const html = readFileSync(file, 'utf8');
  const head = html.slice(0, html.search(/<\/head>/i));
  if (/http-equiv=["']?refresh/i.test(head) || /name=["']?robots["']?[^>]*noindex/i.test(head)) continue;
  const dir = relative(ROOT, join(file, '..')).split(sep).join('/');
  urls.push(ORIGIN + (dir ? `/${dir}/` : '/'));
}
urls.sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b));

writeFileSync(join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
console.log(`sitemap.xml: ${urls.length} pages\nrobots.txt written`);
