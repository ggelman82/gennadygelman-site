// Raises small text on the patient pages to readable sizes and enlarges
// small tap targets. Safe to re-run: it only raises sizes that are below the
// floor, so run it after adding a page or after build-patient-pages.mjs.
//
//   node scripts/readable-text.mjs
//
// Floors (body text on the site is 17px):
//   reading text 14px to under 16px  -> 16px
//   secondary text 12px to under 14px -> 14.5px
//   anything smaller                  -> 13px
//   small uppercase/monospace labels  -> at least 12px
//   form fields                       -> 16px (smaller makes iPhones zoom in)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const SCOPE = ['patients', 'flu'];
const MARK = '/* readability */';
const EXTRA = `${MARK}
.rk{min-height:40px;padding:6px 12px 6px 8px}
.fh-tg span{padding:10px 14px}
.jpp{white-space:normal}
.vnav a{padding:9px 14px}
`;

// Leave alone: the logo, and text drawn inside SVG diagrams (sized in drawing units).
const SKIP = /(^|[\s,>])(\.brand|\.mark)\b|\btext\b|svg/;

function* pages(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* pages(p);
    else if (name === 'index.html') yield p;
  }
}

function floor(px, sel, body) {
  const label = /uppercase|Mono/.test(body);
  if (/\b(input|textarea|select)\b/.test(sel)) return Math.max(px, 16);
  if (label) return Math.max(px, 12);
  if (px >= 16) return px;
  if (px >= 14) return 16;
  if (px >= 12) return 14.5;
  return 13;
}

function fixCss(css) {
  return css.replace(/([^{}]+)\{([^{}]*)\}/g, (rule, sel, body) => {
    if (SKIP.test(sel)) return rule;
    const out = body
      .replace(/(font-size:\s*)(\d+(?:\.\d+)?)px/g, (m, a, n) => `${a}${floor(+n, sel, body)}px`)
      .replace(/(font:\s*[^;{}]*?)(\d+(?:\.\d+)?)px/g, (m, a, n) => `${a}${floor(+n, sel, body)}px`)
      // rem sizes (1rem = 16px), used on the flu page
      .replace(/(font-size:\s*)(\d*\.?\d+)rem/g, (m, a, n) => { const px = floor(+n * 16, sel, body); return px === +n * 16 ? m : `${a}${+(px / 16).toFixed(3)}rem`; });
    return `${sel}{${out}}`;
  });
}

let changed = 0;
for (const dir of SCOPE) {
  for (const file of pages(join(ROOT, dir))) {
    const html = readFileSync(file, 'utf8');
    if (/http-equiv=["']?refresh/i.test(html.slice(0, 2000))) continue;
    let n = 0;
    let out = html.replace(/<style>([\s\S]*?)<\/style>/g, (m, css) => {
      let fixed = fixCss(css);
      if (n++ === 0 && !fixed.includes(MARK)) fixed += EXTRA;
      return `<style>${fixed}</style>`;
    });
    if (out !== html) { writeFileSync(file, out); changed++; console.log('/' + relative(ROOT, join(file, '..')).split(sep).join('/') + '/'); }
  }
}
console.log(`\n${changed} pages updated.`);
