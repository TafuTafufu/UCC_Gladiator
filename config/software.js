/* 角斗士号自定义启动脚本 (localhost 节点专用)
   功能：
   1. 注入船员账号（给 login 用）
   2. 跟踪当前登录用户到 localStorage.loggedUser
   3. 定义战术工具命令：
      - ACKNOWLEDGE  回传折纸计划回执（需要舰员权限）
      - status       查看角斗士号当前战术/航行/武装状态
      - profile      查看档案 / 装备 / 心理记录（带权限规则）
*/

/* =========================
   启动时：注入可登录账号
   ========================= */
(function bootstrapCrewUsers() {
  const crewUsers = [
    { userId: "martin",  password: "snowriver",     userName: "马丁·史密斯 / 角斗士号机械师" },
    { userId: "lola",    password: "virtequal",     userName: "萝拉·沃伊特 / 驾驶员&虚拟造梦者" },
    { userId: "vincent", password: "lola4ever",     userName: "文森特·戴尔加图 / 情报&黑客" },
    { userId: "diana",   password: "neverlost",     userName: "戴安娜·埃弗里特 / 医疗官" },
    { userId: "andrew",  password: "no_meat",       userName: "安德鲁·菲斯克 / 外交官" },
    { userId: "damien",  password: "takeearthback", userName: "达米恩·冈恩 / 炮手&安保" }
  ];

  // 把船员账号写进 localStorage，伪装成“服务器用户数据库”
  const possibleKeys = [
    "UUC_Gladiator_users",
    "UUC_Gladiator_userlist",
    "users",
    "userlist",
    "server_users",
    "registeredUsers"
  ];

  try {
    possibleKeys.forEach(k => {
      localStorage.setItem(k, JSON.stringify(crewUsers));
    });
    console.log("[UUC_Gladiator bootstrap] crew users injected.");
  } catch (e) {
    console.warn("[UUC_Gladiator bootstrap] failed to inject users:", e);
  }

  // 初始化当前登录用户（默认 visitor = 未授权访客）
  if (!localStorage.getItem("loggedUser")) {
    localStorage.setItem("loggedUser", "visitor");
  }
})();

/* =========================
   login 包装：
   - 仍然调用原来的 login
   - 如果原 login 判定成功，则写入 loggedUser
   ========================= */
const _originalLogin = window.login;

function login(args) {
  const rawCred = args && args[0] ? args[0] : "";
  const username = rawCred.split(":")[0] || "";

  let result;
  if (typeof _originalLogin === "function") {
    result = _originalLogin(args); // 跑原版逻辑
  } else {
    result = { message: ["login command not available"] };
  }

  const textBlock = Array.isArray(result.message)
    ? result.message.join(" ")
    : String(result.message || "");

  if (textBlock.includes("Login successful") && username) {
    localStorage.setItem("loggedUser", username);
    console.log("[UUC_Gladiator] loggedUser set to", username);
  }

  return result;
}

window.login = login;

/* =========================
   舰船状态数据 + status 命令
   ========================= */
function status() {
  return {
    delayed: 30,
    clear: false,
    message: [
      "<p class='glow' style='font-size:1.2rem'>UUC-GLADIATOR / 战术状态快照</p>",
      "位置：木星引力井 / 卡利斯托轨道接近段",
      "对接目标：空间站【交易员】",
      "状态：静默接近中（公共频道封锁）",
      "",
      "舰体完整度：94%",
      "反应堆核心温度：稳定",
      "推进姿态控制：手动（K2-PS187 AI 禁止接管）",
      "",
      "主武装：电磁轨道炮（上膛）",
      "副武装：鱼雷 2 枚（安全锁定）",
      "个人火力：舰员个人配发定向能武器 / SMG / 霰弹枪，详见 profile",
      "",
      "注意：未经授权的火力展示将被视为外交破坏。",
      "频道加密：Ω-3 / 折纸计划现场联络中"
    ]
  };
}

/* =========================
   舰员档案数据库（基于人物卡）
   summary = 我是谁 / 职责
   gear    = 我携带/可支配的装备
   notes   = 心理、危险信号、敏感信息
   ========================= */
