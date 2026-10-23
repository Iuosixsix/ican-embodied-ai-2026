"""Render browser-collected ASR rows without modifying their raw text."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
META = {
    '第一轮': {'recorded': '2026-05-26 18:02:41', 'url': 'https://meeting.tencent.com/crm/2yO1ODRg05', 'duration': '01:21:20', 'expected': 103},
    '第二轮': {'recorded': '2026-06-23 15:00:07', 'url': 'https://meeting.tencent.com/crm/KnmQkqenc5', 'duration': '01:09:45', 'expected': 74},
    '第三轮': {'recorded': '2026-07-30 13:32:33', 'url': 'https://meeting.tencent.com/crm/l77rDB6Qb0', 'duration': '01:08:36', 'expected': 74},
    '第四轮': {'recorded': '2026-08-26 14:00:04', 'url': 'https://meeting.tencent.com/crm/2YY6bxge60', 'duration': '01:11:37', 'expected': 86},
}

def seconds(value):
    total = 0
    for part in value.split(':'):
        total = total * 60 + int(part)
    return total

manifest = []
for name, meta in META.items():
    src = ROOT / f'{name}_逐字稿.json'
    if not src.exists():
        continue
    rows = json.loads(src.read_text(encoding='utf-8'))
    ids, times = [], []
    for pid, raw in rows:
        match = re.fullmatch(r'pid-(\d+)-content', pid)
        if not match:
            raise ValueError(f'Unexpected pid: {pid}')
        ids.append(int(match.group(1)))
        parts = raw.split('\n')
        if len(parts) < 3 or not re.fullmatch(r'(?:\d{2}:)?\d{2}:\d{2}', parts[1]):
            raise ValueError(f'Unexpected speaker/time layout: {pid}')
        times.append(parts[1])
    assert ids == list(range(len(ids))), (name, ids)
    assert meta['expected'] is None or len(rows) == meta['expected'], name
    assert all(seconds(a) <= seconds(b) for a,b in zip(times, times[1:])), name
    if meta['duration']:
        assert seconds(times[-1]) <= seconds(meta['duration']), name
    duration = meta['duration'] or '待补充页面显示时长'
    title = f'【{name}·赛前说明暨培训】2026 iCAN“金视线杯”具身智能应用设计挑战赛'
    lines = [f'# {title}：原始 ASR 逐字稿', '',
             f'- 会议录制时间：{meta["recorded"]}（来自用户提供的链接文档）。',
             f'- 来源页面：[腾讯会议录制]({meta["url"]})。',
             '- 抓取日期：2026-10-22；方式：用户授权的 Chrome 页面逐字稿面板连续滚动读取。',
             f'- 页面显示视频时长：{duration}。',
             f'- 抓取范围：`pid-0-content` 至 `pid-{len(rows)-1}-content`，共 {len(rows)} 段；第一段起始时间 {times[0]}，末段起始时间 {times[-1]}。',
             '- 完整性检查：编号从 0 连续、无缺号、无重复，段落时间非递减。末段时间是该段开始时间，不是说话结束时间。',
             '- 完整性边界：验证的是网页提供的逐字稿条目连续覆盖，不是人工逐句听录校对；录音中未被识别的语音、静音或页面未提供内容不能由此证明完整。',
             '- 原文说明：以下说话人、时间与 ASR 文本保持 JSON 原值，包括口误、术语误识别、重复和标点。只添加标题、段落索引与元数据；不将页面 AI 摘要混入原文。',
             '- 阅读注释与技术纠偏另见 `../../04_培训要点与时间索引.md`；不得用纠偏文字覆盖原始记录。', '', '## 原文', '']
    for pid, raw in rows:
        lines.extend([f'### {pid}', '', raw, ''])
    rendered = '\n'.join(lines)
    dest = src.with_suffix('.md')
    dest.write_text(rendered, encoding='utf-8')
    for pid, raw in rows:
        assert f'### {pid}\n\n{raw}\n' in rendered
    item = {'round': name, 'json': src.name, 'markdown': dest.name,
            'segments': len(rows), 'first_pid': ids[0], 'last_pid': ids[-1],
            'first_timestamp': times[0], 'last_timestamp': times[-1],
            'displayed_duration': meta['duration'], 'contiguous_ids': True,
            'timestamps_monotonic': True, 'raw_segments_preserved': True,
            'json_sha256': hashlib.sha256(src.read_bytes()).hexdigest(),
            'markdown_sha256': hashlib.sha256(dest.read_bytes()).hexdigest()}
    manifest.append(item)
(ROOT/'transcript_manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(manifest,ensure_ascii=False,indent=2))
