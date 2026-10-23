# 模拟题的平台复刻映射与可用实测基线

整理日期：2026-10-23（UTC+8）。本文件只读已有本地资料建立映射，没有打开实训平台、改参数、训练、仿真或读取新结果。用于编写赛前模拟卷和讲解答案，不是未开放正式题目的答案。

来源优先级：[10 官方任务要求与评分](../../10_官方任务要求与评分.md)及对应指导书确认题目；[12 全任务实测与排错手册](../../12_全任务实测与排错手册.md)和其原始证据确认当前结果；[03 任务14攻略](../../03_任务14实战攻略.md)解释完整结构；[02 任务1—12攻略](../../02_任务1-12练习攻略.md)只作参考，旧“待补齐”不能覆盖12的新记录。[08 实操记录](../../08_实操记录.md)保存暂停与最新快照。

## 1 模拟卷哪些部分能直接在旧练习复现

四个正式方向是运动控制、定位导航、视觉感知、ROS集成。抓取作为视觉与ROS集成依赖讲解，不据此声称正式比赛有第五模块，也不把任务14的master/nav/vision/arm四节点误作四个正式模块。

| 模拟方向 | 现有练习入口与真实操作 | 能直接采用的实测基线 | 必须留出的未知/失败 |
|---|---|---|---|
| 展会动作表演、舞蹈模仿 | 任务3“训练模型构建”；依次观察值空间、动作空间、奖励值、重置条件、训练参数；提交训练、完成后“查看”，选模型仿真 | H1的100M和200M模型；三次舞蹈完成率100% | 不同舞蹈/新机器人能否沿用未知；偏差报告未标单位；不是最终100分 |
| 入场、行走与复杂地形 | 任务1走跑跳；任务2复杂地形，同类模型构建流程 | 任务1三基线走1/跑3/跳1.5m/s正常；任务2基线复杂地形1.34m/s | 训练参数和机器人不能随意跨题套用；对照模型未全做独立推理 |
| 展区建图/巡游 | 任务7“建图策略制定”；任务8“导航策略制定”；任务9“建图与导航”、首页“导航规划”和“仿真验证” | 优先任务9：PCD→PGM→十航点→30参数，92%地图、十点到达、零碰撞 | 任务7客户2仅79.2%，Karto卡99%无质量报告；任务8航点不齐、无运行报告 |
| 观众表情/展品/动作识别 | 任务4“分类算法构建”；任务5“检测算法构建”；任务6“识别算法构建”，各含训练数据、训练、流程、内部测试与仿真 | 4的两套明暗流程；5的危险品/人脸/OCR三流程；6的TSM与姿态规则两流程 | 4—6都有低置信度/误判，不能把训练指标当应用准确率；新展品/动作必须有题目数据或提供模型 |
| 接指令、导航、抓放和汇报 | 任务14“ROS节点编写/编辑”→“配置文件和其他资源”→变量/函数/图形指令→逐函数“提交”→节点模块提交→“仿真验证”→Debug和报告 | 两机器人各19函数、15变量；R1八项完成，G1六项完成 | 任务14给定模型地图等只适用于这道练习；G1长颈鹿抓取与黄盒放置未修复；没有已核实的“播放舞蹈”ROS指令块 |
| 从头构建抓取能力、避障扩展 | 10/11“手眼标定→模型构建→抓取流程构建”；12另有机械臂控制模块、功能预览与规划 | 已有数据/模型/标定/连线；可用作逐层诊断题 | 10基线2/7、11为2/5、12为0/4完整抓放；均不能写成包过标准配置 |

**模拟整条“展会表演链”时的实施边界：** 目前可在任务3单独复现舞蹈、任务9复现巡游、任务14复现语音导航抓放。现有资料没有证明能把这三道独立练习的模型/地图导入另一题，或在任务14新增舞蹈调用块。因此把组合部分写成“逻辑状态机与接口设计题”，把平台操作部分写成上述各模块的分段复刻；不要虚构一键导入、整卷运行入口或已部署舞蹈服务。

