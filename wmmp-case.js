/* Progressive enhancement for this case study only. Native links work without JS. */
(() => {
  const navigation = document.querySelector('.wm-nav');
  const sections = [...document.querySelectorAll('.wm-section')];
  if (!navigation || !sections.length) return;
  const links = [...navigation.querySelectorAll('a')];
  let frame = 0;
  function update() {
    frame = 0;
    const menu = navigation.getBoundingClientRect();
    const line = menu.height + 36;
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    const index = atEnd ? sections.length - 1 : Math.max(0, sections.findLastIndex(section => section.getBoundingClientRect().top <= line));
    const changed = links[index].getAttribute('aria-current') !== 'location';
    if (!changed) return;
    if (changed && menu.top <= 1 && navigation.scrollWidth > navigation.clientWidth) {
      const target = links[index];
      navigation.scrollTo({ left: target.offsetLeft - navigation.clientWidth / 2 + target.offsetWidth / 2, behavior: 'instant' });
    }
    links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('pageshow', schedule);
  update();

  // Case-only motion adapter: Phase 1 tokens, no new animation runtime.
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const motionTokens = getComputedStyle(document.documentElement);
  const activeAnimations = new Set();
  function cancelMotion() {
    activeAnimations.forEach(animation => animation.cancel());
    activeAnimations.clear();
  }
  function motion(element, frames, token = '--motion-standard') {
    if (reducedMotion.matches || document.hidden || !element.animate) return Promise.resolve();
    element.getAnimations().forEach(animation => animation.cancel());
    const animation = element.animate(frames, {
      duration: parseFloat(motionTokens.getPropertyValue(token)) || 220,
      easing: motionTokens.getPropertyValue('--motion-ease').trim() || 'ease',
    });
    activeAnimations.add(animation);
    return animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
  }
  const enter = element => motion(element, [{ opacity: .65, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }]);
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) cancelMotion(); });
  addEventListener('pagehide', cancelMotion);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelMotion(); });

  // Loading requests are bounded. A failed image keeps its original-image link.
  const imageCache = new Map();
  function prepareImage(src) {
    if (imageCache.has(src)) return imageCache.get(src);
    const request = new Promise(resolve => {
      const image = new Image();
      let timer;
      const finish = ok => {
        clearTimeout(timer);
        image.onload = image.onerror = null;
        resolve(ok);
      };
      timer = setTimeout(() => finish(false), 8000);
      image.onload = () => {
        if (image.decode) image.decode().catch(() => {}).then(() => finish(image.naturalWidth > 0));
        else finish(image.naturalWidth > 0);
      };
      image.onerror = () => finish(false);
      image.src = src;
    });
    imageCache.set(src, request);
    request.then(ok => { if (!ok) imageCache.delete(src); });
    return request;
  }
  function imageInfo(link) {
    const figure = link.closest('figure');
    const caption = figure.querySelector('figcaption');
    const image = link.querySelector('img');
    const heading = caption?.querySelector('strong');
    const title = heading?.textContent.trim() || image.alt;
    const description = caption?.querySelector('strong + span')?.textContent.trim() || image.alt;
    return { src: link.href, alt: image.alt, title, description };
  }

  // Native dialog owns focus containment; grouped browsing never changes the page below it.
  const dialog = document.querySelector('.wm-lightbox');
  if (!dialog) return;
  const detail = dialog.querySelector('img');
  const caption = dialog.querySelector('.wm-lightbox-caption');
  const title = dialog.querySelector('#wm-image-title');
  const original = dialog.querySelector('.wm-original-link');
  const body = dialog.querySelector('.wm-lightbox-body');
  const previous = dialog.querySelector('[data-previous]');
  const next = dialog.querySelector('[data-next]');
  const position = dialog.querySelector('[data-position]');
  const status = dialog.querySelector('.p2-viewer-status');
  let opener, group = [], groupRoot, index = 0, requested = 0, request = 0, closing = false;
  let scrollState;
  function lockScroll() {
    const root = document.documentElement, page = document.body;
    scrollState = { x: scrollX, y: scrollY, root: root.style.overflow, body: {} };
    ['position', 'top', 'left', 'width', 'overflow'].forEach(key => { scrollState.body[key] = page.style[key]; });
    root.style.overflow = 'hidden';
    Object.assign(page.style, { position: 'fixed', top: `${-scrollState.y}px`, left: `${-scrollState.x}px`, width: '100%', overflow: 'hidden' });
  }
  function unlockScroll() {
    if (!scrollState) return;
    document.documentElement.style.overflow = scrollState.root;
    Object.assign(document.body.style, scrollState.body);
    window.scrollTo({ left: scrollState.x, top: scrollState.y, behavior: 'instant' });
    scrollState = null;
  }
  async function showImage(target) {
    if (closing || !dialog.open) return;
    requested = (target + group.length) % group.length;
    const chosen = requested, id = ++request, info = imageInfo(group[chosen]);
    body.setAttribute('aria-busy', 'true');
    status.textContent = 'Loading image…';
    const ok = await prepareImage(info.src);
    if (id !== request || closing || !dialog.open) return;
    index = chosen;
    detail.src = info.src;detail.alt = info.alt;detail.hidden = !ok;
    title.textContent = info.title;caption.textContent = info.description;
    original.href = info.src;
    const groupHeading = document.getElementById(groupRoot?.getAttribute('aria-labelledby'));
    dialog.querySelector('[data-gallery-name]').textContent = groupHeading?.textContent.trim() || 'Design detail';
    position.textContent = `${index + 1} / ${group.length} — ${info.title}`;
    previous.disabled = next.disabled = group.length < 2;
    status.textContent = ok ? '' : 'This image could not load. Try another image or open its full-size file.';
    body.removeAttribute('aria-busy');body.scrollTop = 0;
    if (ok) enter(detail);
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-enlarge]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !dialog.showModal) return;
    event.preventDefault();
    if (dialog.open) return;
    opener = link;
    groupRoot = link.closest('[data-gallery]');
    group = groupRoot ? [...groupRoot.querySelectorAll('a[data-enlarge]')] : [link];
    index = requested = Math.max(0, group.indexOf(link));
    // No old image or caption should flash when opening a different group.
    detail.hidden = true;detail.removeAttribute('src');caption.textContent = '';position.textContent = '';
    const info = imageInfo(link); title.textContent = info.title;original.href = info.src;
    const groupHeading = document.getElementById(groupRoot?.getAttribute('aria-labelledby'));
    dialog.querySelector('[data-gallery-name]').textContent = groupHeading?.textContent.trim() || 'Design detail';
    previous.disabled = next.disabled = group.length < 2;
    closing = false;dialog.classList.remove('p2-closing');
    lockScroll();dialog.showModal();body.scrollTop = 0;
    dialog.querySelector('[data-close]').focus({ preventScroll: true });
    motion(dialog, [{ opacity: 0, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }]);
    showImage(index);
  });
  function finishClose() {
    ++request;closing = false;
    dialog.getAnimations().forEach(animation => animation.cancel());
    if (dialog.open) dialog.close();
  }
  function close() {
    if (!dialog.open) return;
    if (closing) { finishClose();return; }
    closing = true;++request;dialog.classList.add('p2-closing');
    // Completion, cancellation, and a bounded timer all release modality.
    Promise.race([
      motion(dialog, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.985)' }]),
      new Promise(resolve => setTimeout(resolve, 280)),
    ]).then(() => { if (closing) finishClose(); });
  }
  previous.addEventListener('click', () => showImage(requested - 1));
  next.addEventListener('click', () => showImage(requested + 1));
  dialog.querySelector('[data-close]').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault();close(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  dialog.addEventListener('keydown', event => {
    if (closing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || group.length < 2) return;
    event.preventDefault();showImage(requested + (event.key === 'ArrowRight' ? 1 : -1));
  });
  let start;
  body.addEventListener('pointerdown', event => {
    start = event.pointerType === 'touch' && event.isPrimary && (!window.visualViewport || visualViewport.scale <= 1) ? { x: event.clientX, y: event.clientY } : null;
  }, { passive: true });
  body.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;start = null;
    if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && group.length > 1) showImage(requested + (dx < 0 ? 1 : -1));
  }, { passive: true });
  body.addEventListener('pointercancel', () => { start = null; }, { passive: true });
  dialog.addEventListener('close', () => {
    ++request;closing = false;dialog.classList.remove('p2-closing');
    unlockScroll();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    schedule();
  });
  addEventListener('pagehide', () => { if (dialog.open) finishClose(); });
})();
