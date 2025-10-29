// ============================
// override.js - unified final
// ============================
//
// 功能:
// 1. 写死 window.crewProfiles (public/full)，所有文本都手动 <br> 分段
// 2. 覆盖 crew(), profile(), help()，输出 <div class="uuc-block">...</div>
// 3. 权限系统：
//    - 自己可看自己的 full
//    - diana / andrew 可看所有人的 full
//    - vincent 额外可看 lola 的 full
//    - 其他人只能看自己
// 4. 清理不想暴露的旧命令 (echo / ssh / telnet / ping / read / date / whoami)
// 5. 把我们的版本注册进 window.system.commands
//
// 使用: 这个文件必须在 index.html 里最后加载
// ============================


// ---------- 1. 全舰档案，带 <br> ----------

window.crewProfiles = {

  damien: {
    img: "damien.jpg",
    public: [
`<b>达米恩·冈恩</b><br>
26 岁，男<br>
<b>职业：</b> 军人<br>
<b>出生地：</b> 新布鲁克林，殖民联邦<br>
<b>舰上职务：</b> 电磁炮手，警卫<br>
<br>
<b>个人描述：</b> 强壮的外表，黑发棕眼。<br>
<b>思想与信念：</b> 别再东躲西藏了，我们应该尽快和敌人干上一仗，早日夺回地球。<br>
<b>宝贵之物：</b> 圣克里斯多福脖子上的链坠，由爷爷传给你的圣遗物。<br>
<b>特质：</b> 训练有素，虽说有时会头脑发热。你生来就拥有成为军人的天赋。<br>
<b>职责：</b> 操纵角斗士号的电磁轨道炮，负责登舰/安保。最近也被当作助理工程师参与船体维护，并逐渐在维修中找到成就感。<br>
<b>渴望：</b> 你做梦都想着收复地球。你心里知道，你是军队里的英雄。这就是你所有的渴望了。`
    ],
    full: [
`<b>达米恩·冈恩</b><br>
26 岁，男<br>
<b>职业：</b> 军人<br>
<b>出生地：</b> 新布鲁克林，殖民联邦<br>
<b>舰上职务：</b> 电磁炮手，警卫<br>
<br>
<b>属性：</b><br>
STR 70&nbsp;&nbsp;CON 80&nbsp;&nbsp;SIZ 80&nbsp;&nbsp;INT 75<br>
POW 65&nbsp;&nbsp;DEX 60&nbsp;&nbsp;APP 60&nbsp;&nbsp;EDU 85<br>
Luck 45&nbsp;&nbsp;Sanity 65&nbsp;&nbsp;Build 1&nbsp;&nbsp;Move 7&nbsp;&nbsp;DB:+1D4<br>
HP:16&nbsp;&nbsp;MP:13<br>
<br>
<b>武器配置：</b><br>
- 科尼尔 E-1 电子手枪（满充能可发射 6 次）<br>
- 格洛克 23（.40 自动手枪，常规弹夹 x1，穿甲弹夹 x1）<br>
- 科尼尔 E-2 电子步枪（满充能可发射 10 次）<br>
- Skorpion SMG（.32，常规+穿甲弹夹）<br>
<br>
<b>技能：</b><br>
攀爬 40%，电子学 20%，电器维修 30%，急救 70%，恐吓 40%，跳跃 35%，聆听 55%，<br>
低重力机动 65%，机械维修 40%，炮术-电磁轨道炮 60%，潜行 55%，侦查 45%，<br>
虚拟造梦 25%，英语 75%<br>
<br>
<b>战斗数据：</b><br>
斗殴 60% (30/12)，伤害 1D3+DB<br>
科尼尔 E-1 65% (32/13)，伤害 2D6，射程 15 码<br>
格洛克 23 65% (32/13)，伤害 1D10+1，射程 20 码<br>
科尼尔 E-2 70% (35/14)，伤害 4D6，射程 35 码<br>
Skorpion SMG 50% (25/10)，伤害 1D8，射程 40 码<br>
闪避 50% (25/10)<br>
<br>
<b>随身物品：</b><br>
个人便携终端、科技扫描仪、PDA 工具箱、维修工具、背式推进器、应急泡沫密封胶<br>
<br>
<b>背景 / 心理评估：</b><br>
个人描述：强壮的外表，黑发棕眼。<br>
思想与信念：别再东躲西藏了，我们应该尽快和敌人干上一仗，早日夺回地球。<br>
宝贵之物：圣克里斯多福脖子上的链坠，由爷爷传给你的圣遗物。<br>
特质：训练有素，虽然偶尔会头脑发热。你生来就拥有成为军人的天赋。<br>
职责：操纵角斗士号的电磁轨道炮，发射成簇的电磁加速炸弹。后来也被训练成助理工程师，并逐渐在维修工作中找到成就感。<br>
难言之隐：你做梦都想着收复地球。你心里知道你是军队里的英雄——这种信念几乎是你活下去的全部精神支撑。`
    ]
  },

  martin: {
    img: "martin.jpg",
    public: [
`<b>马丁·史密斯</b><br>
36 岁，男<br>
<b>职业：</b> 随航机械工程师<br>
<b>舰上职务：</b> 角斗士号机械师<br>
<br>
<b>个人描述：</b> 疲惫但可靠，拥有多年舰船结构经验。<br>
<b>特长：</b> 几乎能把整艘船拆了再装回去，擅长损害管制与现场抢修。<br>
<b>职责：</b> 验证技术文件和组件真伪，确保折纸计划收到的不是陷阱。<br>
<b>压力：</b> 明白这次交接可能决定殖民联邦的未来。<br>
<b>梦境：</b> 经常梦见雪地与河流的声音，但他从未见过真正的雪。`
    ],
    full: [
`<b>马丁·史密斯</b><br>
36 岁，男<br>
<b>职业：</b> 机械工程师<br>
<b>出生地：</b> 柏林工业区，殖民联邦<br>
<b>舰上职务：</b> 随航机械师（角斗士号机械维护 / 损害管制）<br>
<br>
<b>属性：</b><br>
STR 65&nbsp;&nbsp;CON 80&nbsp;&nbsp;SIZ 75&nbsp;&nbsp;INT 70<br>
POW 80&nbsp;&nbsp;DEX 60&nbsp;&nbsp;APP 55&nbsp;&nbsp;EDU 80<br>
Luck 55&nbsp;&nbsp;Sanity 80&nbsp;&nbsp;Build 1&nbsp;&nbsp;Move 7&nbsp;&nbsp;DB:+1D4<br>
HP:15&nbsp;&nbsp;MP:16<br>
<br>
<b>武器配置：</b><br>
科尼尔 E-1 电子手枪（满充能 6 次）<br>
格洛克 23（.40 自动手枪，常规弹夹 x1，穿甲弹夹 x1）<br>
<br>
<b>技能：</b><br>
计算机使用 35%，电器维修 70%，电子学 70%，快速交谈 30%，<br>
图书馆使用 40%，低重力机动 50%，机械维修 85%，重型机械操纵 45%，<br>
物理学 50%，驾驶：飞船 10%，心理学 45%，<br>
科学：工程学 70%，科学：化学 10%，科学：地质学 10%，<br>
潜行 30%，虚拟造梦 15%，英语 80%<br>
<br>
<b>战斗数据：</b><br>
斗殴 40% (20/8)，伤害 1D3+DB<br>
科尼尔 E-1 60% (30/12)，伤害 2D6，射程 15 码<br>
格洛克 23 60% (30/12)，伤害 1D10+1，射程 20 码<br>
闪避 30% (15/6)<br>
<br>
<b>防护 / 穿戴：</b><br>
联邦制服（2 护甲）<br>
重型真空作业服（12 护甲）<br>
<br>
<b>随身物品：</b><br>
PDA、科技扫描仪、工具箱、维修工具、背式推进器、应急泡沫密封胶<br>
<br>
<b>背景 / 心理评估：</b><br>
个人描述：宽脸，面容疲倦，胡子拉碴，棕发棕眼。<br>
思想与信念：命运如洪流，必须继续往前。<br>
宝贵之物：你的工具箱。<br>
特质：你总觉得任何东西都还能修好。<br>
职责：损害管制 / 现场抢修 / 验证“折纸计划”硬件真伪，确保拿到的不是陷阱。<br>
压力：你知道这次交接可能决定殖民联邦的未来。<br>
难言之隐：你经常梦见雪地与河流的声音，但你从未见过真正的雪。`
    ]
  },

  lola: {
    img: "lola.jpg",
    public: [
`<b>萝拉·沃伊特</b><br>
19 岁，女<br>
<b>职业：</b> 驾驶员 & 虚拟造梦者<br>
<b>舰上职务：</b> 主驾驶，神经链路接口员<br>
<br>
<b>个人描述：</b> 安静、听话、精通飞行控制。<br>
<b>特长：</b> 可与飞船主控阵列进行直接神经链路控制。<br>
<b>限制：</b> 上次事故后被禁止在接近段全时深沉接管。<br>
<b>药物依赖：</b> VirtEqual 稳定剂。<br>
<b>睡眠状况：</b> 常做火焰与爆裂的噩梦，几乎不安眠。`
    ],
    full: [
`<b>萝拉·沃伊特</b><br>
19 岁，女<br>
<b>职业：</b> 飞船驾驶员 / 虚拟造梦者<br>
<b>出生地：</b> 新布鲁克林，殖民联邦<br>
<b>舰上职务：</b> 主驾驶，神经链路接口员（深层飞控对接）<br>
<br>
<b>属性：</b><br>
STR 50&nbsp;&nbsp;CON 75&nbsp;&nbsp;SIZ 50&nbsp;&nbsp;INT 85<br>
POW 70&nbsp;&nbsp;DEX 75&nbsp;&nbsp;APP 65&nbsp;&nbsp;EDU 75<br>
Luck 50&nbsp;&nbsp;Sanity 70&nbsp;&nbsp;Build 0&nbsp;&nbsp;Move 8&nbsp;&nbsp;DB:0<br>
HP:12&nbsp;&nbsp;MP:15<br>
<br>
<b>武器配置：</b><br>
科尼尔 E-1 电子手枪（满充能 6 次）<br>
Skorpion SMG（常规弹夹 x1，穿甲弹夹 x1）<br>
<br>
<b>技能：</b><br>
电器维修 30%，快速交谈 45%，低重力机动 30%，<br>
机械维修 40%，领航 50%，重型机械操纵 25%，<br>
说服 25%，驾驶：飞船 80%，心理学 45%，<br>
科学：天文学 21%，科学：物理 50%，<br>
潜行 35%，虚拟造梦 70%，英语 75%<br>
<br>
<b>战斗数据：</b><br>
斗殴 35% (17/7)，伤害 1D3<br>
科尼尔 E-1 60% (30/12)，伤害 2D6，射程 15 码<br>
Skorpion SMG 55% (27/11)，伤害 1D8，射程 40 码<br>
闪避 37% (18/7)<br>
<br>
<b>防护 / 穿戴：</b><br>
联邦制服（2 护甲）<br>
重型真空作业服（12 护甲）<br>
<br>
<b>随身物品：</b><br>
PDA、科技扫描仪、背式推进器、45 天量的稳定剂（VirtEqual）<br>
<br>
<b>背景 / 心理评估：</b><br>
个人描述：老鼠似的面容，亮棕色长发，翡翠绿色的眼睛。<br>
思想与信念：至少虚拟空间里的生活不像现实那么复杂。<br>
宝贵之物：稳定剂——但同时它也是你的依赖。<br>
特质：明确的命令能让你稳定。你天生是“虚拟造梦者”，能深度接管飞船神经链路。<br>
难言之隐：高度依赖药物，停药几天内会精神瓦解。你自己也知道，并且几乎接受“离不开它”这件事。<br>
恐惧症 / 狂躁反应：反复梦见火焰和爆裂，只能在深度沉浸里感到安全；因为上次事故，你被禁止在接近段做全时深沉接管。`
    ]
  },

  vincent: {
    img: "vincent.jpg",
    public: [
`<b>文森特·戴尔加图</b><br>
28 岁，男<br>
<b>职业：</b> 情报官 & 黑客<br>
<b>舰上职务：</b> 电子渗透 / 安全入侵<br>
<br>
<b>背景：</b> 青少年时期因黑入殖民网络被捕，后被编制化。<br>
<b>职责：</b> 确保通讯安全，提前拆除潜在陷阱。<br>
<b>特长：</b> 攻防兼备的电子侦察专家。<br>
<b>信条：</b> 世界上没有真正安全的系统。`
    ],
    full: [
`<b>文森特·戴尔加图</b><br>
28 岁，男<br>
<b>职业：</b> 黑客 / 情报官<br>
<b>出生地：</b> 柏林工业区，殖民联邦<br>
<b>舰上职务：</b> 计算机操作员 / 电子渗透 / 安全入侵<br>
<br>
<b>属性：</b><br>
STR 65&nbsp;&nbsp;CON 70&nbsp;&nbsp;SIZ 70&nbsp;&nbsp;INT 75<br>
POW 70&nbsp;&nbsp;DEX 65&nbsp;&nbsp;APP 55&nbsp;&nbsp;EDU 91<br>
Luck 50&nbsp;&nbsp;Sanity 70&nbsp;&nbsp;Build 1&nbsp;&nbsp;Move 7&nbsp;&nbsp;DB:0<br>
HP:12&nbsp;&nbsp;MP:15<br>
<br>
<b>武器配置：</b><br>
科尼尔 E-1 电子手枪（满充能 6 次）<br>
格洛克 23（.40 自动手枪，常规弹夹 x1，穿甲弹夹 x1）<br>
.10 口径霰弹枪（5 发装填）<br>
<br>
<b>技能：</b><br>
计算机使用 85%，电器维修 55%，电子学 65%，<br>
快速交谈 65%，图书馆使用 75%，开锁 60%，<br>
低重力机动 20%，机械维修 40%，领航 40%，<br>
心理学 20%，科学：物理 60%，<br>
虚拟造梦 35%，英语 80%<br>
<br>
<b>战斗数据：</b><br>
斗殴 40% (20/8)，伤害 1D3+DB<br>
科尼尔 E-1 45% (22/9)，伤害 2D6，射程 15 码<br>
格洛克 23 45% (22/9)，伤害 1D10+1，射程 20 码<br>
霰弹枪 50% (25/10)，伤害 1D10+7，射程 25 码<br>
闪避 35% (17/7)<br>
<br>
<b>防护 / 穿戴：</b><br>
联邦制服（2 护甲）<br>
重型真空作业服（12 护甲）<br>
<br>
<b>随身物品：</b><br>
PDA、科技扫描仪、未备案接口模块<br>
<br>
<b>背景 / 心理评估：</b><br>
个人描述：稍显娃娃脸，红发绿眼。<br>
思想与信念：没有系统是绝对安全的。<br>
珍视之人：萝拉·沃伊特——你过度保护的对象。<br>
特质：你把“保护她”当成你存在的意义。<br>
经历：13 岁因入侵殖民网络被捕，后来被“编制化”，成了联邦的武器。<br>
难言之隐：你对萝拉有黏着式保护欲，甚至愿意越权/破坏规程只为了她安全。<br>
恐惧症 / 狂躁反应：你持续处于“被抓就会死”的偏执警戒状态；你相信所有系统都在背叛你。`
    ]
  },

  diana: {
    img: "diana.jpg",
    public: [
`<b>戴安娜·埃弗里特</b><br>
35 岁，女<br>
<b>职业：</b> 医疗官<br>
<b>舰上职务：</b> 医疗、心理监护、药物管理<br>
<br>
<b>个人描述：</b> 冷静、专业、理性。<br>
<b>特长：</b> 外科、战地救援、精神稳定干预。<br>
<b>职责：</b> 监控舰员健康与心理状态，维持团队稳定。<br>
<b>信念：</b> “我从来没丢过一个人。”`
    ],
    full: [
`<b>戴安娜·埃弗里特</b><br>
35 岁，女<br>
<b>职业：</b> 医生 / 舰载医疗官<br>
<b>出生地：</b> 西奈山，殖民联邦<br>
<b>舰上职务：</b> 医疗官（医疗处置 / 心理维稳 / 药物管理）<br>
<br>
<b>属性：</b><br>
STR 50&nbsp;&nbsp;CON 70&nbsp;&nbsp;SIZ 65&nbsp;&nbsp;INT 70<br>
POW 70&nbsp;&nbsp;DEX 55&nbsp;&nbsp;APP 80&nbsp;&nbsp;EDU 80<br>
Luck 55&nbsp;&nbsp;Sanity 70&nbsp;&nbsp;Build 0&nbsp;&nbsp;Move 7&nbsp;&nbsp;DB:0<br>
HP:13&nbsp;&nbsp;MP:14<br>
<br>
<b>武器配置：</b><br>
科尼尔 E-1 电子手枪（满充能 6 次）<br>
格洛克 23（.40 自动手枪，常规弹夹 x1，穿甲弹夹 x1）<br>
科尼尔 E-2 电子步枪（满充能 10 次）<br>
<br>
<b>技能：</b><br>
计算机使用 35%，急救 75%，图书馆使用 35%，<br>
低重力机动 20%，医学 75%，说服 30%，<br>
驾驶：飞船 19%，精神分析 55%，心理学 65%，<br>
科学：生物学 60%，科学：药学 40%，<br>
潜行 35%，虚拟造梦 24%，英语 60%<br>
<br>
<b>战斗数据：</b><br>
斗殴 30% (15/6)，伤害 1D3<br>
科尼尔 E-1 40% (20/8)，伤害 2D6，射程 15 码<br>
格洛克 23 40% (20/8)，伤害 1D10+1，射程 20 码<br>
科尼尔 E-2 50% (25/10)，伤害 4D6，射程 35 码<br>
闪避 40% (20/8)<br>
<br>
<b>防护 / 穿戴：</b><br>
联邦制服（2 护甲）<br>
重型真空作业服（12 护甲）<br>
<br>
<b>随身物品：</b><br>
PDA、科技扫描仪、背式推进器、医疗箱<br>
<br>
<b>背景 / 心理评估：</b><br>
个人描述：肤色苍白，黑色短发，棕色眼睛。<br>
思想与信念：你把“拯救生命”视作荣誉，而不仅仅是任务。<br>
珍视对象：文森特——他对你形成依赖投射，你非常清楚，也严肃管理它。<br>
特质：冷静、苛刻、条理化。你认为秩序是唯一能挽救人类的东西。<br>
职责：你是角斗士号的医疗官与心理维稳负责人。<br>
难言之隐：你从未在事故中丢过任何一个船员，这个完美记录变成了你的精神负担。你仍然幻想“稳定、普通的生活”，但你理性上已经不再相信那东西会真的存在。`
    ]
  },

  andrew: {
    img: "andrew.jpg",
    public: [
`<b>安德鲁·法克</b><br>
30 岁，男<br>
<b>职业：</b> 外交官 / 谈判代表<br>
<b>舰上职务：</b> 殖民联邦首席交涉人<br>
<br>
<b>背景：</b> 本舰政治级别最高的成员。<br>
<b>职责：</b> 与米戈种族谈判，获取折纸计划科研数据。<br>
<b>信念：</b> “为了让人类文明活下去，必须付出一切代价。”`
    ],
    full: [
`<b>安德鲁·法克</b><br>
30 岁，男<br>
<b>职业：</b> 发言人 / 外交官 / 谈判代表<br>
<b>出生地：</b> 新布鲁克林，殖民联邦<br>
<b>舰上职务：</b> 殖民联邦首席外事接口 / 折纸计划交涉人<br>
<br>
<b>属性：</b><br>
STR 65&nbsp;&nbsp;CON 65&nbsp;&nbsp;SIZ 75&nbsp;&nbsp;INT 90<br>
POW 75&nbsp;&nbsp;DEX 55&nbsp;&nbsp;APP 65&nbsp;&nbsp;EDU 80<br>
Luck 60&nbsp;&nbsp;Sanity 75&nbsp;&nbsp;Build 1&nbsp;&nbsp;Move 7&nbsp;&nbsp;DB:+1D4<br>
HP:14&nbsp;&nbsp;MP:15<br>
<br>
<b>武器配置：</b><br>
科尼尔 E-1 电子手枪（满充能 6 次）<br>
格洛克 23（.40 自动手枪，常规弹夹 x1，穿甲弹夹 x1）<br>
<br>
<b>技能：</b><br>
魅惑 60%，计算机使用 40%，信用评级 35%，<br>
乔装 15%，快速交谈 45%，恐吓 30%，<br>
图书馆使用 45%，聆听 45%，说服 75%，<br>
心理学 80%，潜行 20%，侦查 40%，<br>
虚拟造梦 30%，语言：英语 80%，米戈语 65%<br>
<br>
<b>战斗数据：</b><br>
斗殴 25% (12/5)，伤害 1D3+DB<br>
科尼尔 E-1 70% (35/14)，伤害 2D6，射程 15 码<br>
格洛克 23 70% (35/14)，伤害 1D10+1，射程 20 码<br>
闪避 45% (22/9)<br>
<br>
<b>防护 / 穿戴：</b><br>
联邦制服（2 护甲）<br>
重型真空作业服（12 护甲）<br>
<br>
<b>随身物品：</b><br>
PDA、科技扫描仪、背式推进器、<br>
折纸计划关键部件的加密数据磁盘（过滤图纸）<br>
<br>
<b>背景 / 心理评估：</b><br>
个人描述：尖脸，金色短发，蓝眼睛。<br>
思想与信念：为了让人类继续活下去，任何代价都可以接受。<br>
特质：表面礼貌，实则是极度冷静的现实主义者。<br>
职责：你是殖民联邦的首席交涉人，与“米戈”打交易，拿到折纸计划需要的科研数据。你很清楚那交易在伦理上有多脏。<br>
难言之隐：你已经完全接受“如果必须牺牲整艘角斗士号才能让人类存活，那也必须做”。<br>
恐惧症 / 狂躁反应：你对肉类有强烈的生理排斥。你会梦见在一片冰冷黑暗的地方寻找一个迷路的孩子。`
    ]
  }

};



