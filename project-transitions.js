/* Phase 4: parser-blocking, route-scoped cross-document transitions.
   Normal anchors own navigation. No router, fetch interception or delayed clicks. */
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  // A short-lived, destination-specific handoff from the homepage portal.
  try {
    const key = 'portfolio-ink-portal';
    const ticket = JSON.parse(sessionStorage.getItem(key));
    if (ticket?.destination === location.href) {
      sessionStorage.removeItem(key);
      if (!preference.matches && Date.now() - ticket.timestamp < 5000) {
        root.dataset.inkArrival = '';
        root.dataset.inkPortalExit = '';
        const clearArrival = () => { delete root.dataset.inkArrival; };
        addEventListener('pageshow', () => setTimeout(clearArrival, 360), {once: true});
        addEventListener('pagehide', () => {
          clearArrival();
          delete root.dataset.inkPortalExit;
        }, {once: true});
      }
    }
  } catch {}

  let active;
  const route = value => {
    if (!value) return '';
    const url = new URL(value, location.href);
    return url.origin === location.origin ? url.pathname.split('/').pop() : '';
  };
  function direction(from, to) {
    const a = route(from), b = route(to);
    if (a === 'work.html' && b === 'wuhan-marine-machinery.html') return 'forward';
    if (a === 'wuhan-marine-machinery.html' && b === 'work.html') return 'back';
    return '';
  }
  const supported = 'CSSViewTransitionRule' in window && 'onpagereveal' in window;
  if (!supported) return;
  const optIn = document.createElement('style');
  optIn.textContent = '@media(prefers-reduced-motion:no-preference){@view-transition{navigation:auto}}';
  document.head.append(optIn);
  const incoming = direction(window.navigation?.activation?.from?.url, location.href);
  if (!preference.matches && incoming) root.dataset.projectTransition = incoming;
  function configure(event, from, to) {
    const transition = event.viewTransition;
    if (!transition) {
      delete root.dataset.projectTransition;
      return;
    }
    transition.ready.catch(() => {});
    const kind = direction(from, to);
    if (!kind || preference.matches) { transition.skipTransition();delete root.dataset.projectTransition;return; }
    const isWork = route(location.href) === 'work.html';
    const scene = document.querySelector(isWork ? '.wm-work-visual' : '.v-opening-screens');
    const title = document.querySelector(isWork ? '#wuhan-project' : '.v-title h1');
    const images = scene ? [...scene.querySelectorAll('img')].slice(0, 2) : [];
    const bounds = scene?.getBoundingClientRect();
    // Deep return links keep their real scroll/history behavior rather than flying
    // an offscreen hero through the reading position.
    if (!bounds || bounds.top >= innerHeight || bounds.bottom <= 0 || images.some(image => !image.complete || !image.naturalWidth)) {
      transition.skipTransition();delete root.dataset.projectTransition;return;
    }
    root.dataset.projectTransition = kind;active = transition;
    const named = [[scene, 'project-scene'], [title, 'project-title'], [document.querySelector('.site-header'), 'project-navigation'], ...images.map((image, index) => [image, `project-screen-${index}`])];
    named.forEach(([element, name]) => { if (element) element.style.viewTransitionName = name; });
    transition.finished.finally(() => {
      named.forEach(([element]) => { if (element) element.style.removeProperty('view-transition-name'); });
      delete root.dataset.projectTransition;
      if (active === transition) active = null;
    });
  }
  addEventListener('pageswap', event => configure(event, location.href, event.activation?.entry?.url));
  addEventListener('pagereveal', event => configure(event, window.navigation?.activation?.from?.url, location.href));
  preference.addEventListener('change', () => { if (preference.matches) active?.skipTransition(); });
})();
