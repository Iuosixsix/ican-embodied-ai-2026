"""Static offline-artifact checks; browser behavior is verified separately."""
from html.parser import HTMLParser
from html import unescape
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess
from urllib.parse import unquote, urlsplit

class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.external=[]
        self.ids=[]
        self.scripts=0
        self.links=[]
        self.article_links=[]
        self.script_records=[]
        self.active_script=None
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs: self.ids.append(attrs['id'])
        if tag=='script':
            self.scripts+=1
            self.active_script={'id':attrs.get('id'),'text':''}
            self.script_records.append(self.active_script)
        if tag=='script' and attrs.get('src'): self.external.append(attrs['src'])
        if tag=='link' and attrs.get('rel')=='stylesheet': self.external.append(attrs.get('href'))
        for key in ('href','src'):
            if attrs.get(key): self.links.append(attrs[key])
        if attrs.get('data-article'): self.article_links.append(attrs['data-article'])
    def handle_data(self,text):
        if self.active_script is not None: self.active_script['text']+=text
    def handle_endtag(self,tag):
        if tag=='script': self.active_script=None

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--node',help='Optional Node executable for app and embedded JavaScript syntax checks')
parser.add_argument('--output',help='Optional path for the static audit JSON')
args=parser.parse_args()
root=Path(__file__).resolve().parent.parent.parent
site=Path(__file__).resolve().parent
text=(root/'ICAN备赛学习站.html').read_text(encoding='utf8')
audit=Audit()
audit.feed(text)
result={'inline_script_tags':audit.scripts,'external_scripts_or_styles':audit.external,'duplicate_static_ids':[x for x in set(audit.ids) if audit.ids.count(x)>1],'content_embedded':'site-data' in audit.ids,'build_markers_remaining':'/*__' in text}
assert result['inline_script_tags']==2, result
assert not result['external_scripts_or_styles'], result
assert not result['duplicate_static_ids'], result
assert result['content_embedded'], result
assert not result['build_markers_remaining'], result

content=json.loads((site/'content.json').read_text(encoding='utf-8-sig'))
embedded=json.loads(next(x['text'] for x in audit.script_records if x['id']=='site-data'))
assert embedded==content, 'HTML data differs from content.json'
app=(site/'app.js').read_text(encoding='utf-8')
embedded_app=next(x['text'] for x in audit.script_records if x['id']!='site-data')
combined_app='\n'.join((site/n).read_text(encoding='utf-8') for n in ['task14-lab.js','mock-lab.js','offline-lab.js','sprint-blocks.js','sprint-visuals.js','sprint-board.js','app.js'])
assert embedded_app==combined_app, 'HTML app differs from app.js'
articles={a['id']:a for a in content['articles']}
tasks={t['id']:t for t in content['tasks']}
assert len(articles)==22 and len(tasks)==14
assert set(tasks)==set(range(1,15))
assert {'fast-track','live-lab','source-code','exam-forecast','mock-exam','mock-answers','mock-variants'}<=articles.keys()
assert '11_' in articles['fast-track']['source'] and '12_' in articles['live-lab']['source']
duplicate_leading_titles=[]
for item in articles.values():
    first=re.match(r'\A\s*<h1\b[^>]*>(.*?)</h1>',item['html'],re.S|re.I)
    if first:
        visible=unescape(re.sub(r'<[^>]+>','',first.group(1)))
        if ' '.join(visible.split())==' '.join(item['title'].split()): duplicate_leading_titles.append(item['id'])
assert not duplicate_leading_titles, 'Duplicate article page/body h1'
for article_id in ('fast-track','live-lab','exam-forecast','mock-exam','mock-answers','mock-variants'):
    source=(root/articles[article_id]['source']).read_text(encoding='utf-8-sig')
    source_h2=len(re.findall(r'(?m)^##\s+',source))
    assert len(re.findall(r'<h2\b',articles[article_id]['html']))==source_h2, 'Section heading lost'
assert "articleLink('fast-track'" in app and "articleLink('live-lab'" in app
assert "articleLink('exam-forecast'" in app
assert "['mock-exam','A卷完整题目']" in app and "'#lab/task14'" in app
assert "esc(t.status" in app, 'Task status must be displayed'
assert len(content['quizzes'])==30 and len(content['meetings'])==4
assert sum(len(m['segments']) for m in content['meetings'])==337

live_path=root/articles['live-lab']['source']
live=live_path.read_text(encoding='utf-8-sig')
sections=re.split(r'(?m)(?=^## 任务\d+ )',live)[1:]
status_by_task={}
for section in sections:
    task_id=int(re.match(r'## 任务(\d+)',section).group(1))
    found=re.search(r'(?m)^实测状态：(.+)$',section)
    assert found, f'Missing explicit status for task {task_id}'
    assert task_id not in status_by_task, f'Duplicate task {task_id}'
    status_by_task[task_id]=found.group(1).replace('**','').strip()
