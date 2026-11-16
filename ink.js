(() => {
  const canvas = document.querySelector('#ink');
  const context = canvas.getContext('2d');
  const help = document.querySelector('#ink-help');
  if (!context) {
    help.textContent = 'The drawing surface is unavailable in this browser.';
    for (const control of document.querySelectorAll('.ink-controls button, .ink-controls input')) control.disabled = true;
    return;
  }

  const settled = document.createElement('canvas');
  const ink = settled.getContext('2d');
  const size = document.querySelector('#brush-size');
  const sizeValue = document.querySelector('#brush-size-value');
  const reticle = document.querySelector('.ink-reticle');
  const swatches = document.querySelectorAll('.ink-color');
  const colors = { charcoal: '#181d1a', green: '#2d4e33' };
  const keyboard = { x: 0.5, y: 0.5 };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  // Fixed integration steps keep the spring consistent across display refresh rates.
  const step = 1 / 120;
  const stiffness = 4400;
  let width = 0;
  let height = 0;
  let scale = 1;
  let frame = 0;
  let previousTime = 0;
  let remaining = 0;
  let active = null;
  let color = colors.charcoal;

  function resize() {
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    const nextScale = Math.min(devicePixelRatio || 1, 2);
    if (!nextWidth || !nextHeight ||
        (nextWidth === width && nextHeight === height && nextScale === scale)) return;
    if (active) finish();
    const snapshot = document.createElement('canvas');
    snapshot.width = settled.width;
    snapshot.height = settled.height;
    snapshot.getContext('2d').drawImage(settled, 0, 0);
    width = nextWidth;
    height = nextHeight;
    scale = nextScale;
    canvas.width = settled.width = Math.round(width * scale);
    canvas.height = settled.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    ink.setTransform(scale, 0, 0, scale, 0, 0);
    ink.drawImage(snapshot, 0, 0, width, height);
    display();
  }

  function display() {
    context.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
    context.drawImage(settled, 0, 0, canvas.width / scale, canvas.height / scale);
    if (active) drawRibbon(context, active, 0, active.points.length - 1, true);
  }

  // Build the ribbon from perpendicular edges. Quadratic midpoints smooth both
  // sides of the outline and allow the live tip to converge to a single point.
  function drawRibbon(ctx, stroke, first, last, taper) {
    if (last <= first) return;
    const { points, size, color } = stroke;
    const tip = points.at(-1);
    const taperLength = Math.max(2, tip.radius * 1.8);
    const left = [];
    const right = [];
    for (let i = first; i <= last; i++) {
      const point = points[i];
      const before = points[Math.max(0, i - 1)];
      const after = points[Math.min(points.length - 1, i + 1)];
      const dx = after.x - before.x;
      const dy = after.y - before.y;
      const length = Math.hypot(dx, dy);
      const nx = length > 0.01 ? -dy / length : point.nx;
      const ny = length > 0.01 ? dx / length : point.ny;
      const entry = Math.min(1, point.distance / (6 + size * 0.75));
      const exit = taper ? Math.min(1, (tip.distance - point.distance) / taperLength) : 1;
      const r = point.radius * Math.pow(Math.min(entry, exit), 0.86);
      left.push([point.x + nx * r, point.y + ny * r]);
      right.push([point.x - nx * r, point.y - ny * r]);
    }

    ctx.beginPath();
    ctx.moveTo(...left[0]);
    traceEdge(ctx, left);
    right.reverse();
    ctx.lineTo(...right[0]);
    traceEdge(ctx, right);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function traceEdge(ctx, edge) {
    for (let i = 1; i < edge.length - 1; i++) {
      const [x, y] = edge[i];
      const [nextX, nextY] = edge[i + 1];
      ctx.quadraticCurveTo(x, y, (x + nextX) * 0.5, (y + nextY) * 0.5);
    }
    ctx.lineTo(...edge.at(-1));
  }

  function capturePoint(stroke) {
    const point = stroke.points.at(-1);
    const dx = stroke.x - point.x;
    const dy = stroke.y - point.y;
    const travel = Math.hypot(dx, dy);
    if (travel < 0.8) return;
    stroke.points.push({
      x: stroke.x, y: stroke.y, radius: stroke.radius,
      distance: point.distance + travel, nx: -dy / travel, ny: dx / travel,
    });

    // Keep the taper and a few neighbors live. The rest is already finished.
    const points = stroke.points;
    if (points.length < 54) return;
    let split = points.length - 8;
    while (split > 4 && points.at(-1).distance - points[split].distance < 20 + stroke.size) split--;
    if (split < 12) return;
    drawRibbon(ink, stroke, 0, split, false);
    points.splice(0, split - 2);
  }

  function advance(stroke) {
    const damping = reducedMotion.matches ? 130 : 108;
    const x = stroke.x;
    const y = stroke.y;
    stroke.vx += (stiffness * (stroke.targetX - x) - damping * stroke.vx) * step;
    stroke.vy += (stiffness * (stroke.targetY - y) - damping * stroke.vy) * step;
    stroke.x += stroke.vx * step;
    stroke.y += stroke.vy * step;

    // Let the tip flex by about one visible brush width, even on a fast flick.
    const dx = stroke.targetX - stroke.x;
    const dy = stroke.targetY - stroke.y;
    const lag = Math.hypot(dx, dy);
    const maxLag = Math.max(1, stroke.radius * 1.8);
    if (lag > maxLag) {
      const pull = 1 - maxLag / lag;
      stroke.x += dx * pull;
      stroke.y += dy * pull;
    }

    // Average short advances so frame-sized pointer updates do not ripple the width.
    const speed = Math.hypot(stroke.x - x, stroke.y - y) / step;
    stroke.speed += (speed - stroke.speed) * 0.2;
    const pressure = stroke.pressure == null ? 1 : 0.65 + 0.55 * stroke.pressure;
    const radius = Math.max(stroke.size * 0.08, stroke.size * 0.38 * pressure / (1 + stroke.speed / 570));
    const desired = stroke.released ? Math.min(stroke.releaseRadius, radius) : radius;
    stroke.radius += (desired - stroke.radius) * 0.34;
    capturePoint(stroke);
  }

  function animate(time) {
    frame = 0;
    if (!active) return;
    const elapsed = previousTime ? Math.min((time - previousTime) / 1000, 0.032) : 1 / 60;
    previousTime = time;
    remaining += elapsed;
    while (remaining >= step) {
      advance(active);
      remaining -= step;
    }
    const distance = Math.hypot(active.targetX - active.x, active.targetY - active.y);
    const speed = Math.hypot(active.vx, active.vy);
    if (distance < 0.45 && speed < 16) {
      active.vx = active.vy = active.speed = 0;
      if (active.released) finish();
      else display();
      previousTime = remaining = 0;
    } else {
      display();
      schedule();
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(animate);
  }

  function stopFrame() {
    cancelAnimationFrame(frame);
    frame = previousTime = remaining = 0;
  }

  function finish() {
    if (!active) return;
    stopFrame();
    drawRibbon(ink, active, 0, active.points.length - 1, true);
    active = null;
    display();
  }

  function position(event) {
    const box = canvas.getBoundingClientRect();
    return {
      x: clamp(event.clientX - box.left, 0, width),
      y: clamp(event.clientY - box.top, 0, height),
    };
  }

  function target(event) {
    const { x, y } = position(event);
    active.targetX = x;
    active.targetY = y;
    if (event.pointerType === 'pen' && event.pressure > 0) active.pressure = event.pressure;
    schedule();
  }

  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || (active && !active.released)) return;
    finish();
    canvas.setPointerCapture(event.pointerId);
    const { x, y } = position(event);
    const diameter = Number(size.value);
    active = {
      pointer: event.pointerId, color, size: diameter, x, y, targetX: x, targetY: y,
      vx: 0, vy: 0, speed: 0, radius: diameter * 0.38, released: false,
      pressure: event.pointerType === 'pen' ? event.pressure : null,
      points: [{ x, y, radius: 0, distance: 0, nx: 0, ny: 1 }],
    };
  });
  canvas.addEventListener('pointermove', event => {
    if (active?.pointer === event.pointerId && !active.released) target(event);
  });
  canvas.addEventListener('pointerup', event => {
    if (active?.pointer !== event.pointerId || active.released) return;
    target(event);
    active.releaseRadius = active.radius;
    active.released = true;
  });
  for (const name of ['pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(name, event => {
      if (active?.pointer === event.pointerId && !active.released) finish();
    });
  }
  window.addEventListener('blur', finish);

  for (const swatch of swatches) {
    swatch.addEventListener('click', () => {
      color = colors[swatch.dataset.color];
      for (const button of swatches) button.setAttribute('aria-pressed', String(button === swatch));
    });
  }
  size.addEventListener('input', () => { sizeValue.value = size.value; });
  document.querySelector('#clear').addEventListener('click', () => {
    stopFrame();
    active = null;
    ink.clearRect(0, 0, settled.width / scale, settled.height / scale);
    display();
  });

  function placeReticle() {
    reticle.style.left = keyboard.x * 100 + '%';
    reticle.style.top = keyboard.y * 100 + '%';
  }

  canvas.addEventListener('keydown', event => {
    const offsets = { ArrowLeft: [-0.035, 0], ArrowRight: [0.035, 0], ArrowUp: [0, -0.045], ArrowDown: [0, 0.045] };
    const offset = offsets[event.key];
    if (offset) {
      event.preventDefault();
      keyboard.x = clamp(keyboard.x + offset[0], 0.035, 0.965);
      keyboard.y = clamp(keyboard.y + offset[1], 0.035, 0.965);
      placeReticle();
    } else if (event.key === ' ') {
      event.preventDefault();
      ink.beginPath();
      ink.arc(keyboard.x * width, keyboard.y * height, Math.max(1, Number(size.value) * 0.08), 0, Math.PI * 2);
      ink.fillStyle = color;
      ink.fill();
      display();
    }
  });

  placeReticle();
  new ResizeObserver(resize).observe(canvas);
  resize();
})();
