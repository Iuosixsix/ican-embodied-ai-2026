/* Source and interaction contract for offline mnemonic illustrations. Not platform evidence. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'sprint-visuals.js'),'utf8'),context);
const api=context.window.IcanSprintVisuals,root=path.resolve(__dirname,'../..');
const ids=Array.from({length:12},(_,i)=>'S'+String(i).padStart(2,'0'));
assert.deepEqual(Object.keys(api.lessons),ids);
for(const id of ids){
  const m=api.lessons[id];
  assert.equal(m.parts.length,3,id+' supports three focused layers');
  for(const field of ['title','memory','question','answer','imageTitle','limit'])assert.ok(m[field].length>5,id+' '+field);
  assert.ok(m.spots.length>=2&&m.spots.length<=3);
  for(const s of m.spots){assert.ok(s[0]>0&&s[0]<100&&s[1]>0&&s[1]<100);assert.ok(s[2]&&s[3]);}
  assert.ok(m.image.startsWith('备赛工作台/sources/platform/'));
  assert.ok(fs.existsSync(path.join(root,m.image)),id+' has original image');
  assert.ok(!/[?]|token|authorization/i.test(m.image));
  for(let layer=-1;layer<3;layer++){
    const svg=api.diagram(id,layer,false);assert.ok(svg.includes('<svg ')&&svg.includes('</svg>'));
    assert.ok(svg.includes('viewBox="0 0 900 490"'));assert.ok(svg.includes('data-memory-label'));
    assert.equal((svg.match(/<svg /g)||[]).length,1);
  }
  assert.ok(api.diagram(id,0,true).includes('sv-recall'));
}
assert.equal(new Set(Object.values(api.lessons).map(m=>m.image)).size,12);
const handlers={},mock={focus(){},showModal(){this.open=true;},close(){this.open=false;},querySelector(){return mock;},open:false};
const box={innerHTML:'',contains:()=>true,querySelector:()=>mock,addEventListener:(k,v)=>handlers[k]=v,removeEventListener:(k,v)=>{if(handlers[k]===v)delete handlers[k];}};
const ctl=api.mount(box,'S06');
const click=dataset=>handlers.click({target:{closest:()=>({dataset})}});
assert.equal(ctl.getState().selected,-1);
click({svLayer:'2'});assert.equal(ctl.getState().selected,2);assert.ok(box.innerHTML.includes('6D与重复变换'));
click({svAction:'recall'});assert.equal(ctl.getState().hidden,true);assert.ok(box.innerHTML.includes('图中文字已遮住'));
click({svAction:'recall'});assert.equal(ctl.getState().hidden,false);
click({svSpot:'1'});assert.equal(ctl.getState().spot,1);assert.equal(mock.open,true);
click({svAction:'zoom'});assert.equal(mock.open,true);
click({svAction:'close'});assert.equal(mock.open,false);
click({svLayer:'9'});assert.equal(ctl.getState().selected,2);
ctl.destroy();assert.equal(Object.keys(handlers).length,0);
console.log('PASS sprint visuals: 12 SVG lessons, 36 explanatory layers, 12 existing historical images, recall/focus/zoom/cleanup.');
