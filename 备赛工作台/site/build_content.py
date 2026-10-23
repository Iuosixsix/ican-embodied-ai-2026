"""Build complete offline study content from local Markdown and captured ASR.

Run with the bundled Python. Uses the already installed Pandoc; installs nothing.
All browser-facing local URLs are relative to the workspace-root study HTML.
"""
from __future__ import annotations

import hashlib
from html import escape, unescape
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import parse_qsl, quote, unquote, urlencode, urlsplit, urlunsplit

SITE = Path(__file__).resolve().parent
WORKBENCH = SITE.parent
WORKSPACE = WORKBENCH.parent
PANDOC = shutil.which('pandoc') or str(Path(os.environ.get('LOCALAPPDATA', '')) / 'Pandoc' / 'pandoc.exe')
if not Path(PANDOC).exists():
    raise RuntimeError('Pandoc is required. No packages are installed by this builder.')

ARTICLE_DEFS = [
    ('00_', 'start', '学习路线'),
    ('11_', 'fast-track', '速通版学习'),
    ('13_', 'exam-forecast', '赛题证据与推断'),
    ('14_', 'mock-exam', '原创模拟考场'),
    ('15_', 'mock-answers', '模拟卷标准答案'),
    ('16_', 'mock-variants', '换题与故障诊断'),
    ('12_', 'live-lab', '全任务实测'),
    ('01_', 'rules', '赛制规则'),
    ('07_', 'primer', '基础概念'),
    ('05_', 'plan', '冲刺计划'),
    ('10_', 'official-guides', '官方任务要求'),
    ('02_', 'practice-guide', '专项任务'),
    ('03_', 'task14-guide', '专项任务'),
    ('04_', 'meeting-notes', '培训资料'),
    ('06_', 'self-test', '闭卷自测'),
    ('08_', 'practice-log', '实操证据'),
    ('09_', 'handoff', '后续接续'),
]
INPUTS: dict[str, Path] = {}
ARTICLE_BY_PATH: dict[Path, str] = {}
for prefix, article_id, category in ARTICLE_DEFS:
    candidates = sorted(WORKBENCH.glob(prefix + '*.md'))
    if not candidates:
        if prefix in ('09_', '10_', '11_', '12_'):
            continue
        raise FileNotFoundError(f'Missing source document {prefix}*.md')
    if len(candidates) != 1:
        raise ValueError(f'Ambiguous document prefix {prefix}: {candidates}')
    INPUTS[article_id] = candidates[0]
    ARTICLE_BY_PATH[candidates[0].resolve()] = article_id

AUTH_KEYS = re.compile(r'(?:^|[_-])(?:access[_-]?token|id[_-]?token|refresh[_-]?token|token|authorization|auth|jwt|sessionid|session[_-]?id)(?:$|[_-])', re.I)
LOCAL_LINKS: set[Path] = set()
EXPECTED_OUTPUT = (WORKSPACE / 'ICAN备赛学习站.html').resolve()
INPUT_SNAPSHOTS: dict[Path, bytes] = {}


def relpath(path: Path) -> str:
    return path.resolve().relative_to(WORKSPACE.resolve()).as_posix()


def pandoc(text: str, source_format: str, target_format: str) -> str:
    result = subprocess.run(
        [PANDOC, '--from=' + source_format, '--to=' + target_format, '--wrap=none'],
        input=text, capture_output=True, text=True, encoding='utf-8', check=True,
    )
    return result.stdout


