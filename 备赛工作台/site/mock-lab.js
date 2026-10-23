/* Offline practice derived from the original mock A paper. No platform calls. */
(() => {
  'use strict';
  const KEY = 'ican-mock-lab-v1';
  const mounted = new WeakMap();
  const names = ['home', 'stage', 'pick', 'place'];
  const waypointInfo = {
    home: {label: '起点', xy: [1, 1], target: [2, 1], yaw: 0},
    stage: {label: '表演区', xy: [3, 1], target: [3, 0], yaw: -Math.PI / 2},
    pick: {label: '取物台', xy: [3, 6], target: [3, 7], yaw: Math.PI / 2},
    place: {label: '放置台', xy: [9, 6], target: [10, 6], yaw: 0}
  };
  const box = {x: [3.6, 6.4], y: [2.6, 5.4]};
  const faults = [
    {id: 'f1', title: '点云有了，机械臂仍未收到目标', log: '分类正确 → 掩码非空 → 目标点云非空 → grasp_candidates=[] → 尚未向机械臂发目标',
      stages: ['导航到达', '合理抓取候选生成／筛选', '轨迹实际执行'], stage: '1',
      steps: ['统一增加规划时间到 5 秒', '核对选中实例、深度配准、点云范围、6D输入及候选过滤', '直接把物体中心作为夹爪姿态'], next: '1',
      answer: '最早可确认的是“合理抓取候选未产生”。非空点云只证明有数据，不证明裁剪、单位或几何都正确。先检查候选之前的数据链；候选存在后，才继续看IK和规划。复验应出现合理候选，并继续验证可达与执行，不能仅凭非空宣布抓取成功。',
      evidence: '旧实测中任务11／12部分对象确实没有合理位姿；这段日志是原创合成，不能据此为真实失败认定唯一根因。'},
    {id: 'f2', title: '目标可解，规划器却超时', log: '候选有效 → 坐标系核对通过 → 目标IK可解 → planner_status=TIMEOUT → 未执行轨迹',
      stages: ['实例分类', '目标IK求解', '路径规划'], stage: '2',
      steps: ['先检查碰撞、约束、起始状态及路径可行性，再做受控规划预算对照', '把成功消息设成 true 让流程继续', '只要IK能解就跳过碰撞检查'], next: '0',
      answer: '目标IK可解只说明终点关节解存在；从当前状态到终点的无碰撞路径仍可能找不到。日志最早确认的失败是规划超时。先核对规划组、末端、起始状态、障碍与约束；在这些合理后可调整预算，但必须实际得到有效轨迹并验证执行。',
      evidence: '任务12历史曾把规划时间从3改为5，但对照报告没有读取。不能把“5就能修好”当实测结论；本案例的TIMEOUT也是合成题设。'},
    {id: 'f3', title: '已经到点，主控却停在状态3', log: 'nav忙 → 位置和朝向均合格 → nav_finish_callback没有被调用 → master仍停在3',
      stages: ['导航完成反馈／回调链路', '6D候选模型', '关节限位'], stage: '0',
      steps: ['重新训练视觉网络', '检查到达回调绑定、话题／字段／类型和主控等待阶段，追踪一次匹配的完成事件', '不看状态，定时强制 state += 1'], next: '1',
      answer: '到点和到点事件被主控收到是两件事。先沿“完成条件→回调→发布→订阅→当前阶段判断”查消息链。复验要求正确事件只推动一次正确状态；正常等待中且尚未超时，不能自行判失败，更不能盲目加状态。',
      evidence: '这是用于练任务14消息与回调的原创故障，不宣称旧实测曾出现这一完全相同的日志。实际平台字段须按本题接口核对。'},
    {id: 'f4', title: '空抓也发出了成功', log: 'move回调 → 闭爪函数执行 → object_attached=false → master仍收到true → 进入6',
      stages: ['地图分辨率', '物体夹持结果与成功反馈语义', '图像加载'], stage: '1',
      steps: ['函数执行过便算完成，不再检查', '增大检测置信度后直接交卷', '停止推进，核对夹持／执行结果如何映射到完成消息；失败进入失败分支'], next: '2',
      answer: '本合成接口明确报告未夹持，却把动作回调当成成功发送，最早明确矛盾在“夹持结果→成功反馈”。执行闭爪≠抓住物体。复验需先证明夹持成立，再发送对应成功；失败不能推进到搬运阶段。',
      evidence: '旧任务14报告中“函数执行”与实际抓放成功确实不等价；但object_attached是本题合成字段，不承诺真实平台有同名传感器或按钮。'}
  ];
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
  const valueNum = value => String(value).trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : null;
  const shortAngle = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const near = (a, b, tolerance = 0.001) => a !== null && Math.abs(a - b) <= tolerance + 1e-10;
  const fmt = (n, digits = 3) => Number(n).toFixed(digits).replace(/\.?0+$/, '') || '0';
  const inMap = point => point && point[0] >= 0 && point[0] <= 12 && point[1] >= 0 && point[1] <= 8;
  function segmentHitsBox(a, b, rect = box) {
    let low = 0, high = 1;
    for (let axis = 0; axis < 2; axis++) {
      const limits = axis ? rect.y : rect.x, delta = b[axis] - a[axis];
      if (Math.abs(delta) < 1e-12) { if (a[axis] < limits[0] || a[axis] > limits[1]) return false; }
      else {
        const t1 = (limits[0] - a[axis]) / delta, t2 = (limits[1] - a[axis]) / delta;
        low = Math.max(low, Math.min(t1, t2)); high = Math.min(high, Math.max(t1, t2));
        if (low > high + 1e-12) return false;
      }
    }
    return true;
  }
  function emptyNav() {
    return {selected: 'home', points: Object.fromEntries(names.map(name => [name, {x: '', y: '', yaw: ''}])), returnMode: 'direct', returnX: '', returnY: '', checked: false, example: false};
  }
  function defaults() {
    return {version: 1, tab: 'motion', motion: {model: '', reasonB: '', reasonC: '', checked: false}, vision: {target: '', checked: false}, coordinate: {cx: '', cy: '', cz: '', bx: '', by: '', bz: '', tf: '', checked: false}, nav: emptyNav(), fault: {selected: 'f1', answers: Object.fromEntries(faults.map(f => [f.id, {stage: '', next: '', checked: false}]))}};
  }
  function loadState() {
    const state = defaults();
    try {
      const old = JSON.parse(localStorage.getItem(KEY));
      if (!old || old.version !== 1) return state;
      if (['motion', 'navigation', 'faults'].includes(old.tab)) state.tab = old.tab;
      for (const group of ['motion', 'vision', 'coordinate']) {
        for (const key of Object.keys(state[group])) {
          const val = old[group] && old[group][key];
          if (key === 'checked') state[group][key] = val === true;
          else if (typeof val === 'string') state[group][key] = val.slice(0, 120);
        }
      }
      if (old.nav) {
        if (names.includes(old.nav.selected)) state.nav.selected = old.nav.selected;
        if (old.nav.returnMode === 'via') state.nav.returnMode = 'via';
        for (const key of ['returnX', 'returnY']) if (typeof old.nav[key] === 'string') state.nav[key] = old.nav[key].slice(0, 40);
        state.nav.checked = old.nav.checked === true; state.nav.example = old.nav.example === true;
        for (const name of names) for (const key of ['x', 'y', 'yaw']) {
          const val = old.nav.points && old.nav.points[name] && old.nav.points[name][key];
          if (typeof val === 'string') state.nav.points[name][key] = val.slice(0, 40);
        }
      }
      if (old.fault) {
        if (faults.some(f => f.id === old.fault.selected)) state.fault.selected = old.fault.selected;
        for (const f of faults) {
          const answer = old.fault.answers && old.fault.answers[f.id];
          if (answer) {
            for (const key of ['stage', 'next']) if (['', '0', '1', '2'].includes(answer[key])) state.fault.answers[f.id][key] = answer[key];
            state.fault.answers[f.id].checked = answer.checked === true;
          }
        }
      }
    } catch (_) { /* A damaged or unavailable store never prevents offline use. */ }
    return state;
  }
  function selectOptions(options, selected) {
    return '<option value="">请选择</option>' + options.map(([value, label]) => `<option value="${esc(value)}"${selected === value ? ' selected' : ''}>${esc(label)}</option>`).join('');
  }
  const notice = (ok, title, body) => `<div class="iml-feedback ${ok ? 'iml-good' : 'iml-review'}" role="status"><strong>${esc(title)}</strong><p>${esc(body)}</p></div>`;
  const numberField = (label, bind, value, options = '') => `<label class="iml-field"><span>${esc(label)}</span><input type="number" inputmode="decimal" step="any" data-bind="${esc(bind)}" value="${esc(value)}" ${options}></label>`;
  function pointOf(nav, name) {
    const raw = nav.points[name], x = valueNum(raw.x), y = valueNum(raw.y);
    return x !== null && y !== null ? [x, y] : null;
  }
  function navSegments(nav) {
    const points = names.map(name => ({name, point: pointOf(nav, name)}));
    if (nav.returnMode === 'via') {
      const x = valueNum(nav.returnX), y = valueNum(nav.returnY);
      points.push({name: '返航中途点', point: x !== null && y !== null ? [x, y] : null});
    }
    points.push({name: 'home', point: pointOf(nav, 'home')});
    const segments = [];
    for (let index = 1; index < points.length; index++) {
      const from = points[index - 1], to = points[index];
      segments.push({from: from.name, to: to.name, a: from.point, b: to.point, complete: !!(from.point && to.point), hit: from.point && to.point ? segmentHitsBox(from.point, to.point) : false});
    }
    return segments;
  }
  function navAssessment(nav) {
    const rows = names.map(name => {
      const point = pointOf(nav, name), yaw = valueNum(nav.points[name].yaw), expected = waypointInfo[name];
      const distance = point ? Math.hypot(point[0] - expected.xy[0], point[1] - expected.xy[1]) : null;
      const angle = yaw === null ? null : shortAngle(yaw, expected.yaw);
      const blocked = point ? segmentHitsBox(point, point) : false;
      const okay = inMap(point) && !blocked && distance <= 0.2 + 1e-10 && angle !== null && angle <= 0.15 + 1e-10;
      return {name, point, yaw, distance, angle, blocked, okay};
    });
    const segments = navSegments(nav);
    const via = nav.returnMode !== 'via' || inMap([valueNum(nav.returnX) === null ? NaN : valueNum(nav.returnX), valueNum(nav.returnY) === null ? NaN : valueNum(nav.returnY)]);
    const routeOkay = ['direct', 'via'].includes(nav.returnMode) && via && segments.every(s => s.complete && inMap(s.a) && inMap(s.b) && !s.hit);
    return {rows, segments, routeOkay, okay: routeOkay && rows.every(r => r.okay)};
  }
  function mapSvg(nav) {
    const mapPoint = p => [40 + p[0] * 50, 430 - p[1] * 50];
    const grid = [];
    for (let x = 0; x <= 12; x++) grid.push(`<line x1="${40 + x * 50}" y1="30" x2="${40 + x * 50}" y2="430"/><text x="${40 + x * 50}" y="449">${x}</text>`);
    for (let y = 0; y <= 8; y++) grid.push(`<line x1="40" y1="${430 - y * 50}" x2="640" y2="${430 - y * 50}"/><text x="24" y="${435 - y * 50}">${y}</text>`);
    const segments = navSegments(nav).filter(s => s.complete && inMap(s.a) && inMap(s.b)).map(s => {
      const a = mapPoint(s.a), b = mapPoint(s.b);
      return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="iml-route ${nav.checked ? (s.hit ? 'iml-route-bad' : 'iml-route-good') : ''}"/>`;
    }).join('');
    const marks = names.map(name => {
      const point = pointOf(nav, name); if (!inMap(point)) return '';
      const [x, y] = mapPoint(point), yaw = valueNum(nav.points[name].yaw), active = nav.selected === name;
      const arrow = yaw === null ? '' : `<line x1="${x}" y1="${y}" x2="${x + 28 * Math.cos(yaw)}" y2="${y - 28 * Math.sin(yaw)}" class="iml-heading"/><circle cx="${x + 28 * Math.cos(yaw)}" cy="${y - 28 * Math.sin(yaw)}" r="3" class="iml-arrow-tip"/>`;
      return `<g class="iml-point${active ? ' iml-selected-point' : ''}">${arrow}<circle cx="${x}" cy="${y}" r="${active ? 9 : 7}"/><text x="${Math.min(x + 11, 590)}" y="${Math.max(y - 12, 21)}">${name}</text></g>`;
    }).join('');
    let viaMark = '';
    if (nav.returnMode === 'via') {
      const x = valueNum(nav.returnX), y = valueNum(nav.returnY);
      if (x !== null && y !== null && inMap([x, y])) { const p = mapPoint([x, y]); viaMark = `<circle cx="${p[0]}" cy="${p[1]}" r="6" class="iml-via"/><text x="${Math.min(p[0] + 10, 590)}" y="${Math.max(20, p[1] - 10)}" class="iml-via-label">返航点</text>`; }
    }
    return `<svg class="iml-map" data-map="true" viewBox="0 0 665 466" role="img" aria-label="可点击的原创12米乘8米教学地图，x向右、y向上；也可用地图下方数字输入摆点。"><rect x="40" y="30" width="600" height="400" class="iml-map-floor"/><g class="iml-grid">${grid.join('')}</g><rect x="220" y="160" width="140" height="140" class="iml-inflation"/><rect x="240" y="180" width="100" height="100" class="iml-obstacle"/><text x="290" y="225" class="iml-obstacle-label">实体障碍</text><text x="290" y="247" class="iml-obstacle-label">4–6 × 3–5</text>${segments}${marks}${viaMark}<text x="633" y="465" class="iml-axis">x / m →</text><text x="42" y="18" class="iml-axis">↑ y / m</text></svg>`;
  }
  function motionContent(state) {
    const m = state.motion, v = state.vision, c = state.coordinate;
    const motionOkay = m.model === 'A' && m.reasonB === 'budget' && m.reasonC === 'completion';
    const values = ['cx', 'cy', 'cz', 'bx', 'by', 'bz'].map(k => valueNum(c[k]));
    const expected = [0.1, 0, 1, 0.3, 0, 1.5];
    const coordinateOkay = values.every((n, i) => near(n, expected[i])) && c.tf === 'direct';
    const modelChoices = [
      ['A', '100M', '100% / 100% / 100%', '7.1% / 7.4% / 7.8%'],
      ['B', '200M', '100% / 100% / 100%', '5.2% / 5.4% / 5.6%'],
      ['C', '100M', '100% / 92% / 100%', '6.2% / 6.0% / 6.4%']
    ];
    return `<div class="iml-stack"><section class="iml-card"><div class="iml-card-heading"><span class="iml-label">M2 · 选模型</span><h3>偏差更小，就一定更好吗？</h3></div><p>每一段完成率都要100%，每段归一化偏差≤8%，训练预算≤100M。选模型，再解释为何排除另外两组。</p><fieldset class="iml-choice-grid"><legend>模型候选（原创模拟评估表）</legend>${modelChoices.map(row => `<label class="iml-choice"><input type="radio" name="iml-model" value="${row[0]}" data-bind="motion.model"${m.model === row[0] ? ' checked' : ''}><span><strong>模型 ${row[0]}</strong><small>步数 ${row[1]}</small><small>完成 ${row[2]}</small><small>偏差 ${row[3]}</small></span></label>`).join('')}</fieldset><div class="iml-two"><label class="iml-field"><span>B的决定性问题</span><select data-bind="motion.reasonB">${selectOptions([['budget', '训练步数超过预算'], ['deviation', '偏差超过8%'], ['all', '所有条件都合格']], m.reasonB)}</select></label><label class="iml-field"><span>C的决定性问题</span><select data-bind="motion.reasonC">${selectOptions([['budget', '训练步数超过预算'], ['completion', '第二段完成率不足100%'], ['deviation', '每段偏差都太大']], m.reasonC)}</select></label></div><div class="iml-actions"><button type="button" data-action="check-motion">核对模型决策</button><button type="button" class="iml-secondary" data-action="reset-motion">重做本题</button></div><div data-feedback="motion">${m.checked ? notice(motionOkay, motionOkay ? '三项决策符合本卷约束' : '还有约束没有同时满足', '参考答案是A；B超出100M预算，C第二段只有92%。这只是纸面选型，仍要看摔倒、抖动、关节限位、自碰撞及阶段完成。') : ''}</div><details class="iml-answer"><summary>作答后查看概念与答案</summary><p><strong>标准选择A。</strong> 验收是三个条件的“且”，不能用平均值掩盖某段失败，也不能让偏差更小覆盖预算超限。实际机器人还要匹配关节顺序、观察量、动作空间和动力学；H1的权重不能直接当G1的权重。</p><p>训练完成、推理结束、动作成功、用户会独立搭建，是四种不同证据。本题模型表是人工构造数据，不是旧平台的三次舞蹈报告。</p></details></section>
    <section class="iml-card"><div class="iml-card-heading"><span class="iml-label">V1 · 选目标</span><h3>收到“取水壶”，你把哪一个交给抓取链？</h3></div><p>阈值0.50。先匹配指令类别，再看置信度，不能只选全图最高分。</p><fieldset class="iml-choice-grid"><legend>检测输出</legend>${[['d1', '水壶', '0.86'], ['d2', '塑料碗', '0.94'], ['d3', '水壶', '0.42']].map(row => `<label class="iml-choice"><input type="radio" name="iml-target" data-bind="vision.target" value="${row[0]}"${v.target === row[0] ? ' checked' : ''}><span><strong>${row[0]} · ${row[1]}</strong><small>置信度 ${row[2]}</small></span></label>`).join('')}</fieldset><div class="iml-actions"><button type="button" data-action="check-vision">检查目标</button><button type="button" class="iml-secondary" data-action="reset-vision">重做本题</button></div><div data-feedback="vision">${v.checked ? notice(v.target === 'd1', v.target === 'd1' ? '目标筛选正确' : '重新检查“类别”和“阈值”', 'd1是满足阈值的水壶；d2类别不对，d3低于阈值。下一步仍须用深度与目标区域形成点云，再得到6D候选。') : ''}</div><details class="iml-answer"><summary>查看答案与数据流</summary><div class="iml-flow"><span>RGB-D</span><b>→</b><span>检测／实例分割</span><b>→</b><span>d1目标区域</span><b>→</b><span>有效深度→点云</span><b>→</b><span>6D候选</span><b>→</b><span>TF / IK / 规划</span></div><p>答案d1。分类只给类别，检测给框，实例分割给每个对象的掩码，点云是三维点集合，6D位姿还包含方向。找蓝盒是“放哪里”的位置／位姿分支，与“怎么夹水壶”的点云分支不同。</p></details></section>
    <section class="iml-card"><div class="iml-card-heading"><span class="iml-label">V2 · 自己算一次坐标</span><h3>像素 → 相机系 → 基座系</h3></div><p>此算例独立于上面的检测框。已校正畸变、配准深度，深度是光轴Z；采用列向量。全部答案以<strong>米</strong>填写。</p><div class="iml-formula">fx=fy=600 px；cx=320 px；cy=240 px<br>像素(u,v)=(380,240)；Z=1 m<br>相机→基座：单位旋转，平移(0.2, 0, 0.5) m</div><p class="iml-hint">提示：X=(u−cx)Z/fx，Y=(v−cy)Z/fy。本题旋转为单位阵，换系后位置=原位置+平移。</p><fieldset><legend>相机系位置 / m</legend><div class="iml-three">${numberField('X_camera', 'coordinate.cx', c.cx)}${numberField('Y_camera', 'coordinate.cy', c.cy)}${numberField('Z_camera', 'coordinate.cz', c.cz)}</div></fieldset><fieldset><legend>基座系位置 / m</legend><div class="iml-three">${numberField('X_base', 'coordinate.bx', c.bx)}${numberField('Y_base', 'coordinate.by', c.by)}${numberField('Z_base', 'coordinate.bz', c.bz)}</div></fieldset><label class="iml-field"><span>如果上游已返回基座系位姿，下游怎么处理？</span><select data-bind="coordinate.tf">${selectOptions([['repeat', '再乘一次相机→基座矩阵'], ['direct', '核对frame后直接消费基座系位姿'], ['rename', '只把frame改成camera再去变换']], c.tf)}</select></label><div class="iml-actions"><button type="button" data-action="check-coordinate">检查六个坐标与TF</button><button type="button" class="iml-secondary" data-action="reset-coordinate">重做本题</button></div><div data-feedback="coordinate">${c.checked ? notice(coordinateOkay, coordinateOkay ? '坐标与TF约定均符合题设' : '坐标或重复TF判断还需检查', `六项数值答对 ${values.filter((n, i) => near(n, expected[i])).length}/6；数值容差0.001m。相机(0.1,0,1)m，基座(0.3,0,1.5)m；上游已在基座系就不要重复同一个TF。这里算出的是点，不是可执行的完整6D抓取位姿。`) : ''}</div><details class="iml-answer"><summary>查看完整计算与常见误区</summary><p>X_camera=(380−320)×1/600=0.1m；Y_camera=0；Z_camera=1m。加平移后得到(0.3,0,1.5)m。重复这个TF会错成(0.5,0,2)m。</p><p>一个点只有位置，缺少夹爪方向、接触／进近方式、工具关系。即便有完整目标姿态，还需要IK、碰撞、轨迹规划及实际夹持验证。不要把此原创算例的坐标或矩阵填进真实任务14。</p></details></section></div>`;
  }
  function navigationContent(state) {
    const nav = state.nav, selected = nav.selected, point = nav.points[selected], info = waypointInfo[selected], assessment = navAssessment(nav);
    const correctPoints = assessment.rows.filter(r => r.okay).length;
    return `<section class="iml-card"><div class="iml-card-heading"><span class="iml-label">N2 · 交互航点与静态避障</span><h3>摆位置、调朝向，再检查整条路线</h3></div><p>先选一个航点，再点地图；也可直接输入x、y。箭头由yaw决定，<strong>0朝右，+π/2朝上</strong>。不是点击墙面目标本身，而是把机器人放到题设停车点。</p><div class="iml-map-legend"><span><i class="iml-swatch iml-swatch-solid"></i>实体障碍</span><span><i class="iml-swatch iml-swatch-inflate"></i>半径0.25+余量0.15m的禁入区</span><span>地图12×8m，原点左下</span></div><div class="iml-point-tabs" aria-label="选择要设置的航点">${names.map(name => `<button type="button" class="iml-secondary ${selected === name ? 'iml-active' : ''}" aria-pressed="${selected === name}" data-action="select-point" data-point="${name}">${name}<small>${waypointInfo[name].label}</small></button>`).join('')}</div><div class="iml-map-frame">${mapSvg(nav)}</div><div class="iml-position-form"><p class="iml-target-hint"><strong>当前编辑 ${selected}：</strong> 停车点 (${info.xy.join(', ')})；需面向 (${info.target.join(', ')})。位置单位m，yaw单位rad。</p><div class="iml-three">${numberField('x / m', `nav.${selected}.x`, point.x, 'min="0" max="12"')}${numberField('y / m', `nav.${selected}.y`, point.y, 'min="0" max="8"')}${numberField('yaw / rad', `nav.${selected}.yaw`, point.yaw)}</div><div class="iml-actions iml-directions"><span>快捷朝向：</span><button type="button" class="iml-secondary" data-action="yaw" data-yaw="0">→ 0</button><button type="button" class="iml-secondary" data-action="yaw" data-yaw="1.5707963267948966">↑ +π/2</button><button type="button" class="iml-secondary" data-action="yaw" data-yaw="3.141592653589793">← π</button><button type="button" class="iml-secondary" data-action="yaw" data-yaw="-1.5707963267948966">↓ −π/2</button></div></div><div class="iml-route-controls"><p><strong>服务顺序：</strong>home → stage → pick → place → 返航。线段连接你的点；检查时会标出穿越禁区的线段。</p><label class="iml-field"><span>从place返回home</span><select data-bind="nav.returnMode">${selectOptions([['direct', '直接连回home'], ['via', '增加一个返航中途点']], nav.returnMode)}</select></label>${nav.returnMode === 'via' ? `<div class="iml-two">${numberField('返航中途点 x / m', 'nav.returnX', nav.returnX, 'min="0" max="12"')}${numberField('返航中途点 y / m', 'nav.returnY', nav.returnY, 'min="0" max="8"')}</div>` : ''}</div><p class="iml-hint">本练习允许停车点误差≤0.20m、最短角差≤0.15rad；用于交互校验。路径按直线段与保守矩形相交检查，禁区边界也算不安全。</p>${nav.example ? '<p class="iml-example-note">目前载入了参考示范。这不计作你的独立作答；点击“清空航点重做”再检验掌握。</p>' : ''}<div class="iml-actions"><button type="button" data-action="check-nav">检查位置、朝向和路线</button><button type="button" class="iml-secondary" data-action="reset-nav">清空航点重做</button></div><div data-feedback="nav">${nav.checked ? `${notice(assessment.okay, assessment.okay ? (nav.example ? '参考示范满足本练习几何条件' : '这组答案满足本练习几何条件') : '还需要调整航点或路径', `停车点与朝向合格 ${correctPoints}/4；整条折线路径${assessment.routeOkay ? '未进入静态禁区' : '不完整、越界或穿越禁区'}。这是离线几何核对，不是物理仿真、平台成绩或动力学可执行证明。`)}<ul class="iml-check-list">${assessment.rows.map(r => `<li class="${r.okay ? 'iml-text-good' : 'iml-text-review'}"><strong>${r.name} ${r.okay ? '✓' : '待调整'}</strong>：${r.point ? `位置误差${fmt(r.distance)}m` : '未填完整位置'}；${r.angle === null ? '未填yaw' : `最短角差${fmt(r.angle)}rad`}${r.blocked ? '；中心进入禁区' : ''}${r.point && !inMap(r.point) ? '；超出地图' : ''}</li>`).join('')}${assessment.segments.map(s => `<li class="${s.complete && inMap(s.a) && inMap(s.b) && !s.hit ? 'iml-text-good' : 'iml-text-review'}">${s.from} → ${s.to}：${!s.complete ? '端点未填齐' : !inMap(s.a) || !inMap(s.b) ? '端点越界' : s.hit ? '与膨胀禁区相交（包括边界）' : '该直线段未穿禁区'}</li>`).join('')}</ul>` : ''}</div><details class="iml-answer"><summary>查看参考摆法、公式与操作对照</summary><p>禁区为[3.6,6.4]×[2.6,5.4]，含边界。yaw=atan2(目标y−停车y,目标x−停车x)，按2π等价。home=(1,1,0)，stage=(3,1,−π/2)，pick=(3,6,+π/2)，place=(9,6,0)。</p><p>可行示例：home→stage→pick→place→(9,1)→home。原A卷的P经过(5,4)，直接进入障碍；Q绕左侧合格。其他不穿禁区的折线也允许。仅看端点是不够的，应检查每一段。</p><button type="button" class="iml-secondary" data-action="load-nav-answer">将参考摆法放到地图中观察</button><p>真实任务8／9是底栏航点长按拖出、落在服务位置、转朝向、保存后重开检查。本图只练同类决策，坐标不能复制到平台地图；速度、加速度、拐弯、定位误差、动态障碍和局部控制仍未模拟。</p></details></section>`;
  }
  function faultsContent(state) {
    const selected = faults.find(f => f.id === state.fault.selected) || faults[0], a = state.fault.answers[selected.id];
    const answered = faults.filter(f => { const answer = state.fault.answers[f.id]; return answer.checked && answer.stage === f.stage && answer.next === f.next; }).length;
    const okay = a.stage === selected.stage && a.next === selected.next;
    return `<section class="iml-card"><div class="iml-card-heading"><span class="iml-label">R3 · 分层排错</span><h3>找到最早有证据的失败，再决定下一步</h3></div><p>四段日志均为<strong>人工合成</strong>，用来练习读报告。状态编号沿用原创A卷（3=去pick、6=去place），与任务14沙盘的编号含义不同。选择故障卡，判断两项。已核对正确 <span data-fault-progress>${answered}</span>/4 个案例；这不是原A卷分数。</p><div class="iml-fault-tabs" aria-label="选择故障案例">${faults.map((f, i) => `<button type="button" class="iml-secondary ${f.id === selected.id ? 'iml-active' : ''}" data-action="select-fault" data-fault="${f.id}" aria-pressed="${f.id === selected.id}">${i + 1} · ${esc(f.title)}</button>`).join('')}</div><div class="iml-log"><span>合成事件记录 · ${selected.id}</span><p>${esc(selected.log)}</p></div><label class="iml-field"><span>最早可确认失败／矛盾在哪一层？</span><select data-bind="fault.${selected.id}.stage">${selectOptions(selected.stages.map((label, i) => [String(i), label]), a.stage)}</select></label><label class="iml-field"><span>最合理的下一步是什么？</span><select data-bind="fault.${selected.id}.next">${selectOptions(selected.steps.map((label, i) => [String(i), label]), a.next)}</select></label><div class="iml-actions"><button type="button" data-action="check-fault">检查这个案例</button><button type="button" class="iml-secondary" data-action="reset-fault">重做这个案例</button></div><div data-feedback="fault">${a.checked ? notice(okay, okay ? '定位与下一步均合理' : '请沿日志重新分层', selected.answer) : ''}</div><details class="iml-answer"><summary>展开本例答案与证据边界</summary><p>${esc(selected.answer)}</p><div class="iml-historical"><strong>与旧实测的关系</strong><p>${esc(selected.evidence)}</p></div><p>口述补全：什么新证据出现时才支持“已修复”？把“改了参数”与“复验通过”分开说。</p></details><div class="iml-flow"><span>目标 / 掩码</span><b>→</b><span>点云</span><b>→</b><span>6D候选</span><b>→</b><span>坐标 / IK</span><b>→</b><span>规划 / 执行</span><b>→</b><span>实际结果</span><b>→</b><span>成功反馈</span></div></section>`;
  }
  function mount(container) {
    if (!container || typeof container.replaceChildren !== 'function') throw new TypeError('IcanMockLab.mount needs a DOM container');
    if (mounted.has(container)) mounted.get(container)();
    let state = loadState(), storageOkay = true;
    function save() {
      try { localStorage.setItem(KEY, JSON.stringify(state)); storageOkay = true; }
      catch (_) { storageOkay = false; }
      const status = container.querySelector('[data-save-status]');
      if (status) status.textContent = storageOkay ? '本浏览器自动保存作答；只使用独立存储，不改变全站学习勾选。' : '浏览器未允许持久保存；当前页仍可练习，离开后可能丢失。';
    }
    function render() {
      container.innerHTML = `<div class="ican-mock-lab"><div class="iml-intro"><span class="iml-label">原创离线互动练习</span><h2>用选择、算坐标和摆航点练决策</h2><p>基于模拟A卷的交互练习；不连接实训平台，不训练模型，不执行真实机器人。操作反馈只说明这道教学题的答案是否满足条件。</p><div class="iml-links"><a href="#article/mock-exam">完整A卷</a><a href="#article/mock-answers">标准答案与真实操作对照</a><a href="#article/mock-variants">换题与故障题</a></div></div><div class="iml-tabs" role="tablist" aria-label="离线互动模块">${[['motion', '01', '运动与视觉'], ['navigation', '02', '导航地图'], ['faults', '03', '故障诊断']].map(([id, num, label]) => `<button type="button" role="tab" id="iml-tab-${id}" aria-controls="iml-panel" aria-selected="${state.tab === id}" tabindex="${state.tab === id ? '0' : '-1'}" data-action="tab" data-tab="${id}" class="${state.tab === id ? 'iml-active' : ''}"><span>${num}</span>${label}</button>`).join('')}</div><div id="iml-panel" role="tabpanel" aria-labelledby="iml-tab-${state.tab}">${state.tab === 'motion' ? motionContent(state) : state.tab === 'navigation' ? navigationContent(state) : faultsContent(state)}</div><p class="iml-save-status" data-save-status>${storageOkay ? '本浏览器自动保存作答；只使用独立存储，不改变全站学习勾选。' : '浏览器未允许持久保存；当前页仍可练习，离开后可能丢失。'}</p></div>`;
    }
    function dirty(group) {
      const feedback = container.querySelector(`[data-feedback="${group}"]`);
      if (feedback && feedback.textContent.trim()) feedback.innerHTML = '<p class="iml-hint" role="status">答案已修改，请重新检查。</p>';
    }
    function updateMap() {
      const map = container.querySelector('.iml-map-frame'); if (map) map.innerHTML = mapSvg(state.nav);
    }
    function input(event) {
      const element = event.target, binding = element.dataset && element.dataset.bind; if (!binding) return;
      const parts = binding.split('.'), value = element.value.slice(0, 120);
      if (['motion', 'vision', 'coordinate'].includes(parts[0]) && parts.length === 2 && Object.hasOwn(state[parts[0]], parts[1]) && parts[1] !== 'checked') {
        state[parts[0]][parts[1]] = value; state[parts[0]].checked = false; dirty(parts[0]);
      } else if (parts[0] === 'nav') {
        if (parts.length === 3 && names.includes(parts[1]) && ['x', 'y', 'yaw'].includes(parts[2])) state.nav.points[parts[1]][parts[2]] = value;
        else if (parts.length === 2 && ['returnMode', 'returnX', 'returnY'].includes(parts[1])) state.nav[parts[1]] = value;
        else return;
        state.nav.checked = false; dirty('nav');
        if (parts[1] === 'returnMode') { save(); render(); return; }
        updateMap();
      } else if (parts[0] === 'fault' && parts.length === 3 && Object.hasOwn(state.fault.answers, parts[1]) && ['stage', 'next'].includes(parts[2])) {
        state.fault.answers[parts[1]][parts[2]] = value; state.fault.answers[parts[1]].checked = false; dirty('fault');
        const progress = container.querySelector('[data-fault-progress]');
        if (progress) progress.textContent = String(faults.filter(f => { const answer = state.fault.answers[f.id]; return answer.checked && answer.stage === f.stage && answer.next === f.next; }).length);
      } else return;
      save();
    }
    function click(event) {
      const button = event.target.closest('button[data-action]');
      if (button && container.contains(button)) {
        const action = button.dataset.action; let focusSelector = '';
        if (action === 'tab' && ['motion', 'navigation', 'faults'].includes(button.dataset.tab)) { state.tab = button.dataset.tab; focusSelector = `[data-tab="${state.tab}"]`; }
        else if (action.startsWith('check-') && ['motion', 'vision', 'coordinate'].includes(action.slice(6))) state[action.slice(6)].checked = true;
        else if (action.startsWith('reset-') && ['motion', 'vision', 'coordinate'].includes(action.slice(6))) state[action.slice(6)] = defaults()[action.slice(6)];
        else if (action === 'select-point' && names.includes(button.dataset.point)) { state.nav.selected = button.dataset.point; focusSelector = `[data-point="${state.nav.selected}"]`; }
        else if (action === 'yaw' && valueNum(button.dataset.yaw) !== null) { state.nav.points[state.nav.selected].yaw = button.dataset.yaw; state.nav.checked = false; focusSelector = `[data-action="yaw"][data-yaw="${button.dataset.yaw}"]`; }
        else if (action === 'check-nav') state.nav.checked = true;
        else if (action === 'reset-nav') state.nav = emptyNav();
        else if (action === 'load-nav-answer') {
          for (const name of names) { const w = waypointInfo[name]; state.nav.points[name] = {x: String(w.xy[0]), y: String(w.xy[1]), yaw: String(w.yaw)}; }
          Object.assign(state.nav, {returnMode: 'via', returnX: '9', returnY: '1', checked: true, example: true});
        } else if (action === 'select-fault' && faults.some(f => f.id === button.dataset.fault)) { state.fault.selected = button.dataset.fault; focusSelector = `[data-fault="${state.fault.selected}"]`; }
        else if (action === 'check-fault') state.fault.answers[state.fault.selected].checked = true;
        else if (action === 'reset-fault') state.fault.answers[state.fault.selected] = {stage: '', next: '', checked: false};
        else return;
        save(); render();
        if (focusSelector) { const element = container.querySelector(focusSelector); if (element) element.focus({preventScroll: true}); }
        return;
      }
      const svg = event.target.closest('svg[data-map]');
      if (svg && container.contains(svg) && state.tab === 'navigation') {
        const matrix = svg.getScreenCTM(); if (!matrix) return;
        const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
        const local = point.matrixTransform(matrix.inverse()), x = (local.x - 40) / 50, y = (430 - local.y) / 50;
        if (x < 0 || x > 12 || y < 0 || y > 8) return;
        state.nav.points[state.nav.selected].x = String(Math.round(x * 10) / 10);
        state.nav.points[state.nav.selected].y = String(Math.round(y * 10) / 10);
        state.nav.checked = false; save(); render();
      }
    }
    function keydown(event) {
      const target = event.target.closest('[role="tab"]');
      if (!target || !container.contains(target) || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const tabs = ['motion', 'navigation', 'faults'], current = tabs.indexOf(state.tab);
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (current + (event.key === 'ArrowRight' ? 1 : -1) + 3) % 3;
      event.preventDefault(); state.tab = tabs[index]; save(); render(); container.querySelector(`[data-tab="${state.tab}"]`).focus();
    }
    container.addEventListener('input', input); container.addEventListener('click', click); container.addEventListener('keydown', keydown);
    const destroy = () => { container.removeEventListener('input', input); container.removeEventListener('click', click); container.removeEventListener('keydown', keydown); mounted.delete(container); };
    mounted.set(container, destroy); render(); save();
    return {destroy};
  }
  function selfCheck() {
    const nav = emptyNav();
    for (const name of names) { const w = waypointInfo[name]; nav.points[name] = {x: String(w.xy[0]), y: String(w.xy[1]), yaw: String(w.yaw)}; }
    Object.assign(nav, {returnMode: 'via', returnX: '9', returnY: '1'});
    const checks = {
      routePBlocked: segmentHitsBox([1, 1], [5, 4]),
      routeQClear: !segmentHitsBox([1, 1], [3, 1]) && !segmentHitsBox([3, 1], [3, 6]),
      boundaryBlocked: segmentHitsBox([1, 2.6], [7, 2.6]),
      nearBoundaryClear: !segmentHitsBox([1, 2.599], [7, 2.599]),
      zeroLengthInsideBlocked: segmentHitsBox([4, 4], [4, 4]),
      zeroLengthOutsideClear: !segmentHitsBox([1, 1], [1, 1]),
      fullTurnYawEquivalent: shortAngle(-Math.PI / 2, 3 * Math.PI / 2) < 1e-10,
      referenceRouteValid: navAssessment(nav).okay,
      blankNotAnswer: !navAssessment(emptyNav()).okay,
      blankNumericRejected: valueNum('') === null && valueNum(' ') === null,
      incompleteXYZRejected: !near(null, 0),
      correctXYZ: [0.1, 0, 1, 0.3, 0, 1.5].every((v, i) => near(v, [0.1, 0, 1, 0.3, 0, 1.5][i]))
    };
    nav.returnMode = 'direct'; checks.directReturnBlocked = !navAssessment(nav).routeOkay;
    nav.points.home.yaw = '6.283185307179586'; checks.equivalentHomeYawValid = navAssessment(nav).rows[0].okay;
    return {scope: '纯数值与几何自检；不是物理仿真', passed: Object.values(checks).every(Boolean), checks};
  }
  window.IcanMockLab = Object.freeze({mount, selfCheck, logic: Object.freeze({shortestAngle: shortAngle, segmentAABB: segmentHitsBox, numericInput: valueNum, navAssessment, emptyNav})});
})();
