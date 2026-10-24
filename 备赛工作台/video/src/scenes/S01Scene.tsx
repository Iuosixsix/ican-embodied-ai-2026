import React from 'react';
import {Sequence,Html5Audio,useVideoConfig} from 'remotion';
import {BasicCaptions} from '../basic-captions';
import {voiceSource} from '../voiceSource';
import {Diagram} from '../Diagram';
import {SceneShell,StageBadge,useStage,VideoProps} from '../SceneShell';
export const S01Scene:React.FC<VideoProps>=({captions=true,voice=true})=>{
 const {fps}=useVideoConfig();const stage=useStage('S01');
 return <SceneShell lesson="S01">
   <StageBadge lesson="S01" stage={stage}/>
   <div style={{position:'absolute',left:110,top:310,width:1700,height:485}}><Diagram kind="blocks" stage={stage}/></div>
      <Sequence name="S01-01 配音" from={0/30*fps} durationInFrames={187/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S01-01')} />}
      </Sequence>
      <Sequence name="S01-02 配音" from={187/30*fps} durationInFrames={161/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S01-02')} />}
      </Sequence>
      <Sequence name="S01-03 配音" from={348/30*fps} durationInFrames={213/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S01-03')} />}
      </Sequence>
      <Sequence name="S01-04 配音" from={561/30*fps} durationInFrames={156/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S01-04')} />}
      </Sequence>
      <Sequence name="S01-05 配音" from={717/30*fps} durationInFrames={197/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S01-05')} />}
      </Sequence>
      <Sequence name="S01-06 配音" from={914/30*fps} durationInFrames={228/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S01-06')} />}
      </Sequence>
   {captions&&<BasicCaptions name="S01 中文字幕" premountFor={fps} width={1680} style={{position:'absolute',left:120,bottom:100}} captions={[
  {
    "text": "图形化编程不是把积木摆整齐，而是把依赖关系接正确。",
    "startMs": 0.0,
    "endMs": 6233.333333333333,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "执行关系决定什么时候做，数据关系决定拿什么做。",
    "startMs": 6233.333333333333,
    "endMs": 11600.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "变量像贴了名字的盒子。点云、位姿、布尔值不能随便混装。",
    "startMs": 11600.0,
    "endMs": 18700.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "赋值是放进盒子，比较是检查盒子里现在的值。",
    "startMs": 18700.0,
    "endMs": 23900.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "发出移动命令以后，要等完成反馈，才能进入需要它完成的下一步。",
    "startMs": 23900.0,
    "endMs": 30466.666666666664,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "最后连接的一条线也要保存，再重开核查。画布有线，不等于保存成功。",
    "startMs": 30466.666666666664,
    "endMs": 38066.66666666667,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]}/>}
 </SceneShell>;
};
