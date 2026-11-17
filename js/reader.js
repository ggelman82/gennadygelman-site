/* Reading controls for long pages: text size and typeface.
 * Choice is saved per visitor in localStorage (key gg-reader). Pages load it
 * with <script src="/js/reader.js?v=1" defer></script>.
 */
(function () {
  var KEY = 'gg-reader';
  var FONTS = {
    serif: { label: 'Serif (default)', css: '' },
    sans: { label: 'Sans-serif', css: 'Geist,system-ui,sans-serif' },
    atkinson: { label: 'Atkinson Hyperlegible', css: '"Atkinson Hyperlegible",Arial,sans-serif' }
  };
  var state = { step: 0, font: 'serif' };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) state = Object.assign(state, saved); } catch (e) {}

  function base() { return window.innerWidth <= 560 ? 17 : 20; }
  function apply() {
    var b = document.body;
    b.style.fontSize = (base() + state.step) + 'px';
    b.style.fontFamily = FONTS[state.font].css;
    if (state.font === 'atkinson') b.style.lineHeight = '1.7';
    else b.style.lineHeight = '';
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    if (sel) sel.value = state.font;
    if (val) val.textContent = (base() + state.step) + 'px';
  }

  var css = '' +
    '#rd{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:60;font-family:Geist,system-ui,sans-serif;font-size:14px}' +
    '#rd>button{all:unset;cursor:pointer;padding:8px 14px;border:1px solid #bbb;border-radius:999px;background:#fff;color:#141413;box-shadow:0 2px 10px rgba(0,0,0,.12)}' +
    '#rd>button:focus-visible{outline:3px solid #2b5fd9;outline-offset:2px}' +
    '#rd .pn{display:none;position:absolute;left:0;bottom:48px;width:250px;padding:14px;border:1px solid #bbb;border-radius:12px;background:#fff;color:#141413;box-shadow:0 6px 24px rgba(0,0,0,.16)}' +
    '#rd.open .pn{display:block}' +
    '#rd .row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px}' +
    '#rd .row:last-child{margin-bottom:0}' +
    '#rd .row>b{font-weight:500;font-size:13px}' +
    '#rd .sz button{all:unset;cursor:pointer;width:34px;height:34px;border:1px solid #bbb;border-radius:8px;text-align:center;line-height:34px;font-size:16px}' +
    '#rd .sz span{min-width:52px;text-align:center;font-variant-numeric:tabular-nums}' +
    '#rd select{font:inherit;padding:6px;border:1px solid #bbb;border-radius:8px;background:#fff;color:#141413;max-width:150px}' +
    '@media (prefers-color-scheme:dark){#rd>button,#rd .pn,#rd select{background:#1f1e1c;color:#f0eee6;border-color:#555}#rd .sz button{border-color:#555;color:#f0eee6}}' +
    'html[data-theme="dark"] #rd>button,html[data-theme="dark"] #rd .pn,html[data-theme="dark"] #rd select{background:#1f1e1c;color:#f0eee6;border-color:#555}' +
    'html[data-theme="dark"] #rd .sz button{border-color:#555;color:#f0eee6}' +
    '@media print{#rd{display:none}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap';
  document.head.appendChild(link);

  var box = document.createElement('div');
  box.id = 'rd';
  box.innerHTML =
    '<button type="button" aria-expanded="false" aria-controls="rd-panel">Text</button>' +
    '<div class="pn" id="rd-panel">' +
      '<div class="row sz"><b>Size</b><span><button type="button" data-d="-1" aria-label="Smaller text">A−</button></span><span id="rd-val"></span><span><button type="button" data-d="1" aria-label="Larger text">A+</button></span></div>' +
      '<div class="row"><b>Font</b><select id="rd-font" aria-label="Typeface">' +
        Object.keys(FONTS).map(function (k) { return '<option value="' + k + '">' + FONTS[k].label + '</option>'; }).join('') +
      '</select></div>' +
    '</div>';
  document.body.appendChild(box);

  var sel = box.querySelector('#rd-font'), val = box.querySelector('#rd-val');
  var toggle = box.querySelector('button');
  toggle.addEventListener('click', function () {
    var o = !box.classList.contains('open');
    box.classList.toggle('open', o);
    toggle.setAttribute('aria-expanded', String(o));
  });
  box.querySelectorAll('.sz button').forEach(function (b) {
    b.addEventListener('click', function () {
      state.step = Math.max(-2, Math.min(6, state.step + Number(b.getAttribute('data-d'))));
      apply();
    });
  });
  sel.addEventListener('change', function () { state.font = sel.value; apply(); });
  window.addEventListener('resize', apply);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { box.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); } });
  apply();
})();