// ---------- 2. 工具函数 ----------

function getCurrentUserId() {
  const raw = localStorage.getItem("loggedUser") || "visitor";
  return raw.toLowerCase();
}

function getCrewArray() {
  const order = ["martin","lola","vincent","diana","andrew","damien"];
  const out = [];
  order.forEach(id => {
    if (window.crewProfiles[id]) {
      out.push({ id, data: window.crewProfiles[id] });
    }
  });
  return out;
}

function resolveCrewTarget(arg) {
  if (!arg) return null;
  const lower = arg.toLowerCase();
  const list  = getCrewArray();

  // crew 2
  if (!isNaN(parseInt(lower,10))) {
    const idx = parseInt(lower,10) - 1;
    if (idx >= 0 && idx < list.length) return list[idx];
  }

  // crew lola
  return list.find(e => e.id.toLowerCase() === lower) || null;
}

function canViewFullProfile(requester, target) {
  requester = requester.toLowerCase();
  target    = target.toLowerCase();

  if (requester === target) return true;
  if (requester === "diana" || requester === "andrew") return true;
  if (requester === "vincent" && target === "lola") return true;
  return false;
}



// ---------- 3. crew() ----------

function crew(args) {
  const me = getCurrentUserId();

  if (me === "visitor") {
    return {
      delayed: 0,
      clear: false,
      message: [
        `<div class="uuc-block">`,
        `<p class="glow" style="color:#ff4d4d">访问拒绝</p>`,
        `此终端处于访客 / 未授权模式。<br>`,
        `舰员身份验证后可读取舰上在岗信息（crew）。`,
        `</div>`
      ]
    };
  }

  const list = getCrewArray();

  // crew -> roster view
  if (!args || args.length === 0) {
    const out = [];
    out.push(`<div class="uuc-block">`);
    out.push(`<p class="glow">[CREW ROSTER / 舰内频道]</p>`);
    list.forEach((entry, i) => {
      out.push(`[${i + 1}] ${entry.id}<br>`);
    });
    out.push(`<br>使用 'crew &lt;编号&gt;' 或 'crew &lt;名字&gt;' 查看该成员的在岗信息。`);
    out.push(`</div>`);
    return { delayed: 0, clear: false, message: out };
  }

  // crew lola / crew 2
  const target = resolveCrewTarget(args[0]);
  if (!target) {
    return {
      delayed: 0,
      clear: false,
      message: [
        `<div class="uuc-block">`,
        `<p class="glow" style="color:#ff4d4d">档案不可用</p>`,
        `该身份未在此节点登记。`,
        `</div>`
      ]
    };
  }

  const pubInfo = target.data.public || [];
  const out = [
    `<div class="uuc-block">`,
    `<p class="glow">[在岗信息] ${target.id.toUpperCase()}</p>`,
    ...pubInfo,
    `</div>`
  ];

  return { delayed: 0, clear: false, message: out };
}



