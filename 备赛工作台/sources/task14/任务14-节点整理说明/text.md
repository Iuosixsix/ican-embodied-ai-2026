[段落 2] ICAN 金视线杯 具身智能赛项

[段落 4] 任务14 功能模块改造与集成

[段落 5] ROS2 节点整理说明（星海图R1 / 宇树G1）

[段落 7] 按节点编辑界面中的函数与指令流整理，附两机器人差异对照

[段落 9] 一、任务与总体流程

[段落 10] 任务目标：机器人接收语音指令后，依次导航到三张桌子，抓取两个道具并分别放入指定颜色收纳盒，最后回到初始位并语音汇报。团队分工为语音、导航、视觉、运动四个模块，本任务在节点编辑界面中把各模块串成完整通信逻辑。

[段落 11] 每个机器人有 4 个节点：master（主逻辑）、nav（导航）、vision（视觉）、arm（机械臂）。master 用状态变量 master_work_status 驱动全流程，状态机如下：

[段落 12] 触发位置

[段落 13] 进入状态

[段落 14] 动作

[段落 15] 离开状态

[段落 16] 唤醒回调

[段落 17] —

[段落 18] 提取任务信息、发布静态TF、发布 _nav(第1个导航点)

[段落 19] 1

[段落 20] finish回调 分支1

[段落 21] 1

[段落 22] 请求 _locate(物体, 第1个道具)，回调 cb1

[段落 23] 2

[段落 24] cb1

[段落 25] 2

[段落 26] 发布 _grab(Hand=0, 点云=回调Point_Cloud)

[段落 27] 3

[段落 28] finish回调 分支2

[段落 29] 3

[段落 30] 发布 _nav(第2个导航点)

[段落 31] 4

[段落 32] finish回调 分支3

[段落 33] 4

[段落 34] 请求 _locate(物体, 第2个道具)，回调 cb2

[段落 35] 5

[段落 36] cb2

[段落 37] 5

[段落 38] 发布 _grab(Hand=1, 点云=回调Point_Cloud)

[段落 39] 6

[段落 40] finish回调 分支4

[段落 41] 6

[段落 42] 发布 _nav(第3个导航点)

[段落 43] 7

[段落 44] finish回调 分支5

[段落 45] 7

[段落 46] 请求 _locate(颜色, 第1个盒子颜色)，回调 cb3

[段落 47] 8

[段落 48] cb3

[段落 49] 8

[段落 50] 发布 _deploy(Hand=0, 位姿=回调Pose)

[段落 51] 9

[段落 52] finish回调 分支6

[段落 53] 9

[段落 54] 请求 _locate(颜色, 第2个盒子颜色)，回调 cb4

[段落 55] 10

[段落 56] cb4

[段落 57] 10

[段落 58] 发布 _deploy(Hand=1, 位姿=回调Pose)

[段落 59] 11

[段落 60] finish回调 分支7

[段落 61] 11

[段落 62] 发布 _nav(第4个导航点，回初始位)

[段落 63] 12

[段落 64] finish回调 分支8

[段落 65] 12

[段落 66] 文字转语音「任务顺利完成」，状态清零

[段落 67] 0

[段落 69] 通信约定（两机器人相同）：

[段落 70] master 发布：_nav（Navigation_Address）、_grab（布尔Hand+点云Pcloud）、_deploy（布尔Hand+位姿Fpose）；订阅 _finish，回调 nav_arm_finish_callback。

[段落 71] master 作为客户端请求视觉服务端 _locate（参数 Detect_Typ=物体/颜色、Detect_Nar=目标名），视觉节点服务端响应回传 Pose / Point_Cloud。

[段落 72] nav、arm 节点各自发布 _finish（布尔 Is_Finish）通知 master 完成。

[段落 73] 二、星海图R1 节点明细

[段落 74] 2.1 master_node_r1.py（主逻辑）

[段落 75] 节点变量：master_work_status（数字）、master_task_dictionary（字典）。函数：init、set_wakeup_keywords_callback、nav_arm_finish_callback、vision_detect_response_callback1~4。

[段落 76] init：设置唤醒词（你好小星，回调 set_wakeup_keywords_callback）→ 创建发布者×3（_nav、_grab、_deploy）→ 创建订阅者（_finish → nav_arm_finish_callback）。

[段落 77] set_wakeup_keywords_callback：提取任务信息存入 master_task_dictionary（8 个 key：target1-1、target1-2、target2-1、target2-2、target3-1、target3-2、target3-3、target4）→ 发布静态TF（r11_camera 相对基座：位置 0.0930 / 0.0000 / 1.5270，旋转 0.0000 / 0.9250 / 0.0000）→ 状态=1 → 发布 _nav(target1-1)。

[段落 78] nav_arm_finish_callback：条件判断 master_work_status，8 个分支（1/3/4/6/7/9/11/12），按上表状态机执行「变量赋值 → 发布话题或客户端请求」。

[段落 79] cb1/cb2：变量赋值（3/6）→ 发布 _grab，Hand 手动值 0/1，Pcloud 取回调参数 Point_Cloud。

[段落 80] cb3/cb4：变量赋值（9/11）→ 发布 _deploy，Hand 手动值 0/1，Fpose 取回调参数 Pose。

[段落 81] 2.2 nav_node_r1.py（导航）

[段落 82] 节点变量：nav_navigation_status（布尔）、nav_navigation_name（字符）。

[段落 83] init：初始化航点 → 创建发布者（_finish，布尔 Is_Finish）→ 创建订阅者（_nav → nav_target_message_callback）。

[段落 84] nav_target_message_callback：nav_navigation_name=回调参数 Navigation_Address → 条件判断（nav_navigation_status=false 才执行）→ 置 status=1 → 导航到航点（目标航点名=nav_navigation_name，回调 nav_finish_callback）。

