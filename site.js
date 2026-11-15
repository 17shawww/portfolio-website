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
