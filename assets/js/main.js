// Page router (five pages, one at a time), theme toggle, mobile nav, scroll progress,
// count-up stats, project filters, the figure lightbox and pointer feedback.
// Without JavaScript every page simply stacks and stays readable.
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme ---------- */
  var toggle = document.getElementById('theme-toggle');
  function currentTheme() {
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var navLinks = document.getElementById('nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Scroll progress (rAF-throttled) ---------- */
  var bar = document.getElementById('progress');
  var ticking = false;
  function update() {
    ticking = false;
    var max = root.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- Count-up stats ---------- */
  function format(el, v) {
    var d = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (el.hasAttribute('data-comma')) return Math.round(v).toLocaleString('en-US');
    return d ? v.toFixed(d) : String(Math.round(v));
  }
  function runCount(el) {
    var to = parseFloat(el.getAttribute('data-to'));
    var finalText = el.textContent;
    var t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / 1200);
      el.textContent = format(el, to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) window.requestAnimationFrame(step);
      else el.textContent = finalText;
    }
    window.requestAnimationFrame(step);
  }
  function countIn(view) {
    if (reduceMotion) return;
    view.querySelectorAll('.count').forEach(function (el) {
      if (el.getAttribute('data-done')) return;
      el.setAttribute('data-done', '1');
      window.setTimeout(function () { runCount(el); }, 250);
    });
  }

  /* ---------- Pages ---------- */
  var views = Array.prototype.slice.call(document.querySelectorAll('.view'));
  var names = views.map(function (v) { return v.getAttribute('data-view'); });
  var legacy = {
    interests: 'about', education: 'experience', 'professional-experience': 'experience',
    awards: 'skills', intermodal: 'research'
  };
  var baseTitle = document.title;
  var current = null;
  var switching = false;

  function routeFromHash() {
    var h = (window.location.hash || '').replace(/^#\/?/, '');
    if (legacy[h]) h = legacy[h];
    return names.indexOf(h) > -1 ? h : 'about';
  }
  function viewOf(name) { return views[names.indexOf(name)]; }

  function reveal(name, userInitiated) {
    var view = viewOf(name);
    views.forEach(function (v) { v.hidden = v !== view; v.classList.remove('is-leaving'); });
    navLinks && navLinks.querySelectorAll('a[data-nav]').forEach(function (a) {
      var on = a.getAttribute('data-nav') === name;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = name === 'about' ? baseTitle : view.getAttribute('data-title') + ' - Tahsin Reza';
    window.scrollTo(0, 0);
    current = name;
    switching = false;
    update();
    countIn(view);
    if (userInitiated) view.focus({ preventScroll: true });
  }

  function go(name, userInitiated) {
    if (name === current || switching) return;
    var out = current ? viewOf(current) : null;
    if (out && !reduceMotion) {
      // exits are quicker than entrances
      switching = true;
      out.classList.add('is-leaving');
      window.setTimeout(function () { reveal(name, userInitiated); }, 150);
    } else {
      reveal(name, userInitiated);
    }
  }

  if (views.length) {
    root.classList.add('js-pages');
    reveal(routeFromHash(), false);
    window.addEventListener('hashchange', function () { go(routeFromHash(), true); });
  }

  /* ---------- Project filters ---------- */
  var chips = document.querySelectorAll('.fchip');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.pcard'));
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      cards.forEach(function (card) {
        var show = f === 'All' || card.getAttribute('data-cat') === f;
        if (reduceMotion) { card.hidden = !show; return; }
        if (show) {
          card.hidden = false;
          card.classList.add('is-out');
          window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () { card.classList.remove('is-out'); });
          });
        } else {
          card.classList.add('is-out');
          setTimeout(function () { if (card.classList.contains('is-out')) card.hidden = true; }, 260);
        }
      });
    });
  });

  /* ---------- Figure lightbox ---------- */
  var box = document.getElementById('lightbox');
  if (box && typeof box.showModal === 'function') {
    var imgEl = document.getElementById('lb-img');
    var capEl = document.getElementById('lb-cap');
    var cntEl = document.getElementById('lb-count');
    var items = [];
    var idx = 0;
    var opener = null;

    function show(i) {
      idx = (i + items.length) % items.length;
      imgEl.src = items[idx].src;
      imgEl.alt = items[idx].alt;
      capEl.textContent = items[idx].alt;
      cntEl.textContent = (idx + 1) + ' / ' + items.length;
    }
    function open(btn) {
      var list = document.getElementById(btn.getAttribute('data-gallery'));
      if (!list) return;
      items = Array.prototype.slice.call(list.children).map(function (li) {
        return { src: li.getAttribute('data-src'), alt: li.getAttribute('data-alt') || '' };
      });
      opener = btn;
      show(0);
      box.showModal();
    }
    document.querySelectorAll('.pmedia').forEach(function (btn) {
      btn.addEventListener('click', function () { open(btn); });
    });
    document.getElementById('lb-close').addEventListener('click', function () { box.close(); });
    document.getElementById('lb-prev').addEventListener('click', function () { show(idx - 1); });
    document.getElementById('lb-next').addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    box.addEventListener('close', function () { if (opener) opener.focus(); });
  } else {
    document.querySelectorAll('.pmedia').forEach(function (b) { b.style.cursor = 'default'; });
  }

  /* ---------- Pointer feedback (mouse and trackpad only) ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    // a soft spotlight follows the cursor across cards
    document.addEventListener('mousemove', function (e) {
      var card = e.target.closest ? e.target.closest('.card, .pcard') : null;
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });

    // the outline behind the portrait drifts a few pixels against the cursor
    var home = document.getElementById('view-about');
    var photo = document.querySelector('.hero-photo');
    if (home && photo) {
      home.addEventListener('mousemove', function (e) {
        var r = home.getBoundingClientRect();
        photo.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        photo.style.setProperty('--py', ((e.clientY - r.top) / Math.max(r.height, 1) - 0.5).toFixed(3));
      }, { passive: true });
      home.addEventListener('mouseleave', function () {
        photo.style.setProperty('--px', 0);
        photo.style.setProperty('--py', 0);
      });
    }
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  update();
})();
