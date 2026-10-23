import React from 'react';
import {Sequence,Html5Audio,useVideoConfig} from 'remotion';
import {BasicCaptions} from '../basic-captions';
import {voiceSource} from '../voiceSource';
import {Diagram} from '../Diagram';
import {SceneShell,StageBadge,useStage,VideoProps} from '../SceneShell';
export const S05Scene:React.FC<VideoProps>=({captions=true,voice=true})=>{
 const {fps}=useVideoConfig();const stage=useStage('S05');
 return <SceneShell lesson="S05">
   <StageBadge lesson="S05" stage={stage}/>
   <div style={{position:'absolute',left:110,top:310,width:1700,height:485}}><Diagram kind="navigation" stage={stage}/></div>
      <Sequence name="S05-01 配音" from={0/30*fps} durationInFrames={231/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S05-01')} />}
      </Sequence>
      <Sequence name="S05-02 配音" from={231/30*fps} durationInFrames={199/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S05-02')} />}
      </Sequence>
      <Sequence name="S05-03 配音" from={430/30*fps} durationInFrames={172/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S05-03')} />}
      </Sequence>
      <Sequence name="S05-04 配音" from={602/30*fps} durationInFrames={194/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S05-04')} />}
      </Sequence>
      <Sequence name="S05-05 配音" from={796/30*fps} durationInFrames={185/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S05-05')} />}
      </Sequence>
      <Sequence name="S05-06 配音" from={981/30*fps} durationInFrames={195/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S05-06')} />}
      </Sequence>
   {captions&&<BasicCaptions name="S05 中文字幕" premountFor={fps} width={1680} style={{position:'absolute',left:120,bottom:100}} captions={[
  {
    "text": "一个航点包含位置，也包含朝向。走到桌边却背对桌子仍可能失败。",
    "startMs": 0.0,
    "endMs": 7700.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "全局规划像选整条路线，局部规划像边走边避开眼前障碍。",
    "startMs": 7700.0,
    "endMs": 14333.333333333334,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "代价地图不只记录墙，还给障碍附近留出安全空间。",
    "startMs": 14333.333333333334,
    "endMs": 20066.666666666668,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "速度太快可能来不及调整。容差太松可能提前说到了。",
    "startMs": 20066.666666666668,
    "endMs": 26533.333333333336,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "检查距离误差和朝向误差都满足要求，再发到达反馈。",
    "startMs": 26533.333333333336,
    "endMs": 32700.000000000004,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "历史导航报告的十点到达，是一次练习证据，不是正式赛保证。",
    "startMs": 32700.000000000004,
    "endMs": 39200.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]}/>}
 </SceneShell>;
};
