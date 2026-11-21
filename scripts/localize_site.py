"""Reviewed shared strings -> indexable localized static pages (no dependencies)."""
from html.parser import HTMLParser
from html import escape
from pathlib import Path
import json, re
ROOT=Path(__file__).resolve().parents[1]
ORIGIN='https://yixiao-peng-portfolio.vercel.app'
PAGES=['index.html','work.html','about.html','wuhan-marine-machinery.html','lexflow.html']
CATALOG=json.loads((ROOT/'locales/catalog.json').read_text())
TRANSLATIONS={v['en']:v['zh'] for v in CATALOG.values()}
def normalize(s):return re.sub(r'\s+',' ',s).strip()
def translated(s,lang):
    key=normalize(s)
    if not key or not re.search('[A-Za-z]',key):return s
    if key not in TRANSLATIONS:raise ValueError('Missing reviewed translation: '+key)
    return s if lang=='en' else s[:len(s)-len(s.lstrip())]+TRANSLATIONS[key]+s[len(s.rstrip()):]
def route(page,lang):return ('/zh/' if lang=='zh' else '/')+('' if page=='index.html' and lang=='en' else page)
def companion_markup():
    return ('<div class="ink-companion" aria-hidden="true" hidden>'
            '<img src="/assets/portfolio/ink/idle.webp" width="296" height="760" alt="" aria-hidden="true" '
            'draggable="false" decoding="async"></div>')
class LocalizedPage(HTMLParser):
    def __init__(self,source,page,lang,versions):
        super().__init__(convert_charrefs=True);self.parts=[];self.skip=0;self.navs=[];self.page=page;self.lang=lang;self.versions=versions;self.feed(source)
    def handle_decl(self,d):self.parts.append('<!'+d+'>')
    def handle_comment(self,d):self.parts.append('<!--'+d+'-->')
    def handle_startendtag(self,t,a):self.handle_starttag(t,a)
    def handle_starttag(self,t,attrs):
        a=dict(attrs)
        if t=='nav':self.navs.append(a.get('id')=='primary-navigation')
        if t=='html':a['lang']='zh-Hans' if self.lang=='zh' else 'en'
        if t in ('script','style'):self.skip+=1
        for key in ('alt','title','aria-label','data-in','data-out'):
            if a.get(key):a[key]=translated(a[key],self.lang)
        if t=='meta' and (a.get('name')=='description' or a.get('property') in ('og:title','og:description','og:image:alt')):a['content']=translated(a['content'],self.lang)
        if (t=='link' and a.get('rel')=='canonical') or (t=='meta' and a.get('property')=='og:url'):
            a['href' if t=='link' else 'content']=ORIGIN+route(self.page,self.lang)
        for key in ('href','src'):
            value=a.get(key,'')
            if not value or value.startswith(('#','/','http:','https:','mailto:','data:')):continue
            path,sep,fragment=value.partition('#')
            if path in PAGES:a[key]=route(path,self.lang)+(sep+fragment if sep else '')
            else:a[key]='/'+value
            if value in self.versions:a[key]+='?v='+self.versions[value]
        if t=='head':
            self.parts.append('<head>');return
        if t=='script' and a.get('src','').startswith('/site.js'):
            self.parts.append('<script src="/i18n-data.js?v='+self.versions['i18n-data.js']+'" defer></script><script src="/i18n.js?v='+self.versions['i18n.js']+'" defer></script>')
        self.parts.append('<'+t+''.join(' '+k+('="'+escape(v,quote=True)+'"' if v is not None else '') for k,v in a.items())+'>')
    def handle_endtag(self,t):
        if t in ('script','style'):self.skip-=1
        if t=='body' and self.page in ('index.html', 'about.html', 'wuhan-marine-machinery.html'):
            self.parts.append(companion_markup())
        if t=='head':
            if self.page in ('index.html', 'about.html', 'wuhan-marine-machinery.html'):
                self.parts.append(f'<link rel="stylesheet" href="/ink-character.css?v={self.versions["ink-character.css"]}">')
                self.parts.append(f'<script src="/ink-character.js?v={self.versions["ink-character.js"]}" defer></script>')
            for lang in ('en','zh'):
                self.parts.append('<link rel="alternate" hreflang="'+('zh-Hans' if lang=='zh' else 'en')+'" href="'+ORIGIN+route(self.page,lang)+'">')
            self.parts.append('<link rel="alternate" hreflang="x-default" href="'+ORIGIN+route(self.page,'en')+'"><meta property="og:locale" content="'+('zh_CN' if self.lang=='zh' else 'en_US')+'"><link rel="stylesheet" href="/localization.css?v='+self.versions['localization.css']+'"><script src="/coming-soon.js?v='+self.versions['coming-soon.js']+'" defer></script>')
        if t=='nav' and self.navs.pop():
            self.parts.append('<span class="language-switch" role="group" aria-label="'+('语言' if self.lang=='zh' else 'Language')+'">'+''.join('<a data-language="'+l+'" href="'+route(self.page,l)+'" lang="'+('zh-Hans' if l=='zh' else 'en')+'"'+(' aria-current="true"' if l==self.lang else '')+'>'+label+'</a>' for l,label in [('en','EN'),('zh','中文')])+'</span>')
        self.parts.append('</'+t+'>')
    def handle_data(self,d):self.parts.append(d if self.skip else escape(translated(d,self.lang),quote=False))
def render(source,page,lang,versions):return ''.join(LocalizedPage(source,page,lang,versions).parts)
