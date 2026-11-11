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
        if tag=='img' and not a.get('alt'):self.image_alt_errors.append(a.get('src'))
        for key in ['href','src']:
            if a.get(key):self.refs.append(a[key])
pages={p.name:Page(p.read_text()) for p in ROOT.glob('*.html')}
errors=[];checked=0
for name,page in pages.items():
    if page.h1!=1:errors.append(f'{name}: expected one h1')
    if len(page.ids)!=len(set(page.ids)):errors.append(f'{name}: duplicate IDs')
    if page.image_alt_errors:errors.append(f'{name}: missing image alternatives')
    for ref in page.refs:
        url=urlsplit(ref)
        if url.scheme or url.netloc:continue
        target=unquote(url.path) or name
        if not (ROOT/target).is_file():errors.append(f'{name}: missing {ref}')
        if url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            errors.append(f'{name}: missing fragment {ref}')
        checked+=1
result={'pages':len(pages),'local_references_checked':checked,'errors':errors}
print(json.dumps(result,ensure_ascii=False,indent=2))
if errors:raise SystemExit(1)
