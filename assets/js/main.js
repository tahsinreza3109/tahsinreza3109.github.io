// Theme toggle, mobile nav, scroll progress, active-section nav, scroll reveals,
// count-up stats, project filters, the figure lightbox and pointer feedback.
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
  update();

  /* ---------- Active section in the nav ---------- */
  if ('IntersectionObserver' in window && navLinks) {
    var links = {};
    navLinks.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Object.keys(links).forEach(function (id) { links[id].classList.toggle('active', id === entry.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
    // the hero has no nav link, so it clears the highlight
    ['hero'].forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealables = document.querySelectorAll('.reveal');
  function revealAll() {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    // only opt into the hidden-until-revealed state once we know we can undo it
    root.classList.add('js-anim');
    // safety net: never leave content hidden if the observer misbehaves
    setTimeout(revealAll, 5000);
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = Array.prototype.slice.call(el.parentNode.children).filter(function (n) {
          return n.classList && n.classList.contains('reveal');
        });
        var delay = Math.min(siblings.indexOf(el), 5) * 80;
        setTimeout(function () { el.classList.add('is-visible'); }, delay);
        observer.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll('.count');
  function format(el, v) {
    var d = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (el.hasAttribute('data-comma')) return Math.round(v).toLocaleString('en-US');
    return d ? v.toFixed(d) : String(Math.round(v));
  }
  function runCount(el) {
    var to = parseFloat(el.getAttribute('data-to'));
    var finalText = el.textContent;
    var t0 = null;
    var dur = 1400;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = format(el, to * eased);
      if (k < 1) window.requestAnimationFrame(step);
      else el.textContent = finalText;
    }
    window.requestAnimationFrame(step);
  }
  if (!reduceMotion && 'IntersectionObserver' in window && counters.length) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        countObs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { countObs.observe(c); });
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
    // no <dialog> support: the project images just stay as plain pictures
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
    var hero = document.getElementById('hero');
    var photo = document.querySelector('.hero-photo');
    if (hero && photo) {
      hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        photo.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        photo.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      }, { passive: true });
      hero.addEventListener('mouseleave', function () {
        photo.style.setProperty('--px', 0);
        photo.style.setProperty('--py', 0);
      });
    }
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
