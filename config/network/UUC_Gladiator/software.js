// ============================
// UUC_Gladiator custom commands
// 这个文件会被 index.html 加载
// 我们在这里定义 crew / profile / status / acknowledge
// 并把它们挂到 window.* 上让 kernel 调用
// ============================


// -------------------------------------------------
// 工具函数
// -------------------------------------------------

// 获取当前登录的舰员ID，比如 "vincent" / "diana" / "visitor"
function getCurrentUserId() {
    const raw = localStorage.getItem("loggedUser") || "visitor";
    return raw.toLowerCase();
}

// 角斗士号全员档案来自 crewProfiles.js
// crewProfiles 是一个对象：{ martin:{public:[], full:[]}, lola:{...}, ... }
// 这里把它变成一个有顺序的数组，方便展示编号和用数字索引查询
//
// 顺序按照花名册展示：
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
                id: id,                   // "martin"
                data: window.crewProfiles[id] // { public:[...], full:[...] }
            });
        }
    });

    return result;
}

// 根据输入解析目标成员
// 支持： crew 2 / crew martin / crew lola
// 返回格式：{ id:"lola", data:{public:[...], full:[...]} }
function resolveCrewTarget(arg) {
    if (!arg) return null;
    const val = arg.toLowerCase();
    const list = getCrewArray();

    // 如果是数字（crew 2）
    if (!isNaN(parseInt(val, 10))) {
        const idx = parseInt(val, 10) - 1;
        if (idx >= 0 && idx < list.length) {
            return list[idx];
        }
    }

    // 如果是名字（crew lola）
    return list.find(entry => entry.id.toLowerCase() === val) || null;
}

// profile（full档案）的访问权限
// - 自己：永远可以读自己的 full
// - diana：全舰权限
// - andrew：全舰权限
// - vincent：特批可以读 lola
// - 其他人：只能读自己
function canViewFullProfile(requesterId, targetId) {
    const me  = requesterId.toLowerCase();
    const tgt = targetId.toLowerCase();

    if (me === tgt) return true;
    if (me === "diana"  || me === "andrew") return true;
    if (me === "vincent" && tgt === "lola") return true;

    return false;
}


// -------------------------------------------------
// crew 指令
// -------------------------------------------------
//
// crew
//   -> 显示花名册 [1] martin [2] lola ...
//
// crew 2 / crew lola
//   -> 显示该成员的公开在岗信息 (public)
//      这个信息是全船广播级别（岗位、职责、公开携装）
//
// 限制：
// - visitor 不能使用 crew
// - 登录后任何舰员都能查看他人的 public
//
function crew(args) {
    const me = getCurrentUserId();

    // 未登录直接拒绝
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

    const roster = getCrewArray();

    // 无参数：列出全名单
    if (!args || args.length === 0) {
        const out = [];
        out.push("<p class='glow'>[CREW ROSTER / 舰内频道]</p>");
        out.push("");

        roster.forEach((entry, i) => {
            out.push(`[${i + 1}] ${entry.id}`);
        });

        out.push("");
        out.push("使用 'crew <编号>' 或 'crew <名字>' 查看该成员的在岗信息。");

        return {
            delayed: 0,
            clear: false,
            message: out
        };
    }

    // 有参数：尝试显示某个人的 public
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

    const out = [];
    out.push(`<p class='glow'>[在岗信息] ${target.id.toUpperCase()}</p>`);

    if (target.data.public && target.data.public.length > 0) {
        target.data.public.forEach(block => {
            out.push(block);
        });
    } else {
        out.push("(无公开记录)");
    }

    out.push("");

    return {
        delayed: 0,
        clear: false,
        message: out
    };
}


