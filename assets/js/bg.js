// A very quiet drifting network behind the page: sparse dots, faint lines between near
// neighbours, and a few lines that reach toward the cursor. Drawn in the page's own ink
// colour, so it follows the light/dark theme. Static when reduced motion is requested.
(function () {
  var canvas = document.getElementById('bg-net');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var w = 0, h = 0, dpr = 1, nodes = [], linkDist = 150;
  var ink = [17, 17, 17], blue = [36, 87, 166];
  var mouse = { x: -9999, y: -9999, on: false };
  var raf = 0, running = false;

  function parseColor(v, fallback) {
    v = (v || '').trim();
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
    if (!m) return fallback;
    var s = m[1];
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }
  function readColors() {
    var cs = getComputedStyle(root);
    ink = parseColor(cs.getPropertyValue('--ink'), ink);
    blue = parseColor(cs.getPropertyValue('--blue'), blue);
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }

  function seed() {
    var count = Math.round((w * h) / 24000);
    count = Math.max(18, Math.min(count, 64));
    linkDist = w < 700 ? 110 : 150;
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 10,   // pixels per second, so speed is the same on every display
        vy: (Math.random() - 0.5) * 10,
        r: 1 + Math.random() * 0.9,
        hue: i % 6 === 0
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    draw();
  }

  function step(dt) {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    var i, j, a, b, dx, dy, d, alpha;
    ctx.lineWidth = 1;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j];
        dx = a.x - b.x; dy = a.y - b.y;
        if (dx > linkDist || dx < -linkDist || dy > linkDist || dy < -linkDist) continue;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d > linkDist) continue;
        alpha = (1 - d / linkDist) * 0.13;
        ctx.strokeStyle = rgba(ink, alpha);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    // a few lines reach toward the cursor
    if (mouse.on) {
      var reach = linkDist * 1.15;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        dx = a.x - mouse.x; dy = a.y - mouse.y;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d > reach) continue;
        ctx.strokeStyle = rgba(blue, (1 - d / reach) * 0.28);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      ctx.fillStyle = a.hue ? rgba(blue, 0.5) : rgba(ink, 0.3);
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, 6.2832);
      ctx.fill();
    }
  }

  var last = 0;
  function loop(ts) {
    var dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016;
    last = ts;
    step(dt);
    draw();
    raf = window.requestAnimationFrame(loop);
  }
  function start() {
    if (running || reduceMotion) return;
    running = true;
    last = 0;
    raf = window.requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    window.cancelAnimationFrame(raf);
  }

  readColors();
  resize();
  window.addEventListener('resize', resize);
  window.requestAnimationFrame(function () { canvas.classList.add('on'); });

  if (!reduceMotion) {
    start();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; }, { passive: true });
      document.addEventListener('mouseleave', function () { mouse.on = false; });
    }
  }

  // follow the theme: redraw with the new colours when it changes
  new MutationObserver(function () { readColors(); draw(); })
    .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', function () { readColors(); draw(); });
})();