// ---------- 4. profile() ----------

function profile(args) {
  const me = getCurrentUserId();
  const db = window.crewProfiles || {};

  if (me === "visitor") {
    return {
      delayed: 0,
      clear: false,
      message: [
        `<div class="uuc-block">`,
        `<p class="glow" style="color:#ff4d4d">访问拒绝</p>`,
        `此终端处于访客模式。<br>请先使用 login 指令登录舰员身份。`,
        `</div>`
      ]
    };
  }

  const targetId = (args && args[0] ? args[0] : me).toLowerCase();
  const record   = db[targetId];

  if (!record) {
    return {
      delayed: 0,
      clear: false,
      message: [
        `<div class="uuc-block">`,
        `<p class="glow">档案不可用</p>`,
        `该身份未在此节点登记。`,
        `</div>`
      ]
    };
  }

  if (!canViewFullProfile(me, targetId)) {
    return {
      delayed: 0,
      clear: false,
      message: [
        `<div class="uuc-block">`,
        `<p class="glow" style="color:#ff4d4d">Ω-3 访问拒绝</p>`,
        `请求者身份: ${me}<br>`,
        `目标档案: ${targetId}<br><br>`,
        `该档案属于高密级（心理状态 / 技能 / 风险评估）。<br>`,
        `仅医疗官、外交官，以及特批对象可读取他人完整档案。<br>`,
        `如需升级，请线下寻求安德鲁或戴安娜授权。`,
        `</div>`
      ]
    };
  }

  const fullData = record.full || [];
  const out = [
    `<div class="uuc-block">`,
    `<p class="glow" style="font-size:1.1rem">[生存档案] ${targetId.toUpperCase()}</p>`,
    ...fullData,
    `</div>`
  ];

  return { delayed: 20, clear: false, message: out };
}



