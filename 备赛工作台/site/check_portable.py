"""Independently validate the phone HTML bundle without opening a browser.

Run after build_portable.py. Use --node PATH for an embedded-app syntax check.
The default JSON report is site/portable_check.json; browser usability is not
claimed by this static audit. Large HTML is streamed and each asset is decoded
only once; neither embedded documents nor image data are printed.
"""
from __future__ import annotations

import argparse
import base64
from collections import Counter
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
from urllib.parse import unquote, urlsplit

SITE = Path(__file__).resolve().parent
ROOT = SITE.parent.parent
DEFAULT_HTML = ROOT / 'ICAN备赛学习站_手机单文件.html'
MOVIE = '备赛工作台/video/player.html'
HASH = re.compile(r'^[0-9a-f]{64}$')


def digest_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


class Document(HTMLParser):
    def __init__(self, collect_scripts=True):
        super().__init__(convert_charrefs=True)
        self.collect_scripts = collect_scripts
        self.scripts = []
        self.active_script = None
        self.active_style = False
        self.styles = []
        self.ids = []
        self.dependencies = []
        self.references = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if tag == 'script':
            record = {'id': attrs.get('id'), 'type': attrs.get('type', ''), 'parts': []}
            self.scripts.append(record)
            self.active_script = record if self.collect_scripts else None
            if attrs.get('src'):
                self.dependencies.append(('script', attrs['src']))
        if tag == 'style':
            self.active_style = True
        if tag == 'link' and 'stylesheet' in attrs.get('rel', '').lower().split():
            self.dependencies.append(('stylesheet', attrs.get('href', '')))
        for key in ('src', 'href', 'poster'):
            if attrs.get(key):
                self.references.append((tag, key, attrs[key]))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag in ('script', 'style'):
            self.handle_endtag(tag)

    def handle_data(self, data):
        if self.active_script is not None:
            self.active_script['parts'].append(data)
        elif self.active_style:
            self.styles.append(data)

    def handle_endtag(self, tag):
        if tag == 'script':
            self.active_script = None
        if tag == 'style':
            self.active_style = False


def relative_path(value):
    """Normalize workspace-root-relative aliases; never follow an outside path."""
    parts = urlsplit(value.strip())
    if parts.scheme or parts.netloc or not parts.path:
        return None
    decoded = unquote(parts.path).replace('\\', '/')
    normalized = []
    require(not decoded.startswith('/'), 'Absolute local reference: ' + value)
    for item in decoded.split('/'):
        if item in ('', '.'):
            continue
        if item == '..':
            require(bool(normalized), 'Reference leaves workspace: ' + value)
            normalized.pop()
        else:
            normalized.append(item)
    return '/'.join(normalized)


def all_strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from all_strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from all_strings(item)


