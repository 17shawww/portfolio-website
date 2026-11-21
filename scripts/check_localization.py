"""Fail on an unreviewed source string; report static and runtime coverage separately."""
from html.parser import HTMLParser
from pathlib import Path
import hashlib,json,re
from localize_site import ROOT, PAGES, CATALOG, TRANSLATIONS, normalize
class Inventory(HTMLParser):
    def __init__(self):super().__init__();self.strings=set();self.skip=0
    def add(self,value):
        value=normalize(value)
        if re.search('[A-Za-z]',value):self.strings.add(value)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag in ('script','style'):self.skip+=1
        for name in ('aria-label','alt','title','data-label','data-gallery','data-in','data-out','data-in','data-out','data-in','data-out'):
            if a.get(name):self.add(a[name])
        if tag=='meta' and (a.get('name')=='description' or a.get('property') in ('og:title','og:description','og:image:alt')):self.add(a.get('content',''))
    def handle_endtag(self,tag):
        if tag in ('script','style'):self.skip-=1
    def handle_data(self,data):
        if not self.skip:self.add(data)
report={'pages':{},'catalog_entries':len(CATALOG),'errors':[]}
for key,value in CATALOG.items():
    if key!=hashlib.sha256(value['en'].encode()).hexdigest()[:12] or not value['zh'].strip():report['errors'].append('Invalid catalog entry: '+key)
for name in ['Yixiao Peng','YIXIAO PENG','LinkedIn','MindAware','Chakra Solutions','Figma · Notion','ChatGPT · Codex','WMMP']:
    if TRANSLATIONS.get(name)!=name:report['errors'].append('Changed preserved brand/tool name: '+name)
for page in PAGES:
    p=Inventory();p.feed((ROOT/page).read_text())
    missing=sorted(p.strings-TRANSLATIONS.keys())
    preserved=sorted(s for s in p.strings if TRANSLATIONS.get(s)==s)
    report['pages'][page]={'unique_source_strings':len(p.strings),'translated_strings':sum(TRANSLATIONS.get(s)!=s and s in TRANSLATIONS for s in p.strings),'preserved_names_tokens':preserved,'missing':missing}
    report['errors']+=missing
# SEO consistency is independent of whether client-side JavaScript runs.
from localize_site import route,ORIGIN
for lang in ('en','zh'):
    for page in PAGES:
        file=ROOT/'dist'/('zh' if lang=='zh' else '')/page
        html=file.read_text()
        for code,l in [('en','en'),('zh-Hans','zh'),('x-default','en')]:
            expected=f'<link rel="alternate" hreflang="{code}" href="{ORIGIN+route(page,l)}">'
            if expected not in html:report['errors'].append(f'{file}: incorrect reciprocal {code}')
        if f'<html lang="{ "zh-Hans" if lang=="zh" else "en"}"' not in html:report['errors'].append(f'{file}: missing language metadata')
print(json.dumps(report,ensure_ascii=False,indent=2))
if report['errors']:raise SystemExit(1)
