/* Offline teaching only. This module never contacts or controls the practice platform. */
(function (global) {
  'use strict';
  const KEY = 'ican-sprint-blocks-v1';
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const owns = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
  const scenes = {
    vision: {
      title:'视觉：从“看见”到可抓取的数据', short:'视觉积木', role:'感知负责人', color:'vision',
      brief:'题设：在同一帧里找水壶。检测结果为水壶 0.86、碗 0.94、水壶 0.42；要求只保留水壶且置信度 ≥ 0.50，再用已对齐的深度图取目标点云。',
      boundary:'这是把目标检测与 RGB-D 点云处理合并成五块的教学链。它没有训练模型，也没有恢复三维物理场景；不是原平台每一个节点的逐项复制。',
      source:'#article/task14-guide', sourceLabel:'任务14：vision 物体分支',
      order:['camera','detect','filter','cloud','result'], palette:['filter','cloud','camera','result','detect','image_as_cloud','highest_any'],
      blocks:{
        camera:{label:'读取彩色图 + 对齐深度图', input:'相机订阅 / 一对有效帧', output:'RGB 图 + 深度图（同帧、已对齐）', why:'彩色图提供外观，深度图提供距离。后续检测框和深度必须对应同一空间位置。', event:'frame', eventLabel:'提供一对有效、已对齐相机帧', wait:'等待相机帧；尚未得到可用于检测与取深度的输入。'},
        detect:{label:'目标检测', input:'RGB 图 + 已有检测模型', output:'检测框、类别、置信度', why:'检测回答“是什么、在哪里”。这里输出二维框，还没有抓取姿态。'},
        filter:{label:'按目标类别和阈值筛选', input:'检测结果 + 目标名 + 阈值', output:'水壶 0.86 的目标框', why:'0.94 的碗虽然分数更高，却不是当前目标；0.42 的水壶低于题设阈值。'},
        cloud:{label:'目标框 + 深度 → 点云', input:'目标框 + 对齐深度 + 相机参数', output:'非空目标点云（相机坐标系）', why:'只有二维框不能直接交给六维抓取估计；需要有效深度恢复目标的三维几何。'},
        result:{label:'返回目标点云', input:'经有效性检查的目标点云', output:'_locate.Point_Cloud → _grab.Pcloud', why:'字段名称可以不同，但必须把正确数据接过去。本链完成的是数据准备，不代表已经抓住物体。'},
        image_as_cloud:{label:'把 RGB 图直接当点云发送', input:'RGB 像素', output:'类型错误', why:'RGB 图不是三维点云，不能仅改字段名就当作 Pcloud。', trap:true},
        highest_any:{label:'不管类别，只取最高分物体', input:'所有检测结果', output:'错误地选中碗 0.94', why:'置信度高不等于符合任务。应先限制目标类别，再按题设阈值筛选。', trap:true}
      },
      configs:[
        {key:'target',label:'要找的目标类别',options:[['kettle','水壶'],['bowl','碗']],answer:'kettle',why:'题设要求水壶，不能因碗置信度更高而换目标。'},
        {key:'threshold',label:'置信度保留阈值',options:[['0.5','≥ 0.50'],['0.9','≥ 0.90']],answer:'0.5',why:'本题明确规定 ≥ 0.50；改成 0.90 会把最高 0.86 的水壶也排除。阈值不是越高越好。'}
      ],
      fault:{id:'empty_cloud',at:'cloud',label:'目标点云为空',reason:'检测框存在，但目标区域没有有效深度，点云点数为 0。不能返回“可抓取目标”，更不能发成功完成消息。',repair:'教学假设：重新取得与 RGB 对齐的有效深度，目标点云变为非空。真实操作还需检查深度、目标裁剪、相机参数并重新验证。'},
      finish:'本轮只准备并返回了有效点云；还需要后续抓取候选、坐标变换、规划与实际抓取验证。'
    },
    navigation: {
      title:'导航：从“地图上有点”到真正到位', short:'导航积木', role:'导航负责人', color:'navigation',
      brief:'题设：地图与目标已给定，机器人应到展台并面朝展台。要求位置误差 ≤ 0.20 m、朝向误差 ≤ 0.15 rad。本例最终有效事件给出 0.10 m / 0.08 rad。',
      boundary:'这是定位、规划、控制和完成检查的概念链。全局规划与局部控制在真实系统中可能循环交替，本题为了理解依赖关系将它们按阶段合并；这里没有真实避障仿真。',
      source:'#article/live-lab', sourceLabel:'历史导航实测与未完成项',
      order:['map','localize','goal','global_plan','local_control','arrival','nav_callback'],palette:['goal','arrival','map','local_control','nav_callback','localize','global_plan','finish_on_send','skip_localize'],
      blocks:{
        map:{label:'载入本题地图',input:'已提供地图资源',output:'可用地图',why:'地图描述环境。地图资源加载成功并不说明机器人已知道自己在哪里。'},
        localize:{label:'建立并检查定位',input:'地图 + 当前传感器信息 / 初始位姿',output:'当前机器人位姿有效',why:'先知道“我在哪、朝哪”，才能计算从当前位置到目标的路线。',event:'localized',eventLabel:'提供定位已就绪的事件',wait:'等待定位收敛且可用；地图已载入不等于定位已就绪。'},
        goal:{label:'设定目标位置 + 朝向',input:'目标 x、y、yaw',output:'带最终朝向的目标位姿',why:'yaw 表示终点要面向哪里。只到附近却背对展品，可能影响观察或抓取。'},
        global_plan:{label:'全局路径规划',input:'地图 + 当前位姿 + 目标位姿',output:'从起点到目标的整体路线',why:'全局规划解决总体怎么走；路线存在仍需要局部控制跟踪和处理附近障碍。'},
        local_control:{label:'局部避障与运动控制',input:'全局路线 + 局部障碍 / 机器人状态',output:'执行行进控制，等待到位',why:'局部控制根据附近情况调整运动。这里不生成速度控制命令，只演示逻辑依赖。'},
        arrival:{label:'核对到点位置与朝向',input:'实测当前位置与朝向 + 本题容差',output:'位置 0.10 m、朝向 0.08 rad，均满足题设',why:'位置误差和朝向误差都满足后，才能认定本题的到达条件成立。',event:'arrived',eventLabel:'提供位置和朝向均合格的到位事件',wait:'等待实际到位检查；不能用“导航命令已发出”代替。'},
        nav_callback:{label:'触发完成回调并通知调度',input:'本条导航任务已满足到达条件',output:'教学完成反馈 → master 才能推进',why:'回调是动作完成后的事件处理。实际还需核对消息字段、订阅绑定和当前任务。'},
        finish_on_send:{label:'发出目标后立即通知“已完成”',input:'命令已发送',output:'过早的完成消息',why:'发送成功不等于到达。这样会让调度提前开始视觉或抓取。',trap:true},
        skip_localize:{label:'有地图就直接跳过定位',input:'地图文件',output:'仍未知当前位姿',why:'地图与定位不是一回事；没有可用的当前位置，不能凭空获得正确路线。',trap:true}
      },
      configs:[
        {key:'yaw',label:'目标 yaw 在这里表示什么？',options:[['facing','终点朝向'],['speed','行进速度']],answer:'facing',why:'yaw 是终点的平面朝向角，不是速度。位置与朝向一起构成平面目标位姿。'},
        {key:'arrival',label:'何时允许完成回调？',options:[['both','位置与朝向都合格'],['position','只检查位置接近']],answer:'both',why:'题设同时要求位置和朝向误差均在容差内；只检查位置会漏掉“已到桌边却背向目标”。'}
      ],
      fault:{id:'not_localized',at:'localize',label:'定位未就绪',reason:'地图可用，但当前位姿尚不可用。停在定位检查，不能继续规划、发到达回调。',repair:'教学假设：重新设置合适初始位姿并取得有效定位。真实操作需查看定位是否稳定、与地图是否一致，再继续。'},
      finish:'这是按给定容差推进的导航逻辑演示。没有测量真实位置、碰撞次数或平台分数。'
    },
    grasp: {
      title:'抓取：消息、左右手、TF 与完成反馈', short:'抓取积木', role:'ROS / 集成负责人', color:'grasp',
      brief:'题设：arm 收到 _grab(Hand=false, Pcloud=有效相机系目标点云)。沿用本任务归档合同：false/0 选左臂与左夹爪；本例假定目标可由左臂到达。需要候选、一次相机→基座变换、规划执行和结果核对。',
      boundary:'本链把规划/执行、闭爪/结果核对合并为教学积木，增加“核对真实结果”作为判断要求；并非平台所有节点逐一复刻，也不声称平台有名为 object_attached 的必填传感器字段。任务14已由你重置，旧配置只是历史参考。',
      source:'#lab/task14',sourceLabel:'任务14完整离线练习',
      order:['grab_message','hand','candidate','tf','plan_execute','close_verify','grab_callback'],palette:['tf','close_verify','grab_message','grab_callback','candidate','hand','plan_execute','double_tf','finish_before_move'],
      blocks:{
        grab_message:{label:'接收 _grab 的 Hand + Pcloud',input:'master 发来的当前抓取命令',output:'Hand=false；相机系目标点云有效',why:'注意：视觉服务响应是 Point_Cloud，抓取话题接收字段是 Pcloud。字段、类型与数据来源要对应。'},
        hand:{label:'一致选择手臂与夹爪',input:'Hand=false / 0',output:'left_arm + left_gripper',why:'按本题合同，同一分支的手臂和夹爪必须匹配。同一物体之后放置仍应选择同一只手。'},
        candidate:{label:'估计并选择有效 6D 抓取候选',input:'目标点云 + 抓取模型',output:'相机系抓取位置 + 姿态',why:'6D 通常指三维位置加三维旋转。检测到物体或点云非空，都不保证存在有效抓取候选。'},
        tf:{label:'抓取位姿做一次相机 → 基座 TF',input:'相机系抓取位姿 + 正确坐标变换',output:'基座系抓取目标位姿',why:'坐标变换改变同一目标的表示坐标系；不要把相机坐标直接当基座坐标，也不要变换两遍。'},
        plan_execute:{label:'检查规划并执行移臂',input:'目标位姿 + 所选机械臂 + 约束',output:'机械臂到达抓取位姿（教学事件）',why:'有抓取候选不等于有无碰撞路径；规划失败时应停在这里，不应继续闭爪报成功。',event:'arm_done',eventLabel:'提供规划成功且移臂完成事件',wait:'等待规划和移臂执行完成；发出移动命令不能代替完成回调。'},
        close_verify:{label:'闭合匹配夹爪并核对抓取结果',input:'移臂完成 + 所选夹爪',output:'本例教学假设：物体确实被抓稳',why:'闭爪命令或函数执行标记不等于物体抓牢。需结合可见动作或平台实际结果核对；这里由你提供教学假设事件。',event:'grasp_verified',eventLabel:'假设已核对物体抓稳，提供结果事件',wait:'等待闭爪后实际结果核对；尚不能通知本次抓取成功。'},
        grab_callback:{label:'完成反馈，再由 master 推进',input:'本次动作已完成，结果已核对',output:'教学 _finish.is_Finish=true',why:'只有前置动作满足后才通知调度。实际平台的布尔完成消息本身不足以证明物理成功，也不自动提供完整去重机制。'},
        double_tf:{label:'基座位姿再做一遍相机 → 基座 TF',input:'已经变换后的基座位姿',output:'重复变换后的错误目标',why:'先确认输入所在坐标系。归档任务14中放置 Fpose 已在 vision 转到基座，arm 放置时不重复 TF。',trap:true},
        finish_before_move:{label:'收到 _grab 就立即发完成 true',input:'抓取请求已收到',output:'过早的成功反馈',why:'收到请求不代表已完成。调度可能立即开走，打断尚未完成的抓取。',trap:true}
      },
      configs:[
        {key:'hand',label:'同一物体抓取与放置的 Hand',options:[['same','抓放同手，臂爪匹配'],['opposite','抓左手，放右手']],answer:'same',why:'物体不会因切换布尔值就自动换手。按本题抓放使用同一只手，机械臂和夹爪也需匹配；不要再反转 arm 分支。'},
        {key:'tf',label:'本题相机系抓取位姿变换几次？',options:[['once','一次，相机 → 基座'],['twice','两次，保险一些'],['zero','零次，直接用']],answer:'once',why:'当前输入明确是相机系，目标要求基座系，因此做一次正确变换。已在基座系的放置 Pose 是另一分支，不能照抄。'}
      ],
      fault:{id:'no_candidate',at:'candidate',label:'没有有效抓取候选',reason:'点云存在，但候选列表为空。此时没有可供 TF 和规划使用的抓取位姿；仅增加规划时间不能凭空补出候选。',repair:'教学假设：检查裁剪、点云与抓取估计后，新输入得到有效候选。真实平台仍需重新估计并验证，不能把此按钮当作已经修复。'},
      finish:'这里只演示消息到抓取反馈的逻辑。没有执行真实抓取；函数已执行、完成消息、物体抓稳与最终得分仍是不同证据。'
    }
  };
  function freshRun() { return {cursor:0,waiting:null,blocked:false,fault:false,done:false,log:[]}; }
  function freshScene() { return {sequence:[],config:{},checked:false,assisted:false,run:freshRun()}; }
  function initial() { return {version:1,active:'vision',scenes:Object.fromEntries(Object.keys(scenes).map(id=>[id,freshScene()]))}; }
  function validate(id,s) {
    const scene=scenes[id];
    for(let i=0;i<Math.max(s.sequence.length,scene.order.length);i++){
      if(s.sequence[i]!==scene.order[i])return {ok:false,index:i,kind:'order',message:s.sequence[i]?`第 ${i+1} 块首先不符合本题的数据依赖。${scene.blocks[s.sequence[i]]?.why||'未知积木。'} 应在此处放入“${scene.blocks[scene.order[i]]?.label||'流程已经结束，不需要多余积木'}”。`:`第 ${i+1} 步还缺少“${scene.blocks[scene.order[i]].label}”。先补齐数据链，再检查参数。`};
    }
    for(const c of scene.configs)if(s.config[c.key]!==c.answer)return {ok:false,index:null,kind:'config',key:c.key,message:`参数“${c.label}”${s.config[c.key]?'不符合题设':'尚未选择'}。${c.why}`};
    return {ok:true,index:null,kind:'ok',message:'积木顺序与参数符合本题。现在逐块执行，观察输入、输出和必须等待的事件。这只是本题结构检查。'};
  }
  function log(s,text,tone) { s.run.log.push({text,tone:tone||'note'});s.run.log=s.run.log.slice(-28); }
  function resetRun(s) { s.run=freshRun(); }
  function invalidate(s) { s.checked=false;resetRun(s); }
  function addBlock(id,s,block) { if(owns(scenes[id].blocks,block)&&!s.sequence.includes(block)){s.sequence.push(block);invalidate(s);return true;}return false; }
  function removeBlock(s,index) { if(Number.isInteger(index)&&index>=0&&index<s.sequence.length){s.sequence.splice(index,1);invalidate(s);return true;}return false; }
  function applyConfig(id,s,key,value) { const c=scenes[id].configs.find(x=>x.key===key);if(c&&(value===''||c.options.some(o=>o[0]===value))){if(value==='')delete s.config[key];else s.config[key]=value;invalidate(s);return true;}return false; }
  function available(id,s) { return s.checked && validate(id,s).ok; }
  function completeStep(id,s) { const scene=scenes[id],block=scene.blocks[scene.order[s.run.cursor]];log(s,`${s.run.cursor+1}. ${block.label} → ${block.output}`,'good');s.run.cursor++;s.run.waiting=null;if(s.run.cursor===scene.order.length){s.run.done=true;log(s,`本轮教学链完成。${scene.finish}`,'good');} }
  function advance(id,s) {
    const scene=scenes[id];
    if(!available(id,s)){log(s,'先完成积木和参数检查；当前不能执行。','bad');return false;}
    if(s.run.done){log(s,'本轮已完成，不重复发布完成消息。可重新演示或注入故障。');return false;}
    if(s.run.blocked){log(s,`仍被“${scene.fault.label}”阻断。修复并重新取得有效输入前不推进。`,'bad');return false;}
    if(s.run.waiting){log(s,'仍在等待当前匹配事件。重复点击执行不会跳过等待。','bad');return false;}
    const blockId=scene.order[s.run.cursor],block=scene.blocks[blockId];
    if(s.run.fault&&blockId===scene.fault.at){s.run.blocked=true;log(s,scene.fault.reason,'bad');return false;}
    if(block.event){s.run.waiting=block.event;log(s,`${s.run.cursor+1}. ${block.label}：${block.wait}`,'wait');return false;}
    completeStep(id,s);return true;
  }
  function signal(id,s,event) {
    if(!available(id,s)||s.run.blocked||s.run.done){log(s,'当前未处于可接收完成事件的有效等待阶段，忽略此事件。','bad');return false;}
    const block=scenes[id].blocks[scenes[id].order[s.run.cursor]];
    if(!s.run.waiting||event!==s.run.waiting||event!==block.event){log(s,'事件与当前等待不匹配，保持原步骤。收到消息并不等于该消息能推进当前任务。','bad');return false;}
    log(s,`收到匹配教学事件：${block.eventLabel}。此事件是本题假设，不是平台新结果。`,'note');completeStep(id,s);return true;
  }
  function inject(id,s) { resetRun(s);s.run.fault=true;log(s,`从首块重新演示，注入“${scenes[id].fault.label}”；流程与参数保留。`,'note'); }
  function repair(id,s) { if(!s.run.blocked){log(s,'尚未停在故障步骤，无可替换的故障输入。');return false;}s.run.fault=false;s.run.blocked=false;log(s,scenes[id].fault.repair,'note');return true; }
  function loadExample(id,s) { const scene=scenes[id];s.sequence=scene.order.slice();s.config=Object.fromEntries(scene.configs.map(c=>[c.key,c.answer]));s.assisted=true;invalidate(s); }
  function restoreState(raw) {
    const data=initial();if(!raw||raw.version!==1)return data;
    if(typeof raw.active==='string'&&owns(scenes,raw.active))data.active=raw.active;
    Object.keys(scenes).forEach(id=>{
      const saved=raw.scenes?.[id],s=data.scenes[id],scene=scenes[id];if(!saved||typeof saved!=='object')return;
      if(Array.isArray(saved.sequence))s.sequence=[...new Set(saved.sequence.filter(x=>typeof x==='string'&&owns(scene.blocks,x)))].slice(0,scene.palette.length);
      scene.configs.forEach(c=>{if(c.options.some(o=>o[0]===saved.config?.[c.key]))s.config[c.key]=saved.config[c.key];});
      s.assisted=saved.assisted===true;s.checked=saved.checked===true;
      const r=saved.run;if(!r||!available(id,s)||!Number.isInteger(r.cursor)||r.cursor<0||r.cursor>scene.order.length)return;
      const expected=scene.blocks[scene.order[r.cursor]];s.run.cursor=r.cursor;s.run.fault=r.fault===true;s.run.blocked=r.blocked===true&&s.run.fault&&scene.order[r.cursor]===scene.fault.at;
      s.run.waiting=!s.run.blocked&&typeof r.waiting==='string'&&expected?.event===r.waiting?r.waiting:null;
      s.run.done=r.done===true&&r.cursor===scene.order.length&&!s.run.fault;
      if(r.cursor===scene.order.length&&!s.run.done){s.run=freshRun();return;}
      if(s.run.fault&&r.cursor>scene.order.indexOf(scene.fault.at)){s.run=freshRun();return;}
      s.run.log=Array.isArray(r.log)?r.log.filter(x=>x&&typeof x.text==='string').slice(-28).map(x=>({text:x.text.slice(0,600),tone:['good','bad','wait','note'].includes(x.tone)?x.tone:'note'})):[];
    });return data;
  }
  function questionText(data) {
    const id=data.active,scene=scenes[id],s=data.scenes[id],verdict=validate(id,s),r=s.run;
    const studyIds={vision:'S03',navigation:'S04 + S05',grasp:'S06 + S07 + S08 + S09'};
    return `我在 ICAN 学习站“超级速通看板”的积木实验室学习，请按下面上下文接续讲解，不操控平台。\n仓库：https://github.com/Iuosixsix/ican-embodied-ai-2026\n读取分支：codex/super-sprint-dashboard（不要只读旧 main；若已合并，请确认 main 包含新版超级速通资料）。\n阅读顺序：先 CHAT_SUPER_START.md，再 备赛工作台/19_超级速通_Chat辅导手册.md；按需读取 README.md、CHAT_CONTEXT.md 和对应指导书。\n本场景对应学习编号：${studyIds[id]}。编号只是学习主题映射，不代表实训平台当前状态。\n场景：${scene.title}\n题设：${scene.brief}\n我的顺序：${s.sequence.map((b,i)=>`${i+1}.${scene.blocks[b].label}`).join(' → ')||'尚未拼接'}\n参数：${scene.configs.map(c=>`${c.label}=${c.options.find(o=>o[0]===s.config[c.key])?.[1]||'未选'}`).join('；')}\n检查：${s.checked?verdict.message:'尚未检查'}\n教学进度：${r.cursor}/${scene.order.length} 块已完成；${r.done?'教学链结束':r.blocked?'被故障阻断':r.waiting?'正在等待 '+r.waiting:'可继续演示'}。\n最近日志：${r.log.slice(-4).map(x=>x.text).join('\n')||'无'}\n是否载入示例或展开答案：${s.assisted?'是':'尚未载入示例或展开答案；检查反馈可能已提供提示'}\n请先用“输入 → 积木做什么 → 输出 → 等待谁”的方式解释我卡住的部分，再给一个换题小练习。这里是离线教学状态，不是平台成绩；任务14由我重置后的配置尚未由代理复核。\n我不懂的是：（在这里补充）`;
  }
  let mountCounter=0;
  const mounted=typeof WeakMap!=='undefined'?new WeakMap():null;
  function mount(container) {
    if(!container||typeof container.addEventListener!=='function')throw new Error('IcanSprintBlocks.mount requires a DOM container');
    mounted?.get(container)?.destroy();
    const prefix='sb-'+(++mountCounter);let data=initial(),storageOk=true,resetPending=false,showQuestion=false,destroyed=false;
    try{data=restoreState(JSON.parse(global.localStorage.getItem(KEY)||'null'));}catch(_){storageOk=false;}
    function persist(){try{global.localStorage.setItem(KEY,JSON.stringify(data));storageOk=true;}catch(_){storageOk=false;}}
    function btn(action,text,extra){return `<button type="button" data-sb-action="${action}" ${extra||''}>${text}</button>`;}
    function render(focus){
      const id=data.active,scene=scenes[id],s=data.scenes[id],r=s.run,v=validate(id,s),ready=available(id,s),current=scene.blocks[scene.order[r.cursor]],last=r.cursor?scene.blocks[scene.order[r.cursor-1]]:null;
      container.innerHTML=`<section class="sprint-blocks sb-${scene.color}" aria-label="三方向积木实验室"><header class="sb-header"><span class="sb-eyebrow">动手拼 · 看数据 · 等事件</span><h2>不用写代码，也要看懂积木之间传了什么</h2><p>每个场景先拼流程，再选关键参数；检查后可逐步运行教学数据、注入故障。按钮支持键盘操作，无需拖拽。</p></header><div class="sb-tabs" role="tablist" aria-label="选择积木场景">${Object.entries(scenes).map(([key,item])=>`<button type="button" role="tab" id="${prefix}-${key}" aria-selected="${id===key}" aria-controls="${prefix}-panel" data-sb-action="tab" data-sb-id="${key}"><strong>${item.short}</strong><small>${item.role}${data.scenes[key].run.done?' · 教学链已走完':''}</small></button>`).join('')}</div><div id="${prefix}-panel" role="tabpanel" aria-labelledby="${prefix}-${id}"><div class="sb-brief"><h3>${esc(scene.title)}</h3><p>${esc(scene.brief)}</p><p class="sb-boundary">${esc(scene.boundary)}</p><a href="${scene.source}">${esc(scene.sourceLabel)}</a></div><div class="sb-toolbar">${btn('example','时间紧：载入讲解示例')}${btn('check','检查积木与参数','class="sb-primary"')}${btn('undo','撤销末块',s.sequence.length?'':'disabled')}${btn('ask','把当前问题带到 Chat')}</div><p class="sb-small">${s.assisted?'本场景已使用示例或答案；不能据此记作独立掌握。':'你可以自己拼接，也可以载入示例后逐步观察；它们都不会记为平台实测。'} 修改积木或参数会重新开始本场景演示。</p><div class="sb-builder"><div class="sb-palette"><h3>① 积木盒 <small>含常见错误块</small></h3><p class="sb-small">点击加入右侧。下列顺序是打散的；先想输入来自哪里。</p>${scene.palette.map(blockId=>{const b=scene.blocks[blockId];return `<button type="button" data-sb-action="add" data-sb-id="${blockId}" ${s.sequence.includes(blockId)?'disabled':''}><strong>${esc(b.label)}</strong><span>输入：${esc(b.input)}</span></button>`;}).join('')}</div><div class="sb-workspace"><h3>② 我的流程 <small>${s.sequence.length} 块</small></h3>${s.sequence.length?`<ol class="sb-chain">${s.sequence.map((blockId,i)=>{const b=scene.blocks[blockId],wrong=s.checked&&!v.ok&&v.kind==='order'&&v.index===i;return `<li class="${wrong?'sb-wrong':''} ${ready&&i<r.cursor?'sb-passed':''} ${ready&&!r.done&&i===r.cursor?'sb-current':''}"><div class="sb-block-top"><b>${i+1}</b><strong>${esc(b.label)}</strong></div><div class="sb-io"><span>入：${esc(b.input)}</span><span>出：${esc(b.output)}</span></div><div class="sb-reorder">${btn('up','↑ 上移',`data-sb-index="${i}" ${i===0?'disabled':''} aria-label="上移第 ${i+1} 块"`)}${btn('down','↓ 下移',`data-sb-index="${i}" ${i===s.sequence.length-1?'disabled':''} aria-label="下移第 ${i+1} 块"`)}${btn('remove','移除',`data-sb-index="${i}" aria-label="移除第 ${i+1} 块"`)}</div></li>`;}).join('')}</ol>`:'<div class="sb-empty">流程还是空的。加入第一块，或载入示例后观察。</div>'}</div></div><fieldset class="sb-config"><legend>③ 关键参数：同一套积木，填错值也会出错</legend>${scene.configs.map(c=>`<label for="${prefix}-config-${c.key}"><span>${esc(c.label)}</span><select id="${prefix}-config-${c.key}" data-sb-config="${c.key}"><option value="">请选择</option>${c.options.map(o=>`<option value="${o[0]}" ${s.config[c.key]===o[0]?'selected':''}>${esc(o[1])}</option>`).join('')}</select></label>`).join('')}</fieldset>${s.checked?`<div class="sb-feedback ${v.ok?'good':'bad'}" role="status"><strong>${v.ok?'本题结构正确':'先修复这一处'}</strong> ${esc(v.message)}</div>`:''}<details data-sb-answer="true"><summary>查看本题标准顺序与概念解释</summary><div class="sb-answer">${scene.order.map((blockId,i)=>{const b=scene.blocks[blockId];return `<p><strong>${i+1}. ${esc(b.label)}</strong><br>${esc(b.why)}</p>`;}).join('')}<p><strong>参数答案：</strong>${scene.configs.map(c=>`${esc(c.label)}：${esc(c.options.find(o=>o[0]===c.answer)[1])}。${esc(c.why)}`).join('<br>')}</p><p>顺序检查只针对本题给出的线性教学合同。实际系统可拆分、并行或复用模块，应以真实题面和数据依赖为准。</p></div></details><div class="sb-runner"><div class="sb-run-status"><h3>④ 逐块执行：观察数据在流动</h3><p class="sb-run-count">${r.cursor} / ${scene.order.length} <small>块已完成</small></p><div class="sb-badges"><span>${!ready?'先完成结构检查':r.done?'本轮教学链结束':r.blocked?'故障阻断':r.waiting?'等待匹配事件':'下一块可执行'}</span>${r.fault?`<span class="sb-fault-badge">已注入：${esc(scene.fault.label)}</span>`:''}</div><dl><dt>当前步骤</dt><dd>${r.done?'本轮已结束':current?esc(current.label):'尚未开始'}</dd><dt>当前手中已有的数据</dt><dd>${last?esc(last.output):'只有题设资源，尚未完成任何积木'}</dd><dt>为什么停在这里</dt><dd>${!ready?'先检查完整流程与参数。':r.blocked?esc(scene.fault.reason):r.waiting?esc(current.wait):r.done?esc(scene.finish):'点击“执行下一块”，查看它是否需要等待外部事件。'}</dd></dl></div><div class="sb-run-controls">${btn('step','执行下一块',`class="sb-primary" ${!ready||r.done||r.blocked||r.waiting?'disabled':''}`)}${r.waiting?btn('event',`${esc(current.eventLabel)}<small>我提供的是本题假设数据，不是平台实测</small>`,`class="sb-event" data-sb-event="${r.waiting}" ${r.blocked?'disabled':''}`):''}${btn('wrong-event','试发不匹配事件',!ready||r.done?'disabled':'')}${btn('fault',`注入故障：${esc(scene.fault.label)}<small>从首块重演，保留积木和参数</small>`,!ready?'disabled':'')}${btn('repair','教学修复：用新有效输入重试<small>不自动跳过此步，下一次点击重新执行</small>',r.blocked?'':'disabled')}${btn('restart','重新演示当前流程',!ready?'disabled':'')}</div></div><div class="sb-log-wrap"><h3>执行记录 <small>最近 28 条</small></h3>${r.log.length?`<ol class="sb-log" aria-live="polite">${r.log.slice().reverse().map(item=>`<li class="${item.tone}">${esc(item.text)}</li>`).join('')}</ol>`:'<p class="sb-empty">尚未执行。通过结构检查后，试一遍正常流程，再注入一次故障。</p>'}</div></div>${showQuestion?`<div class="sb-chat"><h3>复制给 Chat，接着问不懂的地方</h3><p>已包含当前场景、配置、等待状态与最近日志。可选中文本后复制，并补上你的问题。</p><textarea readonly data-sb-question aria-label="可复制的 Chat 提问上下文">${esc(questionText(data))}</textarea>${btn('select-question','选中提问文本')}</div>`:''}<footer class="sb-footer"><p>本地自动保存：<code>${KEY}</code>。与旧版学习进度、任务14沙盘、字体设置分开保存；不包含在旧版“导出学习进度”中。更换浏览器或文件来源可能无法读取原记录。</p>${!storageOk?'<p class="sb-storage" role="alert">当前浏览器未允许保存，本页仍可练习；刷新后可能无法恢复，请先复制需要保留的提问文本。</p>':''}${btn('confirm-reset','仅清空这套积木实验室')}${resetPending?`<div class="sb-reset"><p>确认清空三个场景的本地拼接和演示记录？不影响原学习站记录，也不影响实训页。</p>${btn('reset','确认清空三个场景')}${btn('cancel-reset','保留记录')}</div>`:''}</footer></section>`;
      if(focus){const el=container.querySelector(focus);if(el?.focus)el.focus({preventScroll:true});}
    }
    function onClick(event){
      const target=event.target?.closest?.('[data-sb-action]');if(!target||!container.contains(target)||target.disabled)return;
      const action=target.getAttribute('data-sb-action'),id=data.active,s=data.scenes[id];let focus=null;
      if(action==='tab'){const next=target.getAttribute('data-sb-id');if(!owns(scenes,next))return;data.active=next;resetPending=false;focus=`#${prefix}-${next}`;}
      else if(action==='add'){addBlock(id,s,target.getAttribute('data-sb-id'));}
      else if(action==='undo'){removeBlock(s,s.sequence.length-1);}
      else if(action==='remove'){removeBlock(s,Number(target.getAttribute('data-sb-index')));}
      else if(action==='up'||action==='down'){const index=Number(target.getAttribute('data-sb-index')),next=index+(action==='up'?-1:1);if(Number.isInteger(index)&&index>=0&&index<s.sequence.length&&next>=0&&next<s.sequence.length){[s.sequence[index],s.sequence[next]]=[s.sequence[next],s.sequence[index]];invalidate(s);}}
      else if(action==='example'){loadExample(id,s);focus='[data-sb-action="check"]';}
      else if(action==='check'){s.checked=true;focus='[data-sb-action="check"]';}
      else if(action==='step'){advance(id,s);focus=s.run.waiting?'[data-sb-action="event"]':'[data-sb-action="step"]';}
      else if(action==='event'){signal(id,s,target.getAttribute('data-sb-event'));focus='[data-sb-action="step"]';}
      else if(action==='wrong-event'){signal(id,s,'unrelated_event');focus='[data-sb-action="wrong-event"]';}
      else if(action==='fault'){inject(id,s);focus='[data-sb-action="step"]';}
      else if(action==='repair'){repair(id,s);focus='[data-sb-action="step"]';}
      else if(action==='restart'){resetRun(s);focus='[data-sb-action="step"]';}
      else if(action==='ask'){showQuestion=true;focus='[data-sb-question]';}
      else if(action==='select-question'){const field=container.querySelector('[data-sb-question]');if(field){field.focus();field.select();}return;}
      else if(action==='confirm-reset'){resetPending=true;focus='[data-sb-action="cancel-reset"]';}
      else if(action==='cancel-reset'){resetPending=false;focus='[data-sb-action="confirm-reset"]';}
      else if(action==='reset'){if(!resetPending)return;data=initial();resetPending=false;showQuestion=false;focus=`#${prefix}-vision`;}
      else return;
      persist();render(focus);
    }
    function onChange(event){const el=event.target,key=el?.getAttribute?.('data-sb-config');if(key&&applyConfig(data.active,data.scenes[data.active],key,el.value)){persist();render(`#${prefix}-config-${key}`);}}
    function onToggle(event){const details=event.target;if(details?.hasAttribute?.('data-sb-answer')&&details.open){data.scenes[data.active].assisted=true;persist();}}
    container.addEventListener('click',onClick);container.addEventListener('change',onChange);container.addEventListener('toggle',onToggle,true);render();
    const api={getState:()=>clone(data),questionText:()=>questionText(data),destroy:()=>{if(destroyed)return;destroyed=true;container.removeEventListener('click',onClick);container.removeEventListener('change',onChange);container.removeEventListener('toggle',onToggle,true);mounted?.delete(container);}};
    mounted?.set(container,api);return api;
  }
  global.IcanSprintBlocks={mount,storageKey:KEY,version:1};
  if(typeof module!=='undefined'&&module.exports)module.exports={scenes,initial,restoreState,validate,advance,signal,inject,repair,loadExample,addBlock,removeBlock,applyConfig,resetRun,questionText,mount};
})(typeof window!=='undefined'?window:globalThis);
