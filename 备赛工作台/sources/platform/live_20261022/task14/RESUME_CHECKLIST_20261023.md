# 任务14续做检查单

整理日期：2026-10-23（UTC+8）。本页依据上次已保存证据安排续做，不表示今天已执行或仿真通过。源记录为上级目录《任务14实测记录.md》；完整参数在`../../任务10-14_实测操作索引.md`。

## 先恢复已保存位置

- R1已有19个函数：master 7、nav 3、vision 4、arm 5，含每节点默认init。不要重复创建同名函数。
- R1 master变量2个：master_work_status（数字）、master_task_dictionary（字典）；nav变量2个：nav_navigation_status（布尔）、nav_navigation_name（字符）。
- master init已保存：唤醒→3发布→finish订阅；nav init已保存：初始化航点→finish发布→nav订阅。
- 以现有`10_master_init_graph.png`、`11_nav_init_complete_graph.png`核对后再编辑。`09_nav_init_partial_graph.png`只是中间版本。
- vision和arm变量尚未有完成证据；其余函数只有创建证据，没有功能实现或仿真证据。
- G1没有复制/配置/运行完成证据。最终锁定评分没有提交。

## 从依赖最少的函数继续

| 次序 | 节点/函数 | 需实现的链 | 完成时检查 |
|---|---|---|---|
| 1 | nav_target_message_callback | Navigation_Address回调参数→nav_navigation_name；忙标志为false时置1→按变量导航→绑定nav_finish_callback | 参数来源是回调字段；条件分支只有false分支接动作 |
| 2 | nav_finish_callback | 忙标志置0→发布_finish.is_Finish=1 | 沿用现有字段大小写，不新建Is_Finish |
| 3 | vision变量 | 两图像、数字数组框、点、点云、位姿六变量 | 名字和类型逐项回读 |
| 4 | vision init | 订阅彩色→订阅深度→创建_locate服务 | 请求Detect_Type/Detect_Name；响应Pose/Point_Cloud |
| 5 | 两相机回调 | color_image/depth_image分别赋值至对应变量 | 参数来源不是手动字符串 |
| 6 | vision_detect_request_callback | Detect_Type分物体/颜色；物体检测→深度点云→响应，颜色检测→二维点转三维→TF→响应 | 物体支不做TF；颜色支结果已是基座系 |
| 7 | arm变量与init | 点云、两位姿、夹爪名、臂名；规划组→finish发布→grab订阅→deploy订阅 | _grab字段Pcloud；_deploy字段Fpose；两回调绑定正确 |
| 8 | grab_message_callback | Pcloud赋点云→Hand分支设置臂/夹爪→GraspNet→TF→机械臂移动 | R1 false左、true右；位姿源相机r11_camera目标基座 |
| 9 | grab_finish_callback | 闭合变量指定夹爪→发布finish=1 | 不能在移动完成前发完成消息 |
| 10 | deploy_message_callback | Fpose赋位姿→同样手别分支→移动到放置位姿 | 不再重复相机→基座TF |
| 11 | deploy_finish_callback | 张开变量指定夹爪80%→发布finish=1 | 抓与放指向同一只手 |
| 12 | master唤醒回调 | 提取字典→发布静态TF→状态1→导航target1-1 | TF值先与当前资源核对；导航发字典单个key |
| 13 | 四视觉响应回调 | 状态3/6/9/11→发布grab/grab/deploy/deploy | R1 Hand依次0/1/0/1；服务Point_Cloud转为话题Pcloud |
| 14 | master完成回调 | 依状态1/3/4/6/7/9/11/12分支推进 | 除最终播报后清零外，先写状态再发下一动作 |

master完成回调的八条分支：1→2请求物体target1-2；3→4导航target2-1；4→5请求物体target2-2；6→7导航target3-1；7→8请求颜色target3-2；9→10请求颜色target3-3；11→12导航target4；12→播报→0。视觉响应分别把等待状态2/5/8/10推进到3/6/9/11。

## R1过程验证后复制G1

逐节点用官方“复制内容”功能复制，之后核对变量、字段、回调，不假设复制全部完美。G1修改：唤醒“你好小宇”；相机TF名r12_camera、位置0.0364/0/1.2256、旋转0/0.8727/0（仍须查当前资源）；nav增加walk.rknn、/cmd_vel、/odom；vision颜色TF和arm两抓取TF改源系；master四Hand改1/0/1/0，不再同时反转arm分支。

## 每个函数保存前做一次可见状态核对

1. 打开齿轮后先读取当前节点/函数名，避免图说错位或旧弹窗。
2. 下拉列表动画可能让指针选择偏到相邻项。选定后回读文字；可用上下键移动高亮、Enter提交，再回读。
3. 所有参数红光消失，连线方向和分支顺序正确，再点函数级“提交”。
4. 看见保存成功后返回列表；不要立即拖下一块而忽略覆盖层。
5. 查看源码是辅助核对，已见生成模板存在占位/映射问题，不能当可直接运行的ROS工程，也不能绕过图形编辑器调用后台。

## 过程报告检查

R1和G1分别记录8个子任务的实际完成情况与最早失败状态。卡1/4/7/12查导航；卡2/5/8/10查视觉服务；卡3/6查抓取；卡9/11查放置。真正运行后再更新“已实现/已通过”，不能以本检查单、函数已存在或第三方100分图替代。仅保存配置与过程报告，禁止最外层最终评分提交。
