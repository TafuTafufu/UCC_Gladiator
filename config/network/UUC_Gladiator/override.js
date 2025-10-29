// ============================
// override.js FINAL CLEAN
// ============================
// 作用：
// 1. 定义全舰 crewProfiles（public / full）
// 2. 覆盖 crew() / profile()，加权限
// 3. 重写 help()，删掉不要的命令
// 4. 输出时包一层 <div class="uuc-block">，并在运行时注入样式，保证自动换行且不闪烁
// ============================

// ---------- 0. 运行时注入样式（只影响我们输出的块，不影响欢迎界面） ----------
(function injectUUCStyles() {
  if (document.getElementById("uuc-style-block")) return;
  const style = document.createElement("style");
  style.id = "uuc-style-block";
  style.textContent = `
    /* 我们自己的输出外壳 */
    .uuc-block {
      max-width: 90vw;
      line-height: 1.4;
      white-space: pre-wrap;       /* 保留换行符，但允许长行自动折行 */
      word-break: break-word;      /* 中文/长英文都能断开 */
      overflow-wrap: break-word;
      margin-bottom: 1.2em;
    }

    /* glow 现在是常亮柔光，不闪烁 */
    .glow {
      color: #fff;
      text-shadow:
        0 0 4px #fff,
        0 0 8px #fff,
        0 0 12px rgba(128,255,128,0.7),
        0 0 24px rgba(128,255,128,0.4);
      animation: none !important;
      -webkit-animation: none !important;
    }
  `;
  document.head.appendChild(style);
})();


