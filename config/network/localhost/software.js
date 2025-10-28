/* 角斗士号自定义启动脚本
   1. 注入船员账号（给 login 用）
   2. 记录当前登录用户到 localStorage.loggedUser
   3. 定义 ACKNOWLEDGE 命令，只有舰员能合法回执
*/

(function bootstrapCrewUsers() {
  const crewUsers = [
    { userId: "martin",  password: "snowriver",     userName: "马丁·史密斯 / 角斗士号机械师" },
    { userId: "lola",    password: "virtequal",     userName: "萝拉·沃伊特 / 驾驶员&虚拟造梦者" },
    { userId: "vincent", password: "lola4ever",     userName: "文森特·戴尔加图 / 情报&黑客" },
    { userId: "diana",   password: "neverlost",     userName: "戴安娜·埃弗里特 / 医疗官" },
    { userId: "andrew",  password: "no_meat",       userName: "安德鲁·菲斯克 / 外交官" },
    { userId: "damien",  password: "takeearthback", userName: "达米恩·冈恩 / 炮手&安保" }
  ];

  const possibleKeys = [
    'UUC_Gladiator_users',
    'UUC_Gladiator_userlist',
    'users',
    'userlist',
    'server_users',
    'registeredUsers'
  ];

  try {
    possibleKeys.forEach(k => {
      localStorage.setItem(k, JSON.stringify(crewUsers));
    });
    console.log("[UUC_Gladiator bootstrap] crew users injected.");
  } catch (e) {
    console.warn("[UUC_Gladiator bootstrap] failed to inject users:", e);
  }

  // 初始化当前登录用户（默认是 visitor）
  if (!localStorage.getItem("loggedUser")) {
    localStorage.setItem("loggedUser", "visitor");
  }
})();

/* login 包装：
   - 还是跑原版 login
   - 如果原版回了 "Login successful"，我们就把用户名写进 loggedUser
*/
const _originalLogin = window.login;

function login(args) {
  const rawCred = args && args[0] ? args[0] : "";
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
    console.log("[UUC_Gladiator] loggedUser set to", username);
  }

  return result;
}

window.login = login;

/* ACKNOWLEDGE：
   - 如果你只是 visitor，就不给你回执（Ω-3频道拒绝你）
   - 如果你是舰员，就打印加密回执+ACTIVE状态
*/
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

window.ACKNOWLEDGE = ACKNOWLEDGE;
window.acknowledge = ACKNOWLEDGE;
