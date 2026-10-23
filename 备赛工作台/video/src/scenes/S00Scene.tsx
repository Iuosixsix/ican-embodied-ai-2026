import React from 'react';
import {Sequence,Html5Audio,useVideoConfig} from 'remotion';
import {BasicCaptions} from '../basic-captions';
import {voiceSource} from '../voiceSource';
import {Diagram} from '../Diagram';
import {SceneShell,StageBadge,useStage,VideoProps} from '../SceneShell';
export const S00Scene:React.FC<VideoProps>=({captions=true,voice=true})=>{
 const {fps}=useVideoConfig();const stage=useStage('S00');
 return <SceneShell lesson="S00">
   <StageBadge lesson="S00" stage={stage}/>
   <div style={{position:'absolute',left:110,top:310,width:1700,height:485}}><Diagram kind="chain" stage={stage}/></div>
      <Sequence name="S00-01 配音" from={0/30*fps} durationInFrames={170/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S00-01')} />}
      </Sequence>
      <Sequence name="S00-02 配音" from={170/30*fps} durationInFrames={163/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S00-02')} />}
      </Sequence>
      <Sequence name="S00-03 配音" from={333/30*fps} durationInFrames={181/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S00-03')} />}
      </Sequence>
      <Sequence name="S00-04 配音" from={514/30*fps} durationInFrames={149/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S00-04')} />}
      </Sequence>
      <Sequence name="S00-05 配音" from={663/30*fps} durationInFrames={210/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S00-05')} />}
      </Sequence>
      <Sequence name="S00-06 配音" from={873/30*fps} durationInFrames={211/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S00-06')} />}
      </Sequence>
   {captions&&<BasicCaptions name="S00 中文字幕" premountFor={fps} width={1680} style={{position:'absolute',left:120,bottom:100}} captions={[
  {
    "text": "先别背参数。把机器人想成一支会合作的服务队。",
    "startMs": 0.0,
    "endMs": 5666.666666666667,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "它先接到任务，再走到展示区，确认位置和朝向。",
    "startMs": 5666.666666666667,
    "endMs": 11100.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "接着表演，或者识别物体、抓取、放置，最后返回。",
    "startMs": 11100.0,
    "endMs": 17133.333333333332,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "这是一条教学示例链，不是已经公开的正式赛题。",
    "startMs": 17133.333333333332,
    "endMs": 22100.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "每一步只问四件事：输入是什么，做什么，输出什么，等什么反馈。",
    "startMs": 22100.0,
    "endMs": 29100.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "正式四模块、练习十四的四节点、三个人的分工，是三个不同层级。",
    "startMs": 29100.0,
    "endMs": 36133.333333333336,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]}/>}
 </SceneShell>;
};
