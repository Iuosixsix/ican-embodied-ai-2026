import React from 'react';
import {Sequence,Html5Audio,useVideoConfig} from 'remotion';
import {BasicCaptions} from '../basic-captions';
import {voiceSource} from '../voiceSource';
import {Diagram} from '../Diagram';
import {SceneShell,StageBadge,useStage,VideoProps} from '../SceneShell';
export const S09Scene:React.FC<VideoProps>=({captions=true,voice=true})=>{
 const {fps}=useVideoConfig();const stage=useStage('S09');
 return <SceneShell lesson="S09">
   <StageBadge lesson="S09" stage={stage}/>
   <div style={{position:'absolute',left:110,top:310,width:1700,height:485}}><Diagram kind="callback" stage={stage}/></div>
      <Sequence name="S09-01 配音" from={0/30*fps} durationInFrames={222/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S09-01')} />}
      </Sequence>
      <Sequence name="S09-02 配音" from={222/30*fps} durationInFrames={159/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S09-02')} />}
      </Sequence>
      <Sequence name="S09-03 配音" from={381/30*fps} durationInFrames={192/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S09-03')} />}
      </Sequence>
      <Sequence name="S09-04 配音" from={573/30*fps} durationInFrames={237/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S09-04')} />}
      </Sequence>
      <Sequence name="S09-05 配音" from={810/30*fps} durationInFrames={177/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S09-05')} />}
      </Sequence>
      <Sequence name="S09-06 配音" from={987/30*fps} durationInFrames={159/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S09-06')} />}
      </Sequence>
   {captions&&<BasicCaptions name="S09 中文字幕" premountFor={fps} width={1680} style={{position:'absolute',left:120,bottom:100}} captions={[
  {
    "text": "状态机像一张进度单：现在做哪步，下一步是什么，什么条件才能翻页。",
    "startMs": 0.0,
    "endMs": 7400.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "主控发出导航命令后，停在等待导航完成的状态。",
    "startMs": 7400.0,
    "endMs": 12700.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "此时来了视觉结果，不能当导航成功，也不能跳到抓取结束。",
    "startMs": 12700.0,
    "endMs": 19100.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "匹配的到达反馈来了，才请求视觉。有效视觉结果来了，才交给机械臂。",
    "startMs": 19100.0,
    "endMs": 27000.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "重复或过期的回调，需要防止重复执行和错误推进。",
    "startMs": 27000.0,
    "endMs": 32900.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "最终完成信号只能在所有要求的阶段结束后发出。",
    "startMs": 32900.0,
    "endMs": 38200.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]}/>}
 </SceneShell>;
};
