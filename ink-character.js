/* One ink contour both depicts and controls native document scrolling. */
(() => {
  const actor = document.querySelector('.ink-companion');
  if (!actor) return;
  const chapterNav = document.querySelector('.wm-nav, .chapter-nav');
  if (chapterNav) {
    followChapters(chapterNav, actor);
    return;
  }

  const root = document.documentElement;
  const card = document.querySelector('a.home-case');
  const footer = document.querySelector('footer');
  const viewport = window.visualViewport;
  const wide = matchMedia('(min-width: 1100px) and (min-height: 540px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Narrow edges, a broad shelf, and a low rounded shoulder. Only shelves take a seated pose.
  const holds = [
    {at: .13, above: .005, below: .015, depth: .86},
    {at: .31, above: .015, below: .006, depth: 1.35, seat: true},
    {at: .50, above: .008, below: .011, depth: 1.05, seat: true},
    {at: .69, above: .004, below: .013, depth: 1.3},
    {at: .87, above: .015, below: .009, depth: .9},
  ];
  // Each ledge is a bend in the contour, with its own brush pressure.
  const profile = [
    [0, 15, .25], [.09, 16, 1.05], [.13, 13, 1.6], [.16, 15, .85],
    [.27, 13, .95], [.31, 9, 1.95], [.345, 14, 1.06], [.44, 16, .8],
    [.50, 12, 1.5], [.54, 13, .9], [.65, 15, 1.06], [.69, 10, 2.05],
    [.72, 14, .85], [.81, 16, .9], [.87, 13, 1.45], [.91, 14, .82],
    [1, 11, .25],
  ];
  const clamp = value => Math.max(0, Math.min(1, value));
  let frame = 0, restTimer, reading, resting = false, pointer, departure;

  function sample(progress) {
    const i = profile.findIndex(([at]) => at >= progress);
    if (i <= 0) return profile[0].slice(1);
    const [start, from, thin] = profile[i - 1];
    const [end, to, thick] = profile[i];
    const t = (progress - start) / (end - start);
    const bend = t * t * (3 - 2 * t);
    return [from + (to - from) * bend,
      (thin + (thick - thin) * t) * (1 + .09 * Math.sin(progress * 133))];
  }

  const route = document.createElement('div');
  route.className = 'ink-scrollbar';
  route.hidden = true;
  route.tabIndex = 0;
  route.setAttribute('role', 'scrollbar');
  route.setAttribute('aria-orientation', 'vertical');
  route.setAttribute('aria-valuemin', '0');
  route.setAttribute('aria-valuemax', '100');
  const main = document.querySelector('main');
  if (main?.id) route.setAttribute('aria-controls', main.id);

  const ns = 'http://www.w3.org/2000/svg';
  const art = document.createElementNS(ns, 'svg');
  art.setAttribute('viewBox', '0 0 24 600');
  art.setAttribute('preserveAspectRatio', 'none');
  art.setAttribute('aria-hidden', 'true');
  const pigment = document.createElementNS(ns, 'linearGradient');
  pigment.id = 'ink-cliff-pigment';
  pigment.setAttribute('x2', '0');
  pigment.setAttribute('y2', '1');
  const lightPage = document.createElementNS(ns, 'stop');
  lightPage.setAttribute('stop-color', '#45483d');
  lightPage.setAttribute('offset', '1');
  const darkPage = document.createElementNS(ns, 'stop');
  darkPage.setAttribute('stop-color', '#929887');
  darkPage.setAttribute('offset', '1');
  pigment.append(lightPage, darkPage);
  const defs = document.createElementNS(ns, 'defs');
  defs.append(pigment);
  art.append(defs);

  function shelfAt(progress) {
    let shelf = 0;
    for (const hold of holds) {
      const distance = progress - hold.at;
      const reach = distance < 0 ? hold.above : hold.below;
      shelf += hold.depth * clamp(1 - Math.abs(distance) / reach);
    }
    return shelf;
  }

  const edge = document.createElementNS(ns, 'path');
  const left = [], right = [];
  for (let y = 0; y <= 600; y += 2) {
    const progress = y / 600;
    const [x, pressure] = sample(progress);
    left.push([x - pressure - shelfAt(progress), y]);
    right.push([x + pressure * .76, y]);
  }
  const outline = left.concat(right.reverse()).map(([x, y]) => x.toFixed(2) + ' ' + y);
  edge.setAttribute('d', 'M' + outline.join('L') + 'Z');
  art.append(edge);
  route.append(art);
  actor.before(route);
  route.append(actor);

  const climb = actor.firstElementChild;
  climb.src = '/assets/portfolio/ink/climb.webp';
  climb.className = 'ink-climbing-pose';
  climb.width = 515;
  climb.height = 760;

  const cycle = document.createElement('span');
  cycle.className = 'ink-climb-cycle';
  cycle.hidden = true;
  const cels = new Image(1024, 180);
  cels.alt = '';
  cels.draggable = false;
  cels.addEventListener('load', () => {
    cycle.hidden = false;
    actor.setAttribute('data-climb-cycle', '');
    schedule();
  });
  cycle.append(cels);
  actor.append(cycle);

  const sit = new Image(546, 760);
  sit.src = '/assets/portfolio/ink/sit.webp';
  sit.alt = '';
  sit.className = 'ink-resting-pose';
  sit.draggable = false;
  actor.append(sit);

  function update() {
    frame = 0;
    if (departure) return;
    const eligible = wide.matches && !reduced.matches && (viewport?.scale ?? 1) <= 1.05;
    root.classList.toggle('has-ink-scrollbar', eligible);
    const range = root.scrollHeight - innerHeight;
    const active = eligible && range > 1 && !document.hidden;
    if (range <= 1) root.classList.remove('has-ink-scrollbar');
    route.hidden = !active;
    if (!active) {
      clearTimeout(restTimer);
      reading = undefined;
      resting = false;
      return;
    }

    if (!jump.hasAttribute('src')) jump.src = '/assets/portfolio/ink/jump.webp';
    if (!cels.hasAttribute('src')) cels.src = '/assets/portfolio/ink/climb-cycle.webp';
    const progress = clamp(scrollY / range);
    const rail = route.getBoundingClientRect();
    const foot = footer?.getBoundingClientRect().top ?? innerHeight + rail.height;
    const hold = holds.find(({at}) => Math.abs(progress - at) * rail.height <= 6);
    const gripY = rail.top + progress * rail.height;
    const [center, pressure] = sample(progress);
    // Feather the pigment across the actual footer boundary using the same path.
    lightPage.setAttribute('offset', clamp((foot - rail.top - 13) / rail.height).toFixed(4));
    darkPage.setAttribute('offset', clamp((foot - rail.top + 13) / rail.height).toFixed(4));
    route.style.setProperty('--ink-lift', clamp((gripY - foot + 12) / 24).toFixed(3));
    if (reading !== progress) {
      // The cels are authored in ascending order. The same distance mapping
      // unwinds them on descent and holds the current contact when scrolling stops.
      const distance = (1 - progress) * 7;
      const cel = Math.floor((distance % 1) * 8);
      actor.style.setProperty('--climb-cel', String(cel));
      reading = progress;
      resting = false;
      clearTimeout(restTimer);
      restTimer = setTimeout(() => { resting = true; schedule(); }, 180);
    }

    route.style.setProperty('--reading', String(progress));
    route.style.setProperty('--grip-x', (center - pressure * .60 - shelfAt(progress) * .76).toFixed(2) + 'px');
    route.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    route.setAttribute('aria-label', root.lang.startsWith('zh') ? '页面滚动进度' : 'Page scroll');
    actor.dataset.pose = resting && hold?.seat && sit.complete && sit.naturalWidth ? 'sit' : 'climb';
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  function seek(y) {
    const rect = route.getBoundingClientRect();
    scrollTo({top: clamp((y - rect.top) / rect.height) * (root.scrollHeight - innerHeight), behavior: 'instant'});
  }

  route.addEventListener('pointerdown', event => {
    if (departure || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    pointer = event.pointerId;
    route.focus({preventScroll: true});
    route.setPointerCapture(pointer);
    seek(event.clientY);
  });
  route.addEventListener('pointermove', event => {
    if (!departure && event.pointerId === pointer) seek(event.clientY);
  });
  route.addEventListener('lostpointercapture', () => { pointer = undefined; });
  route.addEventListener('keydown', event => {
    if (departure) return;
    const steps = {ArrowDown: 40, ArrowUp: -40, PageDown: innerHeight * .9, PageUp: -innerHeight * .9};
    let top;
    if (event.key === 'Home') top = 0;
    else if (event.key === 'End') top = root.scrollHeight;
    else if (event.key in steps) top = scrollY + steps[event.key];
    else return;
    event.preventDefault();
    scrollTo({top, behavior: 'instant'});
  });

  const jump = new Image();
  jump.alt = '';
  jump.className = 'ink-portal-jump';

  function navigate(run, reveal) {
    if (departure !== run || run.navigating) return;
    run.navigating = true;
    clearTimeout(run.timer);
    if (reveal && !reduced.matches) {
      try {
        sessionStorage.setItem('portfolio-ink-portal', JSON.stringify({
          destination: run.destination.href, timestamp: Date.now(),
        }));
      } catch {}
    }
    location.assign(run.destination.href);
  }

  function restore() {
    const run = departure;
    if (!run) return;
    departure = undefined;
    clearTimeout(run.timer);
    run.layer.getAnimations?.({subtree: true}).forEach(animation => animation.cancel());
    route.append(actor);
    jump.remove();
    run.layer.remove();
    route.removeAttribute('inert');
    schedule();
  }

  async function launch(run, origin, door) {
    const middle = {x: (origin.x + door.x) / 2 - 5,
      y: Math.max(30, Math.min(origin.y, door.y) - 53)};
    const entrance = {x: door.x + 9, y: door.y - 15};
    const keyframes = Array.from({length: 11}, (_, index) => {
      const t = index / 10, remaining = 1 - t;
      const x = remaining ** 2 * origin.x + 2 * remaining * t * middle.x + t ** 2 * entrance.x;
      const y = remaining ** 2 * origin.y + 2 * remaining * t * middle.y + t ** 2 * entrance.y;
      return {transform: `translate(${x}px,${y}px) rotate(${-8 * Math.sin(t * Math.PI)}deg)`};
    });
    const flight = actor.animate(keyframes, {duration: 520, easing: 'cubic-bezier(.26,.56,.39,1)', fill: 'forwards'});
    run.door.animate([{transform: 'scale(.25,.05)', opacity: 0},
      {transform: 'scale(1)', opacity: 1}], {
      duration: 205, delay: 280, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both',
    });
    await flight.finished;

    await actor.animate([
      {transform: keyframes.at(-1).transform, opacity: 1},
      {transform: `translate(${door.x + 14}px,${door.y - 5}px) scale(.45)`, opacity: .3, offset: .8},
      {transform: `translate(${door.x + 14}px,${door.y - 5}px) scale(.30)`, opacity: 0},
    ], {duration: 190, easing: 'ease-in', fill: 'forwards'}).finished;

    await run.veil.animate([
      {clipPath: `ellipse(15px 22px at ${door.x}px ${door.y}px)`},
      {clipPath: `ellipse(145vmax 145vmax at ${door.x}px ${door.y}px)`},
    ], {duration: 290, easing: 'cubic-bezier(.52,.06,.32,1)', fill: 'forwards'}).finished;
    navigate(run, true);
  }

  card?.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey || card.hasAttribute('download') ||
        (card.target && card.target !== '_self')) return;
    if (departure) { event.preventDefault(); return; }

    const destination = new URL(card.href);
    if (destination.origin !== location.origin ||
        !/^\/(?:zh\/)?wuhan-marine-machinery\.html$/.test(destination.pathname) ||
        route.hidden || reduced.matches || !actor.animate || !jump.complete || !jump.naturalWidth) return;

    const origin = actor.getBoundingClientRect();
    const bounds = card.getBoundingClientRect();
    const cta = card.querySelector('.home-case-cta')?.getBoundingClientRect();
    if (bounds.top >= innerHeight || bounds.bottom <= 0 || origin.top < 0 || origin.top >= innerHeight) return;

    event.preventDefault();
    const door = {x: Math.min(bounds.right + 20, innerWidth - 20),
      y: Math.min(innerHeight - 42, Math.max(48, cta ? cta.top + cta.height / 2 : bounds.top + bounds.height / 2))};
    const layer = document.createElement('div');
    layer.className = 'ink-portal-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<div class="ink-portal-door"></div><div class="ink-portal-veil"></div>';
    layer.style.setProperty('--door-x', door.x + 'px');
    layer.style.setProperty('--door-y', door.y + 'px');
    const run = {layer, door: layer.firstElementChild, veil: layer.lastElementChild, destination};
    departure = run;
    run.timer = setTimeout(() => navigate(run, false), 1230);
    try {
      document.body.append(layer);
      route.inert = true;
      layer.append(actor);
      actor.append(jump);
      clearTimeout(restTimer);
      launch(run, {x: origin.left, y: origin.top}, door).catch(() => navigate(run, false));
    } catch {
      navigate(run, false);
    }
  });

  actor.hidden = false;
  climb.addEventListener('load', schedule);
  sit.addEventListener('load', schedule);
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', schedule, {passive: true});
  addEventListener('pageshow', () => { restore(); schedule(); });
  addEventListener('pagehide', () => { if (departure) clearTimeout(departure.timer); });
  addEventListener('load', schedule, {once: true});
  viewport?.addEventListener('resize', schedule, {passive: true});
  wide.addEventListener('change', schedule);
  reduced.addEventListener('change', () => {
    if (departure && reduced.matches) navigate(departure, false);
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('portfolio:languagechange', schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
  schedule();

  function followChapters(nav, character) {
    const html = document.documentElement;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const viewer = document.querySelector('.wm-lightbox');
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const sections = links.map(link => document.getElementById(link.hash.slice(1)));
    if (sections.some(section => !section)) return;
    const caseMenu = nav.matches('.wm-nav');
    nav.classList.add('ink-chapter-track');
    const idle = character.firstElementChild;
    character.classList.add('ink-chapter-companion');
    idle.className = 'ink-chapter-idle';
    function pose(name) {
      const image = new Image();
      image.className = 'ink-chapter-' + name;
      image.alt = '';
      image.draggable = false;
      image.src = '/assets/portfolio/ink/' + name + '.webp';
      character.append(image);
      return image;
    }
    const stride = document.createElement('span');
    stride.className = 'ink-chapter-stride';
    const steps = new Image(528, 128);
    steps.alt = '';
    steps.draggable = false;
    stride.append(steps);
    character.append(stride);
    const jumpPose = html.hasAttribute('data-ink-portal-exit') ? pose('jump') : null;
    let request, requestTimer, frame = 0, dirty = true;
    let x, target, lower, upper, velocity = 0, lastTime, gait = 0;
    let exitAnimations = [];

    function scheduleChapter() {
      dirty = true;
      if (!frame) frame = requestAnimationFrame(renderChapter);
    }

    function readingPosition(centers, menu) {
      if (scrollY + innerHeight >= html.scrollHeight - 4) return centers.at(-1);
      const line = menu.height + (caseMenu ? 36 : 40);
      const tops = sections.map(section => section.getBoundingClientRect().top);
      const index = Math.max(0, tops.findLastIndex(top => top <= line));
      if (index >= tops.length - 1) return centers[index];
      const portion = Math.max(0, Math.min(1, (line - tops[index]) / Math.max(1, tops[index + 1] - tops[index])));
      return centers[index] + (centers[index + 1] - centers[index]) * portion;
    }

    function clearRequest() {
      request = undefined;
      clearTimeout(requestTimer);
      scheduleChapter();
    }

    function clearExit() {
      exitAnimations.forEach(animation => animation.cancel());
      exitAnimations = [];
      character.querySelector('.ink-chapter-door')?.remove();
      delete character.dataset.entering;
    }

    function exitPortal(direction) {
      const door = document.createElement('span');
      door.className = 'ink-portal-door ink-chapter-door';
      character.append(door);
      character.dataset.entering = '';
      const options = {duration: 440, easing: 'cubic-bezier(.24,.62,.34,1)', fill: 'both'};
      const doorway = door.animate([
        {opacity: 0, transform: 'scale(.2,.08)'},
        {opacity: 1, transform: 'scale(1)', offset: .29},
        {opacity: 1, transform: 'scale(.94)', offset: .56},
        {opacity: 0, transform: 'scale(.12,.65)'},
      ], options);
      const hop = jumpPose.animate([
        {opacity: 0, transform: `translateX(${direction * 24}px) scale(.38)`},
        {opacity: 0, transform: `translateX(${direction * 24}px) scale(.38)`, offset: .30},
        {opacity: 1, transform: `translate(${direction * 11}px,-6px) scale(.8)`, offset: .62},
        {opacity: 1, transform: 'none', offset: .93},
        {opacity: 0, transform: 'none'},
      ], options);
      exitAnimations = [doorway, hop];
      Promise.allSettled(exitAnimations.map(animation => animation.finished)).then(clearExit);
    }

    function measureChapter() {
      const selected = links.find(link => link.getAttribute('aria-current') === 'location');
      if (request && request === selected) {
        request = undefined;
        clearTimeout(requestTimer);
      }
      const menu = nav.getBoundingClientRect();
      if (caseMenu) html.style.setProperty('--ink-chapter-nav-height', menu.height + 'px');
      const shown = menu.bottom >= 0 && menu.bottom - 1 <= innerHeight &&
        !viewer?.open && !document.hidden;
      character.hidden = !shown;
      if (!shown) {
        x = undefined;
        velocity = 0;
        lastTime = undefined;
        delete character.dataset.walking;
        if (exitAnimations.length) clearExit();
        return;
      }

      const centers = links.map(link => {
        const box = link.getBoundingClientRect();
        return box.left + box.width / 2;
      });
      lower = menu.left + 16;
      upper = menu.right - 16;
      const destination = request ? centers[links.indexOf(request)] : readingPosition(centers, menu);
      target = Math.max(lower, Math.min(upper, destination));
      character.style.setProperty('--chapter-ink-y', menu.bottom - 2 + 'px');
      if (!reducedMotion.matches && !steps.hasAttribute('src')) steps.src = '/assets/portfolio/ink/walk-cycle.webp';

      if (html.hasAttribute('data-ink-portal-exit') &&
          (reducedMotion.matches || !jumpPose || jumpPose.complete) && !html.hasAttribute('data-ink-arrival')) {
        delete html.dataset.inkPortalExit;
        if (!reducedMotion.matches && jumpPose?.naturalWidth && character.animate) {
          const side = target + 48 < menu.right ? 1 : -1;
          character.style.setProperty('--chapter-door-x', side * 24 + 'px');
          character.style.setProperty('--chapter-ink-facing', side > 0 ? '-1' : '1');
          try { exitPortal(side); } catch { clearExit(); }
        }
      }
    }

    function renderChapter(now) {
      frame = 0;
      if (dirty) {
        dirty = false;
        measureChapter();
      }
      if (character.hidden) return;
      if (x === undefined || reducedMotion.matches) {
        x = target;
        velocity = 0;
      }
      const elapsed = lastTime === undefined ? 1 / 60 : Math.min(.032, (now - lastTime) / 1000);
      // Critically damped motion preserves the rendered position and velocity
      // when a chapter request changes. No target write can teleport the sprite.
      const distance = x - target;
      const damping = 13;
      const drift = velocity + damping * distance;
      const decay = Math.exp(-damping * elapsed);
      velocity = Math.max(-2350, Math.min(2350, (velocity - damping * drift * elapsed) * decay));
      const step = Math.max(-2350 * elapsed, Math.min(2350 * elapsed,
        target + (distance + drift * elapsed) * decay - x));
      const next = Math.max(lower, Math.min(upper, x + step));
      const moving = !reducedMotion.matches && (Math.abs(target - next) > .6 || Math.abs(velocity) > 8);
      if (moving && Math.abs(next - x) > .05 && !character.hasAttribute('data-entering')) {
        character.style.setProperty('--chapter-ink-facing', next < x ? '-1' : '1');
        gait = (gait + Math.min(Math.abs(next - x) / 29, elapsed * 3.4)) % 1;
        character.style.setProperty('--chapter-step', String(Math.floor(gait * 6)));
      }
      character.toggleAttribute('data-walking', moving && steps.complete && steps.naturalWidth > 0);
      x = moving ? next : target;
      character.style.setProperty('--chapter-ink-x', x + 'px');
      lastTime = moving ? now : undefined;
      if (moving) frame = requestAnimationFrame(renderChapter);
      else velocity = 0;
    }

    nav.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#"]');
      if (!links.includes(link) || event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      clearExit();
      request = link;
      clearTimeout(requestTimer);
      requestTimer = setTimeout(clearRequest, 2200);
      scheduleChapter();
    });
    new MutationObserver(scheduleChapter).observe(nav, {subtree: true, attributes: true, attributeFilter: ['aria-current']});
    new MutationObserver(scheduleChapter).observe(html, {attributes: true, attributeFilter: ['data-ink-arrival']});
    if (viewer) new MutationObserver(scheduleChapter).observe(viewer, {attributes: true, attributeFilter: ['open']});
    if ('ResizeObserver' in window) new ResizeObserver(scheduleChapter).observe(nav);
    nav.addEventListener('scroll', scheduleChapter, {passive: true});
    addEventListener('scroll', scheduleChapter, {passive: true});
    addEventListener('resize', scheduleChapter, {passive: true});
    addEventListener('hashchange', scheduleChapter);
    addEventListener('wheel', clearRequest, {passive: true});
    addEventListener('touchmove', clearRequest, {passive: true});
    addEventListener('keydown', event => {
      if (request && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
        clearRequest();
      }
    });
    addEventListener('pageshow', scheduleChapter);
    addEventListener('pagehide', () => { clearExit(); clearRequest(); });
    reducedMotion.addEventListener('change', () => { clearExit(); scheduleChapter(); });
    document.addEventListener('visibilitychange', scheduleChapter);
    jumpPose?.addEventListener('load', scheduleChapter);
    jumpPose?.addEventListener('error', scheduleChapter);
    scheduleChapter();
  }
})();
