import React from 'react';
import {Series,useVideoConfig} from 'remotion';
import {VideoProps} from './SceneShell';
import {S00Scene} from './scenes/S00Scene';
import {S01Scene} from './scenes/S01Scene';
import {S02Scene} from './scenes/S02Scene';
import {S03Scene} from './scenes/S03Scene';
import {S04Scene} from './scenes/S04Scene';
import {S05Scene} from './scenes/S05Scene';
import {S06Scene} from './scenes/S06Scene';
import {S07Scene} from './scenes/S07Scene';
import {S08Scene} from './scenes/S08Scene';
import {S09Scene} from './scenes/S09Scene';
import {S10Scene} from './scenes/S10Scene';
import {S11Scene} from './scenes/S11Scene';
export const SprintFilm:React.FC<VideoProps>=(props)=>{const {fps}=useVideoConfig();return <Series>
    <Series.Sequence name="S00 先记住一条任务链" durationInFrames={1084/30*fps} premountFor={fps}><S00Scene {...props}/></Series.Sequence>
    <Series.Sequence name="S01 积木有两条看不见的线" durationInFrames={1142/30*fps} premountFor={fps}><S01Scene {...props}/></Series.Sequence>
    <Series.Sequence name="S02 运动：目标与奖励" durationInFrames={1220/30*fps} premountFor={fps}><S02Scene {...props}/></Series.Sequence>
    <Series.Sequence name="S03 视觉：认出什么，还要在哪里" durationInFrames={1134/30*fps} premountFor={fps}><S03Scene {...props}/></Series.Sequence>
    <Series.Sequence name="S04 地图和定位不是一回事" durationInFrames={1054/30*fps} premountFor={fps}><S04Scene {...props}/></Series.Sequence>
    <Series.Sequence name="S05 导航：到点，还要朝对方向" durationInFrames={1176/30*fps} premountFor={fps}><S05Scene {...props}/></Series.Sequence>
    <Series.Sequence name="S06 坐标系：同一个点，三种说法" durationInFrames={1238/30*fps} premountFor={fps}><S06Scene {...props}/></Series.Sequence>
    <Series.Sequence name="S07 抓取：看见、够到、拿稳" durationInFrames={1103/30*fps} premountFor={fps}><S07Scene {...props}/></Series.Sequence>
    <Series.Sequence name="S08 四个节点，四份职责" durationInFrames={1195/30*fps} premountFor={fps}><S08Scene {...props}/></Series.Sequence>
    <Series.Sequence name="S09 状态机：等对消息才往下走" durationInFrames={1146/30*fps} premountFor={fps}><S09Scene {...props}/></Series.Sequence>
    <Series.Sequence name="S10 排错：沿数据链找第一个断点" durationInFrames={1296/30*fps} premountFor={fps}><S10Scene {...props}/></Series.Sequence>
    <Series.Sequence name="S11 三人协作，每个人都懂整条链" durationInFrames={1372/30*fps} premountFor={fps}><S11Scene {...props}/></Series.Sequence>
</Series>;};
