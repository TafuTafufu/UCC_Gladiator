// ============================
// UUC_Gladiator custom commands
// 这个文件在 index.html 里会被加载进页面
// 我们在这里把 crew / profile / status / acknowledge
// 都挂到 window 上，让 kernel 能调用
// ============================


// -------------------------------------------------
// 工具函数区
// -------------------------------------------------

// 谁现在登录了？（localStorage.loggedUser 是 kernel 在 login 后写进去的）
function getCurrentUserId() {
    const raw = localStorage.getItem("loggedUser") || "visitor";
    return raw.toLowerCase();
}

// 我们把 crewProfiles（在 crewProfiles.js 里定义的全船档案）
// 从一个对象，变成一个有顺序的数组，方便展示 roster 和用数字索引查询
//
// 顺序你可以自己排，我按你截图展示的顺序：
// [1] martin
// [2] lola
// [3] vincent
// [4] diana
// [5] andrew
// [6] damien
function getCrewArray() {
    const order = ["martin", "lola", "vincent", "diana", "andrew", "damien"];
    const result = [];

    if (!window.crewProfiles) return result;

    order.forEach(id => {
        if (window.crewProfiles[id]) {
            result.push({
                id: id,
                data: window.crewProfiles[id]
            });
        }
    });

    return result;
}

// 根据用户输入（"2" / "martin" / "lola"）解析成具体的crew对象
// 返回结构类似 { id:"lola", data:{ public:[...], full:[...] } }
function resolveCrewTarget(arg) {
    if (!arg) return null;
    const lower = arg.toLowerCase();
    const crewArr = getCrewArray();

    // 数字索引，比如 crew 2
    if (!isNaN(parseInt(lower, 10))) {
        const idx = parseInt(lower, 10) - 1;
        if (idx >= 0 && idx < crewArr.length) {
            return crewArr[idx];
        }
    }

    // 名字索引，比如 crew lola
    const found = crewArr.find(entry => entry.id.toLowerCase() === lower);
    return found || null;
}


