import React from 'react';
import {Sequence,Html5Audio,useVideoConfig} from 'remotion';
import {BasicCaptions} from '../basic-captions';
import {voiceSource} from '../voiceSource';
import {Diagram} from '../Diagram';
import {SceneShell,StageBadge,useStage,VideoProps} from '../SceneShell';
export const S02Scene:React.FC<VideoProps>=({captions=true,voice=true})=>{
 const {fps}=useVideoConfig();const stage=useStage('S02');
 return <SceneShell lesson="S02">
   <StageBadge lesson="S02" stage={stage}/>
   <div style={{position:'absolute',left:110,top:310,width:1700,height:485}}><Diagram kind="motion" stage={stage}/></div>
      <Sequence name="S02-01 配音" from={0/30*fps} durationInFrames={182/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S02-01')} />}
      </Sequence>
      <Sequence name="S02-02 配音" from={182/30*fps} durationInFrames={188/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S02-02')} />}
      </Sequence>
      <Sequence name="S02-03 配音" from={370/30*fps} durationInFrames={206/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S02-03')} />}
      </Sequence>
      <Sequence name="S02-04 配音" from={576/30*fps} durationInFrames={165/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S02-04')} />}
      </Sequence>
      <Sequence name="S02-05 配音" from={741/30*fps} durationInFrames={246/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S02-05')} />}
      </Sequence>
      <Sequence name="S02-06 配音" from={987/30*fps} durationInFrames={233/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S02-06')} />}
      </Sequence>
   {captions&&<BasicCaptions name="S02 中文字幕" premountFor={fps} width={1680} style={{position:'absolute',left:120,bottom:100}} captions={[
  {
    "text": "运动模型负责让身体完成走、跑、跳或舞蹈等动作。",
    "startMs": 0.0,
    "endMs": 6066.666666666666,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "先读目标速度和场景，再选择匹配的机器人与动作资源。",
    "startMs": 6066.666666666666,
    "endMs": 12333.333333333334,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "强化学习像练动作。奖励告诉模型，哪些行为值得重复。",
    "startMs": 12333.333333333334,
    "endMs": 19200.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "速度跟踪、保持稳定、节省能量，可能彼此拉扯。",
    "startMs": 19200.0,
    "endMs": 24700.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "学习率影响更新幅度，批量与训练轮次影响训练过程。不要见大就填大。",
    "startMs": 24700.0,
    "endMs": 32900.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "训练结束只说明得到模型。还要看实际动作、偏差与失败场景。",
    "startMs": 32900.0,
    "endMs": 40666.666666666664,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]}/>}
 </SceneShell>;
};
