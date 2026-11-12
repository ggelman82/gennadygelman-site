/* "On this page" guide for long pages on gennadygelman.com.
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
  var main = document.querySelector('main');
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
    '@media print{.toc-side,.toc-bar{display:none!important}html.toc-on main{margin:0 auto!important}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var cw = parseFloat(getComputedStyle(main).maxWidth);
  document.documentElement.style.setProperty('--cw', (isNaN(cw) ? 880 : cw) + 'px');
  document.documentElement.classList.add('toc-on');

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

  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  var active = -1;
  function update() {
    var line = window.innerHeight * 0.3, idx = 0;
    for (var i = 0; i < items.length; i++) if (items[i].el.getBoundingClientRect().top - line <= 0) idx = i;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = items.length - 1;
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
