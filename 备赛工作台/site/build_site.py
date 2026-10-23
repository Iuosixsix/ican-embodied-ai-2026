"""Build the offline learning site. No network or third-party dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import json
import hashlib
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUTPUT = ROOT / 'ICAN备赛学习站.html'

class ContentAudit(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.images=[]
        self.links=[]
        self.errors=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag.lower() in {'script','iframe','object','embed','base'}:
            self.errors.append('Unsafe embedded tag: '+tag)
        for key,value in attrs.items():
            if key.lower().startswith('on'):
                self.errors.append('Event handler in content: '+key)
            if key in {'href','src'} and re.match(r'\s*(javascript|vbscript|data):',value or '',re.I):
                self.errors.append('Unsafe URL scheme')
        if tag=='img' and attrs.get('src'):
            self.images.append(attrs['src'])
        if tag=='a' and attrs.get('href'):
            self.links.append(attrs['href'])
            if attrs.get('data-image'):
                self.images.append(attrs['href'])

def main():
    content=json.loads((HERE/'content.json').read_text(encoding='utf-8-sig'))
    for key in ['meta','tasks','articles','quizzes','meetings','sources']:
        if key not in content: raise ValueError('Missing content field '+key)
    audit=ContentAudit()
    for record in [*content['tasks'],*content['articles']]:
        audit.feed(record.get('html',''))
    for item in [*content['offlineEvidence']['items'],*content['offlineEvidence']['archive']]:
        audit.images.append(item['path'])
    if audit.errors: raise ValueError('\n'.join(audit.errors))
    missing=[]
    image_targets=set()
    for src in sorted(set(audit.images)):
        parsed=urlparse(src)
        if parsed.scheme or parsed.netloc: raise ValueError('Offline images must be local: '+src)
        target=(ROOT/unquote(parsed.path)).resolve()
        image_targets.add(target)
        if not target.is_relative_to(ROOT): raise ValueError('Image outside workspace: '+src)
        if not target.is_file(): missing.append(src)
    if missing: raise FileNotFoundError('Missing evidence images: '+repr(missing))
    css='\n'.join((HERE/n).read_text(encoding='utf-8') for n in ['style.css','task14-lab.css','mock-lab.css','offline-lab.css'])
    app='\n'.join((HERE/n).read_text(encoding='utf-8') for n in ['task14-lab.js','mock-lab.js','offline-lab.js','app.js'])
    template=(HERE/'template.html').read_text(encoding='utf-8')
    if re.search(r'\bfetch\s*\(|XMLHttpRequest|https?://[^\s\"\']+\.(?:js|css)',app):
        raise ValueError('Unexpected network dependency in app')
    payload=json.dumps(content,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026')
    html=template.replace('/*__STYLE__*/',css).replace('/*__DATA__*/',payload).replace('/*__APP__*/',app)
    if '/*__' in html: raise ValueError('Unresolved build marker')
    OUTPUT.write_text(html,encoding='utf-8')
    manifest={'output':str(OUTPUT),'bytes':OUTPUT.stat().st_size,'sha256':hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),'tasks':len(content['tasks']),'articles':len(content['articles']),'quizzes':len(content['quizzes']),'meetings':len(content['meetings']),'segments':sum(len(m.get('segments',[])) for m in content['meetings']),'unique_local_images':len(image_targets),'image_links':len(audit.images),'network_dependencies':0}
    (HERE/'build_manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(manifest,ensure_ascii=False,indent=2))

if __name__=='__main__':
    main()
