/* UUC Gladiator custom script
   - 注入船员账号
   - 接管 login() 并记录 loggedUser
   - 定义命令: status / profile / ACKNOWLEDGE
*/

// =============== 启动：注入账号 ===============
(function initUsers() {
  const crewUsers = [
    { userId: "martin",  password: "snowriver",     userName: "马丁·史密斯 / 角斗士号机械师" },
    { userId: "lola",    password: "virtequal",     userName: "萝拉·沃伊特 / 驾驶员&虚拟造梦者" },
    { userId: "vincent", password: "lola4ever",     userName: "文森特·戴尔加图 / 情报&黑客" },
    { userId: "diana",   password: "neverlost",     userName: "戴安娜·埃弗里特 / 医疗官" },
    { userId: "andrew",  password: "no_meat",       userName: "安德鲁·法克 / 外交官" },
    { userId: "damien",  password: "takeearthback", userName: "达米恩·冈恩 / 炮手&安保" }
  ];

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
  } catch (e) {
    console.warn("[UUC_Gladiator bootstrap] failed to inject users:", e);
  }

  if (!localStorage.getItem("loggedUser")) {
    localStorage.setItem("loggedUser", "visitor");
  }
})();

// =============== login 包装 ===============
const _originalLogin = window.login;
function login(args) {
  const rawCred  = args && args[0] ? args[0] : "";
  const username = rawCred.split(":")[0] || "";

  let result;
  if (typeof _originalLogin === "function") {
    result = _originalLogin(args);
  } else {
    result = { message: ["login command not available"] };
  }

  const textBlock = Array.isArray(result.message)
    ? result.message.join(" ")
    : String(result.message || "");

  if (textBlock.includes("Login successful") && username) {
    localStorage.setItem("loggedUser", username);
    console.log("[UUC_Gladiator] loggedUser =", username);
  }

  return result;
}
window.login = login;

// =============== status 命令 ===============
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
window.status = status;

// =============== 权限和渲染工具 ===============
function canViewProfile(requester, target) {
  if (requester === target) return true;
  if (requester === "andrew") return true;
  if (requester === "diana") return true;
  if (requester === "vincent" && target === "lola") return true;
  return false;
}

function renderProfileData(target) {
  const data = window.crewProfiles && window.crewProfiles[target];
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

// =============== profile 命令 ===============
function profile(args) {
  const requester = localStorage.getItem("loggedUser") || "visitor";
  const target = (args && args[0] ? args[0] : requester).toLowerCase();

  if (!canViewProfile(requester, target)) {
    return {
      delayed: 0,
      clear: false,
      message: [
        "<p class='glow' style='color:#ff4d4d'>访问拒绝</p>",
        "请求者身份: " + requester,
        "目标档案: " + target,
        "原因：Ω-3 限制。仅医疗官（戴安娜）、外交官（安德鲁），或特批情报访问可读取全舰心理/行为记录。",
        "如需升级，请线下寻求安德鲁·法克授权。"
      ]
    };
  }

  return {
    delayed: 20,
    clear: false,
    message: renderProfileData(target)
  };
}
window.profile = profile;

// =============== ACKNOWLEDGE 命令 ===============
function ACKNOWLEDGE() {
  const user = localStorage.getItem("loggedUser") || "visitor";
  if (user === "visitor") {
    return {
      delayed: 0,
      clear: false,
      message: ["❌ 未授权访客无法执行该指令。"]
    };
  }

  return {
    delayed: 10,
    clear: false,
    message: [
      "<p class='glow'>Ω-3 回执确认成功</p>",
      `舰员 ${user} 已确认折纸计