// ---------- 5. help() (先保留，但不强制接管内核) ----------
function customHelp(args) {
  const out = [];

  out.push(`<div class="uuc-block">`);
  out.push(`<p class="glow" style="font-size:1.1rem">╔════════════════════════════════╗</p>`);
  out.push(`<p class="glow" style="font-size:1.1rem">║  舰载指令索引 / UUC_GLADIATOR   ║</p>`);
  out.push(`<p class="glow" style="font-size:1.1rem">╚════════════════════════════════╝</p>`);
  out.push(`<br>`);
  out.push(`<b>acknowledge</b>    - 确认并回传 Ω-3 指令回执（不可撤回）<br>`);
  out.push(`<b>crew</b>           - 舰员名册 / 在岗信息（公开）<br>`);
  out.push(`<b>profile [id]</b>  - 完整人物档案（需权限；不带参数=查看自己）<br>`);
  out.push(`<b>status</b>         - 舰体与战术态势快照<br>`);
  out.push(`<b>login / logout</b> - 登录 / 登出舰载终端<br>`);
  out.push(`<b>clear</b>          - 清屏<br>`);
  out.push(`<b>help</b>           - 显示本帮助页面<br>`);
  out.push(`<br>`);
  out.push(`<span style="color:#888">注意：部分档案属于 Ω-3 级密级，仅特批舰员可见。</span>`);
  out.push(`</div>`);

  return {
    delayed: 0,
    clear: false,
    message: out
  };
}

