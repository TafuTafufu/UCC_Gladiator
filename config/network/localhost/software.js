/* UUC_Gladiator custom bootstrap
   这个文件会在玩家打开网页时被加载。
   我们在这里把角斗士号的六个船员账号注册进本地用户数据库，
   这样 login 命令才能识别他们。
*/

(function bootstrapCrewUsers() {
  // 舰员清单（和 userlist.json 保持一致）
  const crewUsers = [
    { userId: "martin",  password: "snowriver",   userName: "马丁·史密斯 / 角斗士号机械师" },
    { userId: "lola",    password: "virtequal",   userName: "萝拉·沃伊特 / 驾驶员&虚拟造梦者" },
    { userId: "vincent", password: "lola4ever",   userName: "文森特·戴尔加图 / 情报&黑客" },
    { userId: "diana",   password: "neverlost",   userName: "戴安娜·埃弗里特 / 医疗官" },
    { userId: "andrew",  password: "no_meat",     userName: "安德鲁·菲斯克 / 外交官" },
    { userId: "damien",  password: "takeearthback", userName: "达米恩·冈恩 / 炮手&安保" }
  ];

  // 目标：让 login username:password 能识别这些人。
  // 我们不知道终端最终是从哪个 key 拿“已注册用户列表”，
  // 但我们可以写入一组常用 key（login 通常会检查其中之一）。
  // 这段代码会在页面加载时运行，对所有玩家生效。

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
})();

/* 可选：定义/覆盖 ACKNOWLEDGE 命令，让玩家能发回执 */
function ACKNOWLEDGE() {
  // 这个函数名对应命令行里的 ACKNOWLEDGE
  return {
    delayed: 50,
    clear: false,
    message: [
      "发送回执中...",
      "信号匹配：UUC-GLADIATOR",
      "频道加密：Ω-3",
      "确认指令编号：A-2145-10-29-Ω3",
      "<p class='glow'>通信回执已记录 ▪ 殖民联邦频道锁定中...</p>",
      "任务状态：ACTIVE"
    ]
  };
}