[段落 85] nav_finish_callback：status=0 → 发布 _finish（Is_Finish=true）。

[段落 86] 2.3 vision_node_r1.py（视觉）

[段落 87] 节点变量：Vision_Color_Image、Vision_Depth_Image、Vision_Box、Vision_Point、Vision_Point_Cloud、Vision_Pose。

[段落 88] init：创建订阅者×3：rgb 图 → get_camera_rgb_callback；depth 图 → get_camera_depth_callback；_locate → vision_detect_request_callback。两个相机回调分别把图像存入对应变量。

[段落 89] vision_detect_request_callback：条件判断回调参数 Detect_Typ（分支1=物体，分支2=颜色）。

[段落 90] 物体分支：目标检测（图像 Vision_Color_Image，模型 yolo.pt，识别对象名=回调 Detect_Name，输出矩形框存 Vision_Box）→ 深度图转点云（深度图 Vision_Depth_Image，截取区域 Vision_Box，点云存 Vision_Point_Cloud）→ TF坐标变换（Vision_Point_Cloud，r11_camera → 基座）→ 服务端响应 _locate（Point_Cloud=Vision_Point_Cloud）。

[段落 91] 颜色分支：颜色检测（图像 Vision_Color_Image，颜色=回调 Detect_Name，输出中心点存 Vision_Point）→ 二维点转三维点（二维点 Vision_Point，深度图 Vision_Depth_Image，三维点存 Vision_Pose）→ TF坐标变换（Vision_Pose，r11_camera → 基座）→ 服务端响应 _locate（Pose=Vision_Pose）。

[段落 92] 2.4 arm_node_r1.py（机械臂）

[段落 93] 节点变量：Grasp_Point_Cloud、Grasp_Pose1、Grasp_Pose2、Grasp_Hand、Arm_Hand。

[段落 94] init：初始化规划组 → 创建发布者（_finish）→ 创建订阅者×2（_grab → grab_message_callback，_deploy → deploy_message_callback）。

[段落 95] grab_message_callback：Grasp_Point_Cloud=回调 Point_Cloud → 抓取位姿估计（模型 graspnet.tar，点云 Grasp_Point_Cloud，位姿存 Grasp_Pose1）→ TF坐标变换（Grasp_Pose1，r11_camera → 基座）→ 条件判断回调 Hand（false/true）→ 分支1(false)：Arm_Hand=right_arm、Grasp_Hand=right_gripper；分支2(true)：Arm_Hand=left_arm、Grasp_Hand=left_gripper → 机械臂移动（臂=Arm_Hand，位姿=Grasp_Pose1，速度100%，回调 grab_finish_callback）。

[段落 96] deploy_message_callback：Grasp_Pose2=回调 Fpose → 条件判断回调 Hand → 分支1(false)：Arm_Hand=left_arm、Grasp_Hand=left_gripper；分支2(true)：Arm_Hand=right_arm、Grasp_Hand=right_gripper → 机械臂移动（臂=Arm_Hand，位姿=Grasp_Pose2，速度100%，回调 deploy_finish_callback）。

[段落 97] grab_finish_callback / deploy_finish_callback：夹爪动作后发布 _finish（Is_Finish=true）。

[段落 98] 三、宇树G1 与 R1 的差异（只需改这几处）

[段落 99] G1 的节点结构、函数链、状态机与 R1 完全一致，可直接用「复制内容」把 R1 节点复制到 G1 后，只修改下表差异项。

[段落 100] 差异项

[段落 101] 星海图R1

[段落 102] 宇树G1

[段落 103] 唤醒词

[段落 104] 你好小星

[段落 105] 你好小宇

[段落 106] 手眼TF名称

[段落 107] r11_camera

[段落 108] r12_camera

[段落 109] 静态TF坐标（hand_eye yaml）

[段落 110] 位置 0.0930 / 0.0000 / 1.5270；旋转 0.0000 / 0.9250 / 0.0000

[段落 111] 位置 0.0364 / 0.0 / 1.2256；旋转 roll 0.0 / pitch 0.8727 / yaw 0.0

[段落 112] nav init 加载走路模型

[段落 113] 无（轮式底盘）

[段落 114] 初始化航点后增加「加载走路模型」：walk.rknn，速度话题 /cmd_vel，里程计话题 /odom

[段落 115] vision 中 TF 源坐标系

[段落 116] r11_camera

[段落 117] r12_camera

[段落 118] arm 中 TF 源坐标系

[段落 119] r11_camera

[段落 120] r12_camera

[段落 121] grab 左右手映射

[段落 122] false→right_arm/right_gripper；true→left_arm/left_gripper

[段落 123] false→left_arm/left_gripper；true→right_arm/right_gripper

[段落 124] deploy 左右手映射

[段落 125] false→left_arm/left_gripper；true→right_arm/right_gripper

[段落 126] false→right_arm/right_gripper；true→left_arm/left_gripper

[段落 128] 说明：G1 的 master 发布静态TF时按 hand_eye_g1.yaml 填写（eye_to_hand，base_link → right_palm_link，相机 camera_color_optical_frame）；grab/deploy 的左右手映射与 R1 正好相反，复制节点后务必逐分支核对条件判断的 false/true 对应的赋值。

[段落 129] 四、提交与验证要点

[段落 130] 8 个节点都要有内容，每个节点至少 1 个自定义函数和 1 个变量；24 个指令全部用到且参数提交完整；核心配置文件（hand_eye yaml、waypoints 等）要点击查看。

[段落 131] 条件判断的分支顺序确认后不要在外部调整分支连线结构。

[段落 132] 仿真验证：两个机器人各 8 个子任务；调试面板可查看函数执行过程与变量当前值，用于排查通信问题。