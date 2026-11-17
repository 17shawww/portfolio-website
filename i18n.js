/* Shared reviewed localization. Keep nodes and controllers alive when changing language. */
(() => {
  'use strict';
  const entries = window.portfolioTranslations;
  if (!entries) return;
  const normalize = s => s.replace(/\s+/g, ' ').trim();
  const forward = new Map(entries.map(e => [e.en, e.zh]));
  const reverse = new Map(entries.filter(e => e.en !== e.zh).map(e => [e.zh, e.en]));
  const originals = new WeakMap();
  const attributes = new WeakMap();
  const missing = new Set();
  const key = 'portfolio-language';
  let language = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
  let busy = false;
  const page = location.pathname.split('/').filter(Boolean).pop() || 'index.html';
  const filename = page === 'zh' ? 'index.html' : page;
  const route = lang => (lang === 'zh' ? '/zh/' : '/') + (filename === 'index.html' && lang === 'en' ? '' : filename);
  // Controllers compose captions and numeric statuses. Resolve these documented grammars
  // from canonical strings rather than changing or reinitializing their state machines.
  const reversePhrases = [...reverse].sort((a,b) => b[0].length-a[0].length);
  function canonical(value) {
    if (reverse.has(value)) return reverse.get(value);
    if (!/[\u3400-\u9fff]/.test(value) || !/^(?:Explore |\d+|Visual interpretation\. |Selected |Direction |Comparing )| selected\.$/.test(value)) return value;
    let result = value;
    for (const [zh,en] of reversePhrases) result = result.split(zh).join(en);
    return result;
  }
  function translate(value) {
    if (forward.has(value)) return forward.get(value);
    let m;
    if ((m = value.match(/^Enlarge: (.+)$/))) return '放大查看：'+translate(m[1]);
    if ((m = value.match(/^Explore direction (\d+): (.+)$/))) return '探索方向 '+m[1]+'：'+translate(m[2]);
    if ((m = value.match(/^Direction (\d+) selected\. All six thumbnails and the comparison below remain available\.$/))) return '已选择方向 '+m[1]+'。下方仍可查看六个缩略图并进行对比。';
    if ((m = value.match(/^Comparing directions (\d+) and (\d+)\.$/))) return '正在对比方向 '+m[1]+' 与 '+m[2]+'。';
    if ((m = value.match(/^Selected exploration \/ (\d+)$/))) return '当前探索方案 / '+m[1];
    if ((m = value.match(/^Direction (\d+)$/))) return '方向 '+m[1];
        if ((m = value.match(/^(\d+) of (\d+) — (.+?)\. (.*)$/))) return '第 '+m[1]+' 步，共 '+m[2]+' 步 — '+translate(m[3])+'。'+translate(m[4]);
    if ((m = value.match(/^(\d+ \/ \d+ — |\d+ \/ |\d+\s{1,2})(.+)$/))) return m[1]+translate(m[2]);
    if ((m = value.match(/^Explore (.+) ↓$/))) return '探索'+translate(m[1])+' ↓';
    if ((m = value.match(/^(.+) selected\.$/))) return '已选择：'+translate(m[1]);
    if (value.startsWith('Visual interpretation. ')) return '视觉解读。'+translate(value.slice('Visual interpretation. '.length));
    for (const suffix of ['Image unavailable; its original-file link remains available.', 'Image unavailable; the original-image link remains available.']) {
      if(value.endsWith(' '+suffix))return translate(value.slice(0,-suffix.length-1))+' '+translate(suffix);
    }
    // Descriptions concatenate independently reviewed source sentences and term/definition pairs.
    for (const separator of [' Image unavailable;', ' Image could not load;', ': ', ' · ', '. ']) {
      const index=value.indexOf(separator);
      if (index>0) {
        const left=value.slice(0,index)+(separator==='. '?'.':'');
        const right=value.slice(index+separator.length);
        if (forward.has(left)) return translate(left)+(separator===': '?'：':separator==='. '?'':separator)+translate(right);
      }
    }
    if (!/[A-Za-z]/.test(value)) return value;
    if (/[A-Za-z]{3}/.test(value) && !/^(?:https?:|#[A-Fa-f\d]{6})/.test(value)) missing.add(value);
    return value;
  }
  function text(node) {
    if (node.parentElement?.closest('script,style,noscript,[data-signature-glyph],.signature-char')) return;
    const raw=node.nodeValue, normalized=normalize(raw);
    if (!normalized) return;
    let record=originals.get(node);
    if (!record || record.rendered !== raw) record={source:canonical(normalized),prefix:raw.match(/^\s*/)[0],suffix:raw.match(/\s*$/)[0]};
    const output=language==='zh'?translate(record.source):record.source;
    record.rendered=record.prefix+output+record.suffix;
    if (raw!==record.rendered) node.nodeValue=record.rendered;
    originals.set(node,record);
  }
  function element(el) {
    if (!(el instanceof Element)) return;
    let records=attributes.get(el);if(!records){records={};attributes.set(el,records);}
    const keys=['aria-label','alt','title'];
    if(el.matches('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[property="og:image:alt"]')) keys.push('content');
    for(const name of keys){
      if(!el.hasAttribute(name))continue;
      const current=el.getAttribute(name);let record=records[name];
      if(!record||record.rendered!==current) record={source:canonical(normalize(current))};
      record.rendered=language==='zh'?translate(record.source):record.source;
      if(current!==record.rendered)el.setAttribute(name,record.rendered);
      records[name]=record;
    }
    if(el.matches('a[href]')&&!el.hasAttribute('data-language')){
      const url=new URL(el.href,location.href);
      if(url.origin===location.origin&&/^\/(?:zh\/)?(?:index\.html|work\.html|about\.html|wuhan-marine-machinery\.html)?$/.test(url.pathname)&&!el.getAttribute('href').startsWith('#')){
        const file=url.pathname.split('/').pop();el.setAttribute('href',(language==='zh'?'/zh/':'/')+(file==='index.html'&&language==='en'?'':file|| (language==='zh'?'index.html':''))+url.search+url.hash);
      }
    }
  }
  function scan(root) {
    element(root);
    if(root.nodeType===Node.TEXT_NODE){text(root);return;}
    root.querySelectorAll?.('*').forEach(element);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode()))text(n);
  }
  const observer=new MutationObserver(records=>{
    if(busy)return;
    observer.disconnect();
    for(const record of records){
      if(record.type==='characterData')text(record.target);
      else if(record.type==='attributes')element(record.target);
      else record.addedNodes.forEach(n=>{if(n.nodeType===1||n.nodeType===3)scan(n);});
    }
    observe();
  });
  function observe(){observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','alt','title','content']});}
  function apply(next,{remember=false,updateURL=false}={}){
    const anchor=[...document.querySelectorAll('main h1,main h2,main section,main figure')].filter(el=>{const r=el.getBoundingClientRect();return r.height>0&&r.width>0&&r.top<=innerHeight/2;}).pop();
    const offset=anchor?.getBoundingClientRect().top;
    busy=true;observer.disconnect();language=next;
    document.documentElement.lang=next==='zh'?'zh-Hans':'en';
    scan(document.documentElement);
    document.querySelectorAll('[data-language]').forEach(a=>{a.href=route(a.dataset.language)+location.hash;a.toggleAttribute('aria-current',a.dataset.language===next);if(a.dataset.language===next)a.setAttribute('aria-current','true');});
    const canonicalURL='https://yixiao-peng-portfolio.vercel.app'+route(next);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href',canonicalURL);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content',canonicalURL);
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content',next==='zh'?'zh_CN':'en_US');
    if(updateURL)history.replaceState(history.state,'',route(next)+location.search+location.hash);
    if(remember)try{localStorage.setItem(key,next);}catch{}
    if(anchor&&offset!==undefined&&!document.querySelector('dialog[open]')){
      const delta=anchor.getBoundingClientRect().top-offset;
      if(Math.abs(delta)>1)window.scrollBy({top:delta,behavior:'instant'});
    }
    busy=false;observe();document.dispatchEvent(new CustomEvent('portfolio:languagechange',{detail:{language:next}}));
  }
  window.portfolioI18n={get language(){return language;},t:source=>language==='zh'?translate(source):source,get missing(){return [...missing];},apply};
  document.addEventListener('click',event=>{
    const link=event.target.closest('[data-language]');if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();apply(link.dataset.language,{remember:true,updateURL:true});
  });
  let preferred;try{preferred=localStorage.getItem(key);}catch{}
  apply(language==='zh'?'zh':preferred==='zh'?'zh':'en',{updateURL:language==='en'&&preferred==='zh'});
  addEventListener('pageshow',event=>{
    if(!event.persisted)return;
    let saved;try{saved=localStorage.getItem(key);}catch{}
    apply(saved==='zh'?'zh':saved==='en'?'en':location.pathname.startsWith('/zh/')?'zh':'en',{updateURL:true});
  });
  addEventListener('popstate',()=>apply(location.pathname.startsWith('/zh/')?'zh':'en'));
})();
