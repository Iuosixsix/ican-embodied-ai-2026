import {Composition,Folder} from 'remotion';
import {SprintFilm} from './Composition';
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
export const RemotionRoot=()=> <>
    <Composition id="ICAN-SuperSprint" component={SprintFilm} durationInFrames={14160} fps={30} width={1920} height={1080} defaultProps={{captions:true,voice:true}}/>
    <Folder name="Chapters">
      <Composition id="S00" component={S00Scene} durationInFrames={1084} fps={30} width={1920} height={1080} defaultProps={{captions:true,voice:true}}/>
      <Composition id="S01" component={S01Scene} durationInFrames={1142} fps={30} width={1920} height={1080} defaultProps={{captions:true,voice:true}}/>
      <Composition id="S02" component={S02Scene} durationInFrames={1220} fps={30} width={1920} height={1080} defaultProps={{captions:true,voice:true}}/>
      <Composition id="S03" component={S03Scene} durationInFrames={1134} fps={30} width={1920} height={1080} defaultProps={{captions:true,voice:true}}/>
      <Composition id="S04" component={S04Scene} durationInFrames={1054} fps={30} width={1920} height={1080} defaultProps={{captions:true,voice:true}}/>
      <Composition id="S05" component={S05Scene} durationInFrames={1176} fps={30} width={1920} height={1080} defaultProps={{captions:true,voice:true}}/>
      <Composition id="S06" component={S06Scene} durationInFrames={1238} fps={30} width={1920} height={1080} defaultProps={{captions:true,voice:true}}/>
      <Composition id="S07" component={S07Scene} durationInFrames={1103} fps={30} width={1920} height={1080} defaultProps={{captions:true,voice:true}}/>
      <Composition id="S08" component={S08Scene} durationInFrames={1195} fps={30} width={1920} height={1080} defaultProps={{captions:true,voice:true}}/>
      <Composition id="S09" component={S09Scene} durationInFrames={1146} fps={30} width={1920} height={1080} defaultProps={{captions:true,voice:true}}/>
      <Composition id="S10" component={S10Scene} durationInFrames={1296} fps={30} width={1920} height={1080} defaultProps={{captions:true,voice:true}}/>
      <Composition id="S11" component={S11Scene} durationInFrames={1372} fps={30} width={1920} height={1080} defaultProps={{captions:true,voice:true}}/>
    </Folder>
</>;
