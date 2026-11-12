// Builds one standalone page per patient topic (e.g. /patients/weight/) from the
// PSECTIONS list in /index.html, so the homepage and the topic pages never drift.
//
//   node scripts/build-patient-pages.mjs
//
// Edit topics, links and descriptions in index.html (PSECTIONS), then re-run this.
// The vaccines and screening topics are skipped: /patients/vaccines/ and
// /patients/screening/ are hand-built pages.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://gennadygelman.com';
const home = readFileSync(join(ROOT, 'index.html'), 'utf8');

const grab = (startMark, endMark) => {
  const a = home.indexOf(startMark);
  if (a < 0) throw new Error('not found in index.html: ' + startMark);
  const b = home.indexOf(endMark, a);
  if (b < 0) throw new Error('no end for: ' + startMark);
  return home.slice(a, b + endMark.length);
};
const data = new Function(
  `const B='';\n${grab('const PSECTIONS = [', '\n  ];')}\n${grab('const ICONS = {', '\n  };')}\n${grab('const ACCENT = {', '};')}\nreturn {PSECTIONS, ICONS, ACCENT};`
)();
const { PSECTIONS, ICONS, ACCENT } = data;

const SHORT = { visit: 'Plan your visit', vaccines: 'Vaccines', screening: 'Cancer screening', sick: 'Feeling sick', weight: 'Weight loss', books: 'Books', ai: 'AI tools', phone: 'Apps' };
// Shared two-color card icons (also used by the Python-built pages).
const GLYPHS = JSON.parse(readFileSync(join(ROOT, 'scripts', 'glyphs.json'), 'utf8'));
const gi = (name, acc) => name && GLYPHS[name] ? `<svg class="gi" viewBox="0 0 48 48" aria-hidden="true" style="--a:${acc}">${GLYPHS[name]}</svg>` : '';
const SKIP = new Set(['vaccines', 'screening']);

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const strip = s => String(s).replace(/<[^>]+>/g, '');
const ext = u => /^https?:/.test(u);
const linkAttrs = u => (ext(u) ? ' target="_blank" rel="noopener"' : '');
// Short address shown under each link when the page is printed as a handout.
const printUrl = u => {
  let s = ext(u) ? u.replace(/^https?:\/\/(www\.)?/, '') : 'gennadygelman.com' + u;
  s = s.replace(/\/$/, '');
  return s.length > 64 ? s.slice(0, 61) + '…' : s;
};
const icon = id => `<svg class="ic" viewBox="0 0 48 48" aria-hidden="true" style="--a:${ACCENT[id]}">${ICONS[id] || ''}</svg>`;

const appHTML = it => `<div class="pc app">${gi(it.ic, CUR_ACC)}<span class="top"><span class="nm">${it.u ? `<a href="${it.u}"${linkAttrs(it.u)}>${esc(it.n)} ↗</a>` : esc(it.n)}</span></span><span class="ds">${esc(it.d)}</span>${it.note ? `<span class="ds nt">${esc(it.note)}</span>` : ''}<span class="stores"><a href="${it.ios}" target="_blank" rel="noopener">${esc(it.iosL || 'iPhone')} ↗</a><a href="${it.android}" target="_blank" rel="noopener">${esc(it.andL || 'Android')} ↗</a></span></div>`;
const cardHTML = it => {
  if (it.plan) return PREP;
  if (it.cov) return `<a class="pc bookc" href="${it.u}" data-url="${esc(printUrl(it.u))}"><span class="cv"><img src="${it.cov}" alt="Cover of ${esc(it.n)}" width="200" height="300" loading="lazy"></span><span class="nm">${esc(it.n)}</span><span class="ds">${esc(it.d)}</span></a>`;
  return `<a class="pc${it.f ? ' feature' : ''}"${it.tint ? ` style="--tint:${it.tint}"` : ''} href="${it.u}"${linkAttrs(it.u)} data-url="${esc(printUrl(it.u))}">${gi(it.ic, CUR_ACC)}<span class="top"><span class="nm">${esc(it.n)}</span><span class="x">${ext(it.u) ? '↗' : '→'}</span></span><span class="ds">${esc(it.d)}</span></a>`;
};
let CUR_ACC = '#3b54c4';
const groupHTML = items => items.map(it => (it.g ? `<h2 class="cg">${esc(it.g)}</h2>` : '') + (it.ios ? appHTML(it) : cardHTML(it))).join('');

