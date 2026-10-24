"""Bundle the approved learning site, evidence and original attachments as one HTML.

PNG screenshots are losslessly encoded to WebP only when smaller; decoded RGBA
pixels are checked against the original. Original workspace files are untouched.
Requires Pillow for this optional size optimization; no network is used.
"""
from __future__ import annotations

import base64
from concurrent.futures import ThreadPoolExecutor
import hashlib
from html.parser import HTMLParser
import io
import json
import mimetypes
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlsplit

SITE = Path(__file__).resolve().parent
ROOT = SITE.parent.parent
OUTPUT = ROOT / 'ICAN备赛学习站_手机单文件.html'
CACHE = ROOT / '.firecrawl' / 'portable-cache'
SCRIPTS = ['task14-lab.js', 'mock-lab.js', 'offline-lab.js', 'sprint-blocks.js',
           'sprint-visuals.js', 'sprint-board.js', 'app.js']
STYLES = ['style.css', 'task14-lab.css', 'mock-lab.css', 'offline-lab.css',
          'sprint-blocks.css', 'sprint-visuals.css', 'sprint-board.css']


class Links(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.values = []

    def handle_starttag(self, tag, attrs):
        self.values.extend(v for k, v in attrs if k in ('src', 'href', 'poster') and v)


def local_file(value):
    if not isinstance(value, str) or len(value) > 2048 or '\n' in value:
        return None
    parts = urlsplit(value)
    if parts.scheme or parts.netloc or not parts.path:
        return None
    p = (ROOT / unquote(parts.path)).resolve()
    if p.is_relative_to(ROOT) and p.is_file() and p.name not in (
            OUTPUT.name, 'ICAN备赛学习站.html'):
        return p
    return None


def json_strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from json_strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from json_strings(item)


def encode_asset(path):
    original = path.read_bytes()
    source_sha = hashlib.sha256(original).hexdigest()
    encoded = original
    mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    pixel_equal = None
    if path.suffix.lower() == '.png':
        from PIL import Image
        cached = CACHE / (source_sha + '.webp')
        with Image.open(io.BytesIO(original)) as source:
            rgba = source.convert('RGBA')
            if cached.exists():
                candidate = cached.read_bytes()
            else:
                out = io.BytesIO()
                rgba.save(out, 'WEBP', lossless=True, exact=True, method=3)
                candidate = out.getvalue()
                cached.write_bytes(candidate)
            with Image.open(io.BytesIO(candidate)) as decoded:
                pixel_equal = decoded.size == rgba.size and decoded.convert('RGBA').tobytes() == rgba.tobytes()
            if not pixel_equal:
                raise ValueError('Lossless pixel check failed: ' + str(path))
            if len(candidate) < len(original):
                encoded, mime = candidate, 'image/webp'
    if path.suffix.lower() in ('.md', '.txt'):
        mime = 'text/plain;charset=utf-8'
    elif path.suffix.lower() == '.json':
        mime = 'application/json;charset=utf-8'
    key = hashlib.sha256(encoded).hexdigest()
    rel = path.relative_to(ROOT).as_posix()
    entry = {'mime': mime, 'data': base64.b64encode(encoded).decode('ascii'),
             'path': rel, 'name': path.name}
    if rel == '备赛工作台/video/player.html':
        entry['kind'] = 'movie'
    report = {'path': rel, 'source_bytes': len(original), 'packed_bytes': len(encoded),
              'source_sha256': source_sha, 'packed_sha256': key, 'mime': mime,
              'lossless_pixels_verified': pixel_equal}
    return rel, key, entry, report


def adapt(name, source):
    if name == 'app.js':
        old = "const safePath = value => /^(?:javascript|data|vbscript):/i.test(String(value || '').trim()) ? '#' : String(value || '#');"
        assert old in source
        source = source.replace(old, 'const safePath = value => window.IcanPortable.resolve(value);')
        assert '${a.html}' in source and "${t.html||'<p>本任务内容暂未整理。</p>'}" in source
        source = source.replace('${a.html}', '${window.IcanPortable.html(a.html)}')
        source = source.replace("${t.html||'<p>本任务内容暂未整理。</p>'}",
                                "${window.IcanPortable.html(t.html||'<p>本任务内容暂未整理。</p>')}")
        source = source.replace('来源文件保留在本地；课程整理与官方原文请分别核对。',
                                '原始资料已内嵌本文件，可点开预览或保存；课程整理与官方原文请分别核对。')
        source = source.replace('下面的原始文件链接会交给浏览器或本机程序打开；',
                                '下面的原始文件已内嵌，点开可预览或另存；')
    elif name == 'offline-lab.js':
        old = "const url = p => encodeURI(p).replace(/#/g,'%23').replace(/\\?/g,'%3F');"
        assert old in source
        source = source.replace(old, 'const url = p => window.IcanPortable.resolve(p);')
    elif name == 'sprint-visuals.js':
        assert source.count('esc(lesson.image)') == 3
        source = source.replace('esc(lesson.image)', 'esc(window.IcanPortable.resolve(lesson.image))')
    return source


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    content = json.loads((SITE / 'content.json').read_text(encoding='utf-8'))
    scan = Links()
    for item in content['tasks'] + content['articles']:
        scan.feed(item['html'])
    texts = {name: (SITE / name).read_text(encoding='utf-8') for name in SCRIPTS}
    for value in texts.values():
        scan.values += re.findall(r'(?:href|src)=[\"\']([^\"\'<>$]+)[\"\']', value)
        scan.values += re.findall(r"['\"](备赛工作台/[^'\"\n]+\.(?:png|jpe?g|svg|html))['\"]", value)
    paths = {p for value in [*scan.values, *json_strings(content)] if (p := local_file(value))}
    paths.add(ROOT / '备赛工作台/video/player.html')
    paths.add(ROOT / 'CHAT_SUPER_START.md')
    tracked = set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode('utf-8').split('\0'))
    unexpected = [p.relative_to(ROOT).as_posix() for p in paths if p.relative_to(ROOT).as_posix() not in tracked]
    if unexpected:
        raise ValueError('Unreviewed/untracked attachment: ' + repr(unexpected))
    print(f'Bundling {len(paths)} files with exact-pixel image checks...', flush=True)
    assets, aliases, reports = {}, {}, []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for index, (rel, key, entry, report) in enumerate(pool.map(encode_asset, sorted(paths))):
            aliases[rel] = key
            assets.setdefault(key, entry)
            reports.append(report)
            if index and index % 100 == 0:
                print(f'Packed {index}/{len(paths)}', flush=True)
    data = json.dumps(content, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    bundle = json.dumps({'assets': assets, 'aliases': aliases}, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    runtime = (SITE / 'portable-runtime.js').read_text(encoding='utf-8')
    app = runtime + '\n' + '\n'.join(adapt(name, texts[name]) for name in SCRIPTS)
    css = '\n'.join((SITE / name).read_text(encoding='utf-8') for name in STYLES + ['portable.css'])
    template = (SITE / 'template.html').read_text(encoding='utf-8')
    template = template.replace('<title>ICAN 备赛学习站</title>', '<title>ICAN 备赛学习站 · 手机单文件</title>')
    template = template.replace('</head>', '<link rel="icon" href="data:,">\n</head>')
    template = template.replace('本地离线 · 无需联网', '手机单文件 · 图片/动画/资料已内嵌')
    template = template.replace('<script id="site-data"', '<script id="portable-assets" type="application/json">' + bundle + '</script>\n<script id="site-data"')
    html = template.replace('/*__STYLE__*/', css).replace('/*__DATA__*/', data).replace('/*__APP__*/', app)
    assert '/*__' not in html
    OUTPUT.write_text(html, encoding='utf-8', newline='\n')
    report = {'output': OUTPUT.name, 'bytes': OUTPUT.stat().st_size,
              'sha256': hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
              'files': len(paths), 'deduplicated_assets': len(assets),
              'original_attachment_bytes': sum(r['source_bytes'] for r in reports),
              'packed_asset_bytes': sum(len(base64.b64decode(a['data'])) for a in assets.values()),
              'image_files': sum(r['mime'].startswith('image/') for r in reports),
              'lossless_png_checks': sum(r['lossless_pixels_verified'] is True for r in reports),
              'articles': len(content['articles']), 'tasks': len(content['tasks']),
              'includes_movie': True, 'includes_original_documents': True,
              'dependencies': 'No external local files or remote runtime assets; external reference links are optional.',
              'assets': reports}
    (SITE / 'portable_manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'assets'}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