// ---------- 6. 暴露到全局 ----------
window.getCurrentUserId   = getCurrentUserId;
window.getCrewArray       = getCrewArray;
window.resolveCrewTarget  = resolveCrewTarget;
window.canViewFullProfile = canViewFullProfile;

window.crew    = crew;
window.profile = profile;

// 我们把 customHelp 也挂出来，但暂时不劫持真正的 help
window.customHelp = customHelp;

console.log(
  "%c[override.js] crew/profile 已接管，help() 已就绪(未强制接管)",
  "color:#80ffaa"
);

// === Y/N 对“地球拦截行动 / 小纸条1号”的应答（登录态才生效） ===
(function () {
  const ACK_KEY = "ack_smallnote1"; // 本地记录：Y 或 N

  function isLoggedIn() {
    return !!(window.userDatabase && userDatabase.userId && userDatabase.userId !== "visitor");
  }

  function stamp() {
    const d = new Date();
    const pad = (n) => (n < 10 ? "0" + n : "" + n);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
  }

  // Y：确认接收
  window.y = function () {
    if (!isLoggedIn()) return; // 未登录时，由 kernel 放行到 "command not found"
    const who = userDatabase.userId;
    const prev = localStorage.getItem(ACK_KEY);

    if (prev === "Y") {
      return {
        message: [
          "<p class='glow'>[Ω-3 ACK]</p>系统记录：你已确认过此任务，无需重复回执。"
        ]
      };
    }

    localStorage.setItem(ACK_KEY, "Y");
    return {
      message: [
        "<p class='glow'>[Ω-3 ACK]</p>地球拦截行动",
        `回执人：${who}`,
        `时间戳：${stamp()}`,
        "状态：<b>已确认 / Proceed</b>",
        "",
        "<span style='color:#888'>指挥部确认：任务已纳入全舰链路。</span>"
      ]
    };
  };

  // N：拒绝/犹豫（系统会记录，但任务不会中止）
  window.n = function () {
    if (!isLoggedIn()) return;
    const who = userDatabase.userId;
    const prev = localStorage.getItem(ACK_KEY);

    if (prev === "N") {
      return {
        message: [
          "<p class='glow'>[Ω-3 ACK]</p>系统记录：你的反馈已收到，任务仍在执行中。"
        ]
      };
    }

    localStorage.setItem(ACK_KEY, "N");
    return {
      message: [
        "<p class='glow'>[Ω-3 ACK]</p>地球拦截行动",
        `回执人：${who}`,
        `时间戳：${stamp()}`,
        "状态：<b>反馈：暂未确认 / Hold</b>",
        "",
        "<span style='color:#888'>上级通告：任务已知难度与风险，期待你的判断与执行。</span>",
        "<span style='color:#888'>备注：Ω-3 指令不可拒绝，系统已将此回执标记为“心理应答”。</span>"
      ]
    };
  };
})();
