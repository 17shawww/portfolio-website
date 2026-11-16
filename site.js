document.documentElement.classList.add('js');
const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('#primary-navigation');
function closeMenu(){nav.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');menuButton.textContent='Menu';}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';nav.classList.toggle('is-open',open);menuButton.setAttribute('aria-expanded',String(open));menuButton.textContent=open?'Close':'Menu';});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuButton.getAttribute('aria-expanded')==='true'){closeMenu();menuButton.focus();}});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});


// One short entrance, with a readable heading before and after enhancement.
(() => {
  const title = document.querySelector('#home-title');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (!title || preference.matches || !title.animate || location.hash) return;
  const entrance = title.animate([
    { opacity: .82, transform: 'translateY(8px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], { duration: 620, easing: 'cubic-bezier(.2,.65,.3,1)' });
  preference.addEventListener('change', () => entrance.cancel(), { once: true });
})();

(() => {
  const menu = document.querySelector('.chapter-nav');
  if (!menu) return;
  const chapters = [...document.querySelectorAll('.split-section, .interests')];
  const links = [...menu.querySelectorAll('a')];
  const fill = menu.querySelector('.chapter-track span');
  let active = -1;
  let frame = 0;
  let destination = chapters.findIndex(chapter => '#' + chapter.id === location.hash);

  function update() {
    frame = 0;
    const line = menu.offsetHeight + 40;
    const tops = chapters.map(chapter => chapter.getBoundingClientRect().top);
    const bottom = chapters.at(-1).getBoundingClientRect().bottom;
    const atEnd = document.documentElement.scrollHeight - innerHeight - scrollY <= 3;
    let index = atEnd ? chapters.length - 1 : Math.max(0, tops.findLastIndex(top => top <= line));
    // A short final chapter may not reach the usual reading line. Preserve a
    // native anchor choice while it is visible, until the visitor scrolls again.
    if (destination >= 0 && tops[destination] < innerHeight * .6 && tops[destination] >= -40) {
      index = destination;
    }
    if (index !== active) {
      links[active]?.removeAttribute('aria-current');
      chapters[active]?.classList.remove('chapter-active');
      links[index].setAttribute('aria-current', 'location');
      chapters[index].classList.add('chapter-active');
      active = index;
    }
    const distance = Math.max(1, bottom - tops[0]);
    const progress = atEnd ? 1 : Math.max(0, Math.min(1, (line - tops[0]) / distance));
    fill.style.setProperty('--progress', progress);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function measure() {
    document.documentElement.style.setProperty('--chapter-offset', menu.offsetHeight + 28 + 'px');
    schedule();
  }
  menu.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || !menu.contains(link)) return;
    destination = links.indexOf(link);
    schedule();
  });
  addEventListener('hashchange', () => {
    destination = chapters.findIndex(chapter => '#' + chapter.id === location.hash);
    schedule();
  });
  function resumeReading() {
    destination = -1;
    schedule();
  }
  addEventListener('wheel', resumeReading, { passive: true });
  addEventListener('touchmove', resumeReading, { passive: true });
  addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) resumeReading();
  });
  new ResizeObserver(measure).observe(menu);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure);
  addEventListener('pageshow', measure);
  measure();
})();

// A short-lived ink accent follows fine mouse input without intercepting the page.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 300;
  const extent = 64;
  let canvas;
  let context;
  let samples = [];
  let frame = 0;
  let lastMove = 0;
  let trailLength = 10;

  function clear() {
    cancelAnimationFrame(frame);
    frame = 0;
    samples = [];
    if (canvas) canvas.hidden = true;
  }

  function allowed() {
    // Some embedded browsers report no hover even when receiving real mouse input.
    return !reduced.matches && navigator.maxTouchPoints === 0;
  }

  function createCanvas() {
    canvas = document.createElement('canvas');
    canvas.className = 'cursor-ink';
    canvas.setAttribute('aria-hidden', 'true');
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = canvas.height = extent * ratio;
    context = canvas.getContext('2d');
    if (!context) {
      canvas = null;
      return false;
    }
    context.scale(ratio, ratio);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    document.body.append(canvas);
    return true;
  }

  function draw(now) {
    frame = 0;
    const age = now - lastMove;
    if (age >= duration || !allowed()) {
      clear();
      return;
    }
    context.clearRect(0, 0, extent, extent);
    const tip = samples[0];
    const path = [{ x: 32, y: 32 }];
    let distance = 0;
    for (let i = 1; i < samples.length; i++) {
      const before = samples[i - 1];
      const point = samples[i];
      const length = Math.hypot(point.x - before.x, point.y - before.y);
      if (!length) continue;
      const fraction = Math.min(1, (trailLength - distance) / length);
      // Short sections keep a tapered brush tip even between sparse mouse events.
      const sections = Math.max(1, Math.ceil(length * fraction / 2));
      for (let section = 1; section <= sections; section++) {
        const along = fraction * section / sections;
        path.push({
          x: before.x + (point.x - before.x) * along - tip.x + 32,
          y: before.y + (point.y - before.y) * along - tip.y + 32,
        });
      }
      distance += length * fraction;
      if (distance >= trailLength) break;
    }

    if (path.length > 1) {
      path.reverse();
      context.strokeStyle = '#233c2c';
      // Smooth the existing short path. Tiny width and opacity changes soften its tail.
      for (let i = 1; i < path.length; i++) {
        const previous = path[i - 1];
        const point = path[i];
        const next = path[Math.min(i + 1, path.length - 1)];
        context.lineWidth = 0.35 + 3.85 * Math.pow(i / (path.length - 1), 0.9);
        context.globalAlpha = 0.40 * Math.pow(1 - age / duration, 1.5) * (0.4 + 0.6 * i / (path.length - 1));
        context.beginPath();
        const start = i === 1 ? previous : {
          x: (previous.x + point.x) / 2,
          y: (previous.y + point.y) / 2,
        };
        context.moveTo(start.x, start.y);
        context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
        context.stroke();
      }
    }
    frame = requestAnimationFrame(draw);
  }

  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !allowed()) return;
    if (!canvas && !createCanvas()) return;
    const now = performance.now();
    const previous = samples[0];
    if (previous && now - lastMove < duration) {
      const distance = Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
      if (distance < 0.6) return;
      trailLength = Math.min(23, 10 + distance / Math.max(1, now - lastMove) * 7);
    } else samples = [];
    samples.unshift({ x: event.clientX, y: event.clientY });
    samples.length = Math.min(samples.length, 20);
    lastMove = now;
    canvas.style.transform = `translate(${event.clientX - 32}px, ${event.clientY - 32}px)`;
    canvas.hidden = false;
    if (!frame) frame = requestAnimationFrame(draw);
  }, { passive: true });

  document.addEventListener('pointerout', event => { if (!event.relatedTarget) clear(); });
  addEventListener('blur', clear);
  addEventListener('scroll', clear, { passive: true });
  document.addEventListener('visibilitychange', clear);
  reduced.addEventListener('change', clear);
})();
