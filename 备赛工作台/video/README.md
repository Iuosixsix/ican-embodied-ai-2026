# ICAN 全能超级速通影片

这是**赛前教学动画**，不是官方赛卷、平台仿真或任务成功证明。图形全部为代码绘制的教学示意，配音为 `zh-CN-XiaoxiaoNeural` 合成中文人声，未模仿培训讲师。任务14已经由用户重置，相关历史证据不能当当前配置。

## 立即观看

打开 [player.html](player.html)。这是约4.02MiB的**单文件影片**：JS、CSS、72段MP3和字幕全部内嵌，不加载CDN、远程字体或外部音频，不需要Node、Studio或联网服务来播放。单独复制此HTML也能播放；“回看板”链接仍需保留原工作区相对目录。`player.js`、`player.css`、`public/voice/` 保留供维护和重建。

影片 **7分52秒，1920×1080，30fps，14160帧**。支持播放/暂停、章节跳转、0.75—2倍速、字幕/配音开关、逐句重听、全屏，以及回到学习站对应S课号。

先完整观看一遍建立印象，再回看板进行“认图 → 复述 → 三条积木演练 → 闭卷检查”。影片是概念骨架，不能替代看板的字段说明、题面、故障诊断和完整自测。

> 使用系统中文字体。音频以data URL内嵌，避免普通静态服务器缺少HTTP Range时的跳转/倍速风险。文件协议的实际打开行为取决于浏览器；当前工具环境以本机HTTP预览验证，不能将其表述成已逐浏览器验证 `file://`。

## 文件与Chat阅读顺序

- [narration.json](narration.json)：72句原创中文旁白、S00—S11对应和场景说明。Chat优先读这份，不必读取大JS。
- [src/timeline.json](src/timeline.json)：按实际合成语音时长构建的章节/短句时间线。
- [public/voice/timing.json](public/voice/timing.json)：音频时长、SHA256、编码与完整解码验证结果。
- [build-voice.mjs](build-voice.mjs)：从原MP3按SHA256验证后生成临时音频字典，构建时内嵌，不能手动编辑base64。
- [src/Diagram.tsx](src/Diagram.tsx)：12类动态矢量概念图。
- `src/scenes/S00Scene.tsx` 至 `S11Scene.tsx`：独立可编辑章节，含字幕和音频时间线。
- [src/Composition.tsx](src/Composition.tsx)：主时间线；[src/Root.tsx](src/Root.tsx)：主影片与12章独立Studio composition。
- [../18_超级速通_全能图形化任务链.md](../18_超级速通_全能图形化任务链.md)：每一章的完整概念、输入输出、错例及判断题。
- [../../CHAT_SUPER_START.md](../../CHAT_SUPER_START.md)：Chat辅导续接提示。

## 12章

| 课号 | 概念重点 | 动画 |
|---|---|---|
| S00 | 整体任务链；四模块/四节点/三分工 | 移动机器人与阶段高亮 |
| S01 | 执行关系、数据关系、变量类型、回调、保存 | 执行连线与数据包 |
| S02 | 运动目标、奖励权衡、训练与验证 | 机器人步态和奖励权重 |
| S03 | 分类/检测/分割、目标筛选、深度点云 | 水壶/碗框选和点云 |
| S04 | 建图与定位、漂移、现有资源 | 激光扫描和地图位置 |
| S05 | 全局/局部规划、代价地图、位置+朝向 | 路线、安全区域和朝向 |
| S06 | 坐标变换、方向、单位、3D点与6D姿态 | 相机/基座坐标轴及变换 |
| S07 | 3D抓取候选、可达与碰撞、真实结果 | 机械臂和抓放阶段示意 |
| S08 | 主控/导航/视觉/机械臂、话题/服务合同 | 四节点数据包 |
| S09 | 状态、匹配回调、防过期/重复 | 等待条件与拒绝无关回调 |
| S10 | 最早断点、一次一个因素、保存与绑定 | 故障链逐级定位 |
| S11 | 三人主责、全链理解、闭卷检查 | 三角色交接 |

S07为3D抓取例子，不表示所有2D抓取任务也必须走同一路径。话题可以发送持续或一次性消息。S06的3D点并不自动给出完整抓取姿态。画面中的模型、路径、数值和运动均为示意，不执行真实训练或机器人控制。

## 本地维护

Node及npm用于编辑/重新打包，**普通观看不需要**。

```powershell
npm ci
npm run typecheck
npm run player:build
npm run studio
```

改旁白或音频后：先生成并验证 `public/voice/<id>.mp3` 与 `timing.json`，再运行 `python prepare_timeline.py`，然后重新构建。`prepare_timeline.py` 每段留0.35秒间隔，向上取整到30fps；会按 `narration.json` 重新生成 `src/scenes/`、`src/Composition.tsx`、`src/Root.tsx` 与时间线，所以不要在这些生成文件中保存需长期保留的手工修改。

配音生成脚本 `generate_voice.py` 在生成时需要联网；**已完成的配音在播放时不联网**。本次使用TTS服务合成用户授权的学习文本，没有发送账号令牌、课程会话URL或私密实验凭据。

```powershell
npx remotion studio --no-open
npx remotion bundle --out-dir=studio-bundle
```

Studio默认显示 `ICAN-SuperSprint`，12章同时作为独立composition可修改。没有默认导出MP4；提供的是立即可看的互动影片，后续明确需要导出时再渲染。

## 来源与验证

- 内容依据本工作区18/19课程及12实测手册的边界；正式赛题顺序仍未知。
- `src/basic-captions.tsx` 按 Remotion 官方 [Basic Captions](https://www.remotion.dev/elements/captions/basic-captions.md) 原样引入；其余图形和课程动画为本项目原创。
- 依赖版本由 `package-lock.json` 固定，Remotion 4.0.538。
- `npm run typecheck`、离线IIFE bundle、Remotion bundle通过；72音频已由配音脚本用ffprobe及全量解码验证。
- `QA.json` 为本轮结构与文件验证；浏览器可见页面、字幕、播放和导航的最终记录由主任务写入学习站QA。