def normalize_url(url: str, source: Path) -> tuple[str, list[list[str]]]:
    """Return URL plus safe/link-navigation attributes for Pandoc Link/Image."""
    url = unquote(url.strip())
    if url.startswith('#'):
        return url, []
    windows_path = bool(re.match(r'^[A-Za-z]:[\\/]', url))
    parts = urlsplit(url if not windows_path else '')
    if not windows_path and parts.scheme.lower() in ('http', 'https'):
        # No signed/token-bearing application URL should enter the offline bundle.
        if any(AUTH_KEYS.search(k) for k, _ in parse_qsl(parts.query, keep_blank_values=True)) or re.search(r'(?:token|authorization|jwt)=', parts.fragment, re.I):
            raise ValueError(f'Authenticated URL in source {source.name}; remove it from the source first.')
        return url, [['target', '_blank'], ['rel', 'noopener noreferrer']]
    if not windows_path and parts.scheme in ('mailto', 'tel'):
        return url, []
    if not windows_path and parts.scheme and parts.scheme != 'file':
        raise ValueError(f'Unsupported URL scheme in {source.name}: {parts.scheme}')
    fragment = ''
    if windows_path:
        path_part, marker, fragment = url.partition('#')
        local = Path(path_part)
    elif parts.scheme == 'file':
        local = Path(parts.path.lstrip('/') if re.match(r'^/[A-Za-z]:/', parts.path) else parts.path)
        fragment = parts.fragment
    else:
        local = Path(parts.path.replace('\\', '/'))
        local = local if local.is_absolute() else source.parent / local
        fragment = parts.fragment
    local = local.resolve()
    relative = relpath(local)  # Raises if a source unexpectedly escapes the workspace.
    if not local.exists() and local != EXPECTED_OUTPUT:
        raise FileNotFoundError(f'Broken local link in {source.name}: {url} -> {local}')
    LOCAL_LINKS.add(local)
    attrs: list[list[str]] = []
    article_id = ARTICLE_BY_PATH.get(local)
    if article_id:
        attrs.append(['data-article', article_id])
    if local.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp', '.gif'):
        attrs.append(['data-image', 'true'])
    result = quote(relative, safe='/-_.()')
    if fragment:
        result += '#' + quote(fragment, safe='-_.')
    return result, attrs


def rewrite_ast(node, source: Path):
    if isinstance(node, dict):
        if node.get('t') in ('Link', 'Image'):
            content = node['c']
            url, extra = normalize_url(content[2][0], source)
            content[2][0] = url
            attrs = dict(content[0][2])
            attrs.update(extra)
            content[0][2] = list(map(list, attrs.items()))
        for value in node.values():
            rewrite_ast(value, source)
    elif isinstance(node, list):
        for value in node:
            rewrite_ast(value, source)


def markdown_html(markdown: str, source: Path) -> str:
    # gfm preserves tables, lists, fenced code, links and task checkboxes.
    # Disable raw HTML so documents cannot inject scripts into the study UI.
    ast = json.loads(pandoc(markdown, 'gfm+tex_math_dollars-raw_html', 'json'))
    rewrite_ast(ast, source)
    return pandoc(json.dumps(ast, ensure_ascii=False), 'json', 'html5')


def remove_duplicate_leading_h1(html: str, page_title: str) -> str:
    """The UI owns the page title; retain every other body heading/content."""
    match = re.match(r'\A\s*<h1\b[^>]*>(.*?)</h1>\s*', html, re.S | re.I)
    if match:
        visible = unescape(re.sub(r'<[^>]+>', '', match.group(1)))
        if ' '.join(visible.split()) == ' '.join(page_title.split()):
            return html[match.end():]
    return html


def read(path: Path) -> str:
    path=path.resolve()
    if path not in INPUT_SNAPSHOTS:
        INPUT_SNAPSHOTS[path]=path.read_bytes()
    return INPUT_SNAPSHOTS[path].decode('utf-8-sig')


def title(markdown: str, fallback: str) -> str:
    found = re.search(r'^#\s+(.+)$', markdown, re.M)
    return found.group(1).strip() if found else fallback


def get_h2_sections(markdown: str) -> list[tuple[str, str]]:
    matches = list(re.finditer(r'^##\s+([^\n]+)\n', markdown, re.M))
    return [(m.group(1), markdown[m.start():matches[i+1].start() if i+1 < len(matches) else len(markdown)]) for i,m in enumerate(matches)]


