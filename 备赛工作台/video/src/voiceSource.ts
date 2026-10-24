import voices from './voice-data.json';
/** Fully local data URLs avoid byte-range fetches and file-origin seeking. */
export const voiceSource=(id:string):string=>{
 const src=(voices as Record<string,string>)[id];
 if(!src)throw new Error(`Missing embedded narration: ${id}`);
 return src;
};
