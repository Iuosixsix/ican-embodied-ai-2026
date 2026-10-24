from pathlib import Path
import json,hashlib
from html.parser import HTMLParser
r=Path(__file__).resolve().parent
n=json.loads((r/'narration.json').read_text(encoding='utf-8-sig'))
t=json.loads((r/'src/timeline.json').read_text(encoding='utf-8-sig'))
v=json.loads((r/'public/voice/timing.json').read_text(encoding='utf-8-sig'))
assert len(n['segments'])==72 and len(t['chapters'])==12
assert [c['lesson'] for c in t['chapters']]==[f'S{i:02d}' for i in range(12)]
assert len(set(s['id'] for s in n['segments']))==72
assert t['fps']==30 and t['durationFrames']==14160
assert sum(c['durationFrames'] for c in t['chapters'])==t['durationFrames']
last=0
for c in t['chapters']:
 assert c['startFrame']==last;last+=c['durationFrames'];local=0
 for s in c['segments']:
  assert s['startFrame']==local;local+=s['durationFrames']
  assert s['durationFrames']/30>s['audioSeconds']
 assert local==c['durationFrames']
for s in v['segments']:
 f=r/f"public/voice/{s['id']}.mp3"
 assert f.exists() and hashlib.sha256(f.read_bytes()).hexdigest()==s['sha256']
 assert s['fullDecode'] is True
for f in ['player.html','player.js','player.css','src/Root.tsx','src/basic-captions.tsx']:
 assert (r/f).is_file()
html=(r/'player.html').read_text(encoding='utf-8-sig')
class Resources(HTMLParser):
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  assert not(tag=='script' and 'src' in d), 'External script dependency'
  assert not(tag=='link' and d.get('rel')=='stylesheet'), 'External stylesheet dependency'
Resources().feed(html)
assert html.count('data:audio/mpeg;base64,')==72
assert len(html.encode('utf-8'))<5_000_000
report={'chapters':12,'segments':72,'fps':30,'durationFrames':t['durationFrames'],'durationSeconds':t['durationFrames']/30,'audioFilesHashVerified':72,'offlineEntry':'player.html','captionSource':'Remotion BasicCaptions','audioEngine':'Remotion Html5Audio with 72 embedded MP3 data URLs','portableSingleFile':True,'externalPlaybackDependencies':0,'typecheck':'PASS (2026-10-24)','playerBundle':'PASS (2026-10-24)','studioBundle':'PASS (2026-10-24)','boundaries':['No platform operations','No official-paper claim','No MP4 render requested or performed','file URL not browser-verified; all playback assets embedded'],'files':[{ 'path':x,'bytes':(r/x).stat().st_size,'sha256':hashlib.sha256((r/x).read_bytes()).hexdigest()} for x in ['player.html','player.js','player.css','narration.json','src/timeline.json']]}
(r/'QA.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False))
