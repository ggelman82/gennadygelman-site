// Writes /search-index.json, used by /js/search.js for the search box on every page.
// Re-run after adding, removing or substantially editing a page:
//
//   node scripts/build-search-index.mjs
//
// Each entry: u (path), t (title), d (description), a (audience: p patients,
// c clinicians, k words and ideas), s (section labels with anchors), k (word bag).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const unesc = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const text = s => unesc(s.replace(/<(script|style|svg)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const STOP = new Set('about after also been before being both could does each every from have here into just more most much only other over same should some such than that their them then there these they this those through very what when where which while will with would your yours'.split(' '));

function* pages(dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* pages(p);
    else if (name === 'index.html') yield p;
  }
}

const out = [];
for (const file of pages(ROOT)) {
  const html = readFileSync(file, 'utf8');
  const head = html.slice(0, html.search(/<\/head>/i));
  if (/http-equiv=["']?refresh/i.test(head) || /name=["']?robots["']?[^>]*noindex/i.test(head)) continue;
  const dir = relative(ROOT, join(file, '..')).split(sep).join('/');
  if (!dir) continue; // the home page is the search's starting point, not a result
  const u = `/${dir}/`;
  const titleM = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleM) continue;
  const t = unesc(titleM[1].trim()).replace(/\s+-\s+Gennady Gelman$/, '');
  const descM = head.match(/<meta\s+name=["']?description["']?\s+content="([^"]*)"/i);
  const a = /^(patients|flu)(\/|$)/.test(dir) ? 'p' : /^(tools|professional)(\/|$)/.test(dir) ? 'c' : 'k';
  const bodyStart = html.search(/<(main|article)\b/i);
  const body = bodyStart > -1 ? html.slice(bodyStart) : html.slice(html.search(/<body/i));
  const s = [];
  for (const m of body.matchAll(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/g)) {
    if (/data-toc-skip/.test(m[1])) continue;
    const label = (m[1].match(/data-toc="([^"]*)"/) || [])[1] || text(m[2]).replace(/[.:]$/, '');
    const id = (m[1].match(/\bid="([^"]*)"/) || [])[1] || '';
    if (label && !/^(Further reading|Sources|Key points)$/i.test(label)) s.push([unesc(label), id]);
  }
  const seen = new Set();
  for (const w of text(body).toLowerCase().match(/[a-z][a-z0-9'’-]{3,}/g) || []) {
    if (!STOP.has(w)) seen.add(w.replace(/[’']s$/, ''));
    if (seen.size >= 900) break;
  }
  out.push({ u, t, d: descM ? unesc(descM[1]) : '', a, s, k: [...seen].join(' ') });
}
out.sort((x, y) => x.u.localeCompare(y.u));
writeFileSync(join(ROOT, 'search-index.json'), JSON.stringify(out));
console.log(`search-index.json: ${out.length} pages, ${Math.round(JSON.stringify(out).length / 1024)} KB`);
