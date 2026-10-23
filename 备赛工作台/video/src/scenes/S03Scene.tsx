import React from 'react';
import {Sequence,Html5Audio,useVideoConfig} from 'remotion';
import {BasicCaptions} from '../basic-captions';
import {voiceSource} from '../voiceSource';
import {Diagram} from '../Diagram';
import {SceneShell,StageBadge,useStage,VideoProps} from '../SceneShell';
export const S03Scene:React.FC<VideoProps>=({captions=true,voice=true})=>{
 const {fps}=useVideoConfig();const stage=useStage('S03');
 return <SceneShell lesson="S03">
   <StageBadge lesson="S03" stage={stage}/>
   <div style={{position:'absolute',left:110,top:310,width:1700,height:485}}><Diagram kind="vision" stage={stage}/></div>
      <Sequence name="S03-01 配音" from={0/30*fps} durationInFrames={172/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S03-01')} />}
      </Sequence>
      <Sequence name="S03-02 配音" from={172/30*fps} durationInFrames={144/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S03-02')} />}
      </Sequence>
      <Sequence name="S03-03 配音" from={316/30*fps} durationInFrames={205/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S03-03')} />}
      </Sequence>
      <Sequence name="S03-04 配音" from={521/30*fps} durationInFrames={169/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S03-04')} />}
      </Sequence>
      <Sequence name="S03-05 配音" from={690/30*fps} durationInFrames={198/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S03-05')} />}
      </Sequence>
      <Sequence name="S03-06 配音" from={888/30*fps} durationInFrames={246/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S03-06')} />}
      </Sequence>
   {captions&&<BasicCaptions name="S03 中文字幕" premountFor={fps} width={1680} style={{position:'absolute',left:120,bottom:100}} captions={[
  {
    "text": "分类回答这张图是什么，检测回答哪些目标在哪里。",
    "startMs": 0.0,
    "endMs": 5733.333333333333,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "实例分割进一步分清每个物体的像素轮廓。",
    "startMs": 5733.333333333333,
    "endMs": 10533.333333333334,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "如果任务要水壶，就筛水壶，而不是只选置信度最高的任意物体。",
    "startMs": 10533.333333333334,
    "endMs": 17366.666666666668,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "置信度阈值太高会漏掉目标，太低可能留下误检。",
    "startMs": 17366.666666666668,
    "endMs": 23000.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "对齐的深度与相机内参，把目标像素还原成三维点或点云。",
    "startMs": 23000.0,
    "endMs": 29600.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "识别正确还不等于抓到。下游要的类别、坐标系和数据类型都要对齐。",
    "startMs": 29600.0,
    "endMs": 37800.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]}/>}
 </SceneShell>;
};
