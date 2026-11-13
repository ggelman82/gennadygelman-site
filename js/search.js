/* Site-wide search for gennadygelman.com.
 *
 * Pages load it with <script src="/js/search.js?v=1" defer></script>. Bump v= after edits.
 * It adds a Search button to the page header and opens a search box over the page
 * (also with "/" or Ctrl/Cmd+K). Results come from /search-index.json, which is
 * rebuilt by scripts/build-search-index.mjs.
 *
 * Patient pages (/patients/, /flu/) only search patient pages, so patients are
 * not sent to the clinician tools. Every other page searches the whole site.
 * The home page keeps its own search and is skipped.
 */
(function () {
  if (location.pathname === '/' || document.querySelector('.ss-btn')) return;
  var nav = document.querySelector('header.top nav') || document.querySelector('#gg-hd nav');
  if (!nav) return;
  var patientOnly = /^\/(patients|flu)(\/|$)/.test(location.pathname);
  var GROUP = { p: 'For patients', c: 'For clinicians', k: 'Words and ideas' };

  var css = '' +
    'header .ss-btn,#gg-hd .ss-btn{all:unset;box-sizing:border-box!important;cursor:pointer;display:inline-flex!important;flex-direction:row;align-items:center;justify-content:center;gap:7px;width:auto!important;min-width:36px;height:36px!important;margin:0;padding:0 12px!important;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:none;color:inherit;font:500 14px/1 Geist,system-ui,sans-serif;white-space:nowrap;flex:none;vertical-align:middle}' +
    '.ss-btn:hover{border-color:rgba(255,255,255,.6)}' +
    '.ss-btn:focus-visible{outline:3px solid var(--accent,#93a6ff);outline-offset:2px}' +
    '.ss-btn svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}' +
    '.ss-btn span{display:inline}' +
    '@media (max-width:640px){header .ss-btn,#gg-hd .ss-btn{padding:0!important;width:36px!important}.ss-btn span{display:none}header.top nav,#gg-hd nav{gap:4px}header.top nav a,#gg-hd nav a{white-space:nowrap;font-size:14px;padding-left:7px;padding-right:7px}' +
    // On phones the logo already links home, so the Home link gives way to the search button.
    '@media (max-width:480px){header.top nav a[href="/"],#gg-hd nav a[href="/"]{display:none}}' +
    '.ss-ov{position:fixed;inset:0;z-index:200;background:rgba(10,15,30,.55);display:none;align-items:flex-start;justify-content:center;padding:clamp(12px,9vh,96px) 14px 14px}' +
    '.ss-ov.open{display:flex}' +
    '.ss-box{width:min(640px,100%);max-height:100%;display:flex;flex-direction:column;background:var(--surface,#fff);color:var(--ink,#0e1734);border-radius:18px;box-shadow:0 24px 70px -18px rgba(0,0,0,.5);overflow:hidden;font-family:Geist,system-ui,sans-serif}' +
    '.ss-in{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line,rgba(14,23,52,.12))}' +
    '.ss-in input{all:unset;flex:1;min-width:0;font:400 17px/1.4 Geist,system-ui,sans-serif;color:inherit}' +
    '.ss-in input::placeholder{color:var(--faint,#8a91a8)}' +
    '.ss-x{all:unset;cursor:pointer;font:500 13px/1 "Geist Mono",monospace;color:var(--faint,#8a91a8);border:1px solid var(--line,rgba(14,23,52,.12));border-radius:8px;padding:7px 9px}' +
    '.ss-x:focus-visible{outline:3px solid var(--accent,#3b54c4);outline-offset:2px}' +
    '.ss-res{overflow:auto;padding:6px}' +
    '.ss-res a{display:block;text-decoration:none;color:inherit;padding:11px 12px;border-radius:12px}' +
    '.ss-res a[aria-selected="true"],.ss-res a:hover{background:var(--tint,rgba(59,84,196,.09))}' +
    '.ss-res .g{display:block;font:500 11px/1.2 "Geist Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--faint,#8a91a8);margin-bottom:3px}' +
    '.ss-res .t{display:block;font-weight:600;font-size:16px;line-height:1.3}' +
    '.ss-res .d{display:block;font-size:14.5px;line-height:1.4;color:var(--soft,#5a6383);margin-top:2px}' +
    '.ss-none{padding:18px 16px;color:var(--soft,#5a6383);font-size:15.5px}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ss-btn';
  btn.setAttribute('aria-label', 'Search the site');
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></svg><span>Search</span>';
  nav.appendChild(btn);

  var ov = document.createElement('div');
  ov.className = 'ss-ov';
  ov.innerHTML = '<div class="ss-box" role="dialog" aria-modal="true" aria-label="Search the site">' +
    '<div class="ss-in"><input type="search" autocomplete="off" spellcheck="false" aria-label="Search" placeholder="' + (patientOnly ? 'Search: flu, cholesterol, mammogram…' : 'Search the site…') + '"><button type="button" class="ss-x">Esc</button></div>' +
    '<div class="ss-res" role="listbox"></div></div>';
  document.body.appendChild(ov);
  var input = ov.querySelector('input'), res = ov.querySelector('.ss-res');
  var index = null, hits = [], sel = 0;

  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function load() {
    if (index) return Promise.resolve();
    return fetch('/search-index.json').then(function (r) { return r.json(); }).then(function (d) {
      index = d.filter(function (p) { return !patientOnly || p.a === 'p'; });
    }).catch(function () { index = []; });
  }

  function run() {
    var terms = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length || !index) { res.innerHTML = ''; hits = []; return; }
    var out = [];
    index.forEach(function (p) {
      var title = p.t.toLowerCase(), desc = (p.d || '').toLowerCase(), bag = ' ' + (p.k || '') + ' ';
      var score = 0, best = null;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i], s = 0;
        if (title.indexOf(t) > -1) s += 6;
        var sec = (p.s || []).filter(function (x) { return x[0].toLowerCase().indexOf(t) > -1; })[0];
        if (sec) { s += 4; if (!best) best = sec; }
        if (desc.indexOf(t) > -1) s += 2;
        if (bag.indexOf(' ' + t) > -1) s += 1;
        if (!s) return;
        score += s;
      }
      out.push({ p: p, score: score, sec: title.indexOf(terms[0]) > -1 ? null : best });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    hits = out.slice(0, 8);
    sel = 0;
    res.innerHTML = hits.length ? hits.map(function (h, i) {
      var u = h.p.u + (h.sec && h.sec[1] ? '#' + h.sec[1] : '');
      return '<a role="option" aria-selected="' + (i === 0) + '" href="' + esc(u) + '"><span class="g">' + GROUP[h.p.a] + '</span><span class="t">' + esc(h.p.t) + (h.sec ? ' › ' + esc(h.sec[0]) : '') + '</span>' + (h.p.d ? '<span class="d">' + esc(h.p.d) + '</span>' : '') + '</a>';
    }).join('') : '<div class="ss-none">Nothing found for “' + esc(input.value) + '”.' + (patientOnly ? ' For questions about your own health, ask your clinician.' : '') + '</div>';
  }

  function open() {
    ov.classList.add('open');
    input.value = '';
    res.innerHTML = '';
    input.focus();
    load().then(run);
  }
  function close() { ov.classList.remove('open'); btn.focus(); }
  function move(d) {
    var a = res.querySelectorAll('a');
    if (!a.length) return;
    sel = (sel + d + a.length) % a.length;
    Array.prototype.forEach.call(a, function (x, i) { x.setAttribute('aria-selected', String(i === sel)); });
    a[sel].scrollIntoView({ block: 'nearest' });
  }

  btn.addEventListener('click', open);
  ov.querySelector('.ss-x').addEventListener('click', close);
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  input.addEventListener('input', run);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { var a = res.querySelectorAll('a')[sel]; if (a) { e.preventDefault(); a.click(); } }
  });
  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) || e.target.isContentEditable;
    if (e.key === 'Escape' && ov.classList.contains('open')) { e.preventDefault(); close(); }
    else if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); open(); }
    else if (e.key === '/' && !typing && !ov.classList.contains('open')) { e.preventDefault(); open(); }
  });
})();
