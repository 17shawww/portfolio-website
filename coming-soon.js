/* Finite pointer work only; the semantic disclosure also works without hover. */
(() => {
  document.querySelectorAll('[data-coming-soon]').forEach(card => {
    const trigger=card.querySelector('.coming-trigger');
    const message=card.querySelector('.coming-message');
    const reset=card.querySelector('[data-coming-reset]');
    const fine=matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let frame=0;
    function clear(){cancelAnimationFrame(frame);frame=0;card.classList.remove('is-peeking');card.style.removeProperty('--peek-x');card.style.removeProperty('--peek-y');}
    function close(focus=true){message.hidden=true;trigger.hidden=false;trigger.setAttribute('aria-expanded','false');card.classList.remove('is-revealed');clear();if(focus)trigger.focus({preventScroll:true});}
    trigger.addEventListener('click',()=>{clear();message.hidden=false;trigger.hidden=true;trigger.setAttribute('aria-expanded','true');card.classList.add('is-revealed');reset.focus({preventScroll:true});});
    reset.addEventListener('click',()=>close());
    card.addEventListener('keydown',event=>{if(event.key==='Escape'&&!message.hidden){event.preventDefault();close();}});
    card.addEventListener('pointermove',event=>{
      if(!fine.matches||!message.hidden||event.pointerType==='touch')return;
      cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const r=card.getBoundingClientRect();card.style.setProperty('--peek-x',`${event.clientX-r.left}px`);card.style.setProperty('--peek-y',`${event.clientY-r.top}px`);card.classList.add('is-peeking');frame=0;});
    });
    card.addEventListener('pointerleave',clear);fine.addEventListener('change',clear);
    addEventListener('pagehide',clear);
  });
})();