// ---------- 1. 舰员完整档案 ----------
window.crewProfiles = {
  damien: {
    img: "damien.jpg",
    public: [
`<b>达米恩·冈恩</b>
26 岁，男
<b>职业：</b> 军人
<b>出生地：</b> 新布鲁克林，殖民联邦
<b>舰上职务：</b> 电磁炮手，警卫

<b>个人描述：</b> 强壮的外表，黑发棕眼。
<b>思想与信念：</b> 别再东躲西藏了，我们应该尽快和敌人干上一仗，早日夺回地球。
<b>宝贵之物：</b> 圣克里斯多福脖子上的链坠，由爷爷传给你的圣遗物。
<b>特质：</b> 训练有素，虽说有时会头脑发热。你生来就拥有成为军人的天赋。
<b>职责：</b> 操纵角斗士号的电磁轨道炮，负责登舰/安保。最近也被当作助理工程师参与船体维护，并逐渐在维修中找到成就感。
<b>渴望：</b> 你做梦都想着收复地球。你心里知道，你是军队里的英雄。这就是你所有的渴望了。`
    ],
    full: [
`<b>达米恩·冈恩</b>
26 岁，男
<b>职业：</b> 军人
<b>出生地：</b> 新布鲁克林，殖民联邦
<b>舰上职务：</b> 电磁炮手，警卫

<b>属性：</b>
STR 70  CON 80  SIZ 80  INT 75
POW 65  DEX 60  APP 60  EDU 85
Luck 45  Sanity 65  Build 1  Move 7  DB:+1D4
HP:16  MP:13

<b>武器配置：</b>
  - 科尼尔 E-1 电子手枪（满充能可发射 6 次）
  - 格洛克 23（.40 自动手枪，常规弹夹 x1，穿甲弹夹 x1）
  - 科尼尔 E-2 电子步枪（满充能可发射 10 次）
  - Skorpion SMG（.32，常规+穿甲弹夹）

<b>技能：</b>
  攀爬 40%，电子学 20%，电器维修 30%，急救 70%，恐吓 40%，跳跃 35%，聆听 55%，
  低重力机动 65%，机械维修 40%，炮术-电磁轨道炮 60%，潜行 55%，侦查 45%，
  虚拟造梦 25%，英语 75%

<b>战斗数据：</b>
  斗殴 60% (30/12)，伤害 1D3+DB / 武器伤害
  科尼尔 E-1 65% (32/13)，伤害 2D6，射程 15 码
  格洛克 23 65% (32/13)，伤害 1D10+1，射程 20 码
  科尼尔 E-2 70% (35/14)，伤害 4D6，射程 35 码
  Skorpion SMG 50% (25/10)，伤害 1D8，射程 40 码
  闪避 50% (25/10)

<b>随身物品：</b>
  个人便携终端、科技扫描仪、PDA 工具箱、维修工具、背式推进器、应急泡沫密封胶

<b>背景 / 心理评估：</b>
个人描述：强壮的外表，黑发棕眼。
思想与信念：别再东躲西藏了，我们应该尽快和敌人干上一仗，早日夺回地球。
宝贵之物：圣克里斯多福脖子上的链坠，由爷爷传给你的圣遗物。
特质：训练有素，虽说有时会头脑发热。你生来就拥有成为军人的天赋。无论是为角斗士号护航还是包围敌对目标，每一个任务你都严肃以待。
职责：操纵角斗士号的电磁轨道炮，发射成簇的电磁加速炸弹。自从不再被频繁投入正面交火后，你受训成为助理工程师，也逐渐在维修工作中找到成就感。
难言之隐：你做梦都想着收复地球。你心里知道你是军队里的英雄。这种信念几乎是你全部的精神支撑。`
    ]
  },

  martin: {
    img: "martin.jpg",
    public: [
`<b>马丁·史密斯</b>
36 岁，男
<b>职业：</b> 随航机械工程师
<b>舰上职务：</b> 角斗士号机械师

<b>个人描述：</b> 疲惫但可靠，拥有多年舰船结构经验。
<b>特长：</b> 几乎能把整艘船拆了再装回去，擅长损害管制与现场抢修。
<b>职责：</b> 验证技术文件和组件真伪，确保折纸计划收到的不是陷阱。
<b>压力：</b> 明白这次交接可能决定殖民联邦的未来。
<b>梦境：</b> 经常梦见雪地与河流的声音，但他从未见过真正的雪。`
    ],
    full: [
`<b>马丁·史密斯</b>
36 岁，男
<b>职业：</b> 机械工程师
<b>出生地：</b> 柏林工业区，殖民联邦
<b>舰上职务：</b> 随航机械师（角斗士号机械维护 / 损害管制）

<b>属性：</b>
STR 65  CON 80  SIZ 75  INT 70
POW 80  DEX 60  APP 55  EDU 80
Luck 55  Sanity 80  Build 1  Move 7  DB:+1D4
HP:15  MP:16

<b>武器配置：</b>
  科尼尔 E-1 电子手枪（满充能 6 次）
  格洛克 23（.40 自动手枪，常规弹夹 x1，穿甲弹夹 x1）

<b>技能：</b>
  计算机使用 35%，电器维修 70%，电子学 70%，快速交谈 30%，
  图书馆使用 40%，低重力机动 50%，机械维修 85%，重型机械操纵 45%，
  物理学 50%，驾驶：飞船 10%，心理学 45%，
  科学：工程学 70%，科学：化学 10%，科学：地质学 10%，
  潜行 30%，虚拟造梦 15%，英语 80%

<b>战斗数据：</b>
  斗殴 40% (20/8)，伤害 1D3+DB / 武器伤害
  科尼尔 E-1 60% (30/12)，伤害 2D6，射程 15 码
  格洛克 23 60% (30/12)，伤害 1D10+1，射程 20 码
  闪避 30% (15/6)

<b>防护 / 穿戴：</b>
  联邦制服（2 护甲）
  重型真空作业服（12 护甲）

<b>随身物品：</b>
  PDA、科技扫描仪、工具箱、维修工具、背式推进器、应急泡沫密封胶

<b>背景 / 心理评估：</b>
个人描述：宽脸，面容疲倦，胡子拉碴，棕发棕眼。
思想与信念：命运如洪流，必须继续往前。
宝贵之物：你的工具箱。
特质：你总觉得任何东西都还能修好。
职责：损害管制 / 现场抢修 / 验证“折纸计划”硬件真伪，确保拿到的不是陷阱。
你知道这次交接可能决定殖民联邦的未来。
难言之隐：你经常梦见雪地与河流的声音，但你从未见过真正的雪。`
    ]
  },

  lola: {
    img: "lola.jpg",
    public: [
`<b>萝拉·沃伊特</b>
19 岁，女
<b>职业：</b> 驾驶员 & 虚拟造梦者
<b>舰上职务：</b> 主驾驶，神经链路接口员

<b>个人描述：</b> 安静、听话、精通飞行控制。
<b>特长：</b> 可与飞船主控阵列进行直接神经链路控制。
<b>限制：</b> 上次事故后被禁止在接近段全时深沉接管。
<b>药物依赖：</b> VirtEqual 稳定剂。
<b>睡眠状况：</b> 常做火焰与爆裂的噩梦，几乎不安眠。`
    ],
    full: [
`<b>萝拉·沃伊特</b>
19 岁，女
<b>职业：</b> 飞船驾驶员 / 虚拟造梦者
<b>出生地：</b> 新布鲁克林，殖民联邦
<b>舰上职务：</b> 主驾驶，神经链路接口员（深层飞控对接）

<b>属性：</b>
STR 50  CON 75  SIZ 50  INT 85
POW 70  DEX 75  APP 65  EDU 75
Luck 50  Sanity 70  Build 0  Move 8  DB:0
HP:12  MP:15

<b>武器配置：</b>
  科尼尔 E-1 电子手枪（满充能 6 次）
  Skorpion SMG（常规弹夹 x1，穿甲弹夹 x1）

<b>技能：</b>
  电器维修 30%，快速交谈 45%，低重力机动 30%，
  机械维修 40%，领航 50%，重型机械操纵 25%，
  说服 25%，驾驶：飞船 80%，心理学 45%，
  科学：天文学 21%，科学：物理 50%，
  潜行 35%，虚拟造梦 70%，英语 75%

<b>战斗数据：</b>
  斗殴 35% (17/7)，伤害 1D3 / 武器伤害
  科尼尔 E-1 60% (30/12)，伤害 2D6，射程 15 码
  Skorpion SMG 55% (27/11)，伤害 1D8，射程 40 码
  闪避 37% (18/7)

<b>防护 / 穿戴：</b>
  联邦制服（2 护甲）
  重型真空作业服（12 护甲）

<b>随身物品：</b>
  PDA、科技扫描仪、背式推进器、45 天量的稳定剂（VirtEqual）

<b>背景 / 心理评估：</b>
个人描述：老鼠似的面容，亮棕色长发，翡翠绿色的眼睛。
思想与信念：至少虚拟空间里的生活不像现实那么复杂。
宝贵之物：稳定剂——同时也是你的依赖来源。
特质：明确的命令能让你稳定。你天生是“虚拟造梦者”，能深度接管飞船神经链路。
难言之隐：高度依赖药物，停药几天内会精神瓦解。你也知道这点，并且几乎接受“可能离不开它”这个事实。
恐惧症与狂躁症：反复梦见火焰和爆裂，只能在深度沉浸里感到安全；因为上次事故，你被禁止在接近段做全时深沉接管。`
    ]
  },

  vincent: {
    img: "vincent.jpg",
    public: [
`<b>文森特·戴尔加图</b>
28 岁，男
<b>职业：</b> 情报官 & 黑客
<b>舰上职务：</b> 电子渗透 / 安全入侵

<b>背景：</b> 青少年时期因黑入殖民网络被捕，后被编制化。
<b>职责：</b> 确保通讯安全，提前拆除潜在陷阱。
<b>特长：</b> 攻防兼备的电子侦察专家。
<b>信条：</b> 世界上没有真正安全的系统。`
    ],
    full: [
`<b>文森特·戴尔加图</b>
28 岁，男
<b>职业：</b> 黑客 / 情报官
<b>出生地：</b> 柏林工业区，殖民联邦
<b>舰上职务：</b> 计算机操作员 / 电子渗透 / 安全入侵

<b>属性：</b>
STR 65  CON 70  SIZ 70  INT 75
POW 70  DEX 65  APP 55  EDU 91
Luck 50  Sanity 70  Build 1  Move 7  DB:0
HP:12  MP:15

<b>武器配置：</b>
  科尼尔 E-1 电子手枪（满充能 6 次）
  格洛克 23（.40 自动手枪，常规弹夹 x1，穿甲弹夹 x1）
  .10 口径霰弹枪（5 发装填）

<b>技能：</b>
  计算机使用 85%，电器维修 55%，电子学 65%，
  快速交谈 65%，图书馆使用 75%，开锁 60%，
  低重力机动 20%，机械维修 40%，领航 40%，
  心理学 20%，科学：物理 60%，
  虚拟造梦 35%，英语 80%

<b>战斗数据：</b>
  斗殴 40% (20/8)，伤害 1D3+DB / 武器伤害
  科尼尔 E-1 45% (22/9)，伤害 2D6，射程 15 码
  格洛克 23 45% (22/9)，伤害 1D10+1，射程 20 码
  霰弹枪 50% (25/10)，伤害 1D10+7，射程 25 码
  闪避 35% (17/7)

<b>防护 / 穿戴：</b>
  联邦制服（2 护甲）
  重型真空作业服（12 护甲）

<b>随身物品：</b>
  PDA、科技扫描仪、未备案接口模块

<b>背景 / 心理评估：</b>
个人描述：稍显娃娃脸，红发绿眼。
思想与信念：没有系统是绝对安全的。
珍视之人：萝拉·沃伊特——你过度保护的对象。
特质：你很愿意做别人的盾牌，把“保护她”当成你存在的意义。
经历：13 岁因入侵殖民网络被捕，后来被“编制化”，成了联邦的武器。
难言之隐：对萝拉有黏着式保护欲，甚至愿意越权/破坏规程只为了她安全。
恐惧症与狂躁症：你持续处于“被抓就会死”的偏执警戒状态。你相信所有系统都在背叛你。`
    ]
  },

  diana: {
    img: "diana.jpg",
    public: [
`<b>戴安娜·埃弗里特</b>
35 岁，女
<b>职业：</b> 医疗官
<b>舰上职务：</b> 医疗、心理监护、药物管理

<b>个人描述：</b> 冷静、专业、理性。
<b>特长：</b> 外科、战地救援、精神稳定干预。
<b>职责：</b> 监控舰员健康与心理状态，维持团队稳定。
<b>信念：</b> “我从来没丢过一个人。”`
    ],
    full: [
`<b>戴安娜·埃弗里特</b>
35 岁，女
<b>职业：</b> 医生 / 舰载医疗官
<b>出生地：</b> 西奈山，殖民联邦
<b>舰上职务：</b> 医疗官（医疗处置 / 心理维稳 / 药物管理）

<b>属性：</b>
STR 50  CON 70  SIZ 65  INT 70
POW 70  DEX 55  APP 80  EDU 80
Luck 55  Sanity 70  Build 0  Move 7  DB:0
HP:13  MP:14

<b>武器配置：</b>
  科尼尔 E-1 电子手枪（满充能 6 次）
  格洛克 23（.40 自动手枪，常规弹夹 x1，穿甲弹夹 x1）
  科尼尔 E-2 电子步枪（满充能 10 次）

<b>技能：</b>
  计算机使用 35%，急救 75%，图书馆使用 35%，
  低重力机动 20%，医学 75%，说服 30%，
  驾驶：飞船 19%，精神分析 55%，心理学 65%，
  科学：生物学 60%，科学：药学 40%，
  潜行 35%，虚拟造梦 24%，英语 60%

<b>战斗数据：</b>
  斗殴 30% (15/6)，伤害 1D3 / 武器伤害
  科尼尔 E-1 40% (20/8)，伤害 2D6，射程 15 码
  格洛克 23 40% (20/8)，伤害 1D10+1，射程 20 码
  科尼尔 E-2 50% (25/10)，伤害 4D6，射程 35 码
  闪避 40% (20/8)

<b>防护 / 穿戴：</b>
  联邦制服（2 护甲）
  重型真空作业服（12 护甲）

<b>随身物品：</b>
  PDA、科技扫描仪、背式推进器、医疗箱

<b>背景 / 心理评估：</b>
个人描述：肤色苍白，黑色短发，棕色眼睛。
思想与信念：你把“拯救生命”视作荣誉，而不仅仅是任务。
珍视对象：文森特——他对你形成依赖投射，你非常清楚，也严肃管理它。
特质：冷静、苛刻、条理化。你认为秩序是唯一能挽救人类的东西。
职责：你是角斗士号的医疗官与心理维稳负责人。
难言之隐：你从未在事故中丢过任何一个船员，这个完美记录变成了你的精神负担。你仍然幻想“稳定、普通的生活”，但你理性上已经不再相信那东西会真的存在。`
    ]
  },

  andrew: {
    img: "andrew.jpg",
    public: [
`<b>安德鲁·法克</b>
30 岁，男
<b>职业：</b> 外交官 / 谈判代表
<b>舰上职务：</b> 殖民联邦首席交涉人

<b>背景：</b> 本舰政治级别最高的成员。
<b>职责：</b> 与米戈种族谈判，获取折纸计划科研数据。
<b>信念：</b> “为了让人类文明活下去，必须付出一切代价。”`
    ],
    full: [
`<b>安德鲁·法克</b>
30 岁，男
<b>职业：</b> 发言人 / 外交官 / 谈判代表
<b>出生地：</b> 新布鲁克林，殖民联邦
<b>舰上职务：</b> 殖民联邦首席外事接口 / 折纸计划交涉人

<b>属性：</b>
STR 65  CON 65  SIZ 75  INT 90
POW 75  DEX 55  APP 65  EDU 80
Luck 60  Sanity 75  Build 1  Move 7  DB:+1D4
HP:14  MP:15

<b>武器配置：</b>
  科尼尔 E-1 电子手枪（满充能 6 次）
  格洛克 23（.40 自动手枪，常规弹夹 x1，穿甲弹夹 x1）

<b>技能：</b>
  魅惑 60%，计算机使用 40%，信用评级 35%，
  乔装 15%，快速交谈 45%，恐吓 30%，
  图书馆使用 45%，聆听 45%，说服 75%，
  心理学 80%，潜行 20%，侦查 40%，
  虚拟造梦 30%，语言：英语 80%，米戈语 65%

<b>战斗数据：</b>
  斗殴 25% (12/5)，伤害 1D3+DB / 武器伤害
  科尼尔 E-1 70% (35/14)，伤害 2D6，射程 15 码
  格洛克 23 70% (35/14)，伤害 1D10+1，射程 20 码
  闪避 45% (22/9)

<b>防护 / 穿戴：</b>
  联邦制服（2 护甲）
  重型真空作业服（12 护甲）

<b>随身物品：</b>
  PDA、科技扫描仪、背式推进器、
  折纸计划关键部件的加密数据磁盘（过滤图纸）

<b>背景 / 心理评估：</b>
个人描述：尖脸，金色短发，蓝眼睛。
思想与信念：为了让人类继续活下去，任何代价都可以接受。
特质：表面礼貌，实则是极度冷静的现实主义者。
职责：你是殖民联邦的首席交涉人，与“米戈”打交易，拿到折纸计划需要的科研数据。你很清楚那交易在伦理上有多脏。
难言之隐：你已经完全接受“如果必须牺牲整艘角斗士号才能让人类存活，那也必须做”。
恐惧症与狂躁症：你对肉类有强烈的生理排斥。你会梦见在一片冰冷黑暗的地方寻找一个迷路的孩子。`
    ]
  }
};