## 2 运动模块：任务3可直接引用的完整基线

[官方任务3指导书](../platform/任务3_当前平台指导书.pdf)要求宇树H1借助预设轨迹完成三类舞蹈，设计观察、动作、奖励、重置及训练策略；至少两个模型且各点击查看。没有写每一种舞蹈都强制两个模型，不扩大成六模型要求。模型构建/推理验证各50是**这道练习**的分值。

| 设置层 | `dance_baseline_100M_1022`已填值 |
|---|---|
| 观察量 | 勾躯干姿态、躯干角速度、全部关节角度、全部关节角速度；不勾躯干线速度、参考轨迹编码 |
| 动作 | 输出关节目标角度；指数移动平均＋前馈控制 |
| 奖励 | 存活奖励+1；躯干角度偏移惩罚系数0.01；位置偏移惩罚系数1。界面显示源码亦称这两项为惩罚，不把偏差变大当正奖励 |
| 重置 | 角度偏差>30度或位置偏差>0.3m联合条件；环境步数>1000 |
| 最大训练步数 | 100M |
| 学习率 / 熵正则 | 0.0003 / 0.005 |
| batch size | 4096 |
| 网络 | 深度4，每层512 |
| 奖励衰减因子 | 0.995 |
| 单次交互最大步数 | 2000 |

对照`dance_compare_200M_1022`只把最大训练步数改200M。实测：第1次100M完成率100%、位置偏差6.71；两次200M均100%，偏差6.74、6.78。官方偏差评分以百分比阈值表述，但本次报告没有显示单位；引用报告时保留原值，不自行加“%”“米”或算最终分。不能把训练翻倍写成优化成功。

原证据：[训练参数](../platform/live_20261022/task3_training.txt)、[重置](../platform/live_20261022/task3_reset.txt)、[预设轨迹首屏](../platform/live_20261022/task3_reference_trajectory_sample.txt)、[三次报告](../platform/live_20261022/task3_compare_200M_report_1023.txt)、[报告图](../platform/live_20261022/task3_compare_200M_report_1023.png)。[界面显示源码](../platform/live_20261022/task3_baseline_displayed_code.txt)只用于理解参考轨迹/关节控制等，不等于后台实际实现已审计。

适合命题：解释参考动作前馈与策略修正；给出姿态/位置偏差判断；辨认100M与200M的成本和结果；检查训练完成→模型查看→选权重推理→报告四个不同阶段。可以用这套参数作为**同题可复刻基线答案**，不能作未知正式动作的唯一最优答案。

## 3 导航模块：任务9完整已保存参数

题面与实测：[任务9指导书](../platform/任务9_当前平台指导书.pdf)、[策略回读](../platform/live_20261022/task9_strategy_readback.txt)、[报告](../platform/live_20261022/task9_simulation_report_baseline.txt)。G1场景包含缓坡、小台阶和局部抬高平台；先3D PCD，再转换2D PGM，不能只建点云就开始填“已完成导航”。

建图选第2参数卡：点云采样间隔3、特征滤波0.35m、地图滤波0.45m、优化迭代4、激光检测60m、IMU噪声0.1；路线第1张/左上卡。路线说明是区域1—11的覆盖，不是11个航点。[路线说明](../platform/live_20261022/task9_route1_description.txt)。PCD创建输入名`nav9_baseline_1023`，实际列表显示`nav9_basel`，不推断是截断还是限长；PGM名称`nav9_pgm`。

转换选第2卡：分辨率0.05m，Z轴1—2m，“半径0.1m内少于10”这一显示条件。已有记录没有完整展开滤波动作，不补出它具体删除/保留什么。转换完成有[PGM预览](../platform/live_20261022/task9_pgm_preview.png)，不是只输入过名称。

