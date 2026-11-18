// One scrolling page: theme toggle, mobile nav, scroll progress, active-section highlight,
// reveal-on-scroll, count-up stats, project filters, the figure lightbox and pointer feedback.
// Without JavaScript everything is simply visible and readable.
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

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
  function closeNav() {
    if (!navLinks) return;
    navLinks.classList.remove('open');
    navToggle && navToggle.setAttribute('aria-expanded', 'false');
  }
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeNav); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  }

  /* ---------- Scroll progress, header shadow, back-to-top (rAF-throttled) ---------- */
  var bar = document.getElementById('progress');
  var toTop = document.getElementById('to-top');
  var ticking = false;
  function update() {
    ticking = false;
    var y = window.scrollY;
    var max = root.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    root.classList.toggle('is-scrolled', y > 8);
    if (toTop) toTop.classList.toggle('show', y > window.innerHeight * 0.9);
    if (typeof spy === 'function') spy();
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- Active section in the nav ---------- */
  var navAnchors = navLinks ? Array.prototype.slice.call(navLinks.querySelectorAll('a[data-nav]')) : [];
  function setActive(id) {
    navAnchors.forEach(function (a) {
      var on = a.getAttribute('data-nav') === id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  var spySections = navAnchors.map(function (a) { return document.getElementById(a.getAttribute('data-nav')); }).filter(Boolean);
  var activeId = null;
  function spy() {
    // the active section is the last one whose top has passed 40% of the viewport;
    // at the very bottom of the page the last section wins
    var line = window.innerHeight * 0.4, id = '';
    spySections.forEach(function (s) { if (s.getBoundingClientRect().top <= line) id = s.id; });
    if (window.innerHeight + window.scrollY >= root.scrollHeight - 4 && spySections.length) id = spySections[spySections.length - 1].id;
    if (id !== activeId) { activeId = id; setActive(id); }
  }

  /* ---------- Count-up stats ---------- */
  function format(el, v) {
    var d = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (el.hasAttribute('data-comma')) return Math.round(v).toLocaleString('en-US');
    return d ? v.toFixed(d) : String(Math.round(v));
  }
  function runCount(el) {
    if (el.getAttribute('data-done')) return;
    el.setAttribute('data-done', '1');
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

  /* ---------- Reveal on scroll ----------
     Content is hidden only while html.js-anim is set (added in <head> when IntersectionObserver
     exists and motion is allowed). If the observer never reports, everything is shown anyway. */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function showAll() {
    reveals.forEach(function (el) { el.classList.add('in'); });
    root.classList.remove('js-anim');
  }
  if (root.classList.contains('js-anim') && hasIO) {
    var seen = false;
    var io = new IntersectionObserver(function (entries) {
      seen = true;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        // stagger siblings that enter together
        var sibs = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('reveal'); }) : [];
        var i = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = Math.min(i, 6) * 60 + 'ms';
        el.classList.add('in');
        el.querySelectorAll('.count').forEach(function (c) { window.setTimeout(function () { runCount(c); }, 200); });
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    reveals.forEach(function (el) { io.observe(el); });
    window.setTimeout(function () { if (!seen) showAll(); }, 2500);
    window.addEventListener('beforeprint', showAll);
  } else {
    root.classList.remove('js-anim');
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
        card.classList.add('in');
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

  // a link to a project hidden by the filter resets the filter first
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#p-"]') : null;
    if (!a) return;
    var card = document.getElementById(a.getAttribute('href').slice(1));
    var all = document.querySelector('.fchip[data-filter="All"]');
    if (card && card.hidden && all) { all.click(); card.hidden = false; card.classList.remove('is-out'); }
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
      var card = e.target.closest ? e.target.closest('.card, .pcard, .thesis') : null;
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });

    // the outline behind the portrait drifts a few pixels against the cursor
    var heroSec = document.getElementById('about');
    var photo = document.querySelector('.hero-photo');
    if (heroSec && photo) {
      heroSec.addEventListener('mousemove', function (e) {
        var r = heroSec.getBoundingClientRect();
        photo.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        photo.style.setProperty('--py', ((e.clientY - r.top) / Math.max(r.height, 1) - 0.5).toFixed(3));
      }, { passive: true });
      heroSec.addEventListener('mouseleave', function () {
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
