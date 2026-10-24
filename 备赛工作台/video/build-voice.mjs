import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const buildVoiceData=async()=>{
 const timing=JSON.parse((await readFile('public/voice/timing.json','utf8')).replace(/^\uFEFF/,''));
 const voices={};let bytes=0;
 for(const segment of timing.segments){const data=await readFile(`public/voice/${segment.id}.mp3`);const hash=createHash('sha256').update(data).digest('hex');if(hash!==segment.sha256)throw new Error(`Voice hash mismatch: ${segment.id}`);voices[segment.id]=`data:audio/mpeg;base64,${data.toString('base64')}`;bytes+=data.length;}
 if(Object.keys(voices).length!==72)throw new Error('Expected 72 voice segments');
 await mkdir('src',{recursive:true});await writeFile('src/voice-data.json',JSON.stringify(voices));
 console.log(`Embedded ${Object.keys(voices).length} verified MP3 clips, ${bytes} source bytes`);
};
await buildVoiceData();