| 页面 | 30项已保存回读参数 |
|---|---|
| 代价地图8项 | 机器人半径0.34m；膨胀半径0.5m；障碍物检测范围5.5m；高度1.5m；全局更新1Hz；局部更新10Hz；滚动窗口开启；尺寸3m×3m |
| 规划器与恢复8项 | A*；允许未知；目标位置容忍0.5m；恢复旋转/退后/等待；最大旋转1rad/s；最小0.4rad/s；旋转加速度3.2rad/s²；等待3s |
| 控制器8项 | 前进0.5—1.2m/s；旋转0.4—1rad/s；前进加速度2.5m/s²；旋转加速度3.2rad/s²；目标位置容忍0.25m；偏离路径惩罚32；靠近障碍惩罚0.10；目标转向权重32 |
| AMCL6项 | 最大粒子1500；里程计噪声中；激光地图匹配距离2m；更新激光束60；触发最小角0.3rad；触发最小距离0.25m |

四页回读原证据：[代价](../platform/live_20261022/task9_nav_costmap_readback.txt)、[规划与恢复](../platform/live_20261022/task9_nav_planner_readback.txt)、[控制](../platform/live_20261022/task9_nav_controller_readback.txt)、[AMCL](../platform/live_20261022/task9_nav_amcl_readback.txt)。规划容忍0.5m与控制容忍0.25m是不同字段，不能因为名字类似就合并。

十航点：充电桩、公司门口、文化墙、部门1—5、会议室、休闲区。长按底栏文字或图钉持续拖动，看到实际新标记才计数；工具快速拖动曾只移动镜头。用黑色弯箭头调朝向，每次90°；[本次点位图](../platform/live_20261022/task9_ten_waypoints_orientation_adjusted.png)可参考，**没有可复制到新地图的全部x/y/yaw数值**。画面朝向：充电桩下、公司门口/文化墙左、部门1—4上、部门5右、会议室/休闲区左，仅描述当前俯视图，不是世界坐标系。

保存/验证：航点面板右上“提交”→返回列表确认10点；首页“导航规划”四页→“提交”策略→关闭重开逐页核对；“仿真验证”选`nav9_pgm`、充电桩初始位、1倍速运行，报告十点全部到达，碰撞/撞人/撞墙或门均0。92%达到任务9地图准确度>90%要求，但报告没单列点位合理性得分，不能因此推断十个点的设置全部满分。[保存十点](../platform/live_20261022/task9_ten_waypoints_saved.txt)。

适合命题：从地图、点位、定位、全局路线、局部避障到到点回调的完整链；为何到展台附近却背对展品仍可能影响视觉；改变机器人半径/通道/目标位置时，应重新核对可通行和相机朝向，而不是照抄十点坐标。未知正式地图以题目资源为准。

## 4 视觉模块：可落到真实按钮的三种路线

共同路径：相应算法构建面板→“训练数据构建”→新建/修改→逐样本标注→保存并在列表核对数量/类别→训练参数及增强卡出现勾→提交训练→完成后“查看”→流程各模型节点绑定正确权重和CPU→内部输入测试→3D仿真报告。权重下拉`NoData`时先查训练是否完成；不要给不存在的权重造文件名。

| 方向 | 已填流程/基线 | 数据或运行证据边界 |
|---|---|---|
| 单图表情分类，任务4 | 明亮：图像采集→224尺寸变换→标准化→ResNet；昏暗在尺寸前加亮度调整0.2与亮度均衡。均值0.485/0.456/0.406，标准差0.229/0.224/0.225；权重`emotion_resnet27_1022`、CPU、分类头7 | 27图；batch4/workers1/SGD/lr0.001/15轮；增强随机裁剪→旋转→颜色抖动。accuracy0.8371；10次3D中8个对应来源标签、2误判，conf0.10—0.37。不是整体80%准确率 |
| 目标框＋下游识别，任务5 | 危险品：采集→尺寸600→YOLO；人脸：采集→600→YOLO→截取人脸→人脸识别0.42并勾3模板；OCR：采集→640→YOLO→截取电子屏文字→文字识别。三处YOLO均`detect_yolo20_1023`、CPU | 20图四类；batch1/workers0/SGD/lr0.001/150轮/尺寸l；增强Mosaic→HSV→缩放→水平翻转。P/R/F1/mAP .871/.812/.840/.843。阈值0.42恢复本轮妈妈识别，OCR640读对PM 34；仍低conf，不保证新图正确 |
| 时序动作与规则，任务6 | 通用：视频采集→TSM，`behavior_tsm20_1023`、CPU；个性化：视频采集→姿态估计CPU→姿态估计判断 | 20段视频四动作，batch4/workers1/SGD/lr0.001/15轮/head4；accuracy0.95407。标注菜单5类不代表模型支持5类；推理TSM无独立head选项；摔倒仍误判。姿态5帧一截不是5Hz |

