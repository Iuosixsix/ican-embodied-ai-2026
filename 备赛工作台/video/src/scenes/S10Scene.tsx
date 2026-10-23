import React from 'react';
import {Sequence,Html5Audio,useVideoConfig} from 'remotion';
import {BasicCaptions} from '../basic-captions';
import {voiceSource} from '../voiceSource';
import {Diagram} from '../Diagram';
import {SceneShell,StageBadge,useStage,VideoProps} from '../SceneShell';
export const S10Scene:React.FC<VideoProps>=({captions=true,voice=true})=>{
 const {fps}=useVideoConfig();const stage=useStage('S10');
 return <SceneShell lesson="S10">
   <StageBadge lesson="S10" stage={stage}/>
   <div style={{position:'absolute',left:110,top:310,width:1700,height:485}}><Diagram kind="diagnosis" stage={stage}/></div>
      <Sequence name="S10-01 配音" from={0/30*fps} durationInFrames={205/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S10-01')} />}
      </Sequence>
      <Sequence name="S10-02 配音" from={205/30*fps} durationInFrames={228/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S10-02')} />}
      </Sequence>
      <Sequence name="S10-03 配音" from={433/30*fps} durationInFrames={246/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S10-03')} />}
      </Sequence>
      <Sequence name="S10-04 配音" from={679/30*fps} durationInFrames={178/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S10-04')} />}
      </Sequence>
      <Sequence name="S10-05 配音" from={857/30*fps} durationInFrames={200/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S10-05')} />}
      </Sequence>
      <Sequence name="S10-06 配音" from={1057/30*fps} durationInFrames={239/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S10-06')} />}
      </Sequence>
   {captions&&<BasicCaptions name="S10 中文字幕" premountFor={fps} width={1680} style={{position:'absolute',left:120,bottom:100}} captions={[
  {
    "text": "机器人没动，不要同时改十个参数。先找到最早失效的那一步。",
    "startMs": 0.0,
    "endMs": 6833.333333333333,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "没有目标，查图片、类别和阈值。空点云，查深度对齐与裁剪。",
    "startMs": 6833.333333333333,
    "endMs": 14433.333333333334,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "没有抓取候选，查候选模型和输入。规划失败，再查坐标、可达与碰撞。",
    "startMs": 14433.333333333334,
    "endMs": 22633.333333333332,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "配置保存成功，不能证明运行时一定绑定了这份资源。",
    "startMs": 22633.333333333332,
    "endMs": 28566.666666666668,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "一次只改变一个有理由的因素，记录修改前后和完整分项结果。",
    "startMs": 28566.666666666668,
    "endMs": 35233.333333333336,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "历史截图只帮你认界面。任务十四已由用户重置，旧图不是当前状态。",
    "startMs": 35233.333333333336,
    "endMs": 43200.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]}/>}
 </SceneShell>;
};
