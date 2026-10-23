import React from 'react';
import {Sequence,Html5Audio,useVideoConfig} from 'remotion';
import {BasicCaptions} from '../basic-captions';
import {voiceSource} from '../voiceSource';
import {Diagram} from '../Diagram';
import {SceneShell,StageBadge,useStage,VideoProps} from '../SceneShell';
export const S06Scene:React.FC<VideoProps>=({captions=true,voice=true})=>{
 const {fps}=useVideoConfig();const stage=useStage('S06');
 return <SceneShell lesson="S06">
   <StageBadge lesson="S06" stage={stage}/>
   <div style={{position:'absolute',left:110,top:310,width:1700,height:485}}><Diagram kind="coordinates" stage={stage}/></div>
      <Sequence name="S06-01 配音" from={0/30*fps} durationInFrames={190/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S06-01')} />}
      </Sequence>
      <Sequence name="S06-02 配音" from={190/30*fps} durationInFrames={218/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S06-02')} />}
      </Sequence>
      <Sequence name="S06-03 配音" from={408/30*fps} durationInFrames={207/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S06-03')} />}
      </Sequence>
      <Sequence name="S06-04 配音" from={615/30*fps} durationInFrames={217/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S06-04')} />}
      </Sequence>
      <Sequence name="S06-05 配音" from={832/30*fps} durationInFrames={185/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S06-05')} />}
      </Sequence>
      <Sequence name="S06-06 配音" from={1017/30*fps} durationInFrames={221/30*fps} premountFor={fps}>
        {voice && <Html5Audio src={voiceSource('S06-06')} />}
      </Sequence>
   {captions&&<BasicCaptions name="S06 中文字幕" premountFor={fps} width={1680} style={{position:'absolute',left:120,bottom:100}} captions={[
  {
    "text": "相机说物体在我前方，机械臂却要知道它在基座的哪里。",
    "startMs": 0.0,
    "endMs": 6333.333333333333,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "标定提供坐标系之间的关系。变换是把同一个目标换一种坐标表达。",
    "startMs": 6333.333333333333,
    "endMs": 13600.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "从相机系到基座系，要核对方向、单位，以及输入和输出是什么。",
    "startMs": 13600.0,
    "endMs": 20500.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "正向矩阵和逆向矩阵不能随便交换，同一变换也不能重复做两遍。",
    "startMs": 20500.0,
    "endMs": 27733.333333333336,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "深度能恢复三维点，但一个点还不是完整的六维抓取姿态。",
    "startMs": 27733.333333333336,
    "endMs": 33900.0,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  },
  {
    "text": "六维姿态除了位置，还描述朝向。抓手必须知道从哪个方向接近。",
    "startMs": 33900.0,
    "endMs": 41266.666666666664,
    "timestampMs": null,
    "confidence": null,
    "pageBreakAfter": true
  }
]}/>}
 </SceneShell>;
};
