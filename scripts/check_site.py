from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
ROOT=Path(__file__).resolve().parents[1]/'dist'
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__();self.ids=[];self.refs=[];self.h1=0;self.image_alt_errors=[];self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='h1':self.h1+=1
        if tag=='img' and not a.get('alt') and not ('alt' in a and a.get('aria-hidden')=='true'):self.image_alt_errors.append(a.get('src'))
        for key in ['href','src']:
            if a.get(key):self.refs.append(a[key])
pages={p.relative_to(ROOT).as_posix():Page(p.read_text()) for p in ROOT.rglob('*.html')}
demo_entry = 'assets/wmmp/demo/index.html'
if demo_entry in pages and '<meta name="robots" content="noindex, nofollow"' not in (ROOT/demo_entry).read_text():
    raise ValueError('The r6 demo must stay out of search indexing')
site_pages = {name: page for name, page in pages.items() if name != demo_entry}
errors=[];checked=0
for name,page in pages.items():
    if name != demo_entry and page.h1!=1:errors.append(f'{name}: expected one h1')
    if len(page.ids)!=len(set(page.ids)):errors.append(f'{name}: duplicate IDs')
    if page.image_alt_errors:errors.append(f'{name}: missing image alternatives')
    for ref in page.refs:
        url=urlsplit(ref)
        if url.scheme or url.netloc:continue
        target=unquote(url.path)
        if target.startswith('/'):
            target=target.lstrip('/')
        elif target:
            target=(Path(name).parent/target).as_posix()
        else:target=name
        if not target or target.endswith('/') :target+='index.html'
        if not (ROOT/target).is_file():errors.append(f'{name}: missing {ref}')
        if url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            errors.append(f'{name}: missing fragment {ref}')
        checked+=1
expected={'robots.txt','sitemap.xml','index.html','about.html','work.html','wuhan-marine-machinery.html','styles.css','site.js',
          'wmmp-case.css','wmmp-case.js','assets/portfolio/yp-monogram.png','signature-motion.css','signature-motion.js','project-transitions.css','project-transitions.js','immersive-case.css','immersive-case.js'}
case_images={'workbench.png','messages.png','statistics.png','management.png','all-business.png',
             'safety-form.png','exploration-01.png','exploration-04.png','foundations.png','components.png',
             'original-workbench.jpg','original-safety.jpg','original-messages.jpg',
             'message-list.png','message-detail.png','validation-error.png','discard-confirm.png','process-record.png','hazard-form.png','notification-settings.png','statistics-detail.png','exploration-02.png','exploration-03.png','exploration-05.png','exploration-06.png','component-status-badge.png','component-button.png','component-text-field.png','component-toggle.png','prototype-workbench-2026-08-11.png'}
expected.update('assets/wmmp/'+name for name in case_images)
expected.update('assets/wmmp/r6-'+screen+'.png' for screen in (
    'workbench', 'messages', 'statistics', 'management',
    'message-inbox', 'message-task', 'safety-registration', 'safety-rectification', 'production-form',
    'required-state', 'discard-state', 'notification-settings', 'statistics-trend', 'statistics-breakdown',
))
expected.update('assets/wmmp/'+name for name in (
    'editorial.css', 'r6-workbench-task-overview.png', 'figma-library-overview.png',
))
expected.update('assets/wmmp/demo/'+name for name in (
    'index.html', 'assets/index-ipdpVm6X.js', 'assets/index-DQ4IFDZL.css',
    'assets/login-industrial-C9ytOitd.png', 'assets/workbench-harbor-Bp7slw5B.png',
))
expected.update('assets/about/'+name for name in (
    'about.css', 'portrait.webp', 'portrait-small.webp', 'model.webp', 'footwear-sketch.webp', 'sensory-garden-sketch.webp',
    'climb.webp', 'detail.webp', 'guitar.webp', 'sim.webp', 'snow.webp', 'cat.webp', 'steam-cs2.webp', 'steam-apex.webp', 'steam-wukong.webp', 'steam-elden-ring.webp',
))
expected.update({'zh/'+name for name in ['index.html','work.html','about.html','wuhan-marine-machinery.html']})
expected.update({'localization.css','i18n.js','i18n-data.js','coming-soon.js'})
expected.update({'ink-character.css','ink-character.js'})
expected.update('assets/portfolio/ink/'+pose+'.webp' for pose in ('idle','look','walk','jump','sit','climb','surprise','sleep','climb-cycle','walk-cycle'))
actual={p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file()}
if actual!=expected:errors.append(f'Deployment allowlist mismatch: extra={sorted(actual-expected)}, missing={sorted(expected-actual)}')
for name in ['index.html','work.html','about.html']:
    if 'wuhan-marine-machinery.html' not in (ROOT/name).read_text():
        errors.append(f'{name}: missing existing Wuhan case-study entry')
if 'Coming soon.' in (ROOT/'index.html').read_text():
    errors.append('Home: stale Selected Work placeholder')
# Production metadata and sitemap must resolve to the approved public origin.
import xml.etree.ElementTree as ET
origin='https://yixiao-peng-portfolio.vercel.app/'
for name in site_pages:
    html=(ROOT/name).read_text()
    canonical=origin+('' if name=='index.html' else name)
    if f'<link rel="canonical" href="{canonical}">' not in html:
        errors.append(f'{name}: missing or incorrect canonical')
    for prop in ['og:title','og:description','og:url','og:image','og:image:alt']:
        if f'property="{prop}"' not in html:errors.append(f'{name}: missing {prop}')
try:
    locations={node.text for node in ET.parse(ROOT/'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
    if locations!={origin+('' if name=='index.html' else name) for name in site_pages}:
        errors.append('Sitemap must contain exactly the eight localized canonical pages')
except (ET.ParseError,OSError) as exc:errors.append(f'Sitemap invalid: {exc}')
if f'Sitemap: {origin}sitemap.xml' not in (ROOT/'robots.txt').read_text():
    errors.append('robots.txt: missing production sitemap')
result={'pages':len(site_pages),'demo_pages':len(pages)-len(site_pages),'local_references_checked':checked,'errors':errors}
print(json.dumps(result,ensure_ascii=False,indent=2))
if errors:raise SystemExit(1)
