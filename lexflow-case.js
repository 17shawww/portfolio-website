(() => {
  const viewer = document.getElementById('viewer');
  const large = document.getElementById('large');
  const stage = viewer.querySelector('.viewer-stage');
  const zoom = document.getElementById('zoom');
  let opener;

  function setZoom(active) {
    stage.classList.toggle('zoomed',active);
    zoom.setAttribute('aria-pressed',String(active));
    zoom.textContent = active ? zoom.dataset.out : zoom.dataset.in;
    stage.scrollTo(0,0);
  }

  document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click',event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !viewer.showModal) return;
      event.preventDefault();
      opener = link;
      const image = link.querySelector('img');
      large.src = link.href;
      large.alt = image.alt;
      document.getElementById('viewer-title').textContent = image.alt;
      document.getElementById('original').href = link.href;
      viewer.showModal();
      setZoom(false);
    });
  });
  zoom.addEventListener('click',() => setZoom(!stage.classList.contains('zoomed')));
  document.getElementById('close').addEventListener('click',() => viewer.close());
  viewer.addEventListener('close',() => opener?.focus({preventScroll:true}));

  function activatePanels(root, buttonSelector, panelSelector, {initial = 0, select, reset = false} = {}) {
    const buttons = [...root.querySelectorAll(buttonSelector)];
    const panels = [...root.querySelectorAll(panelSelector)];
    const controls = buttons[0].parentElement;
    let active;
    function apply(index) {
      active = index;
      panels.forEach((panel,i) => { panel.hidden = i !== active; });
      buttons.forEach((button,i) => button.setAttribute('aria-pressed',String(i === active)));
      if (select) select(active);
    }
    controls.hidden = false;
    buttons.forEach((button,index) => button.addEventListener('click',() => apply(reset && active === index ? -1 : index)));
    apply(initial);
  }

  activatePanels(document.querySelector('[data-sequence]'),'[data-step]','[data-panel]');

  const map = document.querySelector('[data-map]');
  map.querySelector('.map-switch').hidden = false;
  activatePanels(map,'[data-map-step]','[data-map-panel]', {
    initial: -1, reset: true,
    select(index) { map.querySelectorAll('[data-phase]').forEach((phase,i) => phase.toggleAttribute('data-active',i === index)); }
  });

  const inspector = document.querySelector('[data-inspector]');
  activatePanels(inspector,'[data-focus-step]','[data-focus-panel]', {
    select(index) { inspector.closest('.ui-spread').dataset.focus = index; }
  });

  function syncLinks() {
    document.querySelectorAll('[data-languages] a').forEach(a => {
      a.hash = location.hash;
      if (a.lang === document.documentElement.lang) a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('.chapters a').forEach(a => {
      if (a.hash && a.hash === location.hash) a.setAttribute('aria-current','location');
      else a.removeAttribute('aria-current');
    });
  }
  document.querySelectorAll('[data-languages] a').forEach(a => {
    a.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      try { localStorage.setItem('portfolio-language',a.lang === 'zh-Hans' ? 'zh' : 'en'); } catch {}
    });
  });
  addEventListener('hashchange',syncLinks);
  syncLinks();
})();