// ============================
// 人物档案权限判断：谁可以看谁的 full 档案
// ============================
function canViewProfile(requester, target) {
    requester = requester.toLowerCase();
    target    = target.toLowerCase();

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


// -------------------------------------------------
// crew 指令
// -------------------------------------------------
//
// 用法：
//   crew
//      -> 显示花名册 [1] martin [2] lola ...
//
//   crew 2
//   crew lola
//      -> 显示该成员的公开在岗信息（public）
//         这个信息是全船都知道的：岗位/大致职责/公开携装
//
// 访问策略：
//   - visitor 不能用
//   - 登录后任何人都能看（public 信息是广播级别）
//
function crew(args) {
    const me = getCurrentUserId();

    // 访客直接拒绝
    if (me === "visitor") {
        return {
            delayed: 0,
            clear: false,
            message: [
                "<p class='glow' style='color:#ff4d4d'>访问拒绝</p>",
                "该终端处于访客/未授权模式。",
                "船员名册与岗位分配仅对在册舰员开放。",
                ""
            ]
        };
    }

    const crewArr = getCrewArray();

    // 无参数 -> 打花名册
    if (!args || args.length === 0) {
        const lines = [];
        lines.push("<p class='glow'>[CREW ROSTER / 舰内频道]</p>");
        lines.push("");

        crewArr.forEach((entry, i) => {
            lines.push(`[${i+1}] ${entry.id}`);
        });

        lines.push("");
        lines.push("使用 'crew <编号>' 或 'crew <名字>' 查看该成员的在岗信息。");

        return {
            delayed: 0,
            clear: false,
            message: lines
        };
    }

    // 有参数 -> 看某一位
    const target = resolveCrewTarget(args[0]);
    if (!target) {
        return {
            delayed: 0,
            clear: false,
            message: [
                "<p class='glow' style='color:#ff4d4d'>记录不可用</p>",
                "该身份未在此节点登记。",
                ""
            ]
        };
    }

    const lines = [];
    lines.push(
        `<p class='glow'>[在岗信息] ${target.id.toUpperCase()}</p>`
    );

    // 输出 public 信息
    if (target.data.public && target.data.public.length > 0) {
        target.data.public.forEach(block => {
            lines.push(block);
        });
    } else {
        lines.push("(无公开记录)");
    }

    lines.push("");

    return {
        delayed: 0,
        clear: false,
        message: lines
    };
}


// -------------------------------------------------
// profile 指令
// -------------------------------------------------
//
// 用法：
//   profile
//      -> 看“我自己”的完整人物档案 (full)
//         包含心理评估 / 行为限制 / 真正武装 / 风险分级
//
//   profile lola
//      -> 尝试看 lola 的完整档案 (full)
//         只有有权限的角色才行：
//         - diana / andrew: 全员
//         - vincent: 自己 + lola
//         - 其他人: 只能看自己
//
// 访问策略：
//   - visitor 完全禁止
//
function profile(args) {
    const requester = getCurrentUserId(); // 例如 "diana", "vincent", ...
    const db = window.crewProfiles || {};

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

    // 没给参数 -> 默认看自己
    const targetId = (args && args[0] ? args[0] : requester).toLowerCase();
    const record   = db[targetId];

    // 这个人压根没登记
    if (!record) {
        return {
            delayed: 0,
            clear: false,
            message: [
                "<p class='glow'>档案不可用</p>",
                "该身份未在此节点登记，或记录已被清除。"
            ]
        };
    }

    // 权限检查
    if (!canViewProfile(requester, targetId)) {
        return {
            delayed: 0,
            clear: false,
            message: [
                "<p class='glow' style='color:#ff4d4d'>Ω-3 访问拒绝</p>",
                "请求者身份: " + requester,
                "目标档案: " + targetId,
                "该档案属于高密级（心理状态 / 武装负载 / 风险评估 / 神经稳定性）。",
                "仅医疗官、外交官，以及特批对象可读取他人完整人物档案。",
                "如需升级，请线下寻求安德鲁或戴安娜授权。"
            ]
        };
    }

    // 可以看的话 -> 输出 full
    const fullData = record.full;
    if (!fullData || fullData.length === 0) {
        return {
            delayed: 0,
            clear: false,
            message: [
                `<p class='glow' style='font-size:1.1rem'>[人物档案] ${targetId.toUpperCase()}</p>`,
                "(无生存档案记录)"
            ]
        };
    }

    const out = [
        `<p class='glow' style='font-size:1.1rem'>[人物档案] ${targetId.toUpperCase()}</p>`
    ];
    fullData.forEach(block => {
        out.push(block);
    });

    return {
        delayed: 20,  // 想做“逐行打字”的演出保留这个；如果你不想延迟，就改成0
        clear: false,
        message: out
    };
}


// -------------------------------------------------
// status 指令 (示例占位)
// -------------------------------------------------
//
// 这是战术态势广播，所有登录舰员都能看，visitor 也能看删减版。
// 你之前截图里的版本已经很好，我这里放一个基础示例。
// 你可以保留你现有的，如果你已经写了就别覆盖它。
//
function status(args) {
    const me = getCurrentUserId();
    const lines = [];

    lines.push("<p class='glow' style='font-size:1.1rem'>UUC-GLADIATOR / 战术状态快照</p>");
    lines.push("");
    lines.push("位置：木星引力井 / 卡利斯托轨道道接近段");
    lines.push("对接目标：空间站『交易员』");
    lines.push("状态：静默接近中（公共频谱抑制）");
    lines.push("");
    lines.push("舰体完整度：94%");
    lines.push("反应堆核心温度：稳定");
    lines.push("推进姿态控制：手动（K2-PS187 AI 禁止接管）");
    lines.push("主武器：电磁轨道炮（上膛）");
    lines.push("副武器：霰弹 2 枚（安全锁定）");
    lines.push("");
    lines.push("火力分配：舰员只可配发可能配武 / SMG / 霰弹枪，详见 profile");
    lines.push("武装：未经授权的火力展示将被视为外交破坏。");
    lines.push("");
    lines.push("折纸指令：Ω-3 行动计划现为最高优先级。");

    if (me === "visitor") {
        lines.push("");
        lines.push("<span style='color:#ff4d4d'>访客模式：</span>部分数据已屏蔽。使用 login 指令获取完整态势。");
    }

    return {
        delayed: 10,
        clear: false,
        message: lines
    };
}


// -------------------------------------------------
// acknowledge 指令 (示例占位)
// -------------------------------------------------
//
// 玩家“签字”确认接受 Ω-3 指令。可以把这个状态记进 localStorage。
// 之后你甚至可以在 status() 里读这个状态，比如谁已经ack了。
//
function acknowledge(args) {
    const me = getCurrentUserId();

    if (me === "visitor") {
        return {
            delayed: 0,
            clear: false,
            message: [
                "<p class='glow' style='color:#ff4d4d'>访问拒绝</p>",
                "Ω-3 任务回执仅限在册舰员提交。",
                "请先使用 login 指令登录舰员身份。"
            ]
        };
    }

    // 记录一下这个人已确认过
    // 例如：localStorage.setItem("ack_"+me, "true");
    localStorage.setItem("ack_"+me, "true");

    return {
        delayed: 20,
        clear: false,
        message: [
            `<p class='glow' style='font-size:1.1rem'>[折纸计划·回执已登记]</p>`,
            "回传信道：殖民联邦行动司令部 / 折纸计划联络线",
            "登记舰员：" + me,
            "记录：已接收Ω-3级任务指令《交易员》；同意执行。",
            "",
            "<span style='color:#888'>提示：此回执已加密并锁定，不可撤回。</span>"
        ]
    };
}


// -------------------------------------------------
// 把所有命令挂到 window 上
// kernel.js 在执行命令时会尝试调用 window.同名函数
// -------------------------------------------------
window.getCurrentUserId = getCurrentUserId;
window.getCrewArray = getCrewArray;
window.resolveCrewTarget = resolveCrewTarget;
window.canViewProfile = canViewProfile;

window.crew = crew;
window.profile = profile;
window.status = status;
window.acknowledge = acknowledge;