// ---------- visit agenda builder (only on /patients/visit/) ----------
const PREP = `<section class="prep" id="prep" aria-labelledby="prepH">
    <div class="prep-form">
      <p class="k">Before your visit</p>
      <h2 id="prepH">Make your appointment count.</h2>
      <p class="sub">Visits are short. Writing down your top concern ahead of time helps us get to what matters most. Fill in what applies and bring the result with you.</p>
      <label for="f1">The one thing I most want to talk about</label>
      <input id="f1" maxlength="160" placeholder="e.g. tired all the time for two months">
      <div class="row">
        <div><label for="f2">Something else <span>(optional)</span></label><input id="f2" maxlength="120"></div>
        <div><label for="f3">One more <span>(optional)</span></label><input id="f3" maxlength="120"></div>
      </div>
      <label for="f4">Questions about my medicines <span>(refills, side effects, cost)</span></label>
      <textarea id="f4" maxlength="400"></textarea>
      <label for="f5">What's changed since my last visit <span>(ER visits, new specialists, new symptoms)</span></label>
      <textarea id="f5" maxlength="400"></textarea>
      <p class="priv"><span aria-hidden="true">●</span> Stays on your device. Nothing you type is saved or sent anywhere.</p>
    </div>
    <div class="card-side">
      <div class="agenda" id="agenda" aria-live="polite">
        <h3>My visit agenda</h3>
        <p class="when" id="agWhen"></p>
        <div id="agBody"></div>
      </div>
      <div class="actions">
        <button class="btn" id="agCopy" type="button" disabled>Copy for MyChart</button>
        <button class="btn ghost" id="agPrint" type="button" disabled>Print</button>
        <button class="btn ghost" id="agClear" type="button">Clear</button>
      </div>
      <p class="tip">Tip: paste it into a MyChart message a day or two before your appointment, or show it to whoever rooms you.</p>
    </div>
  </section>`;
const PREP_JS = `<script>(function(){
  var $=function(s){return document.querySelector(s)};
  if(!$('#prep')) return;
  var esc=function(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  var lines=function(s){return s.split(/\\n+/).map(function(x){return x.trim()}).filter(Boolean)};
  var F=['f1','f2','f3','f4','f5'].map(function(id){return $('#'+id)});
  function vals(){return F.map(function(f){return f.value.trim()})}
  function agendaText(){
    var v=vals(),concerns=v.slice(0,3).filter(Boolean),m=v[3],ch=v[4],t='My visit agenda\\n';
    if(concerns.length) t+='\\nWhat I want to talk about (most important first):\\n'+concerns.map(function(x,i){return (i+1)+'. '+x}).join('\\n')+'\\n';
    if(m) t+='\\nMedicine questions:\\n'+lines(m).map(function(x){return '- '+x}).join('\\n')+'\\n';
    if(ch) t+='\\nChanges since my last visit:\\n'+lines(ch).map(function(x){return '- '+x}).join('\\n')+'\\n';
    return t.trim();
  }
  function render(){
    var v=vals(),concerns=v.slice(0,3).filter(Boolean),m=v[3],ch=v[4];
    $('#agWhen').textContent='Prepared '+new Date().toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'});
    var empty=!concerns.length&&!m&&!ch,h='';
    h+='<div class="blk"><p class="lbl">What I want to talk about</p>'+(concerns.length?'<ol>'+concerns.map(function(x,i){return '<li'+(i===0?' class="top"':'')+'>'+esc(x)+'</li>'}).join('')+'</ol>':'<p class="ph">Your top concern appears here as you type.</p>')+'</div>';
    if(m) h+='<div class="blk"><p class="lbl">Medicine questions</p><ol>'+lines(m).map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ol></div>';
    if(ch) h+='<div class="blk"><p class="lbl">Changes since my last visit</p><ol>'+lines(ch).map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ol></div>';
    if(concerns.length>2||(concerns.length&&(m||ch))) h+='<p class="tip" style="margin:6px 0 0">If time runs short, start with #1.</p>';
    $('#agBody').innerHTML=h;
    $('#agCopy').disabled=$('#agPrint').disabled=empty;
  }
  F.forEach(function(f){f.addEventListener('input',render)});
  $('#agCopy').addEventListener('click',function(){var b=$('#agCopy');
    var done=function(){b.textContent='Copied ✓'},fail=function(){b.textContent='Select the agenda text to copy'};
    try{navigator.clipboard.writeText(agendaText()).then(done,fail)}catch(e){fail()}
    setTimeout(function(){b.textContent='Copy for MyChart'},2200)});
  $('#agPrint').addEventListener('click',function(){document.body.dataset.print='agenda';try{window.print()}catch(e){}});
  window.addEventListener('afterprint',function(){delete document.body.dataset.print});
  $('#agClear').addEventListener('click',function(){F.forEach(function(f){f.value=''});render();F[0].focus()});
  render();
})();</script>`;

