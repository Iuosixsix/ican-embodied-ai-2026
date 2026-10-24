import React from 'react';
import {Sequence,Html5Audio,useVideoConfig} from 'remotion';
import {BasicCaptions} from '../basic-captions';
import {voiceSource} from '../voiceSource';
import {Diagram} from '../Diagram';
import {SceneShell,StageBadge,useStage,VideoProps} from '../SceneShell';
export const S11Scene:React.FC<VideoProps>=({captions=true,voice=true})=>{
 const {fps}=useVideoConfig();const stage=useStage('S11');
 return <SceneShell lesson="S11">
   <StageBadge lesson="S11" stage={stage}/>
   <div style={{position:'absolute',left:110,top:310,width:1700,height:485}}><Diagram kind="team" stage={stage}/></div>
      <Sequence name="S11-01 配音" from={0/30*fps} durationInFrames={198/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S11-01')} />}
      </Sequence>
      <Sequence name="S11-02 配音" from={198/30*fps} durationInFrames={208/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S11-02')} />}
      </Sequence>
      <Sequence name="S11-03 配音" from={406/30*fps} durationInFrames={239/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S11-03')} />}
      </Sequence>
      <Sequence name="S11-04 配音" from={645/30*fps} durationInFrames={230/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S11-04')} />}
      </Sequence>
      <Sequence name="S11-05 配音" from={875/30*fps} durationInFrames={240/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S11-05')} />}
      </Sequence>
      <Sequence name="S11-06 配音" from={1115/30*fps} durationInFrames={257/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S11-06')} />}
      </Sequence>
   {captions&&<BasicCaptions name="S11 中文字幕" premountFor={fps} width={1680} style={{position:'absolute',left:120,bottom:100}} captions={[
  {
    "text": "A熟悉运动和视觉，B熟悉建图导航，C熟悉抓取和集成。",
    "startMs": 0.0,
    "endMs": 6600.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "但每个人都必须知道上下游需要什么，以及失败时该先检查哪里。",
    "startMs": 6600.0,
    "endMs": 13533.333333333334,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "开题先读资源和验收条件，分工时明确接口、保存状态和验证负责人。",
    "startMs": 13533.333333333334,
    "endMs": 21500.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "练习十四历史提供部分资源，不能因此推定正式赛一定提供相同内容。",
    "startMs": 21500.0,
    "endMs": 29166.666666666668,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "现在暂停视频，口述去桌边、找杯子、抓起、放入盒子、返回的完整链。",
    "startMs": 29166.666666666668,
    "endMs": 37166.666666666664,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "再回超级速通看板，做十二站判断和三条积木演练。不会的按课号带去问。",
    "startMs": 37166.666666666664,
    "endMs": 45733.333333333336,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]}/>}
 </SceneShell>;
};
