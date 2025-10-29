// ============================
// override.js （修订最终版）
// ============================

// ---------- 工具 ----------
function getCurrentUserId() {
    const raw = localStorage.getItem("loggedUser") || "visitor";
    return raw.toLowerCase();
}

function getCrewArray() {
    // 用我们想要的顺序展示
    const order = ["martin", "lola", "vincent", "diana", "andrew", "damien"];
    const result = [];
    if (!window.crewProfiles) return result;

    order.forEach(id => {
        if (window.crewProfiles[id]) {
            result.push({
                id,
                data: window.crewProfiles[id]   // 这里期望 { public:[...], full:[...] }
            });
        }
    });

    return result;
}

function resolveCrewTarget(arg) {
    if (!arg) return null;
    const lower = arg.toLowerCase();
    const list = getCrewArray();

    // 数字索引
    if (!isNaN(parseInt(lower, 10))) {
        const idx = parseInt(lower, 10) - 1;
        if (idx >= 0 && idx < list.length) {
            return list[idx];
        }
    }

    // 名字索引
    return list.find(e => e.id.toLowerCase() === lower) || null;
}

// 权限：谁能看谁的 full
function canViewFullProfile(requester, target) {
    requester = requester.toLowerCase();
    target = target.toLowerCase();
    if (requester === target) return true;
    if (requester === "diana" || requester === "andrew") return true;
    if (requester === "vincent" && target === "lola") return true;
    return false;
}

// ---------- crew 覆盖 ----------
// crew            -> 列 roster
// crew lola / 2   -> 公开信息 (public)
function crew(args) {
    const me = getCurrentUserId();

    if (me === "visitor") {
        return {
            delayed: 0,
            clear: false,
            message: [
                "<p class='glow' style='color:#ff4d4d'>访问拒绝</p>",
                "该终端处于访客模式，无法读取船员名册。",
                ""
            ]
        };
    }

    const list = getCrewArray();

    // 没参数：显示 roster
    if (!args || args.length === 0) {
        const out = [];
        out.push("<p class='glow'>[CREW ROSTER / 舰内频道]</p>");
        out.push("");
        list.forEach((entry, i) => {
            out.push(`[${i + 1}] ${entry.id}`);
        });
        out.push("");
        out.push("使用 'crew <编号>' 或 'crew <名字>' 查看成员的在岗信息。");
        return { delayed: 0, clear: false, message: out };
    }

    // 指定成员
    const target = resolveCrewTarget(args[0]);
    if (!target) {
        return {
            delayed: 0,
            clear: false,
            message: [
                "<p class='glow' style='color:#ff4d4d'>记录不可用</p>",
                "该身份未在此节点登记。"
            ]
        };
    }

    const pubInfo = target.data.public || [];
    const out = [
        `<p class='glow'>[在岗信息] ${target.id.toUpperCase()}</p>`,
        ...pubInfo,
        ""
    ];

    return { delayed: 0, clear: false, message: out };
}

// ---------- profile 覆盖 ----------
// profile           -> 看自己的 full
// profile lola      -> 按权限看别人的 full
function profile(args) {
    const me = getCurrentUserId();
    const db = window.crewProfiles || {};

    if (me === "visitor") {
        return {
            delayed: 0,
            clear: false,
            message: [
                "<p class='glow' style='color:#ff4d4d'>访问拒绝</p>",
                "此终端处于访客模式。",
                "请先使用 login 指令登录舰员身份。"
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
                "<p class='glow'>档案不可用</p>",
                "该身份未在此节点登记。"
            ]
        };
    }

    if (!canViewFullProfile(me, targetId)) {
        return {
            delayed: 0,
            clear: false,
            message: [
                "<p class='glow' style='color:#ff4d4d'>Ω-3 访问拒绝</p>",
                "请求者身份: " + me,
                "目标档案: " + targetId,
                "该档案属于高密级（心理状态 / 技能 / 风险评估）。",
                "仅医疗官、外交官，以及特批对象可读取他人完整档案。",
                "如需升级，请线下寻求安德鲁或戴安娜授权。"
            ]
        };
    }

    const fullData = record.full || [];
    const out = [
        `<p class='glow' style='font-size:1.1rem'>[生存档案] ${targetId.toUpperCase()}</p>`,
        ...fullData
    ];

    return { delayed: 20, clear: false, message: out };
}

// ---------- 挂到 window ----------
window.getCurrentUserId = getCurrentUserId;
window.getCrewArray = getCrewArray;
window.resolveCrewTarget = resolveCrewTarget;
window.canViewFullProfile = canViewFullProfile;
window.crew = crew;
window.profile = profile;

console.log("%c[override.js 已加载并覆盖旧逻辑]", "color:#80ffaa");