来源：[任务4参数](../platform/live_20261022/task4_training_config.txt)、[任务4报告](../platform/live_20261022/task4_simulation_report_baseline.txt)、[任务5参数](../platform/live_20261022/task5_training_config.txt)、[任务5调整后报告](../platform/live_20261022/task5_simulation_report_threshold042_resize640.txt)、[任务6参数](../platform/live_20261022/task6_training_config.txt)、[任务6摔倒测试](../platform/live_20261022/task6_tsm_fallfloor1.json)。

任务5框选实测：先“+”，点两个对角位置，选类并确认；图上多个不同目标分别框。任务11/12的实例分割：SAM生成轮廓后逐实例点选、“+”赋类别；清理背景轮廓，检查空白标签行。SAM轮廓和缩略图绿勾不等于类别已经填完。

可命题为“识别观众/展品/手势触发动作”，但现有TSM只训练摔倒、跳绳、俯卧撑、打字，不把它写成已经能识别挥手/举手；若模拟新类别，应明确是拟题提供的数据/标签假设，并把真实平台复刻替换为现有四类。

## 5 ROS模块：任务14可复刻的接口与状态机

本题给地图、航点、Nav2、标定、YOLO、GraspNet、走路模型及MoveIt2配置，[官方题面](../platform/任务14_当前平台指导书.pdf)p1。适合作为“已提供底层功能、把系统串起来”的模拟变体。未知正式题是否预提供这些资源不能据此下结论。

### 5.1 创建对象、真实保存与调试

“ROS节点编写/编辑”→看“配置文件和其他资源”→每节点“节点变量”建变量→建自定义函数→在init创建发布者/订阅者/服务并绑定回调→图形指令的齿轮补参数→确定→检查红光/连线→函数页“提交”并见成功→全部节点模块提交→“仿真验证”。Debug看函数执行过程和变量值，从最早错误定位；最终按实际抓取/放入验收。

发布者先保存，订阅菜单才能出现相应话题；相机订阅未绑定回调时，回调参数可能`No Data`。先补init并保存，再选择`color_image/depth_image`，不要手动写成普通字符串。[相机回调恢复证据](../platform/live_20261022/task14_rgb_parameter_after_binding.png)。

仅条件判断允许多个出线；其余指令一条。分支条件设定后不交换连线顺序。节点有官方“复制内容”功能，复制R1→对应G1节点后还需改差异、检查变量和回调；没有证据支持JSON导入、粘贴整段Python自动建图或源码可编辑。

### 5.2 每机器人变量和函数

| 节点 | 变量（本方案15个） | 函数（本方案19个，含init） |
|---|---|---|
| master | `master_work_status`数字；`master_task_dictionary`字典 | init；set_wakeup_keywords_callback；nav_arm_finish_callback；vision_detect_response_callback1/2/3/4 |
| nav | `nav_navigation_status`布尔；`nav_navigation_name`字符 | init；nav_target_message_callback；nav_finish_callback |
| vision | `Vision_Color_Image`图像；`Vision_Depth_Image`图像；`Vision_Box`数字数组；`Vision_Point`点；`Vision_Point_Cloud`点云；`Vision_Pose`位姿 | init；get_camera_rgb_callback；get_camera_depth_callback；vision_detect_request_callback |
| arm | `Grasp_Point_Cloud`点云；`Grasp_Pose1/Grasp_Pose2`位姿；`Grasp_Hand/Arm_Hand`字符 | init；grab_message_callback；deploy_message_callback；grab_finish_callback；deploy_finish_callback |