const crewProfiles = {
  martin: {
    summary: [
      "马丁·史密斯 / 角斗士号机械师 / 36岁 男",
      "随航机械工程师。几乎能把整艘船拆了再装回去，专长是损害管制与现场抢修。",
      "负责验证交接技术文件和组件真伪，确保折纸计划用到的东西不是陷阱。"
    ],
    gear: [
      "武器：科尼尔E-1电子手枪，格洛克23（常规+穿甲弹夹）",
      "防护：联邦制服（2护甲），重型真空作业服（12护甲）",
      "随身：PDA个人终端，科技扫描仪，工具箱，维修工具，背式推进器，应急泡沫密封胶"
    ],
    notes: [
      "性格：疲惫但可靠，仍然觉得‘也许我们能修好一切’。",
      "压力：知道这次交接成败可能决定殖民联邦还有没有未来。",
      "梦境：关于雪和流水的梦，虽然他从没在现实看过真正的雪。"
    ]
  },

  lola: {
    summary: [
      "萝拉·沃伊特 / 驾驶员 & 虚拟造梦者 / 19岁 女",
      "角斗士号的驾驶员与‘虚拟造梦者’接口，能长时间直接接入高阶系统并稳定他人心智。",
      "对飞船来说，你几乎是第二个大脑。"
    ],
    gear: [
      "武器：科尼尔E-1电子手枪，Skorpion SMG（常规+穿甲弹夹）",
      "防护：联邦制服（2护甲），重型真空作业服（12护甲）",
      "随身：PDA，科技扫描仪，背式推进器，45天量虚拟稳定剂（VirtEqual）"
    ],
    notes: [
      "药物依赖：VirtEqual。停药几天内就会精神崩坏。",
      "心理倾向：喜欢被明确指挥，‘告诉我该做什么，我就不会犯错’。",
      "睡眠：噩梦多，梦到火光和尖叫。几乎没有安眠。"
    ]
  },

  vincent: {
    summary: [
      "文森特·戴尔加图 / 情报官 & 黑客 / 28岁 男",
      "专职入侵/渗透。13岁因黑入殖民网络被抓，此后被改造成‘编制内工具人’。",
      "你的工作是确保我们走进陷阱之前，先把陷阱拆了。"
    ],
    gear: [
      "武器：科尼尔E-1电子手枪，格洛克23，.10口径霰弹枪",
      "防护：联邦制服（2护甲），重型真空作业服（12护甲）",
      "随身：PDA，科技扫描仪"
    ],
    notes: [
      "情感记录：你给萝拉写过一只虚拟宠物狗。你非常在意她。",
      "心理风险：反复梦到‘被发现就会死’的场景，强烈的被猎杀感。",
      "信条：世界上没有真正安全的系统。"
    ]
  },

  diana: {
    summary: [
      "戴安娜·埃弗里特 / 医疗官 / 35岁 女",
      "全舰医疗与心理维稳负责人。你的记录是‘从未丢过任何一个船员’。",
      "你会定期评估高风险成员的心理状态，不管他们愿不愿意。"
    ],
    gear: [
      "武器：科尼尔E-1电子手枪，格洛克23，科尼尔E-2电子步枪",
      "防护：联邦制服（2护甲），重型真空作业服（12护甲）",
      "随身：PDA，科技扫描仪，背式推进器，医疗箱"
    ],
    notes: [
      "作风：专业、冷静、近乎苛刻。",
      "你知道文森特对你有投射/依赖迹象。",
      "你渴望‘稳定的普通生活’，但你已经不相信那东西会真的出现。"
    ]
  },

  andrew: {
    summary: [
      "安德鲁·菲斯克 / 首席谈判代表 / 外交官 / 30岁 男",
      "政治级别最高的人。你要和‘交易员’（米戈）谈判，拿到折纸计划推进关键数据。",
      "你本质上是殖民联邦在这次交易中的脸面，和替罪羊。"
    ],
    gear: [
      "武器：科尼尔E-1电子手枪，格洛克23",
      "防护：联邦制服（2护甲），重型真空作业服（12护甲）",
      "随身：PDA，科技扫描仪，背式推进器，折纸计划过滤结构图纸（加密磁盘）"
    ],
    notes: [
      "信念：‘为了让人类文明活下去，必须付出一切代价。’你不是在夸张。",
      "语言：会米戈语（65%）。你不信任它们，但你知道它们就是筹码。",
      "备注：你讨厌肉。吃肉让你生理性反胃。"
    ]
  },

  damien: {
    summary: [
      "达米恩·冈恩 / 炮手 & 安保 / 26岁 男",
      "角斗士号电磁炮手，也是船上火力与登舰安保的主要执行者。",
      "最近也被当半个工程备援使用。"
    ],
    gear: [
      "武器：科尼尔E-1电子手枪，格洛克23，科尼尔E-2电子步枪，Skorpion SMG",
      "防护：联邦制服（2护甲），重型真空作业服（12护甲）",
      "随身：PDA，科技扫描仪，维修工具，背式推进器，应急泡沫密封胶，圣克里斯多福链坠"
    ],
    notes: [
      "倾向：‘别再逃了，打回地球。’你真的相信这一点。",
      "风险点：一旦听到“我们可能永远回不了地球”，你会冲动反应。",
      "自我定位：你需要自己是英雄。这是你活下去的意义。"
    ]
  }
};