// ---------- 2. 通用工具 ----------
function getCurrentUserId() {
  const raw = localStorage.getItem("loggedUser") || "visitor";
  return raw.toLowerCase();
}

function getCrewArray() {
  const order = ["martin", "lola", "vincent", "diana", "andrew", "damien"];
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
  const list = getCrewArray();

  // crew 2
  if (!isNaN(parseInt(lower, 10))) {
    const idx = parseInt(lower, 10) - 1;
    if (idx >= 0 && idx < list.length) return list[idx];
  }
  // crew lola
  return list.find(e => e.id.toLowerCase() === lower) || null;
}

function canViewFullProfile(requester, target) {
  requester = requester.toLowerCase();
  target = target.toLowerCase();
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
        "<p class='glow' style='color:#ff4d4d'>访问拒绝</p>",
        "此终端处于访客 / 未授权模式。",
        "舰员身份验证后可读取舰上在岗信息（crew）。",
        `</div>`
      ]
    };
  }

  const list = getCrewArray();

  // crew -> ROSTER
  if (!args || args.length === 0) {
    const out = [];
    out.push(`<div class="uuc-block">`);
    out.push("<p class='glow'>[CREW ROSTER / 舰内频道]</p>");
    out.push("");
    list.forEach((entry, i) => {
      out.push(`[${i + 1}] ${entry.id}`);
    });
    out.push("");
    out.push("使用 'crew <编号>' 或 'crew <名字>' 查看该成员的在岗信息。");
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
        "<p class='glow' style='color:#ff4d4d'>记录不可用</p>",
        "该身份未在此节点登记。",
        `</div>`
      ]
    };
  }

  const pubInfo = target.data.public || [];
  const out = [
    `<div class="uuc-block">`,
    `<p class='glow'>[在岗信息] ${target.id.toUpperCase()}</p>`,
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
        "<p class='glow' style='color:#ff4d4d'>访问拒绝</p>",
        "此终端处于访客模式。",
        "请先使用 login 指令登录舰员身份。",
        `</div>`
      ]
    };
  }

  const targetId = (args && args[0] ? args[0] : me).toLowerCase();
  const record = db[targetId];

  if (!record) {
    return {
      delayed: 0,
      clear: false,
      message: [
        `<div class="uuc-block">`,
        "<p class='glow'>档案不可用</p>",
        "该身份未在此节点登记。",
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
        "<p class='glow' style='color:#ff4d4d'>Ω-3 访问拒绝</p>",
        "请求者身份: " + me,
        "目标档案: " + targetId,
        "该档案属于高密级（心理状态 / 技能 / 风险评估）。",
        "仅医疗官、外交官，以及特批对象可读取他人完整档案。",
        "如需升级，请线下寻求安德鲁或戴安娜授权。",
        `</div>`
      ]
    };
  }

  const fullData = record.full || [];
  const out = [
    `<div class="uuc-block">`,
    `<p class='glow' style='font-size:1.1rem'>[生存档案] ${targetId.toUpperCase()}</p>`,
    ...fullData,
    `</div>`
  ];

  return { delayed: 20, clear: false, message: out };
}