def task14_gallery() -> str:
    folder=WORKBENCH/'sources/task14/任务14-节点截图整理'
    pictures=[p for p in folder.glob('image*.*') if p.suffix.lower() in ('.png','.jpg','.jpeg','.webp')]
    pictures.sort(key=lambda p:int(re.search(r'\d+',p.stem).group()))
    if not pictures:
        return ''
    if len(pictures)!=129:
        raise ValueError(f'Expected 129 task14 source images, found {len(pictures)}')
    links=[]
    for picture in pictures:
        LOCAL_LINKS.add(picture.resolve())
        links.append('<li><a data-image="true" href="'+quote(relpath(picture),safe='/-_.()')+'">'+escape(picture.name)+'</a></li>')
    return ('<details class="source-image-index"><summary>完整节点截图索引：129张第三方原始图片</summary>'
            '<p>编号与攻略中的 image 编号一致，部分原始图说存在错位，请以图片内的函数和参数标题为准。'
            '这些截图及历史分数不代表本队实操通过。</p><ol>'+''.join(links)+'</ol></details>')


TASK14_GALLERY=task14_gallery()


official_catalog = WORKBENCH / 'sources/platform/任务13_页面文本.txt'
catalog_text = read(official_catalog)
catalog_section = catalog_text.split('项目一 练习', 1)[1].split('项目二 比赛', 1)[0]
chinese_number = { '一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9, '十':10, '十一':11, '十二':12, '十三':13, '十四':14 }
catalog = {}
for number, name in re.findall(r'任务([一二三四五六七八九十]+)\s+([^\r\n]+)', catalog_section):
    catalog[chinese_number[number]] = name.strip()
assert set(catalog) == set(range(1,15)), catalog

task_sections = {}
for heading, section in get_h2_sections(read(INPUTS['practice-guide'])):
    found = re.match(r'任务(\d+)\s', heading)
    if found:
        task_sections[int(found.group(1))] = section
assert set(task_sections) == set(range(1,13))
official_sections={}
if 'official-guides' in INPUTS:
    for heading,section in get_h2_sections(read(INPUTS['official-guides'])):
        found=re.match(r'任务(\d+)(?:\s|[：:])',heading)
        if found:
            official_sections[int(found.group(1))]=section
platform_source_section=next((section for heading,section in get_h2_sections(read(INPUTS['practice-log'])) if '源码精读' in heading),None)


def section_task_number(heading: str) -> int | None:
    """Only explicit per-task headings may populate a task's live record."""
    found=re.match(r'^任务\s*([0-9]+|[一二三四五六七八九十]+)(?=\s|[：:、.．）)\-—]|$)',heading)
    if not found:
        return None
    value=found.group(1)
    task_id=int(value) if value.isdigit() else chinese_number.get(value)
    return task_id if task_id in range(1,15) else None


def explicit_live_status(section: str) -> str | None:
    """Do not infer success from narrative, reports, examples, or checklist marks."""
    for line in section.splitlines():
        plain=line.replace('**','').strip()
        found=re.match(r'^(?:[-*]\s+)?(?:实测状态|当前状态)\s*[：:]\s*(.+?)\s*$',plain)
        if found:
            return found.group(1).strip()
    return None


live_lab_sections={}
live_lab_statuses={}
if 'live-lab' in INPUTS:
    for heading,section in get_h2_sections(read(INPUTS['live-lab'])):
        task_id=section_task_number(heading)
        if task_id is None:
            continue
        if task_id in live_lab_sections:
            raise ValueError(f'Duplicate live-lab section for task {task_id}; keep one authoritative task section.')
        live_lab_sections[task_id]=section
        status=explicit_live_status(section)
        if status:
            live_lab_statuses[task_id]=status

summaries = {
    1:'按官方每类至少2个模型及查看要求构建走、跑、跳策略，再验证完整推理项目；理解观察、动作、奖励和源码。',
    2:'在复杂地形检验运动策略，区分地形、目标、观察量、奖励与终止条件，避免套用平地参数。',
    3:'让机器人稳定跟随预设舞蹈轨迹，核对前馈、平滑、姿态误差及训练配置。',
    4:'构建表情分类数据和模型，连接明亮/昏暗图像预处理、标准化与分类推理。',
    5:'完成危险品、陌生人和电子屏三条检测应用链，逐项检查检测、裁剪和下游识别。',
    6:'通过视频分类与人体关节规则识别行为，理解两种流程和分类头数量的差异。',
    7:'按大小客户场景选择建图策略和路线，检查覆盖、重影、回环与玻璃区域。',
    8:'配置航点及朝向、代价地图、全局与局部规划、恢复行为和定位，逐点验证导航。',
    9:'建立三维点云，再按高度与离群点规则转换栅格地图，验证通路和导航。',
    10:'完成手眼标定并将视觉输出转换为机械臂可执行目标，不能用不完整矩阵代替本次标定。',
    11:'通过实例分割、深度点云和GraspNet估计六维抓取位姿，再完成坐标变换与抓放。',
    12:'配置规划组、预设姿态、求解器、碰撞环境和规划器，使双臂抓取路径可执行。',
    13:'平台未发布，概念补课：理解节点、话题、服务、回调、状态与TF；这里不是任务13官方题目或答案。',
    14:'把master、nav、vision、arm接成完整任务链，掌握服务字段、状态推进、TF与R1/G1迁移检查。',
}

tasks = []
for task_id in range(1,15):
    module = '运动控制' if task_id <= 3 else '定位导航' if 7 <= task_id <= 9 else 'ROS集成' if task_id >= 13 else '视觉感知'
    if task_id <= 12:
        source = INPUTS['practice-guide']
        body = ('> 来源边界：本任务正文整理第三方材料并注明官方/培训补证。数值是练习参考，不能自动视为官方唯一答案；阅读完成不代表平台运行通过。\n\n' + task_sections[task_id])
        status = '六模型已训练查看；三基线推理正常；评分未提交' if task_id == 1 else '参考已整理；整题实操待验证'
    elif task_id == 13:
        source = INPUTS['primer']
        body = '# 任务13：平台未发布，概念补课\n\n> **当前状态：2026-10-22课程页显示“虚仿实训（未发布）”。以下完整内容是基础概念课，不是任务13官方步骤、题目或评分答案。**\n\n' + read(source)
        status = '平台未发布，概念补课'
    else:
        source = INPUTS['task14-guide']
        body = read(source)
        status = '第三方截图已核对；本队运行待验证'
    if task_id==1:
        body+='\n\n## 本账号基线与实操证据\n\n本题的真实运行状态、模型与报告边界见[本队实操记录](<'+INPUTS['practice-log'].name+'>)。本页阅读状态不替代训练、推理或评分。\n\n'
        if platform_source_section:
            body+=platform_source_section
    official_guide=WORKBENCH/'sources/platform'/f'任务{task_id}_当前平台指导书.pdf'
    if task_id in official_sections:
        # 00-10 documents share WORKBENCH as their link base. Keep full official
        # requirements before the full reference section instead of summarizing.
        body=official_sections[task_id]+'\n\n---\n\n# 参考配置与理解\n\n'+body
    if official_guide.exists():
        guide_relative=os.path.relpath(official_guide,source.parent).replace('\\','/')
        body=(f'> **官方题面入口：** [本次登录平台取得的任务{task_id}指导书](<{guide_relative}>)。先看任务目标与评分，再使用下面的练习参考；第三方答案的性质不因指导书核验而改变。\n\n'+body)
    if task_id in live_lab_sections:
        live_source=INPUTS['live-lab']
        body+=('\n\n---\n\n# 本账号实测与排错记录\n\n'
               '> 下列内容完整引用当前实测手册中的本题章节；仅记录已有证据，不把配置、推理、成绩提交或用户掌握混为一项。\n\n'
               +live_lab_sections[task_id]
               +'\n\n完整记录与跨任务排错见[全任务实测与排错手册](<'+live_source.name+'>)。\n')
    if task_id in live_lab_statuses:
        status=live_lab_statuses[task_id]
    tasks.append({'id':task_id, 'title':catalog[task_id], 'module':module,
                  'priority':'按依赖补课' if 10 <= task_id <= 12 else '概念补课' if task_id == 13 else '优先掌握',
                  'status':status,'summary':summaries[task_id],
                  'liveLab':task_id in live_lab_sections,
                  'statusSource':relpath(INPUTS['live-lab']) if task_id in live_lab_statuses else None,
                  'html':markdown_html(body,source)+(TASK14_GALLERY if task_id==14 else ''),'source':relpath(source)})

articles = []
for prefix, article_id, category in ARTICLE_DEFS:
    if article_id not in INPUTS:
        continue
    source = INPUTS[article_id]
    markdown = read(source)
    page_title = title(markdown,source.stem)
    article_html = remove_duplicate_leading_h1(markdown_html(markdown,source),page_title)
    articles.append({'id':article_id,'title':page_title,
                     'category':category,'html':article_html+(TASK14_GALLERY if article_id=='task14-guide' else ''),'source':relpath(source)})

source_code = platform_source_section
if source_code:
    articles.append({'id':'source-code','title':'任务1：本账号平台显示源码精读','category':'实现细节',
                     'html':markdown_html(source_code,INPUTS['practice-log']),'source':relpath(INPUTS['practice-log'])})

quiz_doc = read(INPUTS['self-test'])
question_doc = quiz_doc.split('## 30道具体诊断题',1)[1].split('## 参考答案与诊断理由',1)[0]
answer_doc = quiz_doc.split('## 参考答案与诊断理由',1)[1].split('## 十条关键检查',1)[0]
questions = {int(n):text.strip() for n,text in re.findall(r'^(\d+)\.\s+(.+)$',question_doc,re.M)}
answer_matches = list(re.finditer(r'^\*\*(\d+)\.\*\*\s+',answer_doc,re.M))
answers = {}
for i,match in enumerate(answer_matches):
    body=answer_doc[match.end():answer_matches[i+1].start() if i+1 < len(answer_matches) else len(answer_doc)]
    body=re.split(r'^### ',body,flags=re.M)[0].strip()
    answers[int(match.group(1))]=body
assert set(questions)==set(answers)==set(range(1,31))
quizzes=[]
for n in range(1,31):
    module='规则与协作' if n<=5 else '运动控制' if n<=10 else '定位导航' if n<=15 else '视觉感知' if n<=20 else 'ROS集成'
    context='【任务14参考实现；状态码、字段和Hand不是官方固定常量】' if n>=21 else ''
    quizzes.append({'id':n,'question':context+questions[n].replace('`',''),'answer':answers[n].replace('`',''),'module':module})

meeting_specs=[
    ('第一轮','2026-05-26','01:21:20','https://meeting.tencent.com/crm/2yO1ODRg05',103),
    ('第二轮','2026-06-23','01:09:45','https://meeting.tencent.com/crm/KnmQkqenc5',74),
    ('第三轮','2026-07-30','01:08:36','https://meeting.tencent.com/crm/l77rDB6Qb0',74),
    ('第四轮','2026-08-26','01:11:37','https://meeting.tencent.com/crm/2YY6bxge60',86),
]
meetings=[]
for n,(name,date,duration,url,expected) in enumerate(meeting_specs,1):
    path=WORKBENCH/'sources/meetings'/f'{name}_逐字稿.json'
    rows=json.loads(read(path))
    assert len(rows)==expected
    segments=[]
    for i,(pid,body) in enumerate(rows):
        assert pid==f'pid-{i}-content'
        speaker,time,text=body.split('\n',2)
        segments.append({'id':pid,'time':time,'speaker':speaker,'text':text})
    meetings.append({'id':n,'title':name+'赛前培训','date':date,'duration':duration,'url':url,'segments':segments})
assert sum(len(m['segments']) for m in meetings)==337

sources=[]
def add_source(path:Path,kind:str,label:str|None=None):
    if path.exists() and not any(x['path']==relpath(path) for x in sources):
        sources.append({'title':label or path.name,'path':relpath(path),'kind':kind})

for article in articles:
    add_source(WORKSPACE/article['source'],'备赛文章')
for path in sorted((WORKSPACE/'赛事文件').glob('*.pdf')):
    add_source(path,'官方PDF')
for path in sorted((WORKSPACE/'练习题参考(第三方)').iterdir()):
    # Large videos/archives stay local; the shared study bundle uses extracted
    # text, screenshots and source documents, without linking missing binaries.
    if path.is_file() and path.suffix.lower() in ('.pdf','.docx'):
        add_source(path,'第三方原件')
add_source(official_catalog,'当前平台目录')
for name, *_ in meeting_specs:
    add_source(WORKBENCH/'sources/meetings'/f'{name}_逐字稿.md','会议原始ASR')
add_source(WORKBENCH/'sources/meetings/transcript_manifest.json','完整性证据')
add_source(WORKBENCH/'sources/official/manifest.json','官方原件哈希')
for path in sorted((WORKBENCH/'sources/platform').glob('任务1_walk_baseline_*')):
    add_source(path,'本账号平台证据')
for pattern in ('任务1_*_平台显示源码.txt', '任务1_首次仿真报告.*', '任务1_评分提交会锁定实验.png'):
    for path in sorted((WORKBENCH/'sources/platform').glob(pattern)):
        add_source(path,'本账号平台证据')
for path in sorted((WORKBENCH/'sources/platform').glob('任务*_当前平台指导书.pdf')):
    add_source(path,'当前平台官方指导书')
add_source(WORKSPACE/'HANDOFF.md','对话续接')
add_source(WORKSPACE/'AGENTS.md','工作区指引')
add_source(WORKSPACE/'README.md','仓库学习入口')
add_source(WORKSPACE/'CHAT_CONTEXT.md','跨对话学习上下文')
add_source(WORKSPACE/'UPLOAD_POLICY.md','资料范围与未上传项')

content={
    'meta':{'title':'iCAN 金视线杯 · 具身智能备赛学习站','updated':'2026-10-23',
            'competitionDate':'2026-10-24',
            'scope':'赛前离线自学与复习。完整保留官方规则、第三方参考、培训ASR及本队实操边界；阅读/自测标记不代表平台成绩或任务通过。'},
    'tasks':tasks,'articles':articles,'quizzes':quizzes,'meetings':meetings,'sources':sources,
}
serialized=json.dumps(content,ensure_ascii=False,indent=2)
if re.search(r'(?:access_token|refresh_token|id_token|token|authorization|jwt)\s*(?:=|%3D)\s*[A-Za-z0-9._-]{12,}',serialized,re.I):
    raise ValueError('Possible authentication token in exported content')
for path,original in INPUT_SNAPSHOTS.items():
    if path.read_bytes()!=original:
        raise RuntimeError(f'Source changed while building; rerun after edits finish: {path.name}')
output=SITE/'content.json'
temporary=SITE/'content.json.tmp'
temporary.write_text(serialized,encoding='utf-8')
temporary.replace(output)
manifest={'output':relpath(output),'tasks':len(tasks),'articles':len(articles),'quizzes':len(quizzes),
          'meetings':len(meetings),'segments':sum(len(m['segments']) for m in meetings),
          'official_requirements_tasks':sorted(official_sections),
          'live_lab_tasks':sorted(live_lab_sections),'explicit_live_status_tasks':sorted(live_lab_statuses),
          'local_links_checked':len(LOCAL_LINKS),'content_sha256':hashlib.sha256(output.read_bytes()).hexdigest(),
          'input_markdown':[{'path':relpath(p),'sha256':hashlib.sha256(INPUT_SNAPSHOTS[p.resolve()]).hexdigest()} for p in INPUTS.values()]}
(SITE/'content_manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(manifest,ensure_ascii=False,indent=2))
