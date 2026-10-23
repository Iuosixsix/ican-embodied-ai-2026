/* Offline practice hub. All screenshots are archived evidence; no platform connection. */
(() => {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url = p => encodeURI(p).replace(/#/g,'%23').replace(/\?/g,'%3F');
  window.IcanOffline = {
    mount(container, evidence, part = 'task14') {
      const active = ['task14','mock','evidence'].includes(part) ? part : 'task14';
      container.innerHTML = `<div class="offline-hub"><div class="offline-intro"><div><span class="tag blue">赛前 · 离线交互练习</span><h1>把任务动手走一遍</h1><p>先在这里试错，再到仍可用的任务14验证。图解、选择、配置和回调都可反复练习。</p></div><div class="offline-fact"><strong>${esc(evidence?.counts?.account_screenshots ?? 0)}</strong><span>历史平台截图保留</span></div></div><div class="note amber">你已报告任务14重置并保留页面。旧截图代表重置前演示；当前配置与新结果尚未核验。本页是教学规则演练，不会连接平台，也不产生仿真成绩。</div><nav class="offline-tabs" aria-label="互动练习分类">${[['task14','01','任务14 · 集成练习'],['mock','02','模拟考场 · 动手作答'],['evidence','03','截图回放 · 查配置']].map(([id,n,label])=>`<a href="#lab/${id}" class="${active===id?'active':''}" ${active===id?'aria-current="page"':''}><small>${n}</small>${label}</a>`).join('')}</nav><div id="offline-workspace"></div><div class="offline-bottom"><a href="#article/offline-practice">使用说明与材料覆盖</a><a href="#article/mock-exam">完整A卷文字题</a><a href="#article/mock-answers">A卷标准答案</a><a href="#article/task14-guide">任务14完整搭建攻略</a></div></div>`;
      const target=container.querySelector('#offline-workspace');
      if(active==='task14') window.IcanTask14.mount(target);
      else if(active==='mock') window.IcanMockLab.mount(target);
      else this.gallery(target,evidence);
    },
    gallery(container,evidence) {
      let task='14', mode='curated', query='';
      const archive=evidence.archive||[], curated=evidence.items||[];
      container.innerHTML=`<section class="offline-gallery"><div class="section-head"><h2>看得到当时怎样配置、哪里失败</h2></div><p>精选图附有解释；完整归档按文件名检索。点图可放大，原图里的参数、遮挡和截断均保留。配置已保存、训练完成、报告成功是不同证据。</p><div class="offline-gallery-controls"><label>任务<select id="evidence-task"><option value="all">全部任务</option>${[1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(n=>`<option value="${n}" ${n===14?'selected':''}>任务 ${n}</option>`).join('')}<option value="other">课程与环境</option></select></label><label>显示<select id="evidence-mode"><option value="curated">精选讲解</option><option value="archive">全部 ${archive.length} 张平台截图</option></select></label><label class="offline-query">检索<input id="evidence-query" type="search" placeholder="如：节点、报告、保存、task14"></label></div><p id="evidence-count" role="status"></p><div id="offline-gallery-grid" class="offline-gallery-grid"></div><div class="note">第三方提取图片另保留在各题原文中：<a href="#article/practice-guide">任务1—12参考</a> · <a href="#article/task14-guide">任务14参考及纠错</a>。本图库专列本账号历史截图，避免把第三方成绩混进来。</div></section>`;
      const draw=()=>{
        const list=(mode==='archive'?archive:curated).filter(x=>(task==='all'||(task==='other'?x.task==null:String(x.task)===task))&&(!query||`${x.title} ${x.caption||''} ${x.path}`.toLowerCase().includes(query.toLowerCase())));
        container.querySelector('#evidence-count').textContent=`找到 ${list.length} 张${mode==='archive'?'归档':'精选'}截图${task==='14'?' · 均为重置前证据':''}`;
        container.querySelector('#offline-gallery-grid').innerHTML=list.length?list.map(x=>`<article class="offline-shot"><a data-image="true" href="${esc(url(x.path))}" aria-label="放大：${esc(x.title)}"><img src="${esc(url(x.path))}" loading="lazy" alt="${esc(x.title)}"><span class="offline-zoom">点击放大 ↗</span></a><div><span class="tag">${x.task?'任务'+esc(x.task):'课程与环境'} · ${esc(x.kind||'本账号历史实测')}</span><h3>${esc(x.title)}</h3><p>${esc(x.caption||'归档原图，尚未逐张增加讲解；以同题文字报告和来源日期解释，不由文件名推定已通过。')}</p>${x.warning?`<p class="offline-shot-warning">${esc(x.warning)}</p>`:''}<a href="${esc(url(x.path))}" target="_blank" rel="noopener">在新页看原图</a> ${x.task?`<a href="#task/${x.task}">本题讲义与报告</a>`:''}</div></article>`).join(''):'<div class="empty-state">没有匹配截图，试试全部任务或更短关键词。</div>';
      };
      container.querySelector('#evidence-task').onchange=e=>{task=e.target.value;draw();};
      container.querySelector('#evidence-mode').onchange=e=>{mode=e.target.value;draw();};
      container.querySelector('#evidence-query').oninput=e=>{query=e.target.value;draw();};
      draw();
    }
  };
})();
