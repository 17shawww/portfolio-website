/* Complete ink paintings share one pose layer controller. No scroll or pointer capture. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const sources = new Map();
  const resource = name => '/assets/portfolio/ink/' + name + '.webp';
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const duration = Math.min(140, parseFloat(getComputedStyle(root).getPropertyValue('--motion-fast')) || 140);
  const easing = getComputedStyle(root).getPropertyValue('--motion-ease').trim() || 'ease';

  function load(name) {
    if (!sources.has(name)) {
      const img = new Image();
      img.src = resource(name);
      const ready = img.decode().then(() => img).catch(error => {
        sources.delete(name);
        throw error;
      });
      sources.set(name, ready);
    }
    return sources.get(name);
  }

  class InkActor {
    constructor(host, render, warm = []) {
      this.host = host;
      this.plate = host.querySelector('.ink-plate');
      this.img = this.plate.querySelector('img');
      this.rest = host.dataset.pose;
      this.current = this.rest;
      this.desired = this.rest;
      this.render = render;
      this.frame = 0;
      this.request = 0;
      this.visible = false;
      this.warm = warm;

      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(([entry]) => {
          this.visible = entry.isIntersecting;
          this.reconcile();
        });
        this.observer.observe(host.closest('.ink-climb-rail') || host);
      } else {
        this.visible = true;
      }
    }

    get eligible() { return this.visible && !document.hidden && !hiddenByNavigation; }
    get active() { return this.eligible && !reduced.matches; }

    reconcile() {
      if (!this.eligible) {
        this.sleep();
      } else {
        if (!reduced.matches && this.warm.length) {
          for (const pose of this.warm) load(pose).catch(() => {});
          this.warm = [];
        }
        if (reduced.matches) this.clearCrossfade();
        this.queue();
      }
    }

    queue() {
      if (this.frame || !this.eligible) return;
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        if (this.eligible) this.render(this);
      });
    }

    clearCrossfade() {
      this.enterAnimation?.cancel();
      this.exitAnimation?.cancel();
      this.retiring?.remove();
      this.enterAnimation = this.exitAnimation = this.retiring = undefined;
    }

    async pose(name) {
      if (name === this.desired) return name === this.current;
      this.desired = name;
      const request = ++this.request;
      if (name === this.current) return true;
      try {
        const image = await load(name);
        if (request !== this.request) return false;
        this.clearCrossfade();

        const next = image.cloneNode();
        next.alt = '';
        next.draggable = false;
        next.setAttribute('aria-hidden', 'true');
        const previous = this.img;
        this.img = next;
        this.host.dataset.pose = this.current = name;

        if (!this.active || typeof next.animate !== 'function') {
          this.plate.replaceChildren(next);
          return true;
        }

        this.plate.append(next);
        this.retiring = previous;
        const timing = {duration, easing, fill: 'both'};
        this.exitAnimation = previous.animate([{opacity: 1}, {opacity: 0}], { ...timing, duration: duration * .82 });
        const enter = next.animate([{opacity: 0}, {opacity: 1}], timing);
        this.enterAnimation = enter;
        enter.finished.then(() => {
          if (this.enterAnimation === enter) this.clearCrossfade();
        }, () => {});
        return true;
      } catch {
        if (request === this.request) this.desired = this.current;
        return false;
      }
    }

    sleep() {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      ++this.request;
      this.desired = this.current;
      this.clearCrossfade();
      this.host.style.removeProperty('--ink-lean');
      this.host.style.removeProperty('--ink-tilt');
      this.onSleep?.();
    }
  }

  let hiddenByNavigation = false;
  const actors = [];
  for (const host of document.querySelectorAll('[data-ink-actor]')) {
    const context = host.dataset.inkActor;
    const actor = {home, work, coming, about}[context]?.(host);
    if (actor) actors.push(actor);
  }
  const refresh = () => actors.forEach(actor => actor.reconcile());
  reduced.addEventListener('change', refresh);
  finePointer.addEventListener('change', refresh);
  document.addEventListener('visibilitychange', refresh);
  addEventListener('pagehide', () => { hiddenByNavigation = true; refresh(); });
  addEventListener('pageshow', () => { hiddenByNavigation = false; refresh(); });

  function hover(source, handler) {
    source.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && finePointer.matches) handler(true);
    });
    source.addEventListener('pointerleave', () => handler(false));
  }

  function focus(source, handler) {
    source.addEventListener('focusin', () => handler(true));
    source.addEventListener('focusout', event => {
      if (!source.contains(event.relatedTarget)) handler(false);
    });
  }

  function home(host) {
    const button = host.closest('button');
    const area = host.closest('.hero');
    let pointer;
    let near = false;
    let jumping = false;
    let gesture = 0;
    let timer;
    const actor = new InkActor(host, current => {
      if (jumping) return;
      if (pointer && current.active && finePointer.matches) {
        const rect = button.getBoundingClientRect();
        const dx = pointer.x - (rect.left + rect.width / 2);
        const dy = pointer.y - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy);
        // Different enter/leave thresholds keep the pose stable near the edge.
        near = distance < (near ? 127 : 108);
        if (near) {
          const weight = clamp((127 - distance) / 67, 0, 1);
          host.style.setProperty('--ink-lean', (clamp(dx / 18, -4, 4) * weight).toFixed(2) + 'px');
          host.style.setProperty('--ink-tilt', (clamp(dx / 48, -2, 2) * weight).toFixed(2) + 'deg');
        }
      } else {
        near = false;
      }
      if (!near) {
        host.style.removeProperty('--ink-lean');
        host.style.removeProperty('--ink-tilt');
      }
      current.pose(near ? 'look' : 'idle');
    }, ['look', 'jump']);

    button.disabled = false;
    area.addEventListener('pointermove', event => {
      if (!actor.active || !finePointer.matches || event.pointerType !== 'mouse') return;
      pointer = {x: event.clientX, y: event.clientY};
      actor.queue();
    }, {passive: true});
    area.addEventListener('pointerleave', () => { pointer = undefined; actor.queue(); });
    button.addEventListener('click', async () => {
      if (!actor.eligible || jumping) return;
      host.style.removeProperty('--ink-lean');
      host.style.removeProperty('--ink-tilt');
      jumping = true;
      const attempt = ++gesture;
      const shown = await actor.pose('jump');
      if (attempt !== gesture) return;
      if (!shown) {
        jumping = false;
        actor.queue();
        return;
      }
      timer = setTimeout(() => { jumping = false; actor.queue(); }, 420);
    });
    actor.onSleep = () => {
      ++gesture;
      clearTimeout(timer);
      jumping = false;
      pointer = undefined;
      near = false;
    };
    return actor;
  }

  function work(host) {
    const project = host.closest('.wm-work-feature');
    let pointed = false;
    let focused = false;
    const actor = new InkActor(host, current => {
      current.pose((pointed && finePointer.matches) || focused ? (current.active ? 'walk' : 'look') : 'idle');
    }, ['walk']);
    hover(project, value => { pointed = value; actor.queue(); });
    focus(project, value => { focused = value; actor.queue(); });
    actor.onSleep = () => { pointed = false; };
    return actor;
  }

  function coming(host) {
    const card = host.closest('[data-coming-soon]');
    const trigger = card.querySelector('.coming-trigger');
    const reset = card.querySelector('[data-coming-reset]');
    let pointed = false;
    let focused = false;
    let wasRevealed = false;
    let awake = false;
    let waking = false;
    let wakeAttempt = 0;
    let timer;
    function finishWake() {
      ++wakeAttempt;
      clearTimeout(timer);
      waking = false;
    }
    const actor = new InkActor(host, current => {
      const revealed = card.classList.contains('is-revealed');
      // Closing restores focus to the trigger. Don't mistake that for a new wake.
      if (wasRevealed && !revealed) {
        focused = false;
        pointed = false;
      }
      wasRevealed = revealed;
      const interested = revealed || focused || (pointed && finePointer.matches && current.active);
      if (!interested) {
        finishWake();
        awake = false;
        current.pose('sleep');
      } else if (!current.active) {
        finishWake();
        awake = true;
        current.pose('sit');
      } else if (!awake) {
        awake = waking = true;
        const attempt = ++wakeAttempt;
        current.pose('surprise').then(shown => {
          if (attempt !== wakeAttempt) return;
          const settle = () => {
            waking = false;
            current.queue();
          };
          if (shown) timer = setTimeout(settle, 320);
          else settle();
        });
      } else if (!waking) {
        current.pose('sit');
      }
    }, ['surprise', 'sit']);

    hover(card, value => { pointed = value; actor.queue(); });
    focus(card, value => { focused = value; actor.queue(); });
    trigger.addEventListener('click', () => actor.queue());
    reset.addEventListener('click', () => actor.queue());
    card.addEventListener('keydown', event => { if (event.key === 'Escape') actor.queue(); });
    actor.onSleep = () => {
      finishWake();
      pointed = false;
      awake = false;
    };
    return actor;
  }

  function about(host) {
    const rail = host.closest('.ink-climb-rail');
    const anchor = host.closest('.ink-climb-anchor');
    const route = rail.querySelector('[data-ink-route]');
    const reveal = rail.querySelector('[data-ink-reveal]');
    const total = route.getTotalLength();
    const samples = Array.from({length: 49}, (_, index) => route.getPointAtLength(total * index / 48));
    let last = -1;
    let viewportWidth = root.clientWidth;
    let height = root.clientHeight;
    const actor = new InkActor(host, current => {
      let progress = 0;
      if (current.active) {
        const top = rail.getBoundingClientRect().top;
        const remaining = root.scrollHeight - height - scrollY;
        const start = height * .85;
        // Reserve enough of the final scroll interval for the upper resting pose.
        const available = Math.max(100, remaining + start - top);
        const span = Math.min(height * .49, available * .88);
        progress = clamp((start - top) / span, 0, 1);
      }
      const eased = progress * progress * (3 - 2 * progress);
      if (Math.abs(eased - last) > .0005 || (eased !== last && (eased === 0 || eased === 1))) {
        last = eased;
        const index = Math.min(47, Math.floor(eased * 48));
        const mix = eased * 48 - index;
        const point = samples[index];
        const next = samples[index + 1];
        const x = point.x + (next.x - point.x) * mix;
        const y = point.y + (next.y - point.y) * mix;
        anchor.style.setProperty('--climb-x', (x / 150 * 100).toFixed(3) + '%');
        anchor.style.setProperty('--climb-y', (y / 260 * 100).toFixed(3) + '%');
        host.style.setProperty('--climb-progress', eased.toFixed(4));
        // Approach the ledge with enough ink above the feet to meet the hand.
        const clipY = y + 13 * (1 - eased) ** 8 - 7 * eased - 7 * eased ** 6;
        reveal.setAttribute('y', clipY.toFixed(2));
        reveal.setAttribute('height', (260 - clipY).toFixed(2));
      }
      current.pose(progress > .035 && progress < .95 ? 'climb' : 'sit');
    }, ['climb']);
    const queue = () => actor.queue();
    addEventListener('scroll', queue, {passive: true});
    addEventListener('resize', () => {
      // The browser toolbar can change mobile viewport height mid-scroll.
      if (finePointer.matches || root.clientWidth !== viewportWidth) {
        viewportWidth = root.clientWidth;
        height = root.clientHeight;
      }
      queue();
    }, {passive: true});
    document.addEventListener('portfolio:languagechange', queue);
    return actor;
  }

})();
