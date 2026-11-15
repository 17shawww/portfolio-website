document.documentElement.classList.add('js');
const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('#primary-navigation');
function closeMenu(){nav.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');menuButton.textContent='Menu';}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';nav.classList.toggle('is-open',open);menuButton.setAttribute('aria-expanded',String(open));menuButton.textContent=open?'Close':'Menu';});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuButton.getAttribute('aria-expanded')==='true'){closeMenu();menuButton.focus();}});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});

// Motion is progressive: the original heading, links and copy work without it.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const runningMotion = new Map();

function playMotion(element, frames, timing) {
  if (reducedMotion.matches || !element.animate) return;
  runningMotion.get(element)?.cancel();
  const animation = element.animate(frames, timing);
  runningMotion.set(element, animation);
  animation.onfinish = () => {
    if (runningMotion.get(element) === animation) runningMotion.delete(element);
  };
}

reducedMotion.addEventListener('change', () => {
  runningMotion.forEach(animation => animation.cancel());
  runningMotion.clear();
  document.querySelectorAll('.type-glyph, .magnetic-label').forEach(element => {
    element.style.removeProperty('transform');
  });
});

function enhanceHero() {
  const heading = document.querySelector('#home-title');
  if (!heading || !heading.animate) return;
  // Keep the actual characters in the heading, including the selectable space.
  const name = heading.textContent;
  const words = name.trim().split(/\s+/);
  const glyphs = [];
  heading.setAttribute('aria-label', name);
  heading.replaceChildren();
  words.forEach((word, index) => {
    if (index) heading.append(' ');
    const wordSpan = document.createElement('span');
    wordSpan.className = 'type-word';
    wordSpan.setAttribute('aria-hidden', 'true');
    for (const character of word) {
      const glyph = document.createElement('span');
      glyph.className = 'type-glyph';
      glyph.textContent = character;
      wordSpan.append(glyph);
      glyphs.push(glyph);
    }
    heading.append(wordSpan);
  });

  const directionFor = index => (index % 2 ? -1 : 1);
  const pose = (x, y, rotation) => ({ transform: `translate(${x}em, ${y}em) rotate(${rotation}deg)` });
  const atRest = pose(0, 0, 0);
  const releaseType = () => glyphs.forEach(glyph => glyph.style.removeProperty('transform'));
  let busyUntil = 0;

  function assemble(origin) {
    if (reducedMotion.matches || !getSelection()?.isCollapsed) return;
    const ripple = origin !== undefined;
    busyUntil = performance.now() + 910;
    glyphs.forEach((glyph, index) => {
      glyph.style.removeProperty('transform');
      const direction = directionFor(index);
      const delay = ripple ? Math.abs(index - origin) * 28 : index * 24;
      const scatter = pose(direction * .045, direction * (.18 + (index % 3) * .045), direction * 8);
      playMotion(glyph, [
        { ...(ripple ? atRest : scatter), color: ripple ? 'var(--ink)' : 'var(--green)', offset: 0 },
        { ...(ripple ? scatter : pose(-direction * .025, -direction * .055, -direction * 3)),
          color: 'var(--green)', offset: .34 },
        { ...pose(direction * .012, direction * .024, direction * 1.3), offset: .67 },
        { ...atRest, color: 'var(--ink)', offset: 1 },
      ], { duration: 670, delay, fill: 'backwards', easing: 'cubic-bezier(.2,.65,.3,1)' });
    });
  }

  let frame = 0;
  function resetPointer() {
    cancelAnimationFrame(frame);
    releaseType();
  }
  heading.addEventListener('pointermove', event => {
    if (!finePointer.matches || event.pointerType === 'touch' || reducedMotion.matches || event.buttons ||
        performance.now() < busyUntil || !getSelection()?.isCollapsed) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      // Word boxes are stationary. Per-glyph offsets remain independent of motion.
      const wordLeft = new Map([...heading.children].map(word => [word, word.getBoundingClientRect().left]));
      const centers = glyphs.map(glyph => wordLeft.get(glyph.parentElement) + glyph.offsetLeft + glyph.offsetWidth / 2);
      glyphs.forEach((glyph, index) => {
        const distance = centers[index] - event.clientX;
        const strength = Math.max(0, 1 - Math.abs(distance) / 130) ** 2;
        glyph.style.transform = `translate(${Math.sign(distance) * 9 * strength}px, ${-21 * strength}px) rotate(${directionFor(index) * 7 * strength}deg)`;
      });
    });
  });
  heading.addEventListener('pointerleave', resetPointer);
  heading.addEventListener('pointerdown', resetPointer);
  heading.addEventListener('click', event => {
    if (event.detail !== 1 || !getSelection()?.isCollapsed) return;
    const index = glyphs.indexOf(event.target.closest('.type-glyph'));
    assemble(index < 0 ? 0 : index);
  });

  const replay = document.createElement('button');
  replay.type = 'button';
  replay.className = 'type-replay';
  replay.textContent = 'Replay type ↻';
  replay.addEventListener('click', () => assemble(0));
  document.querySelector('.hero-intro > .text-link').after(replay);

  // Replay only when arriving at the top, never on a restored deep link.
  if (!location.hash && scrollY < 80) assemble();
}

