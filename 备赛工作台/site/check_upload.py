"""Check the Git index study bundle without printing possible secret values.

Run after git add. Reads tracked files only; never makes network requests.
The report excludes its own path from statistics to keep reruns stable.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote, parse_qsl
import hashlib
import json
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[2]
REPORT = '备赛工作台/site/upload_audit.json'
tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode('utf-8').split('\0')
tracked = sorted(x for x in tracked if x and x != REPORT)
tracked_set = set(tracked)
findings = []
patterns = {
    'meeting_access_code': re.compile(r'(?:密码|提取码|访问口令)\s*[：:]\s*[A-Za-z0-9]{4,}'),
    'github_token': re.compile(r'\bgh[pousr]_[A-Za-z0-9]{30,}\b'),
    'github_fine_grained_token': re.compile(r'\bgithub_pat_[A-Za-z0-9_]{50,}\b'),
    'private_key': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    'jwt': re.compile(r'\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b'),
    'assigned_secret': re.compile(r'''(?i)["']?(?:access_token|refresh_token|id_token|authorization|api_key|password)["']?\s*[:=]\s*["'](?:Bearer\s+)?[A-Za-z0-9_./+=-]{20,}["']'''),
}
TEXT = {'.md','.txt','.json','.html','.js','.cjs','.mjs','.ts','.tsx','.py','.css','.toml','.yaml','.yml','.csv','.xml','.svg','.srt','.vtt'}
size_entries=[]
text_scanned=docx_scanned=0
for rel in tracked:
    p=ROOT/rel
    size=p.stat().st_size
    size_entries.append({'path':rel,'bytes':size})
    if size>=100*1024*1024: findings.append({'path':rel,'type':'large_file'})
    if p.suffix.lower() in {'.mp4','.zip','.pem','.key','.pfx'} or p.name.startswith('.env'):
        findings.append({'path':rel,'type':'excluded_file_tracked'})
    text=None
    if p.suffix.lower() in TEXT:
        text=p.read_text(encoding='utf-8-sig',errors='replace');text_scanned+=1
    elif p.suffix.lower()=='.docx':
        with zipfile.ZipFile(p) as z:
            text='\n'.join(z.read(n).decode('utf-8',errors='replace') for n in z.namelist() if n.endswith(('.xml','.rels')))
        docx_scanned+=1
    if text is None: continue
    for label,pattern in patterns.items():
        if pattern.search(text):findings.append({'path':rel,'type':label})
    for raw in re.findall(r'''https?://[^\s<>"']+''',text):
        parsed=urlsplit(raw.replace('&amp;','&'))
        pairs=parse_qsl(parsed.query,keep_blank_values=True)+parse_qsl(parsed.fragment,keep_blank_values=True)
        if any(re.fullmatch(r'(?i)(?:access_?token|refresh_?token|id_?token|token|authorization|jwt|session_?id)',k) and len(v)>12 and 'REDACTED' not in v.upper() for k,v in pairs):
            findings.append({'path':rel,'type':'authenticated_url'});break

class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        for key in ('href','src'):
            if attrs.get(key):self.links.append(attrs[key])

content=json.loads((ROOT/'备赛工作台/site/content.json').read_text(encoding='utf-8'))
links=Links()
links.feed((ROOT/'ICAN备赛学习站.html').read_text(encoding='utf-8'))
for item in content['tasks']+content['articles']:links.feed(item['html'])
links.links.extend(s['path'] for s in content['sources'])
links.links.extend(x['path'] for x in content.get('offlineEvidence',{}).get('archive',[]))
links.links.extend(x['path'] for x in content.get('offlineEvidence',{}).get('items',[]))
local_targets=set()
for link in links.links:
    parsed=urlsplit(link)
    if parsed.scheme or parsed.netloc or link.startswith('#'):continue
    target=(ROOT/unquote(parsed.path)).resolve()
    rel=target.relative_to(ROOT).as_posix()
    if rel not in tracked_set:findings.append({'path':rel,'type':'site_target_not_in_git'})
    local_targets.add(rel)

report={
    'date':'2026-10-24','visibility':'private','repository':'https://github.com/Iuosixsix/ican-embodied-ai-2026',
    'scope':'Git index candidate bundle; report itself excluded from counts',
    'tracked_files':len(tracked),'bytes':sum(x['bytes'] for x in size_entries),
    'text_files_scanned':text_scanned,'docx_archives_scanned':docx_scanned,
    'binary_privacy_ocr':'not performed; screenshots and PDF not exhaustively OCR reviewed',
    'local_site_targets_in_git':len(local_targets),'findings':findings,
    'largest_files':sorted(size_entries,key=lambda x:x['bytes'],reverse=True)[:8],
    'html_sha256':hashlib.sha256((ROOT/'ICAN备赛学习站.html').read_bytes()).hexdigest(),
}
(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(bool(findings))