// ---------- styles ----------
const CSS = `
:root{--ink:#0e1734;--soft:#5a6383;--faint:#8a91a8;--paper:#f7f8fb;--surface:#fff;--line:rgba(14,23,52,.12);--line-2:rgba(14,23,52,.07);
--accent:#3b54c4;--tint:#e7ecf6;--bar:#0e1734;--green:#e2ede6;--green-ink:#2f6b48;--btn:#0e1734;--btn-ink:#fff;color-scheme:light}
:root[data-theme="dark"]{--ink:#e7eaf3;--soft:#a6aec6;--faint:#7f88a5;--paper:#0a0f1e;--surface:#131a2e;--line:rgba(231,234,243,.14);--line-2:rgba(231,234,243,.08);
--accent:#93a6ff;--tint:#1b2340;--bar:#060a15;--green:#18291f;--green-ink:#8fd0a8;--btn:#e7eaf3;--btn-ink:#0a0f1e;color-scheme:dark}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:Geist,system-ui,sans-serif;font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--accent)}
.wrap{max-width:960px;margin:0 auto;padding:0 clamp(16px,4vw,32px)}
header.top{position:sticky;top:0;z-index:20;background:var(--bar);color:#fff}
.top .wrap{max-width:1080px;display:flex;align-items:center;gap:18px;height:64px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff;font-weight:600;font-size:15px;white-space:nowrap}
.mark{width:30px;height:30px;border-radius:50%;border:1.5px solid rgba(255,255,255,.75);display:grid;place-items:center;font-size:11px}
.top nav{margin-left:auto;display:flex;gap:18px;align-items:center}
.top nav a{color:#fff;text-decoration:none;font-size:14px;opacity:.85}.top nav a:hover{opacity:1;text-decoration:underline;text-underline-offset:4px}
.theme{all:unset;cursor:pointer;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,255,255,.35)}
.theme svg{width:18px;height:18px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round}.theme .moon{display:none}
:root[data-theme="dark"] .theme .moon{display:block}:root[data-theme="dark"] .theme .sun{display:none}
@media (max-width:440px){.bn{display:none}}
.vnav{border-bottom:1px solid var(--line-2);background:var(--paper)}
.vnav ul{list-style:none;margin:0 auto;padding:12px clamp(16px,4vw,32px);max-width:1080px;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}
.vnav ul::-webkit-scrollbar{display:none}
.vnav a{display:block;white-space:nowrap;text-decoration:none;font-size:14px;padding:6px 13px;border-radius:999px;border:1px solid var(--line);color:var(--soft);background:var(--surface)}
.vnav a:hover{color:var(--ink)}.vnav a[aria-current="page"]{background:var(--ink);border-color:var(--ink);color:var(--paper)}
.hero{padding:clamp(30px,5vw,52px) 0 22px;display:grid;grid-template-columns:auto 1fr;gap:0 18px;align-items:center}
.hero .ic{width:64px;height:64px;color:var(--ink);fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;grid-row:span 2}
.hero .ic .f{fill:var(--a);fill-opacity:.5}:root[data-theme="dark"] .hero .ic .f{fill-opacity:.85}
.eyebrow{font-family:"Geist Mono",monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);margin:0;align-self:end}
h1{font-family:Newsreader,Georgia,serif;font-weight:400;font-size:clamp(38px,6vw,62px);line-height:1.02;letter-spacing:-.02em;margin:4px 0 0;align-self:start}
.lede{grid-column:1/-1;color:var(--soft);font-size:clamp(17px,2vw,19px);max-width:60ch;margin:16px 0 0}
.tools{grid-column:1/-1;display:flex;gap:10px;margin-top:16px}
.pbtn{all:unset;cursor:pointer;font-size:14px;color:var(--accent);display:inline-flex;gap:6px;align-items:center}
.pbtn:hover{text-decoration:underline;text-underline-offset:4px}
.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;align-content:start}
@media (max-width:560px){.cards{grid-template-columns:1fr}}
.pc{display:flex;flex-direction:column;gap:6px;padding:16px 18px;border-radius:16px;background:var(--surface);border:1px solid var(--line);text-decoration:none;color:var(--ink);transition:transform .15s ease,box-shadow .15s ease,border-color .15s}
a.pc:hover{transform:translateY(-2px);border-color:rgba(14,23,52,.28);box-shadow:0 12px 28px -20px rgba(14,23,52,.5)}
.pc:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.pc .top{display:flex;justify-content:space-between;align-items:center;gap:10px}
.gi{width:36px;height:36px;margin-bottom:4px;color:var(--ink);fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;flex:none;transition:transform .2s ease}
.gi .f{fill:var(--a);fill-opacity:.45}
:root[data-theme="dark"] .gi .f{fill-opacity:.8}
a.pc:hover .gi{transform:rotate(-6deg) scale(1.06)}
.pc.feature .gi{width:44px;height:44px}
.pc .nm{font-weight:600;font-size:16px;line-height:1.3}
.pc .ds{color:var(--soft);font-size:14px}
.pc .x{color:var(--faint);font-size:13px}
.pc.feature{grid-column:1/-1;background:var(--tint,var(--surface));border-color:transparent}
:root[data-theme="dark"] .pc.feature{background:color-mix(in oklab, var(--tint, var(--surface)) 14%, var(--surface))}
.pc.feature .nm{font-family:Newsreader,Georgia,serif;font-weight:400;font-size:24px}
.cg{grid-column:1/-1;margin:18px 0 0;font:600 12px/1.2 'Geist Mono',ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--soft)}
.cg:first-child{margin-top:0}
.cnote{grid-column:1/-1;margin:6px 0 0;padding:14px 16px;border-radius:14px;background:var(--surface);border:1px dashed var(--line);font-size:14px;line-height:1.55;color:var(--soft)}
.cnote b{color:var(--ink)}
.pc.app .nm a{color:inherit;text-decoration:none}.pc.app .nm a:hover{text-decoration:underline}
.pc.app .nt{font-size:13px;font-style:italic}
.stores{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.stores a{font-size:13px;padding:5px 10px;border-radius:999px;border:1px solid var(--line);text-decoration:none;color:var(--ink)}
.stores a:hover{border-color:var(--ink)}
.soon{grid-column:1/-1;font-size:14px;color:var(--soft);padding:12px 4px 0}
.cards:has(.bookc){grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:18px}
.pc.bookc{align-items:flex-start}
a.pc.bookc:hover{transform:none;box-shadow:none}
.bookc .cv{display:block;width:100%;margin:4px 0 10px;transform:rotate(-2deg);transition:transform .18s ease}
.bookc:hover .cv,.bookc:focus-visible .cv{transform:rotate(0) translateY(-5px)}
.bookc .cv img{display:block;width:100%;height:auto;aspect-ratio:2/3;object-fit:cover;background:#e5e2da;border-radius:3px 10px 10px 3px;box-shadow:-8px 9px 0 rgba(20,33,61,.08),0 18px 35px rgba(20,33,61,.14)}
.prep{grid-column:1/-1;border-radius:22px;background:var(--green);display:grid;grid-template-columns:1.1fr 1fr;overflow:hidden;border:1px solid rgba(47,107,72,.18);margin-bottom:6px}
:root[data-theme="dark"] .prep{background:#14241b;border-color:rgba(143,208,168,.2)}
@media (max-width:860px){.prep{grid-template-columns:1fr}}
.prep-form{padding:clamp(20px,3vw,32px)}
.prep .k{font-family:"Geist Mono",monospace;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--green-ink);margin:0 0 8px}
.prep h2{font-family:Newsreader,Georgia,serif;font-weight:400;font-size:clamp(26px,3.2vw,36px);line-height:1.05;margin:0 0 8px}
.prep .sub{color:var(--soft);font-size:15px;margin:0 0 20px;max-width:46ch}
.prep label{display:block;font-weight:600;font-size:14.5px;margin:16px 0 6px}
.prep label span{font-weight:400;color:var(--soft)}
.prep input,.prep textarea{width:100%;font:inherit;font-size:15.5px;color:var(--ink);background:var(--surface);border:1.5px solid rgba(14,23,52,.14);border-radius:12px;padding:11px 13px;resize:vertical}
:root[data-theme="dark"] .prep input,:root[data-theme="dark"] .prep textarea{border-color:var(--line)}
.prep textarea{min-height:64px}
.prep input:focus,.prep textarea:focus{outline:none;border-color:var(--green-ink);box-shadow:0 0 0 4px rgba(47,107,72,.14)}
.prep .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width:520px){.prep .row{grid-template-columns:1fr}}
.prep .priv{display:flex;gap:8px;align-items:center;margin-top:18px;font-size:13px;color:var(--green-ink)}
.card-side{background:#fbfaf6;padding:clamp(20px,3vw,32px);border-left:1px dashed rgba(14,23,52,.18);display:flex;flex-direction:column}
:root[data-theme="dark"] .card-side{background:#10182a}
@media (max-width:860px){.card-side{border-left:0;border-top:1px dashed rgba(14,23,52,.18)}}
.agenda{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px 22px;box-shadow:0 14px 34px -24px rgba(14,23,52,.45);font-size:15px}
.agenda::before{content:"";position:absolute;inset:0 auto 0 0;width:4px;border-radius:14px 0 0 14px;background:var(--green-ink)}
.agenda h3{font-family:Newsreader,Georgia,serif;font-weight:500;font-size:21px;margin:0 0 2px}
.agenda .when{font-family:"Geist Mono",monospace;font-size:11px;color:var(--faint);letter-spacing:.06em;margin:0 0 14px}
.agenda .blk{margin:0 0 12px}
.agenda .lbl{font-family:"Geist Mono",monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:0 0 3px}
.agenda ol{margin:0;padding-left:20px}
.agenda .ph{color:var(--faint);font-style:italic}
.agenda .top{font-weight:600}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.btn{all:unset;cursor:pointer;font-size:14px;font-weight:600;padding:10px 16px;border-radius:999px;background:var(--btn);color:var(--btn-ink)}
.btn.ghost{background:transparent;color:var(--ink);border:1.5px solid var(--line)}
.btn[disabled]{opacity:.45;cursor:default}
.tip{font-size:13px;color:var(--soft);margin:12px 0 0}
.disclaim{border-top:1px solid var(--line);margin-top:40px;padding:22px 0 50px;font-size:14px;color:var(--soft)}
.disclaim p{margin:0 0 6px}
footer{background:var(--bar);color:rgba(255,255,255,.85);font-size:13px}
footer .wrap{max-width:1080px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;padding-top:24px;padding-bottom:24px}
footer a{color:inherit;text-decoration:none}
a:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
@media print{
  @page{margin:14mm}
  :root{--ink:#000;--soft:#333;--faint:#555;--paper:#fff;--surface:#fff;--line:#bbb;--line-2:#ddd}
  header.top,.vnav,footer,.tools,.stores,.actions,.tip,.prep-form,.x{display:none!important}
  body{background:#fff;color:#000;font-size:12pt}
  .hero{padding:0 0 10px}.hero .ic{width:40px;height:40px}
  .cards,.cards:has(.bookc){grid-template-columns:1fr 1fr;gap:8px}
  .pc,.agenda{break-inside:avoid;box-shadow:none!important;transform:none!important}
  .pc[data-url]::after{content:attr(data-url);font-size:9pt;color:#444;word-break:break-all}
  .bookc .cv{transform:none;max-width:90px}
  .prep{display:block;background:none;border:0}.card-side{background:none;border:0;padding:0}
  .disclaim{margin-top:16px;padding-bottom:0}
  body[data-print="agenda"] *{visibility:hidden}
  body[data-print="agenda"] .agenda,body[data-print="agenda"] .agenda *{visibility:visible}
  body[data-print="agenda"] .agenda{position:absolute;left:0;top:0;width:100%;border:0}
}
.bmi{margin:6px 0 26px}
.bmi h2.cg{margin-top:0}
.bmi-box{display:grid;grid-template-columns:1fr 1fr;gap:18px;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:clamp(16px,3vw,22px)}
@media (max-width:720px){.bmi-box{grid-template-columns:1fr}}
.bmi-units{display:flex;gap:6px;margin-bottom:14px}
.bmi-units button{font:500 13.5px Geist,system-ui,sans-serif;padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:var(--surface);color:var(--ink);cursor:pointer}
.bmi-units button[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--paper)}
.bmi-row{display:flex;flex-wrap:wrap;gap:14px 22px}
.bmi-row[hidden]{display:none}
.bmi-row label{display:flex;flex-direction:column;gap:6px;font-weight:500;font-size:14.5px}
.bmi-pair{display:flex;align-items:center;gap:6px;font-weight:400;color:var(--soft)}
.bmi-pair input{width:76px;font:500 17px Geist,system-ui,sans-serif;padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:var(--paper);color:var(--ink)}
.bmi-pair input:focus,.bmi-units button:focus-visible{outline:3px solid var(--accent,#3b54c4);outline-offset:1px}
.bmi-hint{color:var(--soft);font-size:14.5px;margin:0}
.bmi-out p{font-size:14.5px;margin:10px 0 0}
.bmi-res{display:flex;align-items:baseline;gap:12px}
.bmi-n{font-family:Newsreader,Georgia,serif;font-size:48px;line-height:1}
.bmi-c{font-weight:600;font-size:16px}
.bmi-res.ok .bmi-c{color:#2f6b48}.bmi-res.mid .bmi-c{color:#8a5a1c}.bmi-res.hi .bmi-c{color:#c0583b}.bmi-res.lo .bmi-c{color:#3b54c4}
:root[data-theme="dark"] .bmi-res.ok .bmi-c{color:#8fd0a8}:root[data-theme="dark"] .bmi-res.mid .bmi-c{color:#e0b070}:root[data-theme="dark"] .bmi-res.hi .bmi-c{color:#ff8a6b}:root[data-theme="dark"] .bmi-res.lo .bmi-c{color:#93a6ff}
.bmi-bar{position:relative;height:10px;border-radius:99px;margin:14px 0 4px;background:linear-gradient(90deg,#93a6ff 0 11.7%,#8fc9a4 11.7% 33.3%,#e8c27a 33.3% 50%,#f0a07f 50% 100%)}
.bmi-bar i{position:absolute;top:-4px;width:4px;height:18px;margin-left:-2px;border-radius:2px;background:var(--ink)}
.bmi-scale{position:relative;height:16px;font:500 11px "Geist Mono",monospace;color:var(--faint)}
.bmi-scale span{position:absolute;transform:translateX(-50%)}
.bmi-asian{display:flex;align-items:center;gap:8px;margin-top:16px;font-size:14.5px;cursor:pointer}
.bmi-asian input{width:18px;height:18px;accent-color:#0e1734}
.bmi-asian span{color:var(--faint)}
.bmi-c i{font-style:normal;font-weight:400;color:var(--faint);font-size:13px}
.bmi-jw{grid-column:1/-1}
.bmi-jw:empty{display:none}
.bmi-j{margin:4px 0 0}
.bmi-j figcaption{font-size:14px;font-weight:500;margin:0 0 6px}
.bmi-j svg{width:100%;height:auto;display:block;font:500 11px "Geist Mono",monospace;fill:var(--faint)}
.bmi-j .g{stroke:var(--line);stroke-width:1}
.bmi-j .ref{stroke:var(--soft);stroke-width:1;stroke-dasharray:3 3}
.bmi-j .z{fill:#8fc9a4;fill-opacity:.16}
.bmi-j .c{fill:none;stroke:var(--ink);stroke-width:2.5;stroke-linejoin:round}
.bmi-j .d{fill:var(--ink)}
.bmi-j .on{fill:#c0583b;stroke:var(--surface);stroke-width:2}
.bmi-j .me{stroke:#c0583b;stroke-width:1.5;stroke-dasharray:4 3}
.bmi-j .mel{fill:#c0583b;font-weight:600}
.bmi-jt{font-size:14.5px;margin:6px 0 0}
@media (max-width:640px){.bmi-j svg{font-size:19px}}
.bmi-more{margin-top:10px;font-size:14.5px;color:var(--soft)}
.bmi-more summary{cursor:pointer;color:var(--ink);font-weight:500;padding:6px 0}
.bmi-more p{margin:6px 0 10px;max-width:70ch}
@media print{.bmi-units{display:none}}
`;

