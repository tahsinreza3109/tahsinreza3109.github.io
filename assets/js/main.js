// Theme toggle, mobile nav, scroll reveals, and the class-projects carousel.
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme ---------- */
  var toggle = document.getElementById('theme-toggle');

  function currentTheme() {
    var saved = localStorage.getItem('theme');
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
    setTimeout(revealAll, 4000);
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // stagger siblings slightly so groups of cards cascade
        var siblings = Array.prototype.slice.call(el.parentNode.children).filter(function (n) {
          return n.classList && n.classList.contains('reveal');
        });
        var delay = Math.min(siblings.indexOf(el), 5) * 70;
        setTimeout(function () { el.classList.add('is-visible'); }, delay);
        observer.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealables.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Class projects carousel ---------- */
  var track = document.getElementById('carousel-track');
  if (track) {
    var slides = Array.prototype.slice.call(track.querySelectorAll('.slide'));
    var dotsWrap = document.getElementById('carousel-dots');
    var prevBtn = document.getElementById('car-prev');
    var nextBtn = document.getElementById('car-next');
    var index = 0;

    slides.forEach(function (slide, i) {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', (i + 1) + ' of ' + slides.length);
    });

    var dots = slides.map(function (_, i) {
      var b = document.createElement('button');
      b.className = 'dot';
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Project ' + (i + 1));
      b.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(b);
      return b;
    });

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      dots.forEach(function (d, n) {
        d.classList.toggle('active', n === index);
        d.setAttribute('aria-selected', n === index ? 'true' : 'false');
      });
      slides.forEach(function (s, n) { s.setAttribute('aria-hidden', n === index ? 'false' : 'true'); });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { go(index - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { go(index + 1); });

    // keyboard support when the carousel has focus within
    var carousel = document.getElementById('carousel');
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(index - 1); }
      if (e.key === 'ArrowRight') { go(index + 1); }
    });

    // touch swipe
    var startX = null;
    var viewport = carousel.querySelector('.carousel-viewport');
    viewport.addEventListener('touchstart', function (e) {
      startX = e.changedTouches[0].clientX;
    }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) { go(dx < 0 ? index + 1 : index - 1); }
      startX = null;
    }, { passive: true });

    if (reduceMotion) track.style.transition = 'none';
    go(0);
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