assert set(status_by_task)==set(tasks)
for task_id,task in tasks.items():
    assert task['status']==status_by_task[task_id], f'Stale status for task {task_id}'
    assert task.get('liveLab') is True
    assert task.get('statusSource')==articles['live-lab']['source']
    assert '本账号实测与排错记录' in task['html']

body_audit=Audit()
for item in [*content['tasks'],*content['articles']]: body_audit.feed(item['html'])
assert all(key in articles for key in body_audit.article_links), 'Broken article-navigation target'
links=set(audit.links+body_audit.links+[s['path'] for s in content['sources']]+[x['path'] for x in content['offlineEvidence']['items']+content['offlineEvidence']['archive']])
local_targets=set()
for link in links:
    parts=urlsplit(link)
    if parts.scheme in ('http','https','mailto','tel') or link.startswith('#'): continue
    assert not parts.scheme and not parts.netloc, 'Unexpected local link scheme'
    target=(root/unquote(parts.path)).resolve()
    assert target.is_relative_to(root), 'Local link escapes workspace'
    assert target.is_file(), f'Missing local file: {target.relative_to(root)}'
    local_targets.add(target)

content_manifest=json.loads((site/'content_manifest.json').read_text(encoding='utf-8-sig'))
build_manifest=json.loads((site/'build_manifest.json').read_text(encoding='utf-8-sig'))
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert digest(site/'offline_evidence.json')==content_manifest['evidence_index_sha256']
assert {'offline-practice','super-sprint','sprint-chat'}<=articles.keys()
assert digest(site/'sprint_curriculum.json')==content_manifest['sprint_curriculum_sha256']
assert len(content['sprint']['modules'])==12
assert [m['id'] for m in content['sprint']['modules']]==[f'S{i:02}' for i in range(12)]
assert len(content['sprint']['glossary'])>=24
for m in content['sprint']['modules']:
    assert len(m['quiz'])==2 and len(m['flow'])==len(m['blocks'])
    assert m['role'] in ['共同','A','B','C']
    for q in m['quiz']:
        assert len(q['options'])==3 and isinstance(q['answer'],int) and 0<=q['answer']<3
    for link in m['sources']:
        parts=link['href'].lstrip('#').split('/')
        assert (parts[0]=='article' and parts[1] in articles) or (parts[0]=='task' and int(parts[1]) in tasks)
assert "case 'sprint':sprintController=window.IcanSprint.mount" in app
assert "case 'lab':window.IcanOffline.mount" in app
assert digest(site/'content.json')==content_manifest['content_sha256']
assert digest(root/'ICAN备赛学习站.html')==build_manifest['sha256']
for item in content_manifest['input_markdown']:
    assert digest(root/item['path'])==item['sha256'], f'Source changed after build: {item["path"]}'

syntax_checked=False
if args.node:
    subprocess.run([args.node,'--check',str(site/'app.js')],check=True,capture_output=True,text=True)
    subprocess.run([args.node,'--check'],input=embedded_app,check=True,capture_output=True,text=True,encoding='utf-8')
    for test in ('check_mock_lab.cjs','check_task14_lab.cjs','check_sprint_blocks.cjs','check_sprint_board.cjs','check_sprint_visuals.cjs'):
        subprocess.run([args.node,str(site/test)],check=True,capture_output=True,text=True,encoding='utf-8')
    syntax_checked=True
result.update({'meta_updated':content['meta']['updated'],'tasks':len(tasks),'articles':len(articles),
    'quizzes':len(content['quizzes']),'meeting_segments':337,
    'sprint_modules':len(content['sprint']['modules']),'sprint_questions':sum(len(m['quiz']) for m in content['sprint']['modules']),
    'offline_screenshots':len(content['offlineEvidence']['archive']),'curated_screenshots':len(content['offlineEvidence']['items']),
    'fast_track_entry':True,'live_lab_entry':True,'exam_forecast_entry':True,'task_statuses_match_source':True,
    'duplicate_leading_article_titles':duplicate_leading_titles,
    'fast_track_sections':len(re.findall(r'<h2\b',articles['fast-track']['html'])),
    'live_lab_sections':len(re.findall(r'<h2\b',articles['live-lab']['html'])),
    'task14_status':tasks[14]['status'],'task6_status':tasks[6]['status'],
    'local_targets_checked':len(local_targets),'broken_local_targets':0,
    'input_hashes_match':True,'embedded_data_matches':True,'embedded_app_matches':True,
    'javascript_syntax_checked':syntax_checked,'interactive_logic_tests_passed':syntax_checked,'html_sha256':build_manifest['sha256'],
    'validation_kind':'offline static only; no current browser UI test'})
if args.output:
    Path(args.output).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
