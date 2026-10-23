"""Build resumable Chinese narration; requires edge-tts and local ffprobe/ffmpeg.

Only the authored narration text is sent for synthesis. No screenshots,
credentials, meeting transcripts or account records are uploaded.
Run from this folder after npm install, using a Python environment with edge-tts.
"""
from pathlib import Path
import argparse
import asyncio
import hashlib
import json
import os
import subprocess
import edge_tts

ROOT = Path(__file__).resolve().parent
VOICE = 'zh-CN-XiaoxiaoNeural'
RATE = '-2%'

def probe(path, ffprobe):
    value = json.loads(subprocess.check_output([str(ffprobe), '-v', 'error', '-show_entries',
        'format=duration:stream=sample_rate,channels', '-of', 'json', str(path)], text=True))
    duration = float(value['format']['duration'])
    if duration < .25 or path.stat().st_size < 1024:
        raise ValueError('Audio too short: ' + path.name)
    return duration, value['streams'][0]

async def build(args):
    source = ROOT / 'narration.json'
    data = json.loads(source.read_text(encoding='utf-8-sig'))
    output = ROOT / 'public/voice'
    output.mkdir(parents=True, exist_ok=True)
    ffprobe = Path(args.ffprobe) if args.ffprobe else next((ROOT/'node_modules').glob('@remotion/compositor-*/ffprobe.exe'))
    ffmpeg = ffprobe.with_name('ffmpeg.exe')
    semaphore = asyncio.Semaphore(3)
    async def one(segment):
        async with semaphore:
            ident = segment['id']
            path = output / (ident + '.mp3')
            fingerprint = hashlib.sha256((VOICE + RATE + segment['text']).encode()).hexdigest()
            receipt = output / (ident + '.json')
            reusable = path.exists() and receipt.exists() and json.loads(receipt.read_text())['fingerprint'] == fingerprint
            if not reusable:
                for attempt in range(3):
                    try:
                        partial = output / (ident + '.partial.mp3')
                        await edge_tts.Communicate(segment['text'], VOICE, rate=RATE).save(str(partial))
                        probe(partial, ffprobe)
                        os.replace(partial, path)
                        receipt.write_text(json.dumps({'fingerprint':fingerprint,'voice':VOICE,'rate':RATE}),encoding='utf-8')
                        break
                    except Exception:
                        if attempt == 2: raise
                        await asyncio.sleep(2 * (attempt + 1))
            duration, stream = probe(path, ffprobe)
            subprocess.run([str(ffmpeg), '-v', 'error', '-i', str(path), '-f', 'null', '-'], check=True, capture_output=True)
            print(ident + ' ' + str(round(duration,3)) + 's verified', flush=True)
            return {'id':ident,'durationSeconds':duration,'bytes':path.stat().st_size,
                'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                'sampleRate':int(stream['sample_rate']),'channels':stream['channels'],'fullDecode':True}
    segments = await asyncio.gather(*(one(s) for s in data['segments']))
    timing = {'voice':VOICE,'rate':RATE,'provider':'Microsoft speech via edge-tts',
        'synthetic':True,'narrationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'note':'Authored teaching script; synthetic Mandarin voice, not an organizer recording.',
        'segments':segments,'audioDurationSeconds':sum(s['durationSeconds'] for s in segments)}
    (output/'timing.json').write_text(json.dumps(timing,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'segments':len(segments),'audioSeconds':timing['audioDurationSeconds'],
        'bytes':sum(s['bytes'] for s in segments)},ensure_ascii=False))

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffprobe')
    asyncio.run(build(parser.parse_args()))
