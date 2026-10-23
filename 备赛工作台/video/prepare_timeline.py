from pathlib import Path
import json,math,hashlib
r=Path(__file__).resolve().parent
n=json.loads((r/'narration.json').read_text(encoding='utf-8-sig'))
t=json.loads((r/'public/voice/timing.json').read_text(encoding='utf-8-sig'))
a={x['id']:x for x in t['segments']}
fps=30;start=0;chapters=[]
for ch in n['chapters']:
 local=0;segs=[]
 for s in [x for x in n['segments'] if x['lesson']==ch['lesson']]:
  frames=math.ceil((a[s['id']]['durationSeconds']+.35)*fps)
  segs.append(dict(s,startFrame=local,durationFrames=frames,audioSeconds=a[s['id']]['durationSeconds']))
  local+=frames
 chapters.append(dict(ch,startFrame=start,durationFrames=local,segments=segs));start+=local
(r/'src/timeline.json').write_text(json.dumps({'fps':fps,'durationFrames':start,'chapters':chapters},ensure_ascii=False,indent=2),encoding='utf-8')
for c in chapters:
 l=c['lesson'];name=f'{l}Scene'
 clips=[]
 for s in c['segments']:
  clips.append(f'''      <Sequence name="{s['id']} 配音" from={{{s['startFrame']}/30*fps}} durationInFrames={{{s['durationFrames']}/30*fps}} premountFor={{fps}}>
        {{voice && <Html5Audio src={{voiceSource('{s['id']}')}} />}}
      </Sequence>''')
 caps=[{'text':s['text'],'startMs':s['startFrame']/fps*1000,'endMs':(s['startFrame']+s['durationFrames'])/fps*1000,'timestampMs':None,'confidence':None,'pageBreakAfter':True} for s in c['segments']]
 code=f'''import React from 'react';
import {{Sequence,Html5Audio,useVideoConfig}} from 'remotion';
import {{BasicCaptions}} from '../basic-captions';
import {{voiceSource}} from '../voiceSource';
import {{Diagram}} from '../Diagram';
import {{SceneShell,StageBadge,useStage,VideoProps}} from '../SceneShell';
export const {name}:React.FC<VideoProps>=({{captions=true,voice=true}})=>{{
 const {{fps}}=useVideoConfig();const stage=useStage('{l}');
 return <SceneShell lesson="{l}">
   <StageBadge lesson="{l}" stage={{stage}}/>
   <div style={{{{position:'absolute',left:110,top:310,width:1700,height:485}}}}><Diagram kind="{c['scene']}" stage={{stage}}/></div>
{chr(10).join(clips)}
   {{captions&&<BasicCaptions name="{l} 中文字幕" premountFor={{fps}} width={{1680}} style={{{{position:'absolute',left:120,bottom:100}}}} captions={{{json.dumps(caps,ensure_ascii=False,indent=2)}}}/>}}
 </SceneShell>;
}};
'''
 (r/f'src/scenes/{name}.tsx').write_text(code,encoding='utf-8')
imports='\n'.join(f"import {{{c['lesson']}Scene}} from './scenes/{c['lesson']}Scene';" for c in chapters)
seqs='\n'.join(f'''    <Series.Sequence name="{c['lesson']} {c['title']}" durationInFrames={{{c['durationFrames']}/30*fps}} premountFor={{fps}}><{c['lesson']}Scene {{...props}}/></Series.Sequence>''' for c in chapters)
(r/'src/Composition.tsx').write_text(f'''import React from 'react';
import {{Series,useVideoConfig}} from 'remotion';
import {{VideoProps}} from './SceneShell';
{imports}
export const SprintFilm:React.FC<VideoProps>=(props)=>{{const {{fps}}=useVideoConfig();return <Series>\n{seqs}\n</Series>;}};
''',encoding='utf-8')
regs='\n'.join(f'''      <Composition id="{c['lesson']}" component={{{c['lesson']}Scene}} durationInFrames={{{c['durationFrames']}}} fps={{30}} width={{1920}} height={{1080}} defaultProps={{{{captions:true,voice:true}}}}/>''' for c in chapters)
(r/'src/Root.tsx').write_text(f'''import {{Composition,Folder}} from 'remotion';
import {{SprintFilm}} from './Composition';
{imports}
export const RemotionRoot=()=> <>
    <Composition id="ICAN-SuperSprint" component={{SprintFilm}} durationInFrames={{{start}}} fps={{30}} width={{1920}} height={{1080}} defaultProps={{{{captions:true,voice:true}}}}/>
    <Folder name="Chapters">\n{regs}\n    </Folder>
</>;
''',encoding='utf-8')
print(f'{len(chapters)} chapters, {start} frames / {start/fps:.2f} seconds')
