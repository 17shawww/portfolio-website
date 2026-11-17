/* Progressive enhancement for this case study only. Native links work without JS. */
(() => {
  const navigation = document.querySelector('.wm-nav');
  const sections = [...document.querySelectorAll('.wm-section')];
  if (!navigation || !sections.length) return;
  const links = [...navigation.querySelectorAll('a')];
  let frame = 0;
  function update() {
    frame = 0;
    const line = navigation.getBoundingClientRect().height + 36;
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    const index = atEnd ? sections.length - 1 : Math.max(0, sections.findLastIndex(section => section.getBoundingClientRect().top <= line));
    const changed = links[index].getAttribute('aria-current') !== 'location';
    if (changed && navigation.getBoundingClientRect().top <= 1 && navigation.scrollWidth > navigation.clientWidth) {
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
  function arrowIndex(event, index, count) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowRight') return (index + 1) % count;
    if (event.key === 'ArrowLeft') return (index - 1 + count) % count;
    if (event.key === 'Home') return 0;
    if (event.key === 'End') return count - 1;
  }
  function imageInfo(link) {
    const figure = link.closest('figure');
    const caption = figure.querySelector('figcaption');
    const heading = caption.querySelector('b');
    const title = heading?.textContent || caption.firstChild?.textContent || link.querySelector('img').alt;
    const clone = caption.cloneNode(true);
    clone.querySelector('b')?.remove();
    clone.querySelectorAll('button, details').forEach(element => element.remove());
    const description = [...clone.childNodes].map(node => node.textContent.trim()).filter(Boolean).join(' ');
    const notes = caption.querySelector('.p2-direction-notes dl');
    const reading = notes ? [...notes.querySelectorAll('dd')].map(item => `${item.previousElementSibling.textContent}: ${item.textContent}`).join(' ') : '';
    return { src: link.href, alt: link.querySelector('img').alt, title: title.trim(), description: reading ? `Visual interpretation. ${reading}` : description || link.querySelector('img').alt };
  }

  // Phase 3: evidence stays in HTML. A shared controller adds manual exploration.
  document.querySelectorAll('[data-story]').forEach(root => {
    const kind = root.dataset.story;
    const stage = root.querySelector('.p3-panels');
    const panels = [...stage.children].map(disclosure => {
      // Native disclosures are the no-JS baseline. Regions avoid details' internal
      // layout wrapper so enhanced panels can share one stable grid track.
      const panel = document.createElement('article');
      panel.id = disclosure.id;panel.className = disclosure.className;
      panel.dataset.label = disclosure.dataset.label;
      panel.append(disclosure.querySelector('.p3-panel-content'));
      disclosure.replaceWith(panel);
      return panel;
    });
    const controls = root.querySelector('.p3-story-controls');
    const status = root.querySelector('.p3-story-status');
    const branches = [...root.querySelectorAll('.v-ia-branch')];
    const choices = [];
    let current = kind === 'ia' ? -1 : 0;
    let request = 0;
    function button(label, index, destination) {
      const control = document.createElement('button');
      control.type = 'button';control.textContent = label;
      if (index >= 0) control.setAttribute('aria-controls', panels[index].id);
      control.addEventListener('click', () => select(index));
      control.addEventListener('keydown', event => {
        const next = arrowIndex(event, choices.indexOf(control), choices.length);
        if (next === undefined) return;
        event.preventDefault();choices[next].focus();choices[next].click();
      });
      destination.append(control);choices.push(control);
      return control;
    }
    if (kind === 'ia') button('Full architecture overview', -1, controls);
    panels.forEach((panel, index) => button(
      kind === 'ia' ? `Explore ${panel.dataset.label} ↓` : panel.dataset.label,
      index, branches[index] || controls,
    ));
    function commit(index, animate) {
      panels.forEach((panel, i) => {
        const hidden = i !== index;
        panel.hidden = hidden;panel.inert = hidden;
        panel.setAttribute('aria-hidden', String(hidden));
      });
      stage.hidden = index < 0;
      choices.forEach((choice, i) => choice.setAttribute('aria-pressed', String(i === index + (kind === 'ia' ? 1 : 0))));
      branches.forEach((branch, i) => branch.classList.toggle('p3-branch-selected', i === index));
      current = index;
      status.textContent = index < 0 ? 'Full four-destination overview. Select a destination to inspect its route examples.' : `${panels[index].dataset.label} selected.`;
      if (animate && index >= 0) enter(panels[index].querySelector('.p3-panel-content'));
      schedule();
    }
    async function select(index) {
      const id = ++request;
      if (index < 0 || index === current) {
        stage.removeAttribute('aria-busy');commit(index, false);return;
      }
      stage.setAttribute('aria-busy', 'true');status.textContent = 'Loading source artifact…';
      const images = [...panels[index].querySelectorAll('img[src]')];
      const ready = await Promise.all(images.map(image => prepareImage(image.src)));
      if (id !== request) return;
      stage.removeAttribute('aria-busy');commit(index, true);
      if (ready.includes(false)) status.textContent += ' Image unavailable; its original-file link remains available.';
    }
    root.classList.add('p3-enhanced');
    controls.hidden = false;
    commit(current, false);
  });

  // Keep every original thumbnail/link. Selection adds a larger view, not a final-design claim.
  const directionGrid = document.querySelector('.v-direction-grid');
  const directionStage = document.querySelector('.p2-direction-stage');
  if (directionGrid && directionStage) {
    const figures = [...directionGrid.children];
    const controls = document.createElement('div');
    controls.className = 'p2-direction-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Select a Workbench exploration');
    const status = document.createElement('p');
    status.className = 'wm-caption';
    status.setAttribute('role', 'status');
    let request = 0;
    let current = -1;
    const buttons = figures.map((figure, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${String(index + 1).padStart(2, '0')} / ${figure.querySelector('figcaption b').textContent}`;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-controls', 'direction-preview');
      controls.append(button);
      button.addEventListener('click', () => select(index));
      button.addEventListener('keydown', event => {
        const next = arrowIndex(event, index, figures.length);
        if (next === undefined) return;
        event.preventDefault(); buttons[next].focus(); select(next);
      });
      const shortcut = button.cloneNode(true);
      shortcut.textContent = 'Explore direction';
      shortcut.setAttribute('aria-label', `Explore direction ${String(index + 1).padStart(2, '0')}: ${figure.querySelector('figcaption b').textContent}`);
      shortcut.removeAttribute('aria-pressed');
      shortcut.addEventListener('click', () => {
        select(index);
        buttons[index].focus({ preventScroll: true });
        directionStage.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
      figure.append(shortcut);
      return button;
    });
    const preview = document.createElement('div');
    preview.id = 'direction-preview';
    preview.className = 'p2-direction-preview';
    directionStage.append(controls, preview, status);
    directionStage.hidden = false;
    async function select(index) {
      if (current === index && !preview.hasAttribute('aria-busy')) return;
      const id = ++request;
      preview.setAttribute('aria-busy', 'true');
      status.textContent = 'Loading direction…';
      const source = figures[index].querySelector('a[data-enlarge]');
      const ok = await prepareImage(source.href);
      if (id !== request) return;
      const figure = figures[index].cloneNode(true);
      figure.querySelectorAll(':scope > button').forEach(button => button.remove());
      figure.querySelector('a').dataset.viewerSource = 'directions';
      const notes = figure.querySelector('details');
      const copy = document.createElement('div');
      const label = document.createElement('span'); label.className = 'wm-label'; label.textContent = `Selected exploration / ${String(index + 1).padStart(2, '0')}`;
      const title = document.createElement('h3'); title.textContent = figures[index].querySelector('figcaption b').textContent;
      copy.append(label, title, notes.querySelector('dl').cloneNode(true));
      const note = document.createElement('p'); note.className = 'wm-caption'; note.textContent = 'Visual interpretation of an exploration; not a validated or approved selection.'; copy.append(note);
      figure.querySelector('figcaption').textContent = `Direction ${String(index + 1).padStart(2, '0')}`;
      preview.replaceChildren(figure, copy);
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      figures.forEach((item, i) => item.classList.toggle('p2-selected', i === index));
      current = index;
      preview.removeAttribute('aria-busy');
      status.textContent = ok ? `Direction ${String(index + 1).padStart(2, '0')} selected. All six thumbnails and the comparison below remain available.` : 'Image could not load. Use View detail to open its original file, or choose another direction.';
      enter(preview);
    }
    select(0);
  }

  // The preserved 01/04 comparison is the default; visitors can inspect any distinct pair.
  const directionPair = document.querySelector('.r-iteration-pair');
  if (directionGrid && directionPair) {
    const sources = [...directionGrid.children];
    const controls = document.createElement('div');controls.className = 'p2-pair-controls';
    const status = document.createElement('p');status.className = 'wm-caption';status.setAttribute('role', 'status');
    const selected = [0, 3], requests = [0, 0];
    const selects = ['Left direction', 'Right direction'].map((text, column) => {
      const label = document.createElement('label');label.textContent = text;
      const select = document.createElement('select');
      sources.forEach((source, index) => {
        const option = document.createElement('option');option.value = index;
        option.textContent = `${String(index + 1).padStart(2, '0')} / ${source.querySelector('figcaption b').textContent}`;
        select.append(option);
      });
      select.value = selected[column];label.append(select);controls.append(label);
      select.addEventListener('change', async () => {
        const index = Number(select.value), id = ++requests[column];selected[column] = index;syncOptions();
        select.setAttribute('aria-busy', 'true');status.textContent = 'Loading comparison…';
        const ok = await prepareImage(sources[index].querySelector('a').href);
        if (id !== requests[column]) return;
        const figure = sources[index].cloneNode(true);
        figure.classList.remove('p2-selected');figure.querySelectorAll(':scope > button').forEach(button => button.remove());
        figure.querySelector('details').open = true;
        directionPair.children[column].replaceWith(figure);
        select.removeAttribute('aria-busy');
        status.textContent = ok ? `Comparing directions ${String(selected[0] + 1).padStart(2, '0')} and ${String(selected[1] + 1).padStart(2, '0')}.` : 'Image could not load; its original link remains available.';
        enter(figure);
      });
      return select;
    });
    function syncOptions() {
      selects.forEach((select, column) => [...select.options].forEach(option => { option.disabled = Number(option.value) === selected[1 - column]; }));
    }
    syncOptions();directionPair.before(controls, status);
  }

  // Non-equivalent captures: contained side-by-side views with an optional toggle.
  const comparison = document.querySelector('.p2-comparison');
  if (comparison) {
    const controls = comparison.querySelector('.p2-compare-controls');
    const images = [...comparison.querySelectorAll('figure')];
    const buttons = ['Side by side', 'Original', 'Redesigned'].map((label, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
      button.setAttribute('aria-pressed', String(index === 0));
      button.addEventListener('click', () => select(index));
      button.addEventListener('keydown', event => { const next = arrowIndex(event, index, 3); if (next === undefined) return; event.preventDefault();buttons[next].focus();select(next); });
      controls.append(button); return button;
    });
    function select(index) {
      images.forEach((image, i) => { image.hidden = index !== 0 && i !== index - 1; });
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      comparison.classList.toggle('p2-single', index !== 0);
      enter(comparison.querySelector('.p2-compare-images'));
    }
    controls.setAttribute('role', 'group');controls.hidden = false;
  }

  const tabs = [...document.querySelectorAll('.v-flow-tabs [role="tab"]')];
  const panels = [...document.querySelectorAll('.v-flow-panel')];
  function activateTab(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
    enter(panels[index]);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      activateTab(next, true);
    });
  });
  if (tabs.length) activateTab(0);

  // Existing screenshots/captions remain the source for synchronized selection.
  panels.forEach((panel, panelIndex) => {
    const steps = [...panel.querySelectorAll('.v-flow-step')];
    const controls = panel.querySelector('.r-step-controls');
    if (!controls || !steps.length) return;
    controls.setAttribute('role', 'group');
    const status = document.createElement('p');
    status.className = 'p2-step-description'; status.setAttribute('role', 'status');
    controls.after(status);
    let request = 0;
    let current = 0;
    const buttons = steps.map((step, index) => {
      step.id = `screen-${panelIndex}-${index}`;
      const button = document.createElement('button');button.type = 'button';
      button.setAttribute('aria-controls', step.id);
      button.textContent = `${String(index + 1).padStart(2, '0')}  ${step.querySelector('figcaption b').textContent}`;
      controls.append(button);return button;
    });
    function commit(index, animate) {
      steps.forEach((step, i) => { step.hidden = i !== index; });
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      const caption = steps[index].querySelector('figcaption');
      status.textContent = `${index + 1} of ${steps.length} — ${caption.querySelector('b').textContent}. ${caption.querySelector('span').textContent}`;
      current = index;
      if (animate) enter(steps[index]);
      schedule();
    }
    async function select(index) {
      const id = ++request;
      if (current === index) { controls.removeAttribute('aria-busy');commit(index, false); return; }
      controls.setAttribute('aria-busy', 'true');status.textContent = 'Loading screen…';
      const ok = await prepareImage(steps[index].querySelector('a[data-enlarge]').href);
      if (id !== request) return;
      controls.removeAttribute('aria-busy');
      commit(index, true);
      if (!ok) status.textContent += ' Image unavailable; the original-image link remains available.';
    }
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => select(index));
      button.addEventListener('keydown', event => {
        const next = arrowIndex(event, index, steps.length);
        if (next === undefined) return;
        event.preventDefault();buttons[next].focus();select(next);
      });
    });
    commit(0, false);
  });

  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !preference.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .05 });
    // Only section headings transition; evidence and body content always remain visible.
    document.querySelectorAll('.wm-section-head').forEach(element => {
      element.classList.add('wm-reveal');
      observer.observe(element);
    });
    preference.addEventListener('change', () => {
      if (!preference.matches) return;
      observer.disconnect();
      document.querySelectorAll('.wm-reveal').forEach(element => element.classList.add('is-visible'));
    });
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
  let opener, group = [], groupName = '', index = 0, requested = 0, request = 0, closing = false;
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
    dialog.querySelector('[data-gallery-name]').textContent = groupName;
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
    const source = link.dataset.viewerSource === 'directions' ? [...directionGrid.querySelectorAll('a[data-enlarge]')].find(item => item.href === link.href) : link;
    const root = source.closest('[data-gallery]');
    group = root ? [...root.querySelectorAll('a[data-enlarge]')] : [source];
    groupName = root?.dataset.gallery || 'Design detail';
    index = requested = Math.max(0, group.indexOf(source));
    // No old image or caption should flash when opening a different group.
    detail.hidden = true;detail.removeAttribute('src');caption.textContent = '';position.textContent = '';
    const info = imageInfo(source); title.textContent = info.title;original.href = info.src;
    dialog.querySelector('[data-gallery-name]').textContent = groupName;
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
