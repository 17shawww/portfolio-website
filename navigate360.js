(() => {
  const steps = document.querySelector('.nv-steps');
  const buttons = [...steps.querySelectorAll('[data-nv-step]')];
  const panels = buttons.map(button => document.getElementById('nv-step-' + button.dataset.nvStep));

  function selectStep(active) {
    buttons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === active));
      panels[index].hidden = index !== active;
    });
  }

  buttons.forEach((button, index) => {
    button.setAttribute('aria-controls', panels[index].id);
    button.addEventListener('click', () => selectStep(index));
  });
  selectStep(0);
  steps.hidden = false;

  const dialog = document.querySelector('.nv-dialog');
  if (!dialog.showModal) return;
  const image = dialog.querySelector('img');
  const original = dialog.querySelector('[data-nv-full]');
  let opener;

  document.querySelectorAll('[data-nv-image]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      image.removeAttribute('aria-hidden');
      original.href = link.href;
      dialog.showModal();
    });
  });
  dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
})();
