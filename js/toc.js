/* "On this page" guide for long pages on gennadygelman.com.
 *
 * Cache: pages load this as /js/toc.js?v=N. After editing, bump N in every
 * page (and in scripts/build-patient-pages.mjs) so browsers fetch the new copy.
 *
 * Add <script src="/js/toc.js" defer></script> to a page. The script reads the
 * page's <h2> headings inside <main>, and builds:
 *   - wide screens: a sidebar to the left of the content that highlights the
 *     section you are reading;
 *   - narrow screens: a slim sticky bar under the header that names the current
 *     section and opens the full list.
 *
 * Labels, in order of preference: the heading's data-toc attribute, the text of
 * the page's own .jump link to that section, then the heading text itself.
 * Add data-toc-skip to a heading to leave it out.
 */
(function () {
  // Pages built before the shared layout have an <article> instead of <main>.
  var main = document.querySelector('main') || document.querySelector('article');
  if (!main) return;
  var heads = Array.prototype.filter.call(main.querySelectorAll('h2'), function (h) {
    return !h.hasAttribute('data-toc-skip') && !h.closest('[data-toc-skip]') && h.textContent.trim();
  });
  if (heads.length < 3) return;

  var slug = function (s) {
    return s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'section';
  };
  var jump = {};
  Array.prototype.forEach.call(document.querySelectorAll('.jump a[href^="#"]'), function (a) {
    jump[a.getAttribute('href').slice(1)] = a.textContent.trim();
  });

  var items = heads.map(function (h) {
    var sec = h.closest('section[id]');
    var target = sec || h;
    if (!target.id) {
      var id = slug(h.textContent), n = 2, base = id;
      while (document.getElementById(id)) id = base + '-' + n++;
      target.id = id;
    }
    var label = h.getAttribute('data-toc') || jump[target.id] || h.textContent.trim().replace(/[.:]$/, '');
    return { h: h, el: target, id: target.id, label: label };
  });

  var css = '' +
    ':root{--toc-w:216px}' +
    '[tabindex="-1"]:focus{outline:none}' +
    '.toc-side{display:none}' +
    '.toc-bar{position:sticky;top:64px;z-index:15;margin:0 calc(-1 * clamp(16px,4vw,32px));padding:0 clamp(16px,4vw,32px);background:var(--paper);border-bottom:1px solid var(--line)}' +
    '.toc-bar>button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:10px;width:100%;padding:11px 0;font:500 14px/1.3 Geist,system-ui,sans-serif;color:var(--ink)}' +
    '.toc-bar .k{font:500 11px/1 "Geist Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);flex:none}' +
    '.toc-bar .cur{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.toc-bar .chev{flex:none;width:10px;height:10px;border-right:2px solid var(--soft);border-bottom:2px solid var(--soft);transform:rotate(45deg) translateY(-3px);transition:transform .2s}' +
    '.toc-bar.open .chev{transform:rotate(-135deg) translateY(-2px)}' +
    '.toc-bar ol{display:none;list-style:none;margin:0;padding:0 0 12px;max-height:60vh;overflow:auto}' +
    '.toc-bar.open ol{display:block}' +
    '.toc-bar>button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}' +
    '.toc a{display:block;text-decoration:none;color:var(--soft);font-size:14px;line-height:1.35;padding:7px 12px;border-left:2px solid var(--line)}' +
    '.toc a:hover{color:var(--ink)}' +
    '.toc a[aria-current="true"]{color:var(--ink);font-weight:600;border-left-color:var(--accent)}' +
    '.toc a:focus-visible{outline:3px solid var(--accent);outline-offset:1px}' +
    '@media (min-width:1100px){' +
      'html.toc-on main{margin-left:max(calc(var(--toc-w) + 56px),calc(50% - var(--cw) / 2));margin-right:auto}' +
      '.toc-bar{display:none}' +
      '.toc-side{display:block;position:fixed;top:96px;width:var(--toc-w);left:calc(max(calc(var(--toc-w) + 56px),calc(50% - var(--cw) / 2)) - var(--toc-w) - 32px);max-height:calc(100vh - 128px);overflow:auto;z-index:5}' +
      '.toc-side .k{font:500 11px/1 "Geist Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);margin:0 0 10px 14px}' +
      '.toc-side ol{list-style:none;margin:0;padding:0}' +
      '.toc-side .top{display:inline-block;margin:14px 0 0 14px;font-size:13px;color:var(--faint);text-decoration:none}' +
      '.toc-side .top:hover{color:var(--ink)}' +
    '}' +
    '.toc-stick{display:none}' +
    '@media (min-width:1100px){' +
      '.toc-stick{display:flex;align-items:baseline;gap:14px;position:fixed;top:64px;z-index:14;box-sizing:border-box;padding:12px 0 11px;background:var(--paper);border-bottom:1px solid var(--line);opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .18s,transform .18s}' +
      '.toc-stick.show{opacity:1;transform:none;pointer-events:auto}' +
      '.toc-stick .n{font:500 12px/1 "Geist Mono",monospace;color:var(--faint);flex:none}' +
      '.toc-stick .n:empty{display:none}' +
      '.toc-stick .t{font-family:Newsreader,Georgia,serif;font-size:23px;line-height:1.15;letter-spacing:-.01em;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}' +
    '}' +
    '@media print{.toc-side,.toc-bar,.toc-stick{display:none!important}html.toc-on main{margin:0 auto!important}}';
  // Bar-only layout: for pages whose content is too wide (or full-bleed) to
  // make room for a sidebar, show the slim sticky bar at every screen width.
  css += '@media (min-width:1100px){' +
    'html.toc-bar-only.toc-on main,html.toc-bar-only.toc-on article{margin-left:auto}' +
    'html.toc-bar-only .toc-side,html.toc-bar-only .toc-stick{display:none}' +
    'html.toc-bar-only .toc-bar{display:block}' +
  '}' +
  'html.toc-bar-only .toc-bar{margin-left:0;margin-right:0;padding-left:0;padding-right:0}' +
  'html.toc-no-hd .toc-bar{top:0}' +
  'html.toc-bar-only .toc-bar{box-sizing:border-box;overflow-x:clip}' +
  'html.toc-pad .toc-bar{padding-left:clamp(16px,4vw,48px);padding-right:clamp(16px,4vw,48px)}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // Pages with their own stylesheet may not define the shared color variables.
  // Fill any that are missing from the page's own colors, and again whenever
  // the light/dark theme changes.
  var root = document.documentElement;
  var VARS = ['--paper', '--ink', '--soft', '--faint', '--line', '--accent'];
  var own = VARS.filter(function (v) { return !getComputedStyle(root).getPropertyValue(v).trim(); });
  function fill() {
    if (!own.length) return;
    var bs = getComputedStyle(document.body), ink = bs.color, bg = bs.backgroundColor;
    if (!bg || /rgba?\(0, 0, 0, 0\)|transparent/.test(bg)) bg = getComputedStyle(root).backgroundColor;
    if (!bg || /rgba?\(0, 0, 0, 0\)|transparent/.test(bg)) bg = '#fff';
    var a = main.querySelector('a[href]');
    var mix = function (pct) { return 'color-mix(in srgb, ' + ink + ' ' + pct + '%, ' + bg + ')'; };
    var val = { '--paper': bg, '--ink': ink, '--soft': mix(72), '--faint': mix(55), '--line': mix(14), '--accent': a ? getComputedStyle(a).color : ink };
    own.forEach(function (v) { root.style.setProperty(v, val[v]); });
  }
  fill();
  if (own.length && window.MutationObserver) {
    new MutationObserver(function () { own.forEach(function (v) { root.style.removeProperty(v); }); fill(); })
      .observe(root, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  }

  var cw = parseFloat(getComputedStyle(main).maxWidth);
  if (isNaN(cw) || cw > 1000 || main.hasAttribute('data-toc-bar')) root.classList.add('toc-bar-only');
  if (root.classList.contains('toc-bar-only') && parseFloat(getComputedStyle(main).paddingLeft) < 8) root.classList.add('toc-pad');
  // If the site header scrolls away instead of sticking, the bar sticks to the very top.
  var hd = document.querySelector('header.top') || document.querySelector('header') || document.getElementById('gg-hd');
  if (!hd || !/sticky|fixed/.test(getComputedStyle(hd).position)) root.classList.add('toc-no-hd');
  root.style.setProperty('--cw', (isNaN(cw) ? 880 : cw) + 'px');
  root.classList.add('toc-on');

  var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var list = '<ol>' + items.map(function (it) { return '<li><a href="#' + it.id + '">' + esc(it.label) + '</a></li>'; }).join('') + '</ol>';

  var side = document.createElement('nav');
  side.className = 'toc toc-side';
  side.setAttribute('aria-label', 'On this page');
  side.innerHTML = '<p class="k">On this page</p>' + list + '<a class="top" href="#">↑ Back to top</a>';
  document.body.appendChild(side);

  var bar = document.createElement('nav');
  bar.className = 'toc toc-bar';
  bar.setAttribute('aria-label', 'On this page');
  bar.innerHTML = '<button type="button" aria-expanded="false"><span class="k">On this page</span><span class="cur"></span><span class="chev" aria-hidden="true"></span></button>' + list;
  var first = items[0].el;
  while (first.parentNode && first.parentNode !== main) first = first.parentNode;
  main.insertBefore(bar, first);
  var btn = bar.querySelector('button'), cur = bar.querySelector('.cur');
  var setOpen = function (o) { bar.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); };
  btn.addEventListener('click', function () { setOpen(!bar.classList.contains('open')); });
  bar.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  side.querySelector('.top').addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  items.forEach(function (it) { it.el.style.scrollMarginTop = '144px'; });

  // Wide screens: keep the current section's heading pinned under the site
  // header from the moment its own heading scrolls away until the section ends.
  var stick = document.createElement('div');
  stick.className = 'toc-stick';
  stick.setAttribute('aria-hidden', 'true');
  stick.innerHTML = '<span class="n"></span><span class="t"></span>';
  document.body.appendChild(stick);
  var sN = stick.querySelector('.n'), sT = stick.querySelector('.t'), shown = -2;
  items.forEach(function (it) {
    var box = it.h.closest('section') || it.h.parentElement;
    var num = box && box.querySelector('.num');
    it.num = num && box.contains(it.h) ? num.textContent.trim() : '';
    it.box = box;
  });
  items.forEach(function (it) {
    it.ownBox = !!it.box && it.box !== main && !items.some(function (o) { return o !== it && it.box.contains(o.h); });
  });
  function pin(idx) {
    var mr = main.getBoundingClientRect(), cs = getComputedStyle(main);
    stick.style.left = (mr.left + parseFloat(cs.paddingLeft)) + 'px';
    stick.style.width = (mr.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) + 'px';
    var it = items[idx], line = 64 + 50;
    var end = it.ownBox ? it.box.getBoundingClientRect().bottom : Infinity;
    if (items[idx + 1]) end = Math.min(end, items[idx + 1].h.getBoundingClientRect().top);
    var on = it.h.getBoundingClientRect().bottom < line && end > line + 20;
    if (on && shown !== idx) { sN.textContent = it.num; sT.textContent = it.h.textContent.trim(); shown = idx; }
    stick.classList.toggle('show', on);
  }

  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  var active = -1;
  function update() {
    var line = window.innerHeight * 0.3, idx = 0;
    // Sections a page is hiding (a tool's results before it has run) drop out of the guide.
    var firstVis = -1;
    for (var i = 0; i < items.length; i++) {
      var vis = items[i].h.getClientRects().length > 0;
      if (vis !== items[i].vis) {
        items[i].vis = vis;
        links.forEach(function (a) { if (a.getAttribute('href') === '#' + items[i].id) a.parentNode.hidden = !vis; });
      }
      if (!vis) continue;
      if (firstVis < 0) firstVis = i;
      if (items[i].el.getBoundingClientRect().top - line <= 0) idx = i;
    }
    if (firstVis < 0) return;
    if (!items[idx].vis) idx = firstVis;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) { for (var j = items.length - 1; j >= 0; j--) if (items[j].vis) { idx = j; break; } }
    pin(idx);
    if (idx === active) return;
    active = idx;
    links.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + items[idx].id;
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    cur.textContent = items[idx].label;
    var sa = side.querySelector('a[aria-current]');
    if (sa && side.scrollHeight > side.clientHeight) {
      var r = sa.getBoundingClientRect(), s = side.getBoundingClientRect();
      if (r.top < s.top || r.bottom > s.bottom) side.scrollTop += r.top - s.top - s.height / 3;
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