const HEADER = `<header class="top"><div class="wrap">
<a class="brand" href="/"><span class="mark">GG</span><span class="bn">Gennady Gelman, MD</span></a>
<nav><a href="/">Home</a><a href="/#patient">For patients</a><a href="/#about">About</a></nav>
<button class="theme" id="theme" type="button" aria-label="Switch to dark mode"><svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg></button>
</div></header>`;
const FOOTER = `<footer><div class="wrap"><span>© 2026 Gennady Gelman · Personal site, not affiliated with any employer.</span><a href="mailto:me@gennadygelman.com">me@gennadygelman.com</a></div></footer>
<script>(function(){var r=document.documentElement,b=document.getElementById('theme');function l(){b.setAttribute('aria-label',r.dataset.theme==='dark'?'Switch to light mode':'Switch to dark mode')}l();b.addEventListener('click',function(){r.dataset.theme=r.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('gg-theme',r.dataset.theme)}catch(e){}l()})})();
(function(){var p=document.getElementById('printPage');if(p)p.addEventListener('click',function(){delete document.body.dataset.print;window.print()})})();</script>`;

const vnav = cur => `<nav class="vnav" aria-label="Patient topics"><ul>${PSECTIONS.filter(s => s.p).map(s => `<li><a href="${s.p}"${s.id === cur ? ' aria-current="page"' : ''}>${esc(SHORT[s.id] || s.n)}</a></li>`).join('')}</ul></nav>`;

