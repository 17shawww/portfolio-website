/* Independently implemented native signature motion. Source-pattern and license
   review: docs/SIGNATURE-MOTION-RESEARCH-2026-11-16.md. No upstream runtime. */
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const running = new Set(), resets = new Set();
  const tokens = getComputedStyle(document.documentElement);
  const signatureDuration = parseFloat(tokens.getPropertyValue('--motion-signature')) || 720;
  const signatureEase = tokens.getPropertyValue('--motion-signature-ease').trim();
  const entranceEase = tokens.getPropertyValue('--motion-ease').trim();
  const entranceDuration = parseFloat(tokens.getPropertyValue('--motion-enter')) || 340;
  const inkDuration = parseFloat(tokens.getPropertyValue('--motion-ink')) || 920;
  const reformDuration = parseFloat(tokens.getPropertyValue('--motion-ink-return')) || 660;
  const stagger = parseFloat(tokens.getPropertyValue('--motion-stagger')) || 20;
  const unit = value => Math.max(0, Math.min(1, value));
  const smooth = value => {
    const t = unit(value);
    return t * t * (3 - 2 * t);
  };
  let stopped = false;
  const allowed = () => !preference.matches && !document.hidden && !stopped;
  function animate(element, frames, options) {
    if (!allowed() || !element.animate) return Promise.resolve();
    const animation = element.animate(frames, options);running.add(animation);
    return animation.finished.catch(() => {}).finally(() => running.delete(animation));
  }
  function settle() {
    running.forEach(animation => animation.cancel());running.clear();
    resets.forEach(reset => reset());
  }
  preference.addEventListener('change', () => { if (preference.matches) settle(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); });
  addEventListener('pagehide', () => { stopped = true;settle(); });
  addEventListener('pageshow', () => { stopped = false; });

  const home = Boolean(document.querySelector('#home-title[data-signature-type]'));
  const heroImage = document.querySelector('.hero-signature');
  let secondaryHeadingsReady = 0;
  const historyEntry = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';

  // Sample only actual ink from the existing image, at its displayed object-fit.
  // At rest the original PNG is always used, with its exact texture/proportions.
  document.querySelectorAll('.logo,.hero-signature').forEach(image => {
    const hero = image.classList.contains('hero-signature');
    const shell = document.createElement(hero ? 'button' : 'div');
    shell.className = `p4-logo-shell${hero ? ' p4-hero-mark' : ''}`;
    if (hero) { shell.type = 'button';shell.setAttribute('aria-label', 'Replay YP ink animation');shell.disabled = preference.matches; }
    image.before(shell);shell.append(image);
    const canvas = document.createElement('canvas');canvas.className = 'p4-logo-canvas';canvas.setAttribute('aria-hidden', 'true');canvas.hidden = true;shell.append(canvas);
    const context = canvas.getContext('2d');
    if (!context) {
      if (hero) shell.disabled = true;
      return;
    }
    let frame = 0, points = [], width = 0, height = 0, pixelRatio = 1, active = false;
    let pointer = { x: 0, y: 0 }, lastPulse = -Infinity;
    const margin = hero ? 35 : 16;
    function restore() {
      cancelAnimationFrame(frame);frame = 0;active = false;
      image.style.removeProperty('opacity');canvas.hidden = true;
      delete shell.dataset.inkActive;
    }
    resets.add(restore);
    function sample() {
      restore();
      const rect = image.getBoundingClientRect();width = rect.width;height = rect.height;
      if (!width || !height || !image.naturalWidth) return false;
      pixelRatio = Math.min(devicePixelRatio || 1, 2);
      const buffer = document.createElement('canvas');buffer.width = Math.ceil(width);buffer.height = Math.ceil(height);
      const draw = buffer.getContext('2d', { willReadFrequently: true });if (!draw) return false;
      const cover = getComputedStyle(image).objectFit === 'cover';
      const scale = (cover ? Math.max : Math.min)(width / image.naturalWidth, height / image.naturalHeight);
      const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
      draw.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
      let data;try { data = draw.getImageData(0, 0, buffer.width, buffer.height).data; } catch { return false; }
      points = [];
      const step = hero ? 2 : 1;
      for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) {
        const i = (y * buffer.width + x) * 4;
        if (data[i + 3] < 100 || Math.min(data[i], data[i + 1], data[i + 2]) > 222) continue;
        const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const grain = seed - Math.floor(seed);
        const across = x / width - .5;
        const down = y / height;
        // Nearby samples travel together. Grain only changes their density and arrival.
        points.push({
          x, y, grain,
          color: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`,
          sweepX: (hero ? 46 : 16) * (.72 + across + grain * .12),
          sweepY: (hero ? 31 : 12) * (.68 + down * .44),
          curl: (hero ? 16 : 6) * Math.sin((across + down * .65) * Math.PI),
          arrival: .17 * (1 - down) + .055 * grain,
          radius: step * (.39 + grain * .29),
        });
      }
      // Predictable bounded CPU work, even if the source image is replaced later.
      if (points.length > 1600) points = points.filter((_, index) => index % Math.ceil(points.length / 1600) === 0);
      shell.dataset.inkParticles = points.length;
      canvas.width = Math.ceil((width + margin * 2) * pixelRatio);canvas.height = Math.ceil((height + margin * 2) * pixelRatio);
      Object.assign(canvas.style, { width: `${width + margin * 2}px`, height: `${height + margin * 2}px`, left: `${-margin}px`, top: `${-margin}px` });
      pointer = { x: width / 2, y: height / 2 };return points.length > 0;
    }
    let velocity = 0;
    let lastInput = 0;
    function pulse(intro = false) {
      if (!allowed() || active || !points.length || !shell.getBoundingClientRect().width) return;
      const start = performance.now();
      const duration = intro ? (hero ? inkDuration : inkDuration * .84) : reformDuration;
      let centerX = pointer.x;
      let centerY = pointer.y;
      let impulse = velocity;
      lastPulse = start;
      active = true;
      canvas.hidden = false;
      image.style.opacity = intro ? '0' : '1';
      shell.dataset.inkActive = intro ? 'gather' : 'reform';
      if (intro) secondaryHeadingsReady = Math.max(secondaryHeadingsReady, start + duration);

      function paint(now) {
        if (!allowed()) {
          restore();
          return;
        }
        const t = unit((now - start) / duration);
        const handback = intro ? smooth((t - .62) / .38) : 1 - smooth(t / .18) * (1 - smooth((t - .57) / .43)) * .86;
        const envelope = smooth(t / .22) * (1 - smooth((t - .30) / .70));
        centerX += (pointer.x - centerX) * .18;
        centerY += (pointer.y - centerY) * .18;
        impulse += (velocity - impulse) * .15;
        velocity *= .94;
        image.style.opacity = String(handback);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.clearRect(0, 0, width + margin * 2, height + margin * 2);
        for (const point of points) {
          let dx, dy, thread, density;
          if (intro) {
            const travel = 1 - smooth((t - point.arrival) / .76);
            const arc = Math.sin(Math.PI * travel);
            dx = -point.sweepX * travel + point.curl * arc;
            dy = point.sweepY * travel - point.curl * arc * .55;
            thread = travel * (.8 + point.grain * 1.6);
            density = .4 + .6 * (1 - travel);
          } else {
            const offsetX = point.x - centerX;
            const offsetY = point.y - centerY;
            const distance = Math.max(5, Math.hypot(offsetX, offsetY));
            const falloff = smooth(1 - distance / (hero ? 68 : 27));
            const spread = falloff * envelope * (hero ? 21 : 8) * (1 + .48 * impulse);
            dx = (offsetX - offsetY * .62) / distance * spread;
            dy = (offsetY + offsetX * .62) / distance * spread;
            thread = envelope * falloff * (1 + impulse);
            density = .65 + .35 * falloff;
          }
          context.globalAlpha = (1 - handback) * density * (.72 + point.grain * .28);
          context.fillStyle = point.color;
          context.beginPath();
          context.ellipse(
            point.x + margin + dx, point.y + margin + dy,
            point.radius * (1 + thread), point.radius * .66,
            Math.atan2(dy, dx), 0, 2 * Math.PI,
          );
          context.fill();
        }
        if (t < 1) frame = requestAnimationFrame(paint);
        else restore();
      }
      frame = requestAnimationFrame(paint);
    }

    function locate(event) {
      const rect = image.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const dt = event.timeStamp - lastInput;
      velocity = dt > 0 && dt < 100 ? unit(Math.hypot(x - pointer.x, y - pointer.y) / dt / 1.8) : 0;
      lastInput = event.timeStamp;
      pointer = { x, y };
    }
    shell.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || !fine.matches) return;
      locate(event);
      pulse();
    });
    shell.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || !fine.matches) return;
      locate(event);
      if (performance.now() - lastPulse > 950) pulse();
    }, { passive: true });
    if (hero) shell.addEventListener('click', () => { pointer = { x: width / 2, y: height / 2 };pulse(); });
    else shell.closest('.brand')?.addEventListener('focusin', () => pulse());
    preference.addEventListener('change', () => { if (hero) shell.disabled = preference.matches; });
    async function init() {
      try { await image.decode(); } catch { return; }
      if (!sample()) return;
      // One automatic mark per screen. The compact header takes over on mobile.
      if (home && !historyEntry && !location.hash && (hero || !heroImage?.getClientRects().length)) pulse(true);
    }
    if ('ResizeObserver' in window) new ResizeObserver(() => {
      const rect = image.getBoundingClientRect();
      if (Math.abs(rect.width - width) > .5 || Math.abs(rect.height - height) > .5) sample();
    }).observe(image);
    init();
  });

  // Preserve the actual heading text and its shaping/layout. A temporary,
  // aria-hidden letter overlay supplies masks without changing accessible text.
  const title = document.querySelector('#home-title[data-signature-type]');
  if (title) {
    const original = document.createElement('span');original.className = 'p4-type-original';
    original.append(...title.childNodes);title.append(original);title.classList.add('p4-type-title');
    let overlay;
    function revealText() { title.classList.remove('p4-type-active');overlay?.remove();overlay = null; }
    resets.add(revealText);
    const skip = location.hash || historyEntry;
    if (allowed() && !skip && title.animate) {
      const node = original.firstChild, box = title.getBoundingClientRect();
      if (node?.nodeType === Node.TEXT_NODE) {
        overlay = document.createElement('span');overlay.className = 'p4-type-overlay';overlay.setAttribute('aria-hidden', 'true');
        const letters = [];
        const ranges = [];
        let offset = 0;
        for (const letter of node.textContent) {
          const start = offset;
          offset += letter.length;
          if (/\s/.test(letter)) continue;
          const range = document.createRange();
          range.setStart(node, start);
          range.setEnd(node, offset);
          ranges.push({ letter, rect: range.getBoundingClientRect() });
        }
        const firstTop = ranges[0]?.rect.top ?? box.top;
        ranges.forEach(({ letter, rect }) => {
          const mask = document.createElement('span'), glyph = document.createElement('span');
          mask.className = 'p4-glyph-mask';mask.style.left = `${rect.left - box.left - 3}px`;mask.style.width = `${rect.width + 9}px`;
          mask.style.setProperty('--glyph-line-offset', `${rect.top - firstTop}px`);
          glyph.className = 'p4-glyph';glyph.textContent = letter;glyph.style.paddingLeft = '3px';mask.append(glyph);overlay.append(mask);letters.push(glyph);
        });
        title.append(overlay);title.classList.add('p4-type-active');
        secondaryHeadingsReady = performance.now() + signatureDuration + 2 * stagger;
        Promise.all(letters.map((letter, index) => animate(letter, [
          { transform: `translateY(${index % 2 ? -118 : 118}%) rotate(${index % 2 ? -7 : 7}deg)` },
          { transform: 'translateY(0) rotate(0deg)' },
        ], { duration: signatureDuration - 140, delay: index * stagger, easing: signatureEase, fill: 'backwards' }))).then(revealText);
        const role = document.querySelector('.hero-role');
        if (role) animate(role, [{ clipPath: 'inset(0 0 100% 0)', transform: 'translateY(10px)' }, { clipPath: 'inset(0)', transform: 'none' }], { duration: signatureDuration - 140, delay: 100, easing: signatureEase, fill: 'backwards' });
      }
    }
    const heading = document.querySelector('.hero-heading');let driftFrame = 0;
    heading.classList.add('p4-parallax');
    function resetDrift() { cancelAnimationFrame(driftFrame);driftFrame = 0;heading.style.removeProperty('--hero-drift'); }
    resets.add(resetDrift);
    addEventListener('scroll', () => {
      if (driftFrame || !allowed() || !fine.matches) return;
      driftFrame = requestAnimationFrame(() => {
        driftFrame = 0;
        const rect = heading.getBoundingClientRect();
        heading.style.setProperty('--hero-drift', rect.bottom > 0 ? `${-Math.min(8, scrollY * .028)}px` : '0px');
      });
    }, { passive: true });
    addEventListener('resize', () => { revealText();resetDrift(); });
  }

  // Only two Home headings get a quieter horizontal ink-mask reveal.
  const headings = [...document.querySelectorAll('[data-signature-heading]')];
  if (headings.length && allowed() && 'IntersectionObserver' in window && !location.hash && !historyEntry) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (performance.now() < secondaryHeadingsReady) return;
      animate(entry.target, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0)' }], { duration: entranceDuration, easing: entranceEase });
    }), { threshold: .3 });
    headings.forEach(heading => observer.observe(heading));
    resets.add(() => observer.disconnect());
  }
})();