function enhanceSignature() {
  const image = document.querySelector('.hero-signature');
  if (!image || !image.animate) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ink-signature';
  button.setAttribute('aria-label', 'Recompose the YP monogram');
  const syncPreference = () => { button.disabled = reducedMotion.matches; };
  reducedMotion.addEventListener('change', syncPreference);
  syncPreference();
  image.before(button);
  button.append(image);

  // Three diagonally divided ink areas and the green dot use the original raster.
  const pieces = [
    ['polygon(0 0, 100% 0, 100% 31%, 0 51%)', -14, -13, -9],
    ['polygon(0 51%, 100% 31%, 100% 44%, 63% 44%, 63% 52%, 100% 52%, 100% 60%, 0 78%)', 17, -2, 8],
    ['polygon(0 78%, 100% 60%, 100% 100%, 0 100%)', -6, 16, -6],
    ['polygon(63% 44%, 100% 44%, 100% 52%, 63% 52%)', 12, -9, 0],
  ].map(([clip, x, y, angle]) => {
    const piece = image.cloneNode();
    piece.className = 'ink-piece';
    piece.style.clipPath = clip;
    button.append(piece);
    return { piece, x, y, angle };
  });

  function recompose() {
    if (reducedMotion.matches) return;
    playMotion(image, [{ opacity: 0 }, { opacity: 0, offset: .995 }, { opacity: 1 }], { duration: 645 });
    pieces.forEach(({ piece, x, y, angle }, index) => {
      playMotion(piece, [
        { opacity: 1, transform: 'none' },
        { opacity: 1, transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`, offset: .28 + index * .055 },
        { opacity: 1, transform: 'translateY(-2px)', offset: .76 },
        { opacity: 1, transform: 'none' },
      ], { duration: 645, easing: 'cubic-bezier(.25,.65,.3,1)' });
    });
  }
  button.addEventListener('pointerenter', event => {
    if (finePointer.matches && event.pointerType !== 'touch') recompose();
  });
  button.addEventListener('click', recompose);
}

function enhanceAbout() {
  const chapters = [...document.querySelectorAll('.about-page .split-section, .about-page .interests')];
  if (!chapters.length) return;
  const title = document.querySelector('.about-page .page-title');
  const chapterNames = ['Background', 'Approach & Skills', 'Relevant Experience', 'Looking Ahead', 'Personal Interests'];
  const meter = document.createElement('div');
  meter.className = 'chapter-meter';
  meter.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  const line = document.createElement('span');
  line.className = 'chapter-meter-line';
  meter.append(label, line);
  title.after(meter);

  const visited = new Set();
  let active = -1;
  let frame = 0;
  function updateChapter() {
    frame = 0;
    const readingLine = Math.min(innerHeight * .4, 290);
    const tops = chapters.map(chapter => chapter.getBoundingClientRect().top);
    const endOfPage = document.documentElement.scrollHeight - innerHeight - scrollY;
    const atEnd = endOfPage <= 4;
    const next = atEnd ? chapters.length - 1 : Math.max(0, tops.findLastIndex(top => top <= readingLine));
    const distanceRead = readingLine - tops[0];
    const distanceTotal = Math.max(1, distanceRead + endOfPage);
    const progress = atEnd ? 1 : Math.max(0, Math.min(1, distanceRead / distanceTotal));
    line.style.setProperty('--chapter-progress', progress);
    if (next !== active) {
      chapters[active]?.classList.remove('chapter-current');
      chapters[next].classList.add('chapter-current');
      label.textContent = `0${next + 1} / 05 · ${chapterNames[next]}`;
      active = next;
    }
    chapters.forEach((chapter, index) => {
      if (visited.has(chapter) || tops[index] > innerHeight * .82) return;
      visited.add(chapter);
      const text = chapter.lastElementChild;
      playMotion(text, [
        { opacity: .86, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 410, easing: 'cubic-bezier(.2,.65,.3,1)' });
    });
  }

  function scheduleChapter() {
    if (!frame) frame = requestAnimationFrame(updateChapter);
  }
  addEventListener('scroll', scheduleChapter, { passive: true });
  addEventListener('resize', scheduleChapter);
  addEventListener('pageshow', scheduleChapter);
  updateChapter();
}

function enhanceMagnet() {
  const link = document.querySelector('.about-preview .button');
  if (!link) return;
  const label = document.createElement('span');
  label.className = 'magnetic-label';
  label.append(...link.childNodes);
  link.append(label);
  let frame = 0;
  function clear() {
    cancelAnimationFrame(frame);
    label.style.removeProperty('transform');
  }
  link.addEventListener('pointermove', event => {
    if (!finePointer.matches || reducedMotion.matches || event.pointerType === 'touch') return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const bounds = link.getBoundingClientRect();
      const x = (event.clientX - bounds.left - bounds.width / 2) * .1;
      const y = (event.clientY - bounds.top - bounds.height / 2) * .2;
      label.style.transform = `translate(${x}px, ${y}px)`;
    });
  });
  link.addEventListener('pointerleave', clear);
  link.addEventListener('blur', clear);
}

enhanceHero();
enhanceSignature();
enhanceAbout();
enhanceMagnet();
