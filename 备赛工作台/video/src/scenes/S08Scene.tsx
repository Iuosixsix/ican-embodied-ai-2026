import React from 'react';
import {Sequence,Html5Audio,useVideoConfig} from 'remotion';
import {BasicCaptions} from '../basic-captions';
import {voiceSource} from '../voiceSource';
import {Diagram} from '../Diagram';
import {SceneShell,StageBadge,useStage,VideoProps} from '../SceneShell';
export const S08Scene:React.FC<VideoProps>=({captions=true,voice=true})=>{
 const {fps}=useVideoConfig();const stage=useStage('S08');
 return <SceneShell lesson="S08">
   <StageBadge lesson="S08" stage={stage}/>
   <div style={{position:'absolute',left:110,top:310,width:1700,height:485}}><Diagram kind="ros" stage={stage}/></div>
      <Sequence name="S08-01 配音" from={0/30*fps} durationInFrames={150/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S08-01')} />}
      </Sequence>
      <Sequence name="S08-02 配音" from={150/30*fps} durationInFrames={226/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S08-02')} />}
      </Sequence>
      <Sequence name="S08-03 配音" from={376/30*fps} durationInFrames={195/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S08-03')} />}
      </Sequence>
      <Sequence name="S08-04 配音" from={571/30*fps} durationInFrames={192/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S08-04')} />}
      </Sequence>
      <Sequence name="S08-05 配音" from={763/30*fps} durationInFrames={226/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S08-05')} />}
      </Sequence>
      <Sequence name="S08-06 配音" from={989/30*fps} durationInFrames={206/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S08-06')} />}
      </Sequence>
   {captions&&<BasicCaptions name="S08 中文字幕" premountFor={fps} width={1680} style={{position:'absolute',left:120,bottom:100}} captions={[
  {
    "text": "练习十四可以理解成四个人通过消息协作。",
    "startMs": 0.0,
    "endMs": 5000.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "主控负责调度，导航负责到达，视觉负责目标信息，机械臂负责抓放。",
    "startMs": 5000.0,
    "endMs": 12533.333333333334,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "话题适合持续发布消息。服务是提出请求并取得响应。",
    "startMs": 12533.333333333334,
    "endMs": 19033.333333333336,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "长任务要根据平台的完成回调继续，不能只看命令已经发出。",
    "startMs": 19033.333333333336,
    "endMs": 25433.333333333332,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "双方约好字段名、数据类型、单位、坐标系和目标，才算接口接上。",
    "startMs": 25433.333333333332,
    "endMs": 32966.66666666667,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "同名字段也要确认语义。一个完成消息，必须属于当前这一步。",
    "startMs": 32966.66666666667,
    "endMs": 39833.333333333336,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]}/>}
 </SceneShell>;
};
