/* Progressive interactions for the Work cover and Wuhan exploration controls. */
(() => {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canMove = () => finePointer.matches && !reduced.matches
    && !document.hidden && !document.querySelector('dialog[open]')
    && !document.documentElement.hasAttribute('data-project-transition');

  const resetCovers = [];
  if (typeof SVGFEDisplacementMapElement !== 'undefined') {
    document.querySelectorAll('[data-immersive-cover]').forEach((cover, index) => {
      const id = `p5-ink-displacement-${index}`;
      const ripple = document.createElement('span');
      ripple.className = 'p5-cover-ripple';
      ripple.hidden = true;
      ripple.setAttribute('aria-hidden', 'true');
      // Constant-frequency noise. Only displacement amplitude and placement change.
      ripple.innerHTML = `<svg width="0" height="0" aria-hidden="true" focusable="false">
        <defs><filter id="${id}" x="-8%" y="-10%" width="116%" height="120%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency=".014 .023" numOctaves="2" seed="9" result="water"/>
          <feDisplacementMap in="SourceGraphic" in2="water" scale="0" xChannelSelector="R" yChannelSelector="G"/>
        </filter></defs></svg><span class="p5-ripple-pigment"></span>`;
      ripple.querySelector('.p5-ripple-pigment').style.filter = `url(#${id})`;
      const displacement = ripple.querySelector('feDisplacementMap');
      const boundary = document.createElement('span');
      boundary.className = 'p5-ripple-boundary';
      boundary.setAttribute('aria-hidden', 'true');
      boundary.append(ripple);
      cover.prepend(boundary);
      cover.classList.add('p5-ink-cover');

      let latest = null;
      let previous = null;
      let strength = 0;
      let position = null;
      let speed = 0;
      let angle = 0;
      let frame = 0;
      let lastTime = 0;
      function restore() {
        if (!frame && !latest && ripple.hidden) return;
        cancelAnimationFrame(frame);
        frame = 0;
        latest = previous = null;
        position = null;
        strength = lastTime = speed = angle = 0;
        ripple.hidden = true;
        displacement.setAttribute('scale', '0');
      }
      resetCovers.push(restore);

      function paint(now) {
        frame = 0;
        if (!latest || !canMove()) {
          restore();
          return;
        }
        const step = Math.min(2.5, (now - (lastTime || now - 16)) / 16.67);
        lastTime = now;
        const hasInput = latest !== previous;
        if (hasInput) {
          const rect = cover.getBoundingClientRect();
          const x = latest.x - rect.left;
          const y = latest.y - rect.top;
          if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
            restore();
            return;
          }
          const elapsed = latest.time - (previous?.time ?? latest.time);
          const dx = previous ? latest.x - previous.x : 0;
          const dy = previous ? latest.y - previous.y : 0;
          const distance = Math.hypot(dx, dy);
          const inputSpeed = elapsed > 0 && elapsed < 100 ? Math.min(3, distance / elapsed) : .22;
          speed += (inputSpeed - speed) * .62;
          if (!position) position = { x, y, targetX: x, targetY: y };
          position.targetX = x;
          position.targetY = y;
          if (distance > 2) {
            const heading = Math.atan2(dy, dx);
            // An ellipse has the same axis in either direction.
            angle += Math.atan2(Math.sin(2 * (heading - angle)), Math.cos(2 * (heading - angle))) * .27;
          }
          strength = Math.max(strength, 11 + speed * 9);
          previous = latest;
        } else {
          strength *= Math.pow(.90, step);
          speed *= Math.pow(.93, step);
        }
        const follow = 1 - Math.pow(.64, step);
        position.x += (position.targetX - position.x) * follow;
        position.y += (position.targetY - position.y) * follow;
        const stretch = Math.min(.22, speed * .085);
        ripple.style.transform = `translate3d(${position.x - 142}px,${position.y - 105}px,0) rotate(${angle}rad) scale(${1 + stretch},${1 - stretch * .49})`;
        if (strength < .6) {
          restore();
          return;
        }
        ripple.hidden = false;
        ripple.style.opacity = String(Math.min(.97, strength / 20));
        displacement.setAttribute('scale', strength.toFixed(1));
        frame = requestAnimationFrame(paint);
      }

      cover.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse' || !canMove()) return;
        latest = { x: event.clientX, y: event.clientY, time: event.timeStamp };
        if (!frame) frame = requestAnimationFrame(paint);
      }, { passive: true });
      for (const type of ['pointerleave', 'pointercancel', 'pointerdown']) {
        cover.addEventListener(type, restore, { passive: true });
      }
    });
  }

  // All transforms belong to labels. Outer links, buttons and focus outlines
  // stay fixed, including when a pointer is outside the actual hit area.
  const magnets = [...document.querySelectorAll('[data-immersive-magnet]')].map(element => {
    const label = document.createElement('span');
    label.className = 'p5-magnetic-label';
    label.append(...element.childNodes);
    element.append(label);
    return { element, label, x: 0, y: 0, vx: 0, vy: 0 };
  });
  let pointer = null;
  let frame = 0;
  let lastTime = 0;

  function resetMagnets() {
    if (!frame && !pointer && !lastTime) return;
    cancelAnimationFrame(frame);
    frame = lastTime = 0;
    pointer = null;
    magnets.forEach(magnet => {
      magnet.x = magnet.y = magnet.vx = magnet.vy = 0;
      magnet.label.style.removeProperty('--magnetic-x');
      magnet.label.style.removeProperty('--magnetic-y');
    });
  }

  function updateMagnets(now) {
    frame = 0;
    if (!canMove()) {
      resetMagnets();
      return;
    }
    const step = Math.min(1.25, (now - (lastTime || now - 16)) / 16.67);
    lastTime = now;
    let needsFrame = false;
    // Read all target rectangles before writing transforms.
    const targets = magnets.map(({ element }) => {
      if (!pointer || element.matches(':focus-visible')) return [0, 0];
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > innerHeight) return [0, 0];
      const dx = pointer.x - (rect.left + rect.right) / 2;
      const dy = pointer.y - (rect.top + rect.bottom) / 2;
      const distance = Math.hypot(Math.max(0, Math.abs(dx) - rect.width / 2), Math.max(0, Math.abs(dy) - rect.height / 2));
      const pull = Math.max(0, 1 - distance / 24);
      return [Math.max(-7, Math.min(7, dx * .12)) * pull, Math.max(-4, Math.min(4, dy * .18)) * pull];
    });
    magnets.forEach((magnet, index) => {
      const [tx, ty] = targets[index];
      const damping = Math.pow(.63, step);
      magnet.vx = (magnet.vx + (tx - magnet.x) * .25 * step) * damping;
      magnet.vy = (magnet.vy + (ty - magnet.y) * .25 * step) * damping;
      magnet.x += magnet.vx * step;
      magnet.y += magnet.vy * step;
      if (Math.abs(tx - magnet.x) + Math.abs(ty - magnet.y) + Math.abs(magnet.vx) + Math.abs(magnet.vy) > .13) {
        needsFrame = true;
      } else {
        magnet.x = tx;
        magnet.y = ty;
        magnet.vx = magnet.vy = 0;
      }
      magnet.label.style.setProperty('--magnetic-x', `${magnet.x.toFixed(2)}px`);
      magnet.label.style.setProperty('--magnetic-y', `${magnet.y.toFixed(2)}px`);
    });
    if (needsFrame) frame = requestAnimationFrame(updateMagnets);
    else lastTime = 0;
  }

  function clearPointer() {
    pointer = null;
    if (magnets.length && !frame) frame = requestAnimationFrame(updateMagnets);
  }

  if (magnets.length) {
    document.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || !canMove()) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(updateMagnets);
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', clearPointer, { passive: true });
    document.addEventListener('focusin', event => {
      if (event.target.matches(':focus-visible')) clearPointer();
    });
  }

  function reset() {
    resetCovers.forEach(restore => restore());
    resetMagnets();
  }
  for (const event of ['scroll', 'resize', 'blur', 'pageswap', 'pagehide']) {
    addEventListener(event, reset, { passive: true });
  }
  document.addEventListener('visibilitychange', reset);
  finePointer.addEventListener('change', reset);
  reduced.addEventListener('change', reset);
})();