const BMI_HTML = `<section class="bmi" id="bmi" aria-labelledby="bmiH">
<h2 id="bmiH" class="cg" data-toc="BMI calculator">Check your BMI</h2>
<div class="bmi-box">
<form class="bmi-form" id="bmiForm" autocomplete="off" onsubmit="return false">
<div class="bmi-units" role="group" aria-label="Units"><button type="button" data-u="us" aria-pressed="true">Feet and pounds</button><button type="button" data-u="metric" aria-pressed="false">Metric</button></div>
<div class="bmi-row" id="bmiUS"><label>Height<span class="bmi-pair"><input id="bmiFt" type="number" inputmode="numeric" min="3" max="8" placeholder="5"> ft <input id="bmiIn" type="number" inputmode="decimal" min="0" max="11.9" step="0.5" placeholder="7"> in</span></label><label>Weight<span class="bmi-pair"><input id="bmiLb" type="number" inputmode="decimal" min="50" max="900" placeholder="180"> lb</span></label></div>
<div class="bmi-row" id="bmiMet" hidden><label>Height<span class="bmi-pair"><input id="bmiCm" type="number" inputmode="decimal" min="100" max="250" placeholder="170"> cm</span></label><label>Weight<span class="bmi-pair"><input id="bmiKg" type="number" inputmode="decimal" min="25" max="400" placeholder="82"> kg</span></label></div>
<label class="bmi-asian"><input type="checkbox" id="bmiAsian"> I am of Asian descent <span>(uses Asian BMI cut-offs)</span></label>
</form>
<div class="bmi-out" id="bmiOut" aria-live="polite"><p class="bmi-hint">Enter your height and weight. Nothing is saved or sent.</p></div>
<div class="bmi-jw" id="bmiJ"></div>
</div>
<details class="bmi-more"><summary>What BMI does and does not tell you</summary>
<p>BMI is weight compared with height. It is a quick screening number, not a diagnosis. It cannot tell muscle from fat, so it can overestimate in very muscular people and underestimate in older adults who have lost muscle. It does not apply in pregnancy. For children and teens, BMI is compared with others of the same age and sex instead; ask us.</p>
<p>Where you carry weight matters too. A waist over 40 inches in men, or over 35 inches in women, raises the risk of diabetes and heart disease even at the same BMI.</p>
<p>For people of Asian descent, health risks start at a lower BMI, so the check box above switches to Asian cut-offs: overweight from 23 and obesity from 27.5.</p>
<p>The risk curve comes from the Global BMI Mortality Collaboration (<a href="https://pubmed.ncbi.nlm.nih.gov/27423262/">Lancet, 2016</a>): almost 4 million adults on four continents who never smoked and had no major illness at the start, followed for about 14 years. Each point compares the risk of dying from any cause during that time with people at a BMI of 22.5 to 25. It shows what happened to groups of people, not a prediction for you.</p>
</details>
</section>`;
const BMI_JS = `<script>(function(){
var $=function(i){return document.getElementById(i)},u='us';
document.querySelectorAll('.bmi-units button').forEach(function(b){b.addEventListener('click',function(){u=b.dataset.u;document.querySelectorAll('.bmi-units button').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});$('bmiUS').hidden=u!=='us';$('bmiMet').hidden=u==='us';calc()})});
$('bmiForm').addEventListener('input',calc);
// Global BMI Mortality Collaboration, Lancet 2016: all-cause mortality HR vs BMI 22.5-<25, never-smokers.
var GB=[[15,18.5,1.51],[18.5,20,1.13],[20,22.5,1.00],[22.5,25,1.00],[25,27.5,1.07],[27.5,30,1.20],[30,35,1.45],[35,40,1.94],[40,60,2.76]];
var X0=15,X1=45,W=560,H=230,L=44,R=12,T=14,B=34,Y0=0.8,Y1=3;
var px=function(x){return L+(Math.min(Math.max(x,X0),X1)-X0)/(X1-X0)*(W-L-R)},py=function(y){return T+(Y1-y)/(Y1-Y0)*(H-T-B)};
function chart(bmi,cut){
  var pts=GB.map(function(g){return [g[0]===40?42.5:(g[0]+g[1])/2,g[2]]});
  var path=pts.map(function(p,i){return (i?'L':'M')+px(p[0]).toFixed(1)+' '+py(p[1]).toFixed(1)}).join(' ');
  var band=GB.filter(function(g){return bmi>=g[0]&&bmi<g[1]})[0];
  var grid=[1,1.5,2,2.5,3].map(function(y){return '<line x1="'+L+'" x2="'+(W-R)+'" y1="'+py(y)+'" y2="'+py(y)+'" class="g"/><text x="'+(L-8)+'" y="'+(py(y)+4)+'" text-anchor="end">'+(y===1?'1':y+'×')+'</text>'}).join('');
  var xt=[15,20,25,30,35,40,45].map(function(x){return '<text x="'+px(x)+'" y="'+(H-B+18)+'" text-anchor="middle">'+x+(x===45?'+':'')+'</text>'}).join('');
  var zone='<rect x="'+px(cut[0])+'" y="'+T+'" width="'+(px(cut[1])-px(cut[0]))+'" height="'+(H-T-B)+'" class="z"/>';
  var dots=pts.map(function(p,i){var on=band&&GB[i]===band;return '<circle cx="'+px(p[0])+'" cy="'+py(p[1])+'" r="'+(on?6:3.5)+'" class="'+(on?'on':'d')+'"/>'}).join('');
  var mx=px(bmi);
  var me='<line x1="'+mx+'" x2="'+mx+'" y1="'+T+'" y2="'+(H-B)+'" class="me"/><text x="'+Math.min(Math.max(mx,L+30),W-R-30)+'" y="'+(T+12)+'" text-anchor="middle" class="mel">You</text>';
  return '<figure class="bmi-j"><figcaption>Risk of dying over about 14 years, compared with a BMI of 22.5 to 25</figcaption><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="J-shaped curve: risk is lowest at a BMI of 20 to 25 and rises below and above it.'+(band?' Your BMI range had '+band[2].toFixed(2)+' times the risk.':'')+'">'+zone+grid+'<line x1="'+L+'" x2="'+(W-R)+'" y1="'+py(1)+'" y2="'+py(1)+'" class="ref"/><path d="'+path+'" class="c"/>'+dots+me+xt+'<text x="'+((L+W-R)/2)+'" y="'+(H-2)+'" text-anchor="middle">BMI</text></svg></figure>'+
   (band?'<p class="bmi-jt">'+(band[2]<=1.0001?'People with a BMI in your range ('+band[0]+' to '+band[1]+') had the <b>lowest risk</b> in the study.':'People with a BMI of '+band[0]+' to '+(band[1]===60?'60':band[1])+' had <b>'+band[2].toFixed(2)+' times the risk</b> of dying over the study period, compared with a BMI of 22.5 to 25.')+'</p>':'');
}
function n(id){var v=parseFloat($(id).value);return isNaN(v)?null:v}
function calc(){
  var m,kg,o=$('bmiOut'),asian=$('bmiAsian').checked;
  var empty='<p class="bmi-hint">Enter your height and weight. Nothing is saved or sent.</p>';
  if(u==='us'){var ft=n('bmiFt'),inch=n('bmiIn')||0,lb=n('bmiLb');if(ft==null||lb==null){o.innerHTML=empty;return}m=(ft*12+inch)*0.0254;kg=lb*0.45359237}
  else{var cm=n('bmiCm');kg=n('bmiKg');if(cm==null||kg==null){o.innerHTML=empty;return}m=cm/100}
  var b=kg/(m*m);
  if(!isFinite(b)||b<10||b>90||m<1||m>2.5){o.innerHTML='<p class="bmi-hint">Check the numbers. That height and weight do not look right.</p>';return}
  var bmi=Math.round(b*10)/10,ow=asian?23:25,ob=asian?27.5:30,cat,cls;
  if(bmi<18.5){cat='Underweight';cls='lo'}else if(bmi<ow){cat='Healthy weight';cls='ok'}else if(bmi<ob){cat='Overweight';cls='mid'}
  else if(asian){cat='Obesity';cls='hi'}else if(bmi<35){cat='Obesity, class 1';cls='hi'}else if(bmi<40){cat='Obesity, class 2';cls='hi'}else{cat='Obesity, class 3';cls='hi'}
  var sc=function(x){return ((x-15)/(45-15)*100).toFixed(1)+'%'},pos=Math.max(0,Math.min(100,(bmi-15)/(45-15)*100));
  var grad='linear-gradient(90deg,#93a6ff 0 '+sc(18.5)+',#8fc9a4 '+sc(18.5)+' '+sc(ow)+',#e8c27a '+sc(ow)+' '+sc(ob)+',#f0a07f '+sc(ob)+' 100%)';
  var ticks=[18.5,ow,ob].concat(asian?[]:[35,40]).map(function(x){return '<span style="left:'+sc(x)+'">'+x+'</span>'}).join('');
  var w=u==='us'?kg/0.45359237:kg,unit=u==='us'?'lb':'kg',r=function(x){return Math.round(x)};
  var tx='';
  if(bmi>=ow)tx+='<p><b>Even a little helps.</b> Losing 5% of your weight ('+r(w*0.05)+' '+unit+') to 10% ('+r(w*0.10)+' '+unit+') can lower blood pressure, blood sugar and cholesterol.</p>';
  if(bmi>=27)tx+='<p><b>Medicines</b> for weight loss are approved for a BMI of 30 or higher, or 27 or higher with a weight-related condition such as high blood pressure, type 2 diabetes or high cholesterol.</p>';
  if(asian&&bmi>=27.5)tx+='<p><b>Surgery</b> may be an option for people of Asian descent with a BMI of 27.5 or higher.</p>';
  else if(!asian&&bmi>=30)tx+='<p><b>Surgery</b> may be an option with a BMI of 35 or higher, or 30 or higher with type 2 diabetes or other metabolic disease.</p>';
  if(bmi<18.5)tx+='<p>A low BMI can have many causes. If you have lost weight without trying, tell us.</p>';
  o.innerHTML='<div class="bmi-res '+cls+'"><span class="bmi-n">'+bmi.toFixed(1)+'</span><span class="bmi-c">'+cat+(asian?' <i>(Asian cut-offs)</i>':'')+'</span></div>'+
   '<div class="bmi-bar" aria-hidden="true" style="background:'+grad+'"><i style="left:'+pos+'%"></i></div><div class="bmi-scale" aria-hidden="true">'+ticks+'</div>'+tx+
   (bmi>=ow?'<p class="bmi-hint">The resources below can help. Bring your number to your next visit and we can talk about what fits you.</p>':'');
  $('bmiJ').innerHTML=chart(bmi,[20,25]);
}
})();</script>`;
const page = sec => {
  const url = SITE + sec.p, desc = esc(strip(sec.i));
  CUR_ACC = ACCENT[sec.id] || "#3b54c4";
  const body = `<div class="cards">${groupHTML(sec.items)}${(sec.notes || []).map(n => `<p class="cnote">${n}</p>`).join('')}${sec.more ? `<p class="soon">${esc(sec.more)}</p>` : ''}${sec.moreLink ? `<p class="soon"><a href="${sec.moreLink.u}">${esc(sec.moreLink.n)}</a></p>` : ''}</div>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Generated by scripts/build-patient-pages.mjs from PSECTIONS in /index.html. Edit there, then re-run. -->
<title>${esc(sec.n)} - Gennady Gelman</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(sec.n)}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${url}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script>(function(){var t=null;try{t=localStorage.getItem('gg-theme')}catch(e){}if(!t)t=(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';document.documentElement.dataset.theme=t})();</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
<style>${CSS}
</style>
</head>
<body>
${HEADER}
${vnav(sec.id)}
<main class="wrap">
<div class="hero">${icon(sec.id)}<p class="eyebrow">For my patients</p><h1>${esc(sec.n)}</h1><p class="lede">${sec.i}</p><div class="tools"><button class="pbtn" id="printPage" type="button">Print this page</button></div></div>
${sec.id === 'weight' ? BMI_HTML : ''}
${body}
<div class="disclaim"><p>Educational information from Gennady Gelman, MD. Not medical advice for you; your own clinician can tell you what fits your health.</p>
<p>In an emergency, call <a href="tel:911">911</a>. For a mental health crisis, call or text <a href="tel:988">988</a>.</p>
<p>${esc(url.replace('https://', ''))}</p></div>
</main>
${FOOTER}
${sec.items.some(i => i.plan) ? PREP_JS : ''}
${sec.id === 'weight' ? BMI_JS : ''}
${sec.items.filter(i => i.g).length >= 4 ? '<script src="/js/toc.js?v=3" defer></script>' : ''}
</body>
</html>
`;
};

let n = 0;
for (const sec of PSECTIONS) {
  if (!sec.p) throw new Error(`topic "${sec.id}" has no p: (page path) in index.html`);
  if (SKIP.has(sec.id)) continue;
  const out = join(ROOT, sec.p, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page(sec));
  n++;
  console.log('wrote', sec.p);
}
console.log(n, 'pages');
