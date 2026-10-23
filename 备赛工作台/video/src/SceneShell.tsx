import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {C} from './Diagram';
import timeline from './timeline.json';
export type VideoProps={assetBase?:string;captions?:boolean;voice?:boolean};
export const SceneShell=({lesson,children}:{lesson:string;children:React.ReactNode})=>{
 const frame=useCurrentFrame(); const {fps}=useVideoConfig();const chapter=timeline.chapters.find(c=>c.lesson===lesson)!;
 return <AbsoluteFill style={{background:C.bg,color:C.ink,fontFamily:'"Microsoft YaHei", "PingFang SC", system-ui, sans-serif',overflow:'hidden'}}>
 <div style={{position:'absolute',width:850,height:850,right:-250,top:-500,border:'1px solid #33526b',borderRadius:'50%',opacity:.5}}/>
 <div style={{position:'absolute',left:100,right:100,top:70,display:'flex',justifyContent:'space-between',fontSize:30,color:C.dim,letterSpacing:2}}><span>ICAN · 全能超级速通</span><span>{chapter.role} / {lesson}</span></div>
 <div style={{position:'absolute',left:100,right:100,top:142,fontSize:84,fontWeight:800,letterSpacing:1,opacity:interpolate(frame,[0,.35*fps],[0,1],{extrapolateRight:'clamp'}),translate:interpolate(frame,[0,.5*fps],['0px 20px','0px 0px'],{extrapolateRight:'clamp'})}}>{chapter.title}</div>
 {children}
 <div style={{position:'absolute',left:100,right:100,bottom:34,display:'flex',justifyContent:'space-between',fontSize:24,color:C.dim}}><span>原创教学示意 · 合成配音 · 非平台仿真 / 非官方赛卷</span><span>{Number(lesson.slice(1))+1} / 12</span></div>
 <div style={{position:'absolute',left:0,bottom:0,width:`${Math.min(100,frame/chapter.durationFrames*100)}%`,height:8,background:C.mint}}/>
 </AbsoluteFill>;
};
export const useStage=(lesson:string)=>{const frame=useCurrentFrame();const c=timeline.chapters.find(x=>x.lesson===lesson)!;return Math.max(0,c.segments.findIndex(s=>frame>=s.startFrame&&frame<s.startFrame+s.durationFrames));};
export const StageBadge=({lesson,stage}:{lesson:string;stage:number})=>{
 const tags:Record<string,string[]>={S00:['整体链','导航与到达','动作与返回','教学示例','输入输出合同','三个层级'],S01:['依赖关系','执行 / 数据','变量与类型','赋值 / 比较','等待反馈','保存与回读'],S02:['动作目标','机器人与场景','奖励设计','权衡','训练参数','动作验证'],S03:['分类 / 检测','实例分割','按目标筛选','阈值取舍','深度与内参','感知到抓取'],S04:['建图 / 定位','观测与运动','定位可信度','漂移','现成资源','导航前检查'],S05:['位置 + 朝向','全局 / 局部','安全空间','速度与容差','双误差验收','历史结果边界'],S06:['坐标表达','标定与变换','方向 / 单位','变换一次','3D点 ≠ 6D姿态','位置 + 朝向'],S07:['3D抓取示例','空候选先查上游','可达与碰撞','选择手臂与夹持','检查真实放置','执行 ≠ 成功'],S08:['节点协作','四份职责','话题也能发一次性消息','等待完成回调','输入输出合同','匹配当前阶段'],S09:['状态与条件','等待导航','无关回调不推进','匹配才推进','防重复与过期','最终完成条件'],S10:['最早断点','感知 / 点云','候选 / 规划','保存 ≠ 绑定','一次一个因素','任务14历史图非现状'],S11:['三份主责','共同理解接口','读题与验收','提供资源依题面','暂停口述','回看板检查']};
 return <div style={{position:'absolute',left:105,top:255,fontSize:32,color:C.mint,background:'#18392f',padding:'10px 22px',borderRadius:12}}>{String(stage+1).padStart(2,'0')} / 06 {tags[lesson][stage]}</div>;
};