19函数/15变量是可复刻实现数量，非官方强制唯一总数；官方要求每节点至少一自定义函数、一变量，并覆盖指定指令。变量类型必须真实保存为该类型；不能把导航名称变量建成数字。

### 5.3 消息合同：实际字段拼写

| 类型/名称 | 发送→接收 | 字段与绑定 |
|---|---|---|
| 话题`_nav` | master→nav | 字符`Navigation_Address`；nav_target_message_callback |
| 话题`_grab` | master→arm | 布尔`Hand`、点云`Pcloud`；grab_message_callback |
| 话题`_deploy` | master→arm | 布尔`Hand`、位姿`Fpose`；deploy_message_callback |
| 话题`_finish` | nav和arm→master | 布尔`is_Finish`，发布1；nav_arm_finish_callback。当前实测统一这个大小写 |
| 服务`_locate` | master请求→vision响应 | 请求字符`Detect_Type`/`Detect_Name`，响应位姿`Pose`/点云`Point_Cloud`；vision_detect_request_callback |
| 相机订阅 | 系统→vision | `/camera/color/image_raw`→get_camera_rgb_callback，参数color_image；`/camera/depth/image_raw`→get_camera_depth_callback，参数depth_image |

`Point_Cloud`是视觉响应，转发成抓取话题时字段名是`Pcloud`，不能写错；`_locate`是服务端，不能建成第三个普通订阅者。平台对两机器人同名短话题如何隔离未说明，不自造命名空间当已验证答案。[服务字段图](../platform/live_20261022/task14_locate_service_fields.png)。

### 5.4 事件顺序与标准状态答案

master init：唤醒词→创建_nav/_grab/_deploy三个发布者→订阅_finish；R1唤醒“你好小星”，G1“你好小宇”。唤醒回调：提取任务信息至字典→发布相机静态TF→状态1→发布_nav，Navigation_Address读字典target1-1。

字典：target1-1第1导航点、target1-2第1物体；target2-1第2导航点、target2-2第2物体；target3-1第3导航点、target3-2第1物体盒色、target3-3第2物体盒色；target4返航点。不把整个字典作为航点字符串发送。

| `_finish`到达时master状态 | 后续执行顺序 |
|---:|---|
| 1 | 状态2→请求_locate：物体、target1-2，回调1 |
| 3 | 状态4→发布_nav：target2-1 |
| 4 | 状态5→请求_locate：物体、target2-2，回调2 |
| 6 | 状态7→发布_nav：target3-1 |
| 7 | 状态8→请求_locate：颜色、target3-2，回调3 |
| 9 | 状态10→请求_locate：颜色、target3-3，回调4 |
| 11 | 状态12→发布_nav：target4 |
| 12 | 播报“任务顺利完成”→状态0 |

| 视觉响应 | 状态 | 发布数据 | R1 Hand | G1 Hand |
|---|---:|---|---:|---:|
| callback1 | 3 | _grab.Pcloud←回调Point_Cloud | 0 | 1 |
| callback2 | 6 | 同上 | 1 | 0 |
| callback3 | 9 | _deploy.Fpose←回调Pose | 0 | 1 |
| callback4 | 11 | 同上 | 1 | 0 |

状态2/5/8/10等待视觉服务响应，不接成_finish的四个分支。一般先改变状态再发送下一条请求，防止快速回调还读旧状态。数字编号是本实现约定，新模拟卷可换编号，但事件/动作依赖必须一致。[已保存状态机图](../platform/live_20261022/task14_master_state_machine_saved.png)、[保存文字](../platform/live_20261022/task14_master_state_machine_saved.txt)。

