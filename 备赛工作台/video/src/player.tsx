import {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player,PlayerRef} from '@remotion/player';
import {SprintFilm} from './Composition';
import timeline from './timeline.json';
import './player.css';
const stamp=(frame:number)=>`${Math.floor(frame/30/60)}:${String(Math.floor(frame/30)%60).padStart(2,'0')}`;
const App=()=>{
 const ref=useRef<PlayerRef>(null);const [frame,setFrame]=useState(0);const [captions,setCaptions]=useState(true);const [voice,setVoice]=useState(true);const [speed,setSpeed]=useState(1);const [playing,setPlaying]=useState(false);const [error,setError]=useState('');
 const active=timeline.chapters.find(c=>frame>=c.startFrame&&frame<c.startFrame+c.durationFrames)||timeline.chapters[0];
 useEffect(()=>{const p=ref.current;if(!p)return;const onFrame=(e:{detail:{frame:number}})=>setFrame(e.detail.frame);const onPlay=()=>setPlaying(true);const onPause=()=>setPlaying(false);p.addEventListener('frameupdate',onFrame);p.addEventListener('play',onPlay);p.addEventListener('pause',onPause);p.addEventListener('ended',onPause);return()=>{p.removeEventListener('frameupdate',onFrame);p.removeEventListener('play',onPlay);p.removeEventListener('pause',onPause);p.removeEventListener('ended',onPause);};},[]);
 const jump=(f:number)=>{ref.current?.seekTo(f);setFrame(f);document.querySelector('.screen')?.scrollIntoView({block:'start',behavior:'smooth'});};
 const replay=(f:number)=>{jump(f);ref.current?.play();};
 const link=`../../ICAN备赛学习站.html#sprint/${active.lesson}`;
 return <main><header><div><p className="eyebrow">ICAN / 先看动画建立印象</p><h1>全能超级速通影片</h1><p className="lead">7分52秒 · 12站 · 三个分工都看懂 · 中文合成配音</p></div><a className="back" href="../../ICAN备赛学习站.html#sprint">回超级速通看板 ↗</a></header>
 <div className="layout"><section className="screen"><Player ref={ref} component={SprintFilm} inputProps={{assetBase:'./public/',captions,voice}} durationInFrames={timeline.durationFrames} compositionWidth={1920} compositionHeight={1080} fps={30} controls alwaysShowControls style={{width:'100%',borderRadius:16,overflow:'hidden'}} playbackRate={speed} numberOfSharedAudioTags={8} showVolumeControls allowFullscreen spaceKeyToPlayOrPause clickToPlay preservePitch errorFallback={({error:e})=>{if(!error)setTimeout(()=>setError(e.message),0);return <div className="player-error">播放器遇到错误：{e.message}</div>;}}/>
 <p className="view-tip">手机建议横屏或全屏观看；图中文字偏小时，可展开下方逐句旁白阅读并点句重听。</p><div className="toolbar"><button className="primary" onClick={()=>ref.current?.toggle()}>{playing?'暂停':'播放影片'}</button><button onClick={()=>replay(active.startFrame)}>重听本章</button><label><input type="checkbox" checked={captions} onChange={e=>setCaptions(e.target.checked)}/>字幕</label><label><input type="checkbox" checked={voice} onChange={e=>setVoice(e.target.checked)}/>配音</label><label>速度 <select aria-label="播放速度" value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[.75,1,1.25,1.5,2].map(x=><option key={x} value={x}>{x}×</option>)}</select></label><span className="clock">{stamp(frame)} / {stamp(timeline.durationFrames)}</span></div>
 <article className="now"><div><small>当前章节 {active.lesson} / {active.role}</small><h2>{active.title}</h2><p>看完这章，尝试不看字幕讲出“输入 → 动作 → 输出 → 完成条件”。</p></div><a className="primary link" href={link}>去 {active.lesson} 看图与做题 ↗</a></article>
 <details><summary>没听懂？展开本章逐句旁白</summary><div className="transcript">{active.segments.map(s=><button key={s.id} onClick={()=>replay(active.startFrame+s.startFrame)}><span>{stamp(active.startFrame+s.startFrame)}</span>{s.text}</button>)}</div></details>
 <p className="notice">原创赛前教学示意，使用 Remotion 制作；不是平台仿真或官方赛卷。任务14已由用户重置，历史证据不代表当前配置。影片覆盖概念骨架，具体字段、例题和诊断请回看板。学习进度不会自动上传。</p>
 {error&&<p role="alert">{error}。请重新打开完整的 player.html 文件；配音已内嵌，不需要额外文件夹。</p>}
 </section><aside aria-label="影片章节"><div className="chapters-title">12站，随时跳转</div>{timeline.chapters.map(c=><button className={c.lesson===active.lesson?'chapter active':'chapter'} key={c.lesson} onClick={()=>jump(c.startFrame)} aria-current={c.lesson===active.lesson?'step':undefined}><span className="number">{c.lesson}</span><span><strong>{c.title}</strong><small>{c.role}</small></span><time>{stamp(c.startFrame)}</time></button>)}<div className="aside-note">先整片看一遍，再回看板：<br/>认图 → 复述 → 积木演练 → 闭卷检查。</div></aside></div></main>;
};
createRoot(document.getElementById('root')!).render(<App/>);

