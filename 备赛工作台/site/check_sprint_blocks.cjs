/* Logic + fake DOM checks only; this is not a rendered browser or physics test. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const lab=require('./sprint-blocks.js');
const findings=[];
const record=text=>findings.push(text);
const key='ican-sprint-blocks-v1';
function prepared(id){const state=lab.initial().scenes[id];lab.loadExample(id,state);state.checked=true;assert.equal(lab.validate(id,state).ok,true);return state;}
function finish(id,state){let guard=0;while(!state.run.done&&guard++<40){if(state.run.waiting)lab.signal(id,state,state.run.waiting);else lab.advance(id,state);}assert.equal(state.run.done,true,`${id} finishes`);}
function reachFault(id,state){let guard=0;while(!state.run.blocked&&guard++<25){if(state.run.waiting)lab.signal(id,state,state.run.waiting);else lab.advance(id,state);}assert.equal(state.run.blocked,true,`${id} fault stops execution`);}

for(const id of Object.keys(lab.scenes)){
  const scene=lab.scenes[id];let s=lab.initial().scenes[id];
  assert.equal(lab.validate(id,s).ok,false);assert.equal(lab.advance(id,s),false);assert.equal(s.run.cursor,0);
  lab.loadExample(id,s);assert.equal(lab.validate(id,s).ok,true);assert.equal(s.assisted,true);assert.equal(s.checked,false);
  s.checked=true;
  assert.equal(lab.signal(id,s,'premature_success'),false);assert.equal(s.run.cursor,0,'No premature event advances');
  while(!s.run.waiting&&!s.run.done)lab.advance(id,s);
  const cursor=s.run.cursor,wait=s.run.waiting;assert.ok(wait,'Each scene waits for evidence');
  assert.equal(lab.advance(id,s),false);assert.equal(s.run.cursor,cursor,'Repeated step cannot bypass waiting');
  assert.equal(lab.signal(id,s,'unrelated'),false);assert.equal(s.run.cursor,cursor,'Wrong event cannot advance');
  const data=lab.initial();data.active=id;data.scenes[id]=s;
  const restored=lab.restoreState(JSON.parse(JSON.stringify(data)));s=restored.scenes[id];
  assert.equal(s.run.cursor,cursor);assert.equal(s.run.waiting,wait);assert.equal(restored.active,id);
  lab.signal(id,s,wait);finish(id,s);
  const doneCursor=s.run.cursor,logCount=s.run.log.filter(x=>x.text.startsWith('本轮教学链完成。')).length;
  assert.equal(doneCursor,scene.order.length);assert.equal(logCount,1);
  lab.advance(id,s);lab.signal(id,s,wait);assert.equal(s.run.cursor,doneCursor);assert.equal(s.run.log.filter(x=>x.text.startsWith('本轮教学链完成。')).length,1,'Completion emitted only once');
  const question=lab.questionText({...lab.initial(),active:id,scenes:{...lab.initial().scenes,[id]:s}});
  assert.ok(question.includes('不是平台成绩'));
  for(const required of ['https://github.com/Iuosixsix/ican-embodied-ai-2026','codex/super-sprint-dashboard','CHAT_SUPER_START.md','19_超级速通_Chat辅导手册.md','不代表实训平台当前状态'])assert.ok(question.includes(required),`Chat context contains ${required}`);
  assert.ok(question.includes({vision:'S03',navigation:'S04 + S05',grasp:'S06 + S07 + S08 + S09'}[id]),'Stable learning IDs match scene');

  s=prepared(id);lab.inject(id,s);reachFault(id,s);const blockedCursor=s.run.cursor;
  assert.equal(scene.order[blockedCursor],scene.fault.at);
  lab.advance(id,s);lab.signal(id,s,scene.blocks[scene.fault.at].event||'done');assert.equal(s.run.cursor,blockedCursor);assert.equal(s.run.done,false);
  assert.equal(s.run.log.some(x=>x.text.startsWith('本轮教学链完成。')),false);
  assert.equal(lab.repair(id,s),true);assert.equal(s.run.cursor,blockedCursor,'Repair does not advance automatically');assert.equal(s.run.fault,false);
  finish(id,s);assert.equal(s.run.done,true);
  const c=scene.configs[0],wrong=c.options.find(o=>o[0]!==c.answer)[0];lab.applyConfig(id,s,c.key,wrong);
  assert.equal(s.checked,false);assert.equal(s.run.cursor,0);assert.equal(s.run.done,false);assert.equal(lab.validate(id,s).kind,'config');
  s=prepared(id);[s.sequence[0],s.sequence[1]]=[s.sequence[1],s.sequence[0]];assert.equal(lab.validate(id,s).index,0);assert.equal(lab.validate(id,s).ok,false);
  s=prepared(id);const trap=scene.palette.find(b=>scene.blocks[b].trap);s.sequence.splice(1,0,trap);assert.equal(lab.validate(id,s).index,1);
  s=prepared(id);assert.equal(lab.addBlock(id,s,'__proto__'),false);assert.equal(lab.addBlock(id,s,'constructor'),false);
  lab.removeBlock(s,0);assert.equal(s.checked,false);assert.equal(s.run.cursor,0);
  record(`${id}: sequence + parameters + first error + matching event + wait resume + failure gate + explicit repair + one completion`);
}

const g=prepared('grasp');
while(g.run.cursor<lab.scenes.grasp.order.length-1){if(g.run.waiting)lab.signal('grasp',g,g.run.waiting);else lab.advance('grasp',g);}
assert.equal(g.run.done,false);assert.equal(g.run.log.some(x=>x.text.includes('教学 _finish.is_Finish=true')),false,'No finish=true before final feedback block');
lab.advance('grasp',g);assert.equal(g.run.done,true);assert.equal(g.run.log.filter(x=>x.text.includes('教学 _finish.is_Finish=true')).length,1);
record('grasp: completion feedback remains absent before final block');

const corrupted=lab.initial();corrupted.active='__proto__';corrupted.scenes.vision.sequence=['__proto__','constructor','camera','camera'];corrupted.scenes.vision.config={target:'<script>'};
const cleaned=lab.restoreState(corrupted);assert.equal(cleaned.active,'vision');assert.deepEqual(cleaned.scenes.vision.sequence,['camera']);assert.deepEqual(cleaned.scenes.vision.config,{});
const impossible=lab.initial();impossible.scenes.grasp=prepared('grasp');impossible.scenes.grasp.run={cursor:7,done:true,fault:true,waiting:'arm_done',blocked:true,log:[]};assert.equal(lab.restoreState(impossible).scenes.grasp.run.done,false);
record('restore: corrupt keys, duplicate blocks, invalid parameters and impossible terminal state rejected');

class FakeContainer{
  constructor(){this.innerHTML='';this.listeners=new Map();}
  addEventListener(type,callback){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(callback);}
  removeEventListener(type,callback){this.listeners.get(type)?.delete(callback);}
  contains(){return true;}
  querySelector(){return null;}
  emit(type,target){for(const listener of [...(this.listeners.get(type)||[])])listener({target});}
}
function button(action,attrs={}){const values={'data-sb-action':action,...attrs};return{disabled:false,closest(){return this;},getAttribute(name){return values[name]??null;}};}
const storage=new Map([['ican-study-v1','old-progress'],['ican-task14-lab-v1','old-task14'],['ican-study-font-v1','180']]);
global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const host=new FakeContainer();let instance=lab.mount(host);assert.match(host.innerHTML,/三方向积木实验室/);
host.emit('click',button('example'));host.emit('click',button('check'));host.emit('click',button('step'));
assert.equal(instance.getState().scenes.vision.run.waiting,'frame');assert.equal(JSON.parse(storage.get(key)).scenes.vision.run.waiting,'frame');
instance.destroy();assert.equal(host.listeners.get('click').size,0);instance=lab.mount(host);assert.equal(instance.getState().scenes.vision.run.waiting,'frame');
host.emit('click',button('reset'));assert.ok(instance.getState().scenes.vision.sequence.length>0,'Reset cannot run before confirmation');
host.emit('click',button('confirm-reset'));host.emit('click',button('cancel-reset'));host.emit('click',button('reset'));assert.ok(instance.getState().scenes.vision.sequence.length>0);
host.emit('click',button('confirm-reset'));host.emit('click',button('reset'));assert.equal(instance.getState().scenes.vision.sequence.length,0);
assert.equal(storage.get('ican-study-v1'),'old-progress');assert.equal(storage.get('ican-task14-lab-v1'),'old-task14');assert.equal(storage.get('ican-study-font-v1'),'180');
const duplicate=lab.mount(host);assert.equal(host.listeners.get('click').size,1,'Repeated mount destroys old listeners');duplicate.destroy();
global.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
const blocked=new FakeContainer();const failedSave=lab.mount(blocked);blocked.emit('click',button('example'));assert.match(blocked.innerHTML,/当前浏览器未允许保存/);assert.equal(failedSave.getState().scenes.vision.sequence.length,5);failedSave.destroy();
record('fake DOM: mount, delegated events, persistence, two-click reset, unrelated storage preservation, repeated mount cleanup, blocked storage fallback');
const script=fs.readFileSync(path.join(__dirname,'sprint-blocks.js'),'utf8');assert.equal(/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(script),false);assert.equal(/data-action=/.test(script),false);
record('static: no network call or global data-action attribute');
console.log(JSON.stringify({ok:true,scope:'Node logic and fake DOM only; rendered browser layout and real robot execution are not tested here.',checks:findings},null,2));