// -------------------------------------------------
// profile 指令
// -------------------------------------------------
//
// profile
//   -> 查看“我自己”的完整人物档案 (full)
//      包括属性、技能、真实武装、心理状态、风险评估
//
// profile lola
//   -> 尝试查看 lola 的完整档案 (full)
//      需要权限：
//        - diana / andrew: 有全舰读取权
//        - vincent: 可看自己 + lola
//        - 其他人: 只能看自己
//
// 限制：
// - visitor 完全禁止
//
function profile(args) {
    const requester = getCurrentUserId(); // e.g. "diana", "vincent", "martin"
    const db = window.crewProfiles || {};

    // 访客完全禁止
    if (requester === "visitor") {
        return {
            delayed: 0,
            clear: false,
            message: [
                "<p class='glow' style='color:#ff4d4d'>访问拒绝</p>",
                "此终端处于访客/未授权模式。",
                "舰员身份验证后才能请求读取舰员生存档案 (profile)。",
                ""
            ]
        };
    }

    // 没给参数 -> 默认看自己
    const targetId = (args && args[0] ? args[0] : requester).toLowerCase();
    const record = db[targetId];

    // 没这个人
    if (!record) {
        return {
            delayed: 0,
            clear: false,
            message: [
                "<p class='glow' style='color:#ff4d4d'>档案不可用</p>",
                "该身份未在此节点登记，或记录已被清除。",
                ""
            ]
        };
    }

    // 权限判断：我能否读这个人的 full？
    if (!canViewFullProfile(requester, targetId)) {
        return {
            delayed: 0,
            clear: false,
            message: [
                "<p class='glow' style='color:#ff4d4d'>Ω-3 访问拒绝</p>",
                "请求者身份：" + requester,
                "目标档案：" + targetId,
                "阻止访问：未授权档案。",
                "如需查询，请寻求授权。",
                ""
            ]
        };
    }

    // 有权限 -> 输出 full
    const fullData = record.full;
    const out = [];

    out.push(
        `<p class='glow' style='font-size:1.1rem'>[生存档案] ${targetId.toUpperCase()}</p>`
    );

    if (fullData && fullData.length > 0) {
        fullData.forEach(block => {
            out.push(block);
        });
    } else {
        out.push("(无档案记录)");
    }

    out.push("");

    return {
        delayed: 20,
        clear: false,
        message: out
    };
}


// -------------------------------------------------
// status 指令
// -------------------------------------------------
function status(args) {
    const me = getCurrentUserId();

    // === 访客模式：直接拒绝访问 ===
    if (me === "visitor") {
        return {
            delayed: 0,
            clear: false,
            message: [
                "<div class='uuc-block'>",
                "<p class='glow' style='color:#ff4d4d'>访问拒绝</p>",
                "此终端处于访客 / 未授权模式。<br>",
                "舰体信息仅授权舰员读取。<br>",
                "请使用 <b>login</b> 指令验证身份。",
                "</div>"
            ]
        };
    }

    // === 正常舰员可见内容 ===
    const lines = [];
    lines.push("<p class='glow' style='font-size:1.1rem'>UUC-GLADIATOR / 战术状态快照</p>");
    lines.push("");
    lines.push("位置：木星引力井 / 卡利斯托轨道接近段");
    lines.push("对接目标：空间站『交易员』");
    lines.push("状态：静默接近中");
    lines.push("");
    lines.push("舰体完整度：100%");
    lines.push("反应堆核心温度：稳定");
    lines.push("推进姿态控制：手动");
    lines.push("主武器：电磁轨道炮");
    lines.push("副武器：霰弹 2 枚");
    lines.push("");
    lines.push("火力分配：舰员仅可携带标准制式武装，详见 profile。");
    lines.push("外交限制：未经授权的火力展示视为外交破坏。");
    lines.push("");
    lines.push("折纸计划：Ω-3 等级行动为最高优先级。");

    return {
        delayed: 10,
        clear: false,
        message: lines
    };
}


// -------------------------------------------------
// acknowledge 指令
// -------------------------------------------------
//
// 玩家“签名”确认自己已接收 Ω-3 指令。
// 我们把这个状态记在 localStorage 里 (ack_<id> = true)。
// 之后你可以在 status() 里把“哪些人已确认”打出来当成演出。
// 
// 限制：visitor 不允许确认。
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
                "请先使用 login 指令登录舰员身份。",
                ""
            ]
        };
    }

    // 标记这个人已确认
    localStorage.setItem("ack_" + me, "true");

    return {
        delayed: 20,
        clear: false,
        message: [
            `<p class='glow' style='font-size:1.1rem'>[折纸计划·回执已登记]</p>`,
            "回传信道：殖民联邦行动司令部 / 折纸计划联络线。",
            "登记舰员：" + me,
            "记录：已接收Ω-3级任务指令《交易员》；同意执行。",
            "",
            "<span style='color:#888'>提示：此回执已加密并锁定，不可撤回。</span>",
            ""
        ]
    };
}


// -------------------------------------------------
// 把所有命令挂到 window 上
// kernel.js 在执行命令时会优先尝试调用 window.[命令名]
// -------------------------------------------------
window.getCurrentUserId = getCurrentUserId;
window.getCrewArray = getCrewArray;
window.resolveCrewTarget = resolveCrewTarget;
window.canViewFullProfile = canViewFullProfile;

window.crew = crew;
window.profile = profile;
window.status = status;
window.acknowledge = acknowledge;
