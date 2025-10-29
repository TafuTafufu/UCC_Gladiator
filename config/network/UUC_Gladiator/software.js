// ============================
// 人物档案权限判断
// ============================
function canViewProfile(requester, target) {
  requester = requester.toLowerCase();
  target = target.toLowerCase();

  // 自己可以看自己的完整档案
  if (requester === target) return true;

  // 外交官 andrew: 全舰权限
  if (requester === "andrew") return true;

  // 医疗官 diana: 全舰权限
  if (requester === "diana") return true;

  // 情报员 vincent: 特批只可看 lola
  if (requester === "vincent" && target === "lola") return true;

  // 其他人不行
  return false;
}

// ============================
// profile 指令本体
// ============================
// 用法：
//   profile                -> 看自己的完整人物档案
//   profile lola           -> 看 lola 的完整人物档案（需要权限）
//
// 输出包含：武装配置、技能、心理记录等。
// 这个信息是 Ω-3 级别。
function profile(args) {
  // 当前登录的舰员是谁？
  const requester = (localStorage.getItem("loggedUser") || "visitor").toLowerCase();

  // 访客直接禁止
  if (requester === "visitor") {
    return {
      delayed: 0,
      clear: false,
      message: [
        "<p class='glow' style='color:#ff4d4d'>访问拒绝</p>",
        "此终端处于访客/未授权模式。",
        "舰员身份验证后才能请求读取舰员人物档案 (profile)。"
      ]
    };
  }

  // 目标是谁？没给就默认看自己
  const target = (args && args[0] ? args[0] : requester).toLowerCase();

  // 权限检查
  if (!canViewProfile(requester, target)) {
    return {
      delayed: 0,
      clear: false,
      message: [
        "<p class='glow' style='color:#ff4d4d'>Ω-3 访问拒绝</p>",
        "请求者身份: " + requester,
        "目标档案: " + target,
        "该档案属于高密级（心理状态 / 武装负载 / 风险评估 / 神经稳定性）。",
        "仅医疗官、外交官，以及特批对象可读取他人完整人物档案。",
        "如需升级，请线下寻求安德鲁或戴安娜授权。"
      ]
    };
  }

  // 数据库（我们在 crewProfiles.js 定义的）
  const db = window.crewProfiles || {};
  const record = db[target];

  if (!record || !record.full) {
    return {
      delayed: 0,
      clear: false,
      message: [
        "<p class='glow'>档案不可用</p>",
        "该身份未在此节点登记，或记录已被清除。"
      ]
    };
  }

  // 输出完整人物档案（full 字段）
  const out = [
    `<p class='glow' style='font-size:1.1rem'>[人物档案] ${target.toUpperCase()}</p>`,
    ...record.full
  ];

  return {
    delayed: 20,   // 逐行打字的延迟（你可以调小或去掉）
    clear: false,
    message: out
  };
}

// 把方法挂到全局，供 kernel.runSoftware 调用
window.profile = profile;
window.canViewProfile = canViewProfile;
