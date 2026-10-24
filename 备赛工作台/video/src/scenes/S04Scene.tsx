import React from 'react';
import {Sequence,Html5Audio,useVideoConfig} from 'remotion';
import {BasicCaptions} from '../basic-captions';
import {voiceSource} from '../voiceSource';
import {Diagram} from '../Diagram';
import {SceneShell,StageBadge,useStage,VideoProps} from '../SceneShell';
export const S04Scene:React.FC<VideoProps>=({captions=true,voice=true})=>{
 const {fps}=useVideoConfig();const stage=useStage('S04');
 return <SceneShell lesson="S04">
   <StageBadge lesson="S04" stage={stage}/>
   <div style={{position:'absolute',left:110,top:310,width:1700,height:485}}><Diagram kind="mapping" stage={stage}/></div>
      <Sequence name="S04-01 配音" from={0/30*fps} durationInFrames={195/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S04-01')} />}
      </Sequence>
      <Sequence name="S04-02 配音" from={195/30*fps} durationInFrames={206/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S04-02')} />}
      </Sequence>
      <Sequence name="S04-03 配音" from={401/30*fps} durationInFrames={136/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S04-03')} />}
      </Sequence>
      <Sequence name="S04-04 配音" from={537/30*fps} durationInFrames={167/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S04-04')} />}
      </Sequence>
      <Sequence name="S04-05 配音" from={704/30*fps} durationInFrames={183/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S04-05')} />}
      </Sequence>
      <Sequence name="S04-06 配音" from={887/30*fps} durationInFrames={167/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S04-06')} />}
      </Sequence>
   {captions&&<BasicCaptions name="S04 中文字幕" premountFor={fps} width={1680} style={{position:'absolute',left:120,bottom:100}} captions={[
  {
    "text": "建图是画出环境。定位是回答机器人现在在地图的哪里。",
    "startMs": 0.0,
    "endMs": 6500.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "激光或点云不断观察，里程计和惯性信息帮助理解自身运动。",
    "startMs": 6500.0,
    "endMs": 13366.666666666668,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "地图看起来完整，不代表定位已经可靠。",
    "startMs": 13366.666666666668,
    "endMs": 17900.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "遇到重复走廊、遮挡或运动过快，估计可能漂移。",
    "startMs": 17900.0,
    "endMs": 23466.666666666664,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "已有合适地图时，先按题目使用资源，不一定要重新建图。",
    "startMs": 23466.666666666664,
    "endMs": 29566.666666666668,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "先核对地图、机器人和定位，再把目标交给导航。",
    "startMs": 29566.666666666668,
    "endMs": 35133.333333333336,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]}/>}
 </SceneShell>;
};