nav：init初始化航点→建_finish发布者→订阅_nav；G1在初始化后加walk.rknn、/cmd_vel、/odom。接请求时nav_navigation_name←Navigation_Address→判断未忙→设忙1→导航到该变量的航点，回调nav_finish_callback；完成回调设忙0→发布_finish.is_Finish=1。[G1模型参数](../platform/live_20261022/task14_g1_walk_parameters.txt)。

### 5.5 vision/arm的数据流与TF边界

vision物体支：`Vision_Color_Image`＋`yolo.pt`＋回调Detect_Name→输出矩形检测框`Vision_Box`→`Vision_Depth_Image`按框转点云`Vision_Point_Cloud`→服务响应。**此分支不加TF。**

vision颜色支：彩色图按Detect_Name找中心`Vision_Point`→加深度转3D位姿`Vision_Pose`→相机系转基座→服务响应。当前UI两支都要填Pose=Vision_Pose和Point_Cloud=Vision_Point_Cloud；后续物体只消费点云、颜色只消费位姿，不能由响应已保存假设未消费字段每次都有有效值。[分支保存图](../platform/live_20261022/task14_vision_detection_saved.png)。

arm抓取：`Grasp_Point_Cloud`←回调Pcloud→按Hand分支；false/0用left_gripper和left_arm，true/1用right_gripper和right_arm→`graspnet.tar`估计Grasp_Pose1→从本机器人相机系转基座→移动变量Arm_Hand到Grasp_Pose1、速度100%、完成回调grab_finish_callback→闭合Grasp_Hand→发布_finish=1。

arm放置：Grasp_Pose2←回调Fpose→按同样Hand选手/臂→移动到Grasp_Pose2、速度100%、回调deploy_finish_callback→张开Grasp_Hand至80%→发布_finish=1。**此位姿已在vision转到基座，不重复TF；同一物体抓和放用同一只手。**

| 本题静态相机TF | R1 | G1 |
|---|---|---|
| TF名、相对系 | r11_camera，相对基座 | r12_camera，相对基座 |
| 位置原值 | 0.0930, 0, 1.5270 | 0.0364, 0, 1.2256 |
| 旋转原值 | 0, 0.9250, 0 | 0, 0.8727, 0 |
| 使用位置 | vision颜色支、arm两抓取支，均相机→基座 | 同上改r12_camera |

以上只适用于本题已核资源；新机器人/标定数据应读该题配置，不能跨机器人复制。原表未完整说明单位，模拟标准答案不要擅自给这些旋转数补“度”。迁移G1改master的Hand=1/0/1/0后，**不要再把arm的0左/1右反转一次**。

证据：[G1左支回读](../platform/live_20261022/task14_g1_left_branch_readback.json)、[G1左TF](../platform/live_20261022/task14_g1_arm_left_tf_parameters.txt)、[右TF](../platform/live_20261022/task14_g1_arm_right_tf_parameters.txt)、[G1响应2参数](../platform/live_20261022/task14_g1_response2_parameters.json)、[恢复100%速度](../platform/live_20261022/task14_g1_speed100_restored.json)。

### 5.6 什么可当实测答案，什么只能作诊断答案

三轮报告（两次基线，一次仅G1第二抓false支速度100%→50%）都是38函数执行，R1八项成功，G1六项成功、长颈鹿抓取移臂失败和黄盒放置失败。减速未改善，当前已恢复100%并回读；恢复后没有新仿真。不能以函数全执行或_finish发送成功替代实际抓到/放入。

[完整基线报告](../platform/live_20261022/task14_both_simulation_report_baseline.txt)、[分项JSON](../platform/live_20261022/task14_both_simulation_report_rows.json)、[50%对照报告](../platform/live_20261022/task14_g1_speed50_report.txt)。G1根因未定位；模拟题若问“已知有效修复”，答案应是“现有证据没有证明修复，不盲目宣称50%有效”；若问“下一步诊断”，可查实际目标位姿、可达性、输入点云和运动/抓取结果，但必须标为待验证假设。

## 6 抓取扩展：10—12保存、矩阵与失败边界