def audit(args, result):
    path = Path(args.html).resolve()
    manifest = json.loads((SITE / 'portable_manifest.json').read_text(encoding='utf-8-sig'))
    initial_stat = path.stat()
    size, sha = initial_stat.st_size, digest_file(path)
    require(manifest['output'] == path.name, 'Manifest output filename differs')
    require(manifest['bytes'] == size, 'Manifest output byte count differs')
    require(manifest['sha256'] == sha, 'Manifest output SHA-256 differs')
    result.update({'output': path.name, 'bytes': size, 'sha256': sha, 'manifest_matches': True})

    document = Document()
    with path.open('r', encoding='utf-8') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), ''):
            document.feed(chunk)
    document.close()
    require(path.stat().st_mtime_ns == initial_stat.st_mtime_ns,
            'Output changed while being read; finish the build and rerun this audit')
    require(not document.dependencies, 'External script or stylesheet dependency: ' + repr(document.dependencies[:5]))
    duplicates = [key for key, count in Counter(document.ids).items() if count > 1]
    require(not duplicates, 'Duplicate document IDs: ' + repr(duplicates))
    scripts = {record['id']: record for record in document.scripts if record['id']}
    require('site-data' in scripts and 'portable-assets' in scripts, 'Missing embedded JSON scripts')
    require(len(document.scripts) == 3, 'Expected two JSON scripts and one executable script')
    content = json.loads(''.join(scripts['site-data']['parts']))
    bundle = json.loads(''.join(scripts['portable-assets']['parts']))
    for identifier in ('site-data', 'portable-assets'):
        require(scripts[identifier]['type'] == 'application/json', 'Embedded data is not inert JSON')
        scripts[identifier]['parts'].clear()
    current_content = json.loads((SITE / 'content.json').read_text(encoding='utf-8-sig'))
    require(content == current_content, 'Embedded curriculum differs from current content.json')
    del current_content
    assets, aliases = bundle['assets'], bundle['aliases']
    require(isinstance(assets, dict) and isinstance(aliases, dict), 'Malformed asset registry')
    reports = manifest['assets']
    by_path = {record['path']: record for record in reports}
    require(len(by_path) == len(reports), 'Duplicate manifest attachment paths')
    require(set(by_path) == set(aliases), 'Manifest and alias path sets differ')
    require(len(aliases) == manifest['files'], 'Manifest file count differs')
    require(len(assets) == manifest['deduplicated_assets'], 'Manifest unique asset count differs')
    require(set(aliases.values()) == set(assets), 'Dangling or unused embedded asset key')

    packed_sizes, document_counts = {}, Counter()
    movie_source = None
    for key, asset in assets.items():
        require(HASH.fullmatch(key) is not None, 'Asset key is not SHA-256')
        raw = base64.b64decode(asset['data'], validate=True)
        require(hashlib.sha256(raw).hexdigest() == key, 'Embedded asset SHA-256 mismatch: ' + asset.get('path', key))
        require(asset.get('mime') and asset.get('name') and asset.get('path'), 'Asset metadata incomplete: ' + key)
        require(aliases.get(asset['path']) == key, 'Canonical asset path missing from aliases: ' + asset['path'])
        packed_sizes[key] = len(raw)
        if asset.get('kind') == 'movie':
            require(asset['path'] == MOVIE, 'Unexpected movie asset')
            movie_source = raw.decode('utf-8')
        del raw

    original_bytes = 0
    for rel, key in aliases.items():
        require(relative_path(rel) == rel, 'Noncanonical alias path: ' + rel)
        source = ROOT / PurePosixPath(rel)
        record, asset = by_path[rel], assets[key]
        require(source.is_file(), 'Source attachment missing: ' + rel)
        require(record['packed_sha256'] == key, 'Manifest packed hash differs: ' + rel)
        require(record['packed_bytes'] == packed_sizes[key], 'Manifest packed size differs: ' + rel)
        require(record['mime'] == asset['mime'], 'Manifest MIME differs: ' + rel)
        require(record['source_bytes'] == source.stat().st_size, 'Original size changed: ' + rel)
        require(record['source_sha256'] == digest_file(source), 'Original source hash changed: ' + rel)
        original_bytes += record['source_bytes']
        suffix = source.suffix.lower()
        if suffix in ('.pdf', '.docx'):
            require(key == record['source_sha256'], 'Original document transformed: ' + rel)
            document_counts[suffix] += 1
        elif record['mime'] == 'image/webp' and suffix == '.png':
            require(record['lossless_pixels_verified'] is True, 'PNG conversion lacks lossless verification: ' + rel)
    require(original_bytes == manifest['original_attachment_bytes'], 'Original attachment total differs')
    require(sum(packed_sizes.values()) == manifest['packed_asset_bytes'], 'Packed unique byte total differs')
    require(document_counts['.pdf'] > 0 and document_counts['.docx'] > 0, 'Original PDF or DOCX attachments absent')
    require(MOVIE in aliases and movie_source is not None, 'Self-contained narrated movie absent')

    require(len(content['articles']) == 23 and len(content['tasks']) == 14, 'Expected 23 articles and 14 tasks')
    require({task['id'] for task in content['tasks']} == set(range(1, 15)), 'Task IDs incomplete')
    require(len(content['meetings']) == 4, 'Expected four meetings')
    segment_count = sum(len(meeting['segments']) for meeting in content['meetings'])
    require(segment_count == 337, 'Expected 337 ASR segments')
    require(any(article['id'] == 'pre-race' for article in content['articles']), 'Pre-race article missing')
    body = Document(collect_scripts=False)
    for item in content['articles'] + content['tasks']:
        body.feed(item['html'])
    require(not body.dependencies and not body.scripts, 'Article body loads or executes a script')
    referenced, self_routes, external = set(), set(), set()

    def check_reference(value, origin, runtime=False):
        parts = urlsplit(value.strip())
        if parts.scheme in ('http', 'https', 'mailto', 'tel') or parts.netloc:
            require(not runtime, 'Remote runtime asset: ' + value)
            external.add(value)
            return
        if parts.scheme in ('data', 'blob'):
            require(runtime, 'Unexpected embedded-data navigation: ' + origin)
            return
        require(not parts.scheme, 'Unsupported reference scheme: ' + origin)
        rel = relative_path(value)
        if not rel:
            return
        if rel in ('ICAN备赛学习站.html', path.name):
            self_routes.add(value)
            return
        require(rel in aliases, 'Unembedded ' + origin + ': ' + rel)
        referenced.add(rel)

    for tag, attribute, value in document.references + body.references:
        check_reference(value, tag + '.' + attribute,
                        runtime=attribute in ('src', 'poster') or tag == 'link')
    for item in content['sources']:
        check_reference(item['path'], 'source.path')
    for item in content['articles'] + content['tasks']:
        for field in ('source', 'statusSource'):
            if item.get(field):
                check_reference(item[field], field)
    for item in content['offlineEvidence']['items'] + content['offlineEvidence']['archive']:
        check_reference(item['path'], 'offlineEvidence.path', runtime=True)
    # Also cover file references carried in JSON metadata, outside rendered bodies.
    for value in all_strings(content):
        if len(value) < 2048 and '\n' not in value and '<' not in value:
            try:
                rel = relative_path(value)
            except ValueError:
                continue
            if rel and (ROOT / PurePosixPath(rel)).is_file():
                check_reference(value, 'content metadata')
    visuals = (SITE / 'sprint-visuals.js').read_text(encoding='utf-8')
    dynamic_images = re.findall(r"\bimage:\s*['\"]([^'\"]+)['\"]", visuals)
    require(len(dynamic_images) == 12, 'Expected all 12 dynamic sprint screenshots')
    for value in dynamic_images:
        check_reference(value, 'dynamic sprint screenshot', runtime=True)
    check_reference('CHAT_SUPER_START.md', 'Chat handoff')

    css = '\n'.join(document.styles)
    require(not re.search(r'@import\b', css), 'CSS imports an external stylesheet')
    for value in re.findall(r'url\(\s*[\"\']?([^\"\')]+)', css):
        check_reference(value.strip(), 'CSS url', runtime=True)
    movie = Document()
    movie.feed(movie_source)
    require(not movie.dependencies, 'Embedded movie depends on external scripts or CSS')
    for tag, attr, value in movie.references:
        if attr in ('src', 'poster'):
            require(value.startswith(('data:', 'blob:', '#')), 'Movie has external media dependency: ' + value)
    require('data:audio/mpeg;base64,' in movie_source, 'Movie audio is not embedded')
    executable = [record for record in document.scripts if record['type'] != 'application/json']
    require(len(executable) == 1, 'Unexpected executable script count')
    app = ''.join(executable[0]['parts'])
    require('window.IcanPortable' in app and 'function siteHash' in app, 'Portable link adapter is absent')
    require('/*__' not in app, 'Unreplaced application build marker')
    if args.node:
        completed = subprocess.run([args.node, '--check'], input=app, encoding='utf-8',
                                   text=True, capture_output=True)
        require(completed.returncode == 0, 'Embedded JavaScript syntax: ' + completed.stderr[:1500])
    require(path.stat().st_mtime_ns == initial_stat.st_mtime_ns and digest_file(path) == sha,
            'Output changed during validation; finish the build and rerun this audit')
    result.update({'status': 'passed', 'articles': 23, 'tasks': 14, 'meeting_segments': segment_count,
                   'aliases': len(aliases), 'deduplicated_assets': len(assets),
                   'asset_base64_and_sha256_verified': True, 'source_and_manifest_hashes_verified': True,
                   'original_pdf_files': document_counts['.pdf'], 'original_docx_files': document_counts['.docx'],
                   'embedded_movie': True, 'movie_audio_embedded': True,
                   'local_references_checked': len(referenced), 'self_routes': len(self_routes),
                   'dynamic_sprint_screenshots': len(dynamic_images), 'external_reference_links': len(external),
                   'external_runtime_dependencies': [], 'javascript_syntax_checked': bool(args.node),
                   'lossless_png_checks_from_builder': manifest.get('lossless_png_checks', 0),
                   'limitations': ['Static only; no browser, smartphone or platform operation performed.',
                                   'PNG decoded-pixel equality is recorded by the builder; this audit verifies packed/source hashes.']})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--html', default=str(DEFAULT_HTML))
    parser.add_argument('--node', help='Optional Node executable for embedded JavaScript syntax validation')
    parser.add_argument('--output', default=str(SITE / 'portable_check.json'))
    args = parser.parse_args()
    result = {'status': 'failed', 'validation_kind': 'independent offline static audit'}
    try:
        audit(args, result)
    except Exception as error:
        result['error'] = str(error)[:2500]
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result['status'] == 'passed' else 1


if __name__ == '__main__':
    sys.exit(main())
