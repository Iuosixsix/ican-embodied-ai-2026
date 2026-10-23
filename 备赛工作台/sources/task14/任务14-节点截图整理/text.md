[段落 2] ICAN 金视线杯 具身智能赛项 任务14

[段落 4] 功能模块改造与集成

[段落 5] 节点编辑截图整理（按节点与函数排序）

[段落 7] 星海图R1 与 宇树G1 全部节点截图，按 节点 → 函数 顺序排列，附简短说明

[段落 9] 〇、节点与函数总览

[段落 10] 两个机器人各 4 个节点：master（主逻辑）、nav（导航）、vision（视觉）、arm（机械臂）。下图为节点文件与函数清单。

[段落 11 图片] image1.jpeg

[段落 12 图片] image2.jpeg

[段落 13 图片] image3.jpeg

[段落 14 图片] image4.jpeg

[段落 15] 一、星海图R1

[段落 16] 1.1 master_node_r1.py（主逻辑）

[段落 17] init：设置唤醒词、创建3个发布者与1个订阅者

[段落 18 图片] image5.png

[段落 19 图片] image6.png

[段落 20 图片] image7.png

[段落 21 图片] image8.png

[段落 22 图片] image9.png

[段落 23 图片] image10.png

[段落 24 图片] image11.png

[段落 25] set_wakeup_keywords_callback：唤醒词「你好小星」，提取任务信息、发布静态TF r11_camera、状态置1并发布首个导航

[段落 26 图片] image12.png

[段落 27 图片] image13.png

[段落 28 图片] image14.png

[段落 29 图片] image15.png

[段落 30 图片] image16.jpeg

[段落 31] nav_arm_finish_callback：按 master_work_status 八分支推进状态机（导航/视觉请求交替）

[段落 32 图片] image17.jpeg

[段落 33 图片] image18.png

[段落 34 图片] image19.png

[段落 35 图片] image20.png

[段落 36 图片] image21.png

[段落 37 图片] image22.png

[段落 38 图片] image23.png

[段落 39 图片] image24.png

[段落 40 图片] image25.png

[段落 41 图片] image26.png

[段落 42 图片] image27.png

[段落 43 图片] image28.png

[段落 44 图片] image29.png

[段落 45 图片] image30.png

[段落 46 图片] image31.png

[段落 47 图片] image32.png

[段落 48 图片] image33.png

[段落 49] vision_detect_response_callback1：状态置3，发布 _grab（Hand=0，点云=回调Point_Cloud）

[段落 50 图片] image34.png

[段落 51 图片] image35.png

[段落 52 图片] image36.png

[段落 53 图片] image37.png

[段落 54 图片] image38.png

[段落 55] vision_detect_response_callback2：状态置6，发布 _grab（Hand=1）

[段落 56 图片] image39.png

[段落 57 图片] image40.png

[段落 58 图片] image41.png

[段落 59] vision_detect_response_callback3：状态置9，发布 _deploy（Hand=0，位姿=回调Pose）

[段落 60 图片] image42.png

[段落 61 图片] image43.png

[段落 62 图片] image44.png

[段落 63] vision_detect_response_callback4：状态置11，发布 _deploy（Hand=1）

[段落 64 图片] image45.png

[段落 65 图片] image46.png

[段落 66] 1.2 nav_node_r1.py（导航）

[段落 67] init：初始化航点、发布 _finish、订阅 _nav

[段落 68 图片] image47.png

[段落 69 图片] image48.png

[段落 70 图片] image49.png

[段落 71] nav_target_message_callback：记录目标航点名，空闲时导航到航点

[段落 72 图片] image50.png

[段落 73 图片] image51.png

[段落 74 图片] image52.png

[段落 75 图片] image53.png

[段落 76 图片] image54.png

[段落 77] nav_finish_callback：复位状态并发布 _finish

[段落 78 图片] image55.png

[段落 79 图片] image56.png

[段落 80 图片] image57.png

[段落 81] 1.3 vision_node_r1.py（视觉）

[段落 82] init：订阅 rgb 图、depth 图与 _locate 服务

[段落 83 图片] image58.png

[段落 84 图片] image59.png

[段落 85 图片] image60.png

[段落 86] get_camera_rgb_callback / get_camera_depth_callback：缓存相机图像

[段落 87 图片] image61.png

[段落 88 图片] image62.png

[段落 89 图片] image63.png

[段落 90 图片] image64.png