/* =========================
   profile 权限系统
   - requester 看 target
   - andrew: 全权限
   - diana: 全权限（医疗官）
   - vincent: 特批可看 lola
   - 其他人: 只能看自己
   ========================= */
function canViewProfile(requester, target) {
  if (requester === target) return true;        // 自己看自己：允许
  if (requester === "andrew") return true;      // 外交官：全舰权限
  if (requester === "diana") return true;       // 医疗官：全舰医疗权限
  if (requester === "vincent" && target === "lola") return true; // 文森特盯萝拉
  return false;
}

function renderProfileData(target) {
  const data = crewProfiles[target];
  if (!data) {
    return [
      "档案不存在或已被清除。",
      "(可能原因：该身份未在本节点登记，或密级高于 Ω-3。)"
    ];
  }

  return [
    `<p class='glow' style='font-size:1.1rem'>[生存档案] ${target.toUpperCase()}</p>`,
    ...data.summary,
    "",
    "[随身武备 / 装备配置]",
    ...data.gear,
    "",
    "[心理 / 行为注记 - Ω-3 限定]",
    ...data.notes
  ];
}

function profile(args) {
  const requester = (localStorage.getItem("loggedUser") || "visitor").toLowerCase();
  // profile           -> 看自己
  // profile <name>    -> 试图看别人
  const target = (args && args[0]) ? args[0].toLowerCase() : requester;

  if (!canViewProfile(requester, target)) {
    return {
      delayed: 0,
      clear: false,
      message: [
        "<p class='glow' style='color:#ff4d4d'>访问拒绝</p>",
        "请求者身份: " + requester,
        "目标档案: " + target,
        "原因：Ω-3 限制。仅医疗官（戴安娜）、外交官（安德鲁），或特批情报访问可读取全舰心理/行为记录。",
        "如需升级，请线下寻求安德鲁·菲斯克授权。"
      ]
    };
  }

  return {
    delayed: 20,
    clear: false,
    message: renderProfileData(target)
  };
}

/* =========================
   ACKNOWLEDGE：
   - 游客/visitor：拒绝
   - 舰员：回传加密回执
   说明：
   ACKNOWLEDGE 的名字会被登记在 software.json，
   这样终端解析器允许执行它，
   真正的输出逻辑在这里。
   ========================= */
function ACKNOWLEDGE() {
  const currentUser = localStorage.getItem("loggedUser") || "visitor";

  if (currentUser === "visitor" || currentUser === "") {
    return {
      delayed: 0,
      clear: false,
      message: [
        "<p class='glow' style='color:#ff4d4d'>⚠ 未授权访问</p>",
        "UUC-GLADIATOR 频道加密：Ω-3",
        "此频道仅接受舰员级别身份回执。",
        "请先使用舰员账户 login 再次尝试 ACKNOWLEDGE。"
      ]
    };
  }

  return {
    delayed: 50,
    clear: false,
    message: [
      "发送回执中...",
      "信号匹配：UUC-GLADIATOR",
      "频道加密：Ω-3",
      "当前身份标记: " + currentUser,
      "确认指令编号：A-2145-10-29-Ω3",
      "<p class='glow'>通信回执已记录 ▪ 殖民联邦频道锁定中...</p>",
      "任务状态：ACTIVE"
    ]
  };
}

/* =========================
   把命令暴露给终端
   ========================= */
window.status = status;
window.profile = profile;
window.ACKNOWLEDGE = ACKNOWLEDGE;
window.acknowledge = ACKNOWLEDGE;