### 6.1 标定和坐标不要跨题移用

真实操作：手眼标定中改变位置和旋转，让标定板完整可见→“拍照并记录”→等右侧真实新增记录→15组不同姿态→标定模块右上“提交”并确认“提交当前标定数据”→生成文件→“抓取流程构建→核心参数”。点按钮15次不等于成功15条，同画面重复15次也不等于姿态多样。

| 题 | 相机/机器人及实际矩阵字段 | 证据与映射边界 |
|---|---|---|
| 10 | R1 Pro眼在手上；相机与腕关节、基座与桌面、夹爪与腕关节，三矩阵 | [最新核心JSON](../platform/live_20261022/task10_core_parameters_refreshed.json)。抓取/放置TF都按本题三矩阵填；不自行对“与”添加方向或求逆 |
| 11 | R1 Pro眼在手外；核心页实际叫“基座与桌面矩阵”，流程要求“相机与基座矩阵”；另有夹爪与腕关节 | [核心JSON](../platform/live_20261022/task11_core_parameters.json)。本轮第一矩阵原值填深度转点云/抓取TF/放置TF的相机与基座字段，两件成功；语义名称差异未澄清，不能把二者定义为永远等价 |
| 12 | 银河通用S1眼在手外；相机与基座、夹爪与腕关节 | [核心JSON](../platform/live_20261022/task12_core_parameters.json)。按本题同名字段填深度转点云/两TF，不复制任务10/11 |

原矩阵完整数值见链接，不在模拟卷为新题虚造标定结果。报告中生成目标位姿≠机械臂实际到达；本题矩阵未说明方向时，不为了教公式擅自给它补箭头。可以单独设计“已明确T_A_B定义”的纸面变换题，但要标为模拟题给定数据。

### 6.2 连线必须在画完后再保存并重开

任务10基线14节点13边；任务11为15节点14边。任务11曾逐节点保存后才连线，关闭重开只剩孤立节点；有效修复：补齐连线后选末端节点→右侧“确定”→见保存成功→关闭重开逐边核对。[保存文字](../platform/live_20261022/task11_flow_save_after_edges.txt)、[完整重开图](../platform/live_20261022/task11_flow_all_edges_persisted.png)。这证明本轮该操作有效，不推断所有模块自动保存或整页重载都已验证。

任务12双分支14节点14边，最新依据[14边核对图](../platform/live_20261022/task12_flow_reopened_14_edges_verified.png)和[计数文字](../platform/live_20261022/task12_flow_reopened_edge_count.txt)。旧名带all_edges的图实际13边，不能靠文件名判齐。

```text
任务10：初始移腕→相机→目标检测→按仿真指令截取→2D抓取位姿→TF
→抓取移腕→闭爪→抬腕→相机→蓝盒中心→TF→放置移腕→开爪

任务11：初始移腕→相机→实例分割→截取→深度转点云→6D估计→TF
→抓取移腕→闭爪→抬腕→相机→蓝盒中心→TF→放置移腕→开爪

任务12：左臂初始A→右臂初始B→相机C
C→分割D→截取E→点云F→6D G→抓取TF H→按目标左右选臂I→闭爪J→放置移臂M→开爪N
C→蓝盒中心K→放置TF L→M
```

任务12的C→K容易漏；M有J、L两入线，但官方未说明内部AND等待语义，不单凭两线证明执行时必先闭爪。M用“刚在移动的手臂”，开合用对应执行器，不能按盒子位置改用另一手。

逐节点真实字段：[任务10](../platform/live_20261022/task10_flow_parameters.json)、[任务11](../platform/live_20261022/task11_flow_parameters_baseline.json)、[任务12](../platform/live_20261022/task12_flow_parameters.json)。移动速度界面10/11明确mm/s；位置/角度有些截图未标单位，不从速度单位倒推。

### 6.3 机械配置与当前试验值

