import React from 'react';
import {Sequence,Html5Audio,useVideoConfig} from 'remotion';
import {BasicCaptions} from '../basic-captions';
import {voiceSource} from '../voiceSource';
import {Diagram} from '../Diagram';
import {SceneShell,StageBadge,useStage,VideoProps} from '../SceneShell';
export const S07Scene:React.FC<VideoProps>=({captions=true,voice=true})=>{
 const {fps}=useVideoConfig();const stage=useStage('S07');
 return <SceneShell lesson="S07">
   <StageBadge lesson="S07" stage={stage}/>
   <div style={{position:'absolute',left:110,top:310,width:1700,height:485}}><Diagram kind="grasp" stage={stage}/></div>
      <Sequence name="S07-01 配音" from={0/30*fps} durationInFrames={167/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S07-01')} />}
      </Sequence>
      <Sequence name="S07-02 配音" from={167/30*fps} durationInFrames={199/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S07-02')} />}
      </Sequence>
      <Sequence name="S07-03 配音" from={366/30*fps} durationInFrames={175/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S07-03')} />}
      </Sequence>
      <Sequence name="S07-04 配音" from={541/30*fps} durationInFrames={185/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S07-04')} />}
      </Sequence>
      <Sequence name="S07-05 配音" from={726/30*fps} durationInFrames={164/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S07-05')} />}
      </Sequence>
      <Sequence name="S07-06 配音" from={890/30*fps} durationInFrames={213/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S07-06')} />}
      </Sequence>
   {captions&&<BasicCaptions name="S07 中文字幕" premountFor={fps} width={1680} style={{position:'absolute',left:120,bottom:100}} captions={[
  {
    "text": "抓取先筛目标点云，再生成合适的抓取候选姿态。",
    "startMs": 0.0,
    "endMs": 5566.666666666666,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "候选为空，先查感知和候选生成，不要立刻乱改机械臂速度。",
    "startMs": 5566.666666666666,
    "endMs": 12200.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "有候选以后，仍要检查工作空间、碰撞和运动规划。",
    "startMs": 12200.0,
    "endMs": 18033.333333333336,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "选对手臂，接近目标，闭爪，抬起，再移动到放置点。",
    "startMs": 18033.333333333336,
    "endMs": 24200.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "放置后张开夹爪，并检查物体真的到了指定区域。",
    "startMs": 24200.0,
    "endMs": 29666.666666666668,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "函数执行过，不等于物体拿到了。动作结果和结束信号必须一致。",
    "startMs": 29666.666666666668,
    "endMs": 36766.666666666664,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]}/>}
 </SceneShell>;
};
