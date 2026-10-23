/* Numerical contract tests. No browser, physical simulation, or platform calls. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'mock-lab.js'),'utf8'),ctx);
const lab=ctx.window.IcanMockLab, L=lab.logic;
const checks={};
function check(name,fn){fn();checks[name]=true;}
check('bundled_geometry_self_check',()=>assert.equal(lab.selfCheck().passed,true));
check('empty_is_not_zero',()=>{for(const v of ['', ' ', 'Infinity','NaN','wrong'])assert.equal(L.numericInput(v),null);assert.equal(L.numericInput('0'),0);});
check('angle_wrap',()=>{assert.ok(L.shortestAngle(-Math.PI/2,3*Math.PI/2)<1e-12);assert.ok(L.shortestAngle(Math.PI,-Math.PI)<1e-12);});
check('conservative_obstacle_boundary',()=>{assert.equal(L.segmentAABB([1,2.6],[10,2.6]),true);assert.equal(L.segmentAABB([1,2.599],[10,2.599]),false);assert.equal(L.segmentAABB([3.6,2.6],[3.6,2.6]),true);});
const nav=L.emptyNav();
for(const [name,x,y,yaw] of [['home',1,1,0],['stage',3,1,-Math.PI/2],['pick',3,6,Math.PI/2],['place',9,6,0]])nav.points[name]={x:String(x),y:String(y),yaw:String(yaw)};
check('correct_endpoints_do_not_prove_safe_return',()=>assert.equal(L.navAssessment(nav).okay,false));
Object.assign(nav,{returnMode:'via',returnX:'9',returnY:'1'});
check('safe_complete_route',()=>assert.equal(L.navAssessment(nav).okay,true));
nav.points.stage.yaw='';
check('missing_heading_fails',()=>assert.equal(L.navAssessment(nav).okay,false));
nav.points.stage.yaw=String(3*Math.PI/2);
check('equivalent_heading_passes',()=>assert.equal(L.navAssessment(nav).okay,true));
nav.returnX='';
check('missing_return_waypoint_fails',()=>assert.equal(L.navAssessment(nav).okay,false));
const result={scope:'offline numeric contract; not browser or physical simulation',passed:true,checks};
console.log(JSON.stringify(result,null,2));