// ---------- 5. 覆盖 help() 并清理旧命令 ----------
(function pruneOldCommandsAndHelp() {
  const removeList = ["echo", "ssh", "telnet", "ping", "read", "date", "whoami"];

  removeList.forEach(cmd => {
    if (window[cmd]) delete window[cmd];
    if (window.system && window.system.commands && window.system.commands[cmd]) {
      delete window.system.commands[cmd];
    }
  });

  // 新 help
  window.help = function(args) {
    const out = [];
    out.push(`<div class="uuc-block">`);
    out.push(`<p class='glow' style='font-size:1.1rem'>[舰载指令索引 / UUC_GLADIATOR]</p>`);
    out.push("");
    out.push("<b>acknowledge</b>    - 确认并回传 Ω-3 指令回执");
    out.push("<b>crew</b>           - 舰员名册 / 在岗信息（公开）");
    out.push("<b>profile [id]</b>  - 人物完整档案（需权限，默认查看自己）");
    out.push("<b>status</b>         - 舰体与战术态势快照");
    out.push("<b>login / logout</b> - 登录或登出舰载终端");
    out.push("<b>help</b>           - 显示此帮助页面");
    out.push("");
    out.push("<span style='color:#888'>注意：部分档案为 Ω-3 级保密，仅特批舰员可读。</span>");
    out.push(`</div>`);

    return {
      delayed: 0,
      clear: false,
      message: out
    };
  };

  console.log("%c[override.js] 旧命令已移除 & help() 已重写", "color:#99ccff");
})();


// ---------- 6. 挂到全局，给 kernel 用 ----------
window.getCurrentUserId = getCurrentUserId;
window.getCrewArray = getCrewArray;
window.resolveCrewTarget = resolveCrewTarget;
window.canViewFullProfile = canViewFullProfile;
window.crew = crew;
window.profile = profile;

console.log("%c[override.js 已加载并覆盖旧逻辑]", "color:#80ffaa");