任务12：TRAC-IK；left_arm_link1—7、right_arm_link1—7为两臂规划组；两手为各侧adapter_flange_link及gripper_link1/2；末端的父连杆各arm_link7、父规划组对应手臂。四组、六姿态、两末端已模块提交且整页刷新仍在：[重载证据](../platform/live_20261022/task12_mechanical_after_browser_reload.png)。六姿态只有滑杆图，不能编造精确关节角度答案。

点云/规划基线：OctoMap0.02m、最大感知2.5m、安全距离0.03m、上限5Hz、下采样2、膨胀2；RRT_Connect、采样步长0.3、规划时间上限3、尝试5、速度/加速度缩放0.5/0.5。[基线参数](../platform/live_20261022/task12_restored_planning_parameters.png)。步长/时间字段截图没有标单位，不擅自补。暂停前只将时间3→5，已保存启动但结果未回读；**当前仍5，不是恢复3**。

任务10基线初始移腕(0.35,1.26,0.34)，角度(0,180,180)，速度50mm/s；lift同位姿40mm/s；抓取/放置移腕从父节点TF，30mm/s；抓取安全高度0.05、放置0.1。第二轮只初始x改0，lift仍0.35；**当前初始x仍0，没有恢复基线**。

### 6.4 实际结果用作“最早失败环节”模拟题

| 题/报告 | 实际结果 | 合理标准答案边界 |
|---|---|---|
| 10基线 | 锅铲/剪刀完整成功；香蕉/拖鞋/墨镜未抓到；螺丝刀/彩椒移臂碰道具，2/7 | 检测指标很高、metric_iou=1也不能替代抓放成功；未抓到和路径碰撞分开定位 |
| 10初始x=0对照 | 墨镜完整成功，其余失败，1/7；锅铲抓起后碰盒、螺丝刀抓错 | 场景及顺序也变化，不把全部退化归因x，不把抓起等于入盒 |
| 11基线 | 水壶/塑料碗完整成功；包装盒/长颈鹿/罐头无合理抓取位，2/5 | 先查分割→截取→深度/点云→6D候选，不能唯一归因某节点；120正0负未经逐一审查 |
| 12基线 | 长颈鹿/包装盒/罐头无合理抓取位；塑料碗有6D目标但规划失败，0/4 | 加规划时间可能影响有目标的塑料碗；不能凭此补出另三对象的缺失抓取位。颜色分支有放置目标，不等于已完成放置 |

原报告：[10基线](../platform/live_20261022/task10_simulation_report_baseline.txt)、[10对照](../platform/live_20261022/task10_simulation_report_initial_x0.txt)、[11](../platform/live_20261022/task11_simulation_report_baseline.txt)、[12](../platform/live_20261022/task12_simulation_report_baseline.txt)。11的CFR82.83%/SLR33.83%、12的CFR83.04%/SLR33.41%均未达到CFR≥85%/SLR≤20%；这是已证质量缺口，但不是每个运行失败的唯一根因。

## 7 模拟答案与评分口径建议

1. **已验证同题配置**：任务3、9及任务14 R1可给精确参数和报告，称可复刻基线；不承诺新场景同样效果，不把旧结果算成用户已完成。
2. **逻辑设计标准答案**：对未开放“展会表演”整链可给正确事件顺序、消息输入输出、TF归属和失败分支，但写清是模拟设计；不存在的指令/模型/地图须标题设假定，不能伪装实际平台按钮。
3. **诊断标准答案**：给固定报告数据，要求分清错误最早发生的层次、可排除什么、仍需什么证据；不把待测修复写成标准必过配置。
4. **操作验收**：题面要求数量→配置保存回读→模型训练/查看→局部输入测试→整体仿真分项→失败记录，是不同检查点。新卷分值是自定模拟评分，不沿用14的50+50作为正式权重。
5. **保存边界**：训练提交、数据集保存、航点提交、标定提交、函数/模块提交可保留修改；最外层“提交实验/提交成绩”可能锁定。所有现有最终锁定评分未提交，模拟教学停在过程验收；代理实操仍暂停。
