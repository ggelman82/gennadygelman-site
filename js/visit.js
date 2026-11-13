/* My visit list: a site-wide "bring this to your visit" list.
   Stored only in this browser (localStorage key gg-visit-v1). Nothing is sent anywhere.
   Mark-up hooks:
     <button class="vv-add" data-vid="unique-id" data-vt="What to talk about" data-vd="optional detail">  (any page)
     <div data-vv-hub></div>  (full plan, used on /patients/visit/)
   Pages load it with <script src="/js/visit.js?v=1"></script>. Bump v= after edits (GitHub Pages caches 10 min). */
(function () {
  var KEY = 'gg-visit-v1', MAXSTAR = 2, subs = [];
  var st = load();
  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!d || !Array.isArray(d.items)) d = { items: [], when: '', len: '30' };
    return d;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} subs.forEach(function (f) { try { f(); } catch (e) {} }); sync(); }
  function find(id) { for (var i = 0; i < st.items.length; i++) if (st.items[i].id === id) return i; return -1; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function here() { var t = document.querySelector('h1'); return t ? t.textContent.trim() : document.title.split(' - ')[0]; }

  var api = {
    list: function () { return st.items.slice().sort(function (a, b) { return (b.star ? 1 : 0) - (a.star ? 1 : 0); }); },
    has: function (id) { return find(id) > -1; },
    add: function (id, t, d, u) {
      var i = find(id), it = { id: id, t: t, d: d || '', u: u || (location.pathname + (location.hash || '')), from: here(), star: false };
      if (i > -1) { it.star = st.items[i].star; st.items[i] = it; } else st.items.push(it);
      save(); bump();
    },
    remove: function (id) { var i = find(id); if (i > -1) { st.items.splice(i, 1); save(); } },
    toggle: function (id, t, d, u) { if (api.has(id)) api.remove(id); else api.add(id, t, d, u); },
    star: function (id) {
      var i = find(id); if (i < 0) return true;
      if (!st.items[i].star && st.items.filter(function (x) { return x.star; }).length >= MAXSTAR) return false;
      st.items[i].star = !st.items[i].star; save(); return true;
    },
    clear: function () { st.items = []; save(); },
    on: function (f) { subs.push(f); },
    text: function () {
      var L = api.list();
      if (!L.length) return '';
      return L.map(function (x, i) { return (x.star ? '★ ' : '- ') + x.t + (x.d ? ' (' + x.d + ')' : ''); }).join('\n');
    },
    get when() { return st.when; }
  };
  window.GGVisit = api;

  /* ---------- styles ---------- */
  var css = '' +
  '.vv-add{font:inherit;font-size:13.5px;font-weight:500;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;border:1px dashed var(--faint,#888);background:transparent;color:var(--ink,#111);cursor:pointer;line-height:1.2;align-self:flex-start;white-space:nowrap}' +
  '.vv-add:hover{border-style:solid}' +
  '.vv-add .vv-i{display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;background:var(--ink,#111);color:var(--paper,#fff);font-size:12px;line-height:1}' +
  '.vv-add[aria-pressed="true"]{border-style:solid;border-color:var(--good,#2f6b48);color:var(--good,#2f6b48);background:var(--good-tint,rgba(47,107,72,.08))}' +
  '.vv-add[aria-pressed="true"] .vv-i{background:var(--good,#2f6b48)}' +
  '.vv-add:focus-visible,.vv-pill:focus-visible,.vv-x:focus-visible,.vv-st:focus-visible{outline:3px solid var(--accent,#3b54c4);outline-offset:2px}' +
  '.vv-pill{position:fixed;right:18px;bottom:18px;z-index:70;display:flex;align-items:center;gap:10px;padding:11px 18px 11px 12px;border-radius:999px;border:0;background:var(--ink,#111);color:var(--paper,#fff);font:inherit;font-size:15px;font-weight:500;cursor:pointer;box-shadow:0 10px 30px -8px rgba(0,0,0,.45);transform:translateY(130px);transition:transform .35s cubic-bezier(.2,.8,.2,1)}' +
  '.vv-pill.on{transform:none}' +
  '.vv-pill .c{min-width:24px;height:24px;border-radius:999px;background:var(--paper,#fff);color:var(--ink,#111);font:600 13px/24px "Geist Mono",monospace;text-align:center;padding:0 6px}' +
  '.vv-pill.bump .c{animation:vvb .45s}@keyframes vvb{40%{transform:scale(1.4)}}' +
  '.vv-scrim{position:fixed;inset:0;background:rgba(10,14,30,.42);z-index:80;opacity:0;pointer-events:none;transition:opacity .25s}' +
  '.vv-scrim.on{opacity:1;pointer-events:auto}' +
  '.vv-drawer{position:fixed;top:0;right:0;bottom:0;width:min(440px,100vw);z-index:81;background:var(--paper,#fff);color:var(--ink,#111);box-shadow:-20px 0 60px -30px rgba(0,0,0,.5);transform:translateX(105%);transition:transform .32s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column}' +
  '.vv-drawer.on{transform:none}' +
  '.vv-dh{display:flex;align-items:center;justify-content:space-between;padding:18px 22px 12px;border-bottom:1px solid var(--line,#ddd)}' +
  '.vv-dh h2{font-family:Newsreader,Georgia,serif;font-weight:500;font-size:26px;margin:0}' +
  '.vv-close{font:inherit;font-size:26px;line-height:1;border:0;background:none;color:var(--soft,#555);cursor:pointer;padding:4px 8px}' +
  '.vv-db{overflow:auto;padding:16px 22px 28px;flex:1}' +
  '.vv-plan{font-size:15px}' +
  '.vv-plan .vv-k{font:600 11.5px/1.2 "Geist Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--soft,#555);margin:18px 0 8px}' +
  '.vv-plan .vv-k:first-child{margin-top:0}' +
  '.vv-help{color:var(--soft,#555);font-size:14px;margin:0 0 10px}' +
  '.vv-list{list-style:none;margin:0;padding:0;display:grid;gap:8px}' +
  '.vv-list li{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start;padding:10px 12px;border-radius:12px;background:var(--surface,#f6f6f8);border:1px solid var(--line,#ddd)}' +
  '.vv-list li.s{border-color:var(--warn,#a86b00);background:var(--warn-tint,#fff6e5)}' +
  '.vv-list b{display:block;font-weight:600}' +
  '.vv-list .vv-d{display:block;color:var(--soft,#555);font-size:13.5px}' +
  '.vv-list .vv-f{display:block;color:var(--faint,#888);font-size:12.5px;margin-top:2px}' +
  '.vv-list .vv-f a{color:inherit}' +
  '.vv-st,.vv-x{font:inherit;border:0;background:none;cursor:pointer;padding:2px 4px;border-radius:6px;line-height:1}' +
  '.vv-st{font-size:21px;color:var(--faint,#999)}' +
  '.vv-st[aria-pressed="true"]{color:var(--warn,#c48a00)}' +
  '.vv-x{font-size:20px;color:var(--faint,#999)}' +
  '.vv-x:hover{color:var(--stop,#b3261e)}' +
  '.vv-empty{color:var(--soft,#555);padding:14px;border:1px dashed var(--line,#ccc);border-radius:12px;margin:0}' +
  '.vv-msg{font-size:13.5px;color:var(--warn,#a86b00);min-height:1.2em;margin:6px 0 0}' +
  '.vv-when{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
  '.vv-when label{display:grid;gap:4px;font-size:13px;color:var(--soft,#555)}' +
  '.vv-when input,.vv-when select{font:inherit;font-size:15px;color:var(--ink,#111);background:var(--surface,#fff);border:1px solid var(--line,#ccc);border-radius:10px;padding:8px 10px;width:100%;box-sizing:border-box;color-scheme:light dark}' +
  '.vv-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}' +
  '.vv-btn{font:inherit;font-size:14.5px;font-weight:500;padding:10px 16px;border-radius:999px;border:1px solid var(--ink,#111);background:var(--ink,#111);color:var(--paper,#fff);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}' +
  '.vv-btn.g{background:transparent;color:var(--ink,#111)}' +
  '.vv-btn[disabled]{opacity:.45;cursor:not-allowed}' +
  '.vv-lnk{font-size:14px;color:var(--faint,#888);background:none;border:0;font:inherit;cursor:pointer;text-decoration:underline;padding:0;margin-top:14px}' +
  '.vv-priv{font-size:12.5px;color:var(--faint,#888);margin:14px 0 0}' +
  '.vv-toast{position:fixed;left:50%;bottom:84px;transform:translate(-50%,20px);z-index:90;background:var(--ink,#111);color:var(--paper,#fff);padding:9px 16px;border-radius:999px;font-size:14px;opacity:0;pointer-events:none;transition:all .25s}' +
  '.vv-toast.on{opacity:1;transform:translate(-50%,0)}' +
  '@media (prefers-reduced-motion:reduce){.vv-pill,.vv-drawer,.vv-scrim,.vv-toast{transition:none}.vv-pill.bump .c{animation:none}}' +
  '@media print{.vv-add,.vv-pill,.vv-drawer,.vv-scrim,.vv-toast{display:none!important}}';
  var sEl = document.createElement('style'); sEl.textContent = css; document.head.appendChild(sEl);

  /* ---------- add buttons ---------- */
  function label(b) {
    var on = api.has(b.dataset.vid);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    var txt = on ? 'On my visit list' : (b.dataset.vl || 'Add to my visit');
    b.innerHTML = '<span class="vv-i" aria-hidden="true">' + (on ? '✓' : '+') + '</span>' + esc(txt);
    b.title = on ? 'Remove from my visit list' : 'Add "' + b.dataset.vt + '" to my visit list';
  }
  function sync() {
    [].forEach.call(document.querySelectorAll('.vv-add'), label);
    var n = st.items.length;
    if (pill) { pill.querySelector('.c').textContent = n; pill.classList.toggle('on', n > 0); pill.setAttribute('aria-label', 'My visit list, ' + n + ' item' + (n === 1 ? '' : 's')); }
    [].forEach.call(document.querySelectorAll('[data-vv-hub]'), function (h) { renderPlan(h, false); });
    if (drawer && drawer.classList.contains('on')) renderPlan(drawer.querySelector('.vv-db'), true);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.vv-add'); if (!b) return;
    e.preventDefault();
    var was = api.has(b.dataset.vid);
    api.toggle(b.dataset.vid, b.dataset.vt, b.dataset.vd, b.dataset.vu);
    toast(was ? 'Removed from your visit list' : 'Added to your visit list');
  });
  var mo = new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) {
      var n = ms[i].addedNodes[j];
      if (n.nodeType === 1 && (n.classList.contains('vv-add') || n.querySelector('.vv-add'))) { [].forEach.call((n.classList.contains('vv-add') ? [n] : n.querySelectorAll('.vv-add')), label); }
    }
  });

  /* ---------- toast ---------- */
  var tEl, tT;
  function toast(m) {
    if (!tEl) { tEl = document.createElement('div'); tEl.className = 'vv-toast'; tEl.setAttribute('role', 'status'); document.body.appendChild(tEl); }
    tEl.textContent = m; tEl.classList.add('on'); clearTimeout(tT); tT = setTimeout(function () { tEl.classList.remove('on'); }, 1800);
  }

  /* ---------- pill + drawer ---------- */
  var pill, drawer, scrim, lastFocus;
  function bump() { if (!pill) return; pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
  function openD() {
    lastFocus = document.activeElement;
    renderPlan(drawer.querySelector('.vv-db'), true);
    drawer.classList.add('on'); scrim.classList.add('on'); drawer.setAttribute('aria-hidden', 'false');
    drawer.querySelector('.vv-close').focus();
  }
  function closeD() { drawer.classList.remove('on'); scrim.classList.remove('on'); drawer.setAttribute('aria-hidden', 'true'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  /* ---------- the plan (list + stars + appointment + calendar) ---------- */
  function renderPlan(box, inDrawer) {
    var L = api.list(), onVisit = /^\/patients\/visit\/?$/.test(location.pathname);
    var h = '<div class="vv-plan">';
    h += '<p class="vv-k">Things to talk about</p>';
    if (!L.length) {
      h += '<p class="vv-empty">Nothing yet. As you read the site, tap <b>+ Add to my visit</b> next to anything you want to bring up: a vaccine, a screening test, your BMI, a memory check.</p>';
    } else {
      h += '<p class="vv-help">Visits are short. Tap the star on your top ' + (L.length > 1 ? 'one or two' : 'item') + ' so we start there.</p><ul class="vv-list">';
      L.forEach(function (x) {
        h += '<li' + (x.star ? ' class="s"' : '') + '><button type="button" class="vv-st" data-s="' + esc(x.id) + '" aria-pressed="' + (x.star ? 'true' : 'false') + '" aria-label="' + (x.star ? 'Unmark' : 'Mark') + ' as a top priority: ' + esc(x.t) + '">' + (x.star ? '★' : '☆') + '</button>' +
          '<span><b>' + esc(x.t) + '</b>' + (x.d ? '<span class="vv-d">' + esc(x.d) + '</span>' : '') + '<span class="vv-f">From <a href="' + esc(x.u) + '">' + esc(x.from) + '</a></span></span>' +
          '<button type="button" class="vv-x" data-x="' + esc(x.id) + '" aria-label="Remove ' + esc(x.t) + '">×</button></li>';
      });
      h += '</ul><p class="vv-msg" aria-live="polite"></p>';
    }
    h += '<p class="vv-k">My appointment</p><div class="vv-when"><label>Date and time<input type="datetime-local" class="vv-dt" value="' + esc(st.when) + '"></label>' +
      '<label>Length<select class="vv-len">' + ['15', '20', '30', '40', '60'].map(function (m) { return '<option value="' + m + '"' + (st.len === m ? ' selected' : '') + '>' + m + ' min</option>'; }).join('') + '</select></label></div>';
    h += '<div class="vv-acts"><button type="button" class="vv-btn vv-ics"' + (L.length || onVisit ? '' : ' disabled') + '>Add to my calendar</button><button type="button" class="vv-btn g vv-cp"' + (L.length ? '' : ' disabled') + '>Copy list</button>' +
      (inDrawer && !onVisit ? '<a class="vv-btn g" href="/patients/visit/#myvisit">Open my visit plan →</a>' : '') + '</div>';
    h += '<p class="vv-help" style="margin-top:10px">The calendar event has your list in its notes and reminds you the day before. To change it later, edit the event in your calendar.</p>';
    if (L.length) h += '<button type="button" class="vv-lnk vv-clr">Clear my list</button>';
    h += '<p class="vv-priv">Saved only in this browser on this device. Nothing is sent to us or anyone else.</p></div>';
    box.innerHTML = h;
    var dt = box.querySelector('.vv-dt'), ln = box.querySelector('.vv-len');
    dt.addEventListener('change', function () { st.when = dt.value; save(); });
    ln.addEventListener('change', function () { st.len = ln.value; save(); });
    [].forEach.call(box.querySelectorAll('.vv-st'), function (b) { b.addEventListener('click', function () {
      if (!api.star(b.dataset.s)) { var m = box.querySelector('.vv-msg'); if (m) m.textContent = 'Pick your top two. Unstar one first.'; }
      var f = box.querySelector('.vv-st[data-s="' + b.dataset.s + '"]'); if (f) f.focus();
    }); });
    [].forEach.call(box.querySelectorAll('.vv-x'), function (b) { b.addEventListener('click', function () { api.remove(b.dataset.x); }); });
    box.querySelector('.vv-ics').addEventListener('click', function () {
      if (!st.when) { dt.focus(); if (dt.showPicker) try { dt.showPicker(); } catch (e) {} toast('Pick your appointment date and time first'); return; }
      ics();
    });
    box.querySelector('.vv-cp').addEventListener('click', function () { copy('My visit list\n' + api.text()); });
    var c = box.querySelector('.vv-clr'); if (c) c.addEventListener('click', function () { if (confirm('Clear everything on your visit list?')) api.clear(); });
  }

  function copy(t) {
    function ok() { toast('Copied. Paste it into a MyChart message.'); }
    function fb() { var a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} a.remove(); ok(); }
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok, fb); else fb();
  }

  /* ---------- calendar file (.ics) ---------- */
  function icsEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function fold(line) { var out = [], s = line; while (s.length > 73) { out.push(s.slice(0, 73)); s = ' ' + s.slice(73); } out.push(s); return out.join('\r\n'); }
  function stamp(d, utc) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return utc ? d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + 'T' + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + 'Z'
      : d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00';
  }
  function extra() { return typeof window.GGVisitExtra === 'function' ? (window.GGVisitExtra() || '') : ''; }
  function ics() {
    var start = new Date(st.when); if (isNaN(start)) return;
    var end = new Date(start.getTime() + (parseInt(st.len, 10) || 30) * 60000);
    var L = api.list(), body = 'What I want to talk about (starred first):\n';
    var ex = extra();
    if (ex) body += ex + '\n';
    body += L.map(function (x) { return (x.star ? '★ ' : '- ') + x.t + (x.d ? ' (' + x.d + ')' : ''); }).join('\n');
    body += '\n\nBring all your medicines (or photos of the bottles). Visits are short: start with your starred items.\nMy visit plan: https://gennadygelman.com/patients/visit/#myvisit';
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//gennadygelman.com//My visit//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:' + Date.now() + '-' + Math.random().toString(36).slice(2) + '@gennadygelman.com', 'DTSTAMP:' + stamp(new Date(), true),
      'DTSTART:' + stamp(start), 'DTEND:' + stamp(end), 'SUMMARY:' + icsEsc('Doctor visit: bring my list'),
      'DESCRIPTION:' + icsEsc(body), 'URL:https://gennadygelman.com/patients/visit/',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc('Doctor visit tomorrow. Review your list.'), 'TRIGGER:-P1D', 'END:VALARM',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc('Doctor visit soon. Bring your list and medicines.'), 'TRIGGER:-PT2H', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'];
    var txt = lines.map(fold).join('\r\n') + '\r\n';
    var blob = new Blob([txt], { type: 'text/calendar;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'doctor-visit.ics'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    toast('Calendar file downloaded. Open it to add the event.');
  }
  api.ics = function () { if (st.when) ics(); };

  /* ---------- boot ---------- */
  function boot() {
    pill = document.createElement('button'); pill.type = 'button'; pill.className = 'vv-pill';
    pill.innerHTML = '<span class="c">0</span>My visit list';
    pill.addEventListener('click', openD);
    scrim = document.createElement('div'); scrim.className = 'vv-scrim'; scrim.addEventListener('click', closeD);
    drawer = document.createElement('aside'); drawer.className = 'vv-drawer'; drawer.setAttribute('aria-hidden', 'true'); drawer.setAttribute('aria-label', 'My visit list');
    drawer.innerHTML = '<div class="vv-dh"><h2>My visit list</h2><button type="button" class="vv-close" aria-label="Close">×</button></div><div class="vv-db"></div>';
    drawer.querySelector('.vv-close').addEventListener('click', closeD);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('on')) closeD(); });
    document.body.appendChild(scrim); document.body.appendChild(drawer);
    if (!document.querySelector('[data-vv-hub]')) document.body.appendChild(pill);
    else pill = null;
    mo.observe(document.body, { childList: true, subtree: true });
    sync();
    if (location.hash === '#myvisit') { var h = document.getElementById('myvisit'); if (h) setTimeout(function () { h.scrollIntoView(); }, 50); }
  }
  addEventListener('storage', function (e) { if (e.key === KEY) { st = load(); sync(); subs.forEach(function (f) { f(); }); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