[段落 91] vision_detect_request_callback：物体分支（yolo.pt 检测→深度图转点云→TF r11_camera→基座→响应）；颜色分支（颜色检测→二维转三维→TF→响应）

[段落 92 图片] image65.png

[段落 93 图片] image66.png

[段落 94 图片] image67.png

[段落 95 图片] image68.png

[段落 96 图片] image69.png

[段落 97 图片] image70.png

[段落 98 图片] image71.png

[段落 99 图片] image72.png

[段落 100 图片] image73.png

[段落 101 图片] image74.png

[段落 102 图片] image75.png

[段落 103 图片] image76.png

[段落 104] 1.4 arm_node_r1.py（机械臂）

[段落 105] init：初始化规划组、发布 _finish、订阅 _grab 与 _deploy

[段落 106 图片] image77.png

[段落 107 图片] image78.png

[段落 108 图片] image79.png

[段落 109 图片] image80.png

[段落 110 图片] image81.png

[段落 111] grab_message_callback：graspnet 估计抓取位姿→TF变换→按 Hand 选左右臂→机械臂移动

[段落 112 图片] image82.png

[段落 113 图片] image83.png

[段落 114 图片] image84.png

[段落 115 图片] image85.png

[段落 116 图片] image86.png

[段落 117 图片] image87.png

[段落 118 图片] image88.png

[段落 119 图片] image89.png

[段落 120] deploy_message_callback：按 Hand 选左右臂（与 grab 相反）→移动到放置位姿

[段落 121 图片] image90.png

[段落 122 图片] image91.png

[段落 123 图片] image92.png

[段落 124 图片] image93.png

[段落 125 图片] image94.png

[段落 126 图片] image95.png

[段落 127 图片] image96.png

[段落 128] grab_finish_callback / deploy_finish_callback：夹爪动作后发布 _finish

[段落 129 图片] image97.png

[段落 130 图片] image98.png

[段落 131 图片] image99.png

[段落 132] 二、宇树G1（结构与R1相同，仅参数不同）

[段落 133] 2.1 master_node_g1.py（主逻辑）

[段落 134] init：创建发布者与订阅者（同R1）

[段落 135 图片] image100.png

[段落 136 图片] image101.png

[段落 137 图片] image102.png

[段落 138 图片] image103.png

[段落 139] set_wakeup_keywords_callback：唤醒词改为「你好小宇」，静态TF改为 r12_camera

[段落 140 图片] image104.png

[段落 141 图片] image105.png

[段落 142] nav_arm_finish_callback：八分支状态机（同R1）

[段落 143 图片] image106.png

[段落 144 图片] image107.png

[段落 145 图片] image108.png

[段落 146] vision_detect_response_callback1：发布 _grab（Hand=0）

[段落 147 图片] image109.png

[段落 148 图片] image110.jpeg

[段落 149 图片] image111.png

[段落 150] vision_detect_response_callback2：发布 _grab（Hand=1）

[段落 151 图片] image112.png

[段落 152] vision_detect_response_callback3：发布 _deploy（Hand=0）

[段落 153 图片] image113.png

[段落 154 图片] image114.png

[段落 155] vision_detect_response_callback4：发布 _deploy（Hand=1）

[段落 156 图片] image115.png

[段落 157] 2.2 nav_node_g1.py（导航）

[段落 158] init：比R1多「加载走路模型」walk.rknn，速度话题 /cmd_vel、里程计 /odom

[段落 159 图片] image116.png

[段落 160 图片] image117.png

[段落 161] 2.3 vision_node_g1.py（视觉）

[段落 162] init 与 vision_detect_request_callback：TF 源坐标系改为 r12_camera

[段落 163 图片] image118.png

[段落 164 图片] image119.png

[段落 165 图片] image120.png

[段落 166 图片] image121.png

[段落 167 图片] image122.png

[段落 168 图片] image123.png

[段落 169] 2.4 arm_node_g1.py（机械臂）

[段落 170] grab_message_callback：TF 源坐标系 r12_camera；左右手映射与R1相反（false→left，true→right）

[段落 171 图片] image124.png

[段落 172 图片] image125.png

[段落 173 图片] image126.png

[段落 174 图片] image127.png

[段落 175] 三、核心配置与评分

[段落 176] hand_eye_g1.yaml：G1 手眼标定（base_link→right_palm_link，0.0364/0.0/1.2256，pitch 0.8727）

[段落 177 图片] image128.jpeg

[段落 178] 评分报告：节点编辑50分 + 仿真验证50分，两机器人各8个子任务

[段落 179 图片] image129.jpeg