// =====================
// Global scope variables
// =====================

const defaultServerAddress = "UUC_Gladiator";
let serverDatabase = {};
let userDatabase = {};
let userList = [];
let mailList = [];
let cmdLine_;
let output_;
let serverDate = { day: "", month: "", year: "", reference: "" };

// 我们自己缓存一个“当前登录用户名”，给 crew/ACKNOWLEDGE 等命令用
// 注意：login() 时我们会同步 localStorage.loggedUser
let currentLoggedUserId = "visitor"; // <<< 新增


function initDateObject() {
    const date = new Date();
    const day = serverDatabase.day ? serverDatabase.day : date.getDate();
    const month = serverDatabase.month ? serverDatabase.month : date.getMonth() + 1;
    const year = serverDatabase.year ? serverDatabase.year : date.getFullYear();
    const reference = serverDatabase.reference ? serverDatabase.reference : "(Solar System Standard Time)";
    serverDate = { day, month, year, reference };
}

function debugObject(obj) {
    for (const property in obj) {
        console.log(`${property}: ${JSON.stringify(obj[property])}`);
        output(`${property}: ${JSON.stringify(obj[property])}`);
    }
}

function setHeader(msg) {
    // prompt显示形如 [萝拉·沃伊特 / 驾驶员&虚拟造梦者@UUC-GLD] #
    const promptText = `[${ userDatabase.userName }@${ serverDatabase.terminalID }] # `;

    // 顶部终端抬头
    initDateObject();
    const dateStr = `${serverDate.day}/${serverDate.month}/${serverDate.year}`;
    const imgUrl = `config/network/${serverDatabase.serverAddress}/${serverDatabase.iconName}`;
    const imgSize = serverDatabase.iconSize || 100;
    const header = `
    <img src="${imgUrl}" width="${imgSize}" height="${imgSize}"
         style="float: left; padding-right: 10px" class="${serverDatabase.iconClass || ""}">
    <h2 style="letter-spacing: 4px">${serverDatabase.serverName}</h2>
    <p>Logged in: ${serverDatabase.serverAddress} (&nbsp;${dateStr}&nbsp;)</p>
    ${serverDatabase.headerExtraHTML || ""}
    <p>Enter "help" for more information.</p>
    `;

    // 清屏
    output_.innerHTML = "";
    cmdLine_.value = "";

    // 加载初始历史（manifest.json 里的 initialHistory）
    if (term) {
        term.loadHistoryFromLocalStorage(serverDatabase.initialHistory);
    }

    // 准备一次性批量输出的行
    const linesToPrint = [];

    // 1. 标头
    linesToPrint.push(header);

    // 2. 这个用户专属的“接入公告/舰桥广播”
    if (
        serverDatabase.initialHistory &&
        userDatabase &&
        userDatabase.userId &&
        serverDatabase.initialHistory[userDatabase.userId] &&
        Array.isArray(serverDatabase.initialHistory[userDatabase.userId])
    ) {
        const bannerLines = serverDatabase.initialHistory[userDatabase.userId];
        bannerLines.forEach(line => {
            linesToPrint.push(line);
        });
    }

    // 3. 例如 “Connection successful” 或 “Login successful”
    if (msg) {
        linesToPrint.push(msg);
    }

    // 打印输出 & 应用特效
    output(linesToPrint).then(() => applySFX());

    // 更新提示符
    $(".prompt").html(promptText);
}

/**
 * Cross-browser impl to get document's height.
 */
function getDocHeight_() {
    const doc = document;
    return Math.max(
        Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight),
        Math.max(doc.body.offsetHeight, doc.documentElement.offsetHeight),
        Math.max(doc.body.clientHeight, doc.documentElement.clientHeight)
    );
}

/**
 * Scroll to bottom and clear the input value for a new line.
 */
function newLine() {
    window.scrollTo(0, getDocHeight_());
    cmdLine_.value = ""; // Clear/setup line for next input.
}

/**
 * Display content as terminal output.
 */
function output(data) {
    return new Promise((resolve) => {
        let delayed = 0;

        if (data && data.constructor === Object) {
            delayed = data.delayed;
            data = data.text;
        }

        if (data && data.constructor === Array) {
            if (delayed && data.length > 0) {
                outputLinesWithDelay(data, delayed, () => resolve(newLine()));
                return;
            }
            $.each(data, (_, value) => {
                printLine(value);
            });
        } else if (data) {
            printLine(data);
        }
        resolve(newLine());
    });
}

/**
 * Print lines of content with some delay between them.
 */
function outputLinesWithDelay(lines, delayed, resolve) {
    const line = lines.shift();
    printLine(line);
    if (lines.length > 0) {
        setTimeout(outputLinesWithDelay, delayed, lines, delayed, resolve);
    } else if (resolve) {
        resolve();
    }
}

/**
 * Display some text, or an image, on a new line.
 */
function printLine(data) {
    data ||= "";
    if (!data.startsWith("<")) {
        data = `<p>${data}</p>`;
    }
    output_.insertAdjacentHTML("beforeEnd", data);
    applySFX();
}

function applySFX() {
    $(output_).find(".desync").each((_, elem) => {
        const text = elem.textContent.trim();
        if (text) {
            elem.dataset.text = text;
        }
    });
    $(output_).find("img.glitch").filter(once).each((_, img) => glitchImage(img));
    $(output_).find("img.particle").filter(once).each((_, img) => particleImage(img));
    $(output_).find(".hack-reveal").filter(once).each((_, elem) => hackRevealText(elem, elem.dataset));
}

function once(_, elem) {
    if (elem.dataset.marked) {
        return false;
    }
    elem.dataset.marked = true;
    return true;
}

/**
 * ============================
 * Kernel: main command router
 * ============================
 */
function kernel(appName, args) {
    // 先试图让我们自己的指令处理它
    if (tryRunCustomCommand(appName, args)) {
        // 我们已经手动 output() 过了
        // 为了阻止后续报 "command not found"
        // 这里返回一个成功结束的 Promise
        return Promise.resolve();
    }

    // 如果不是我们自己的，就走原来的流程
    const program = allowedSoftwares()[appName];
    if (program) {
        return software(appName, program, args);
    }

    const systemApp = system[appName] || system[appName.replace(".", "_")];
    const appDisabled = (program === null);

    if (!systemApp || appDisabled) {
        return Promise.reject(new CommandNotFoundError(appName));
    }

    return systemApp(args);
}

/**
 * Attempts to connect to a server.
 * Loads manifest.json / userlist.json / mailserver.json
 * and sets serverDatabase / userDatabase / userList / mailList.
 */
kernel.connectToServer = function connectToServer(serverAddress, userName, passwd) {
    return new Promise((resolve, reject) => {
        if (serverAddress === serverDatabase.serverAddress) {
            reject(new AlreadyOnServerError(serverAddress));
            return;
        }
        $.get(`config/network/${serverAddress}/manifest.json`, (serverInfo) => {
            if (!userName && serverInfo.defaultUser) {
                // 未指定账号 → 用默认账号（游客/匿名之类）
                serverDatabase = serverInfo;
                userDatabase = serverInfo.defaultUser;
                currentLoggedUserId = userDatabase.userId || "visitor"; // <<< 新增
                localStorage.setItem("loggedUser", currentLoggedUserId); // <<< 新增

                $.get(`config/network/${serverInfo.serverAddress}/userlist.json`, (users) => {
                    userList = users;
                });
                $.get(`config/network/${serverInfo.serverAddress}/mailserver.json`, (mails) => {
                    mailList = mails;
                });

                setHeader("Connection successful");
                resolve();
            } else if (userName) {
                // 指定了 userName（ssh 或 login 用的）
                $.get(`config/network/${serverInfo.serverAddress}/userlist.json`, (users) => {
                    const matchingUser = users.find((user) => user.userId === userName);
                    if (!matchingUser) {
                        reject(new UnknownUserError(userName));
                        return;
                    }
                    if (matchingUser.password && matchingUser.password !== passwd) {
                        reject(new InvalidPasswordError(userName));
                        return;
                    }
                    serverDatabase = serverInfo;
                    userDatabase = matchingUser;
                    userList = users;
                    currentLoggedUserId = userDatabase.userId || "visitor"; // <<< 新增
                    localStorage.setItem("loggedUser", currentLoggedUserId); // <<< 新增

                    $.get(`config/network/${serverInfo.serverAddress}/mailserver.json`, (mails) => {
                        mailList = mails;
                    });
                    setHeader("Connection successful");
                    resolve();
                }).fail(() => {
                    reject(new AddressNotFoundError(serverAddress));
                });
            } else {
                reject(new ServerRequireUsernameError(serverAddress));
            }
        }).fail((...args) => {
            console.error("[connectToServer] Failure:", args);
            reject(new AddressNotFoundError(serverAddress));
        });
    });
};

/**
 * Kernel.init:
 * - grabs DOM
 * - loads software.json (custom commands list)
 * - connects to default server
 */
kernel.init = function init(cmdLineContainer, outputContainer) {
    return new Promise((resolve, reject) => {
        cmdLine_ = document.querySelector(cmdLineContainer);
        output_ = document.querySelector(outputContainer);

        $.when(
            $.get("config/software.json", (softwareData) => {
                softwareInfo = softwareData; // eslint-disable-line no-undef
                kernel.connectToServer(defaultServerAddress);
            })
        )
        .done(() => {
            resolve(true);
        })
        .fail((err, msg, details) => {
            console.error("[init] Failure:", err, msg, details);
            reject(new JsonFetchParseError(msg));
        });
    });
};


/**
 * ============================
 * System = built-in commands
 * (NOT from software.json, these are native)
 * ============================
 */
system = {
    dumpdb() {
        return new Promise(() => {
            output(":: serverDatabase - connected server information");
            debugObject(serverDatabase);
            output("----------");
            output(":: userDatabase - connected user information");
            debugObject(userDatabase);
            output("----------");
            output(":: userList - list of users registered in the connected server");
            debugObject(userList);
        });
    },

    whoami() {
        return new Promise((resolve) => {
            resolve(
                `${serverDatabase.serverAddress}/${userDatabase.userId}`
            );
        });
    },

    clear() {
        return new Promise((resolve) => {
            setHeader();
            resolve(false);
        });
    },

    date() {
        return new Promise((resolve) => {
            const date = new Date();
            const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
            resolve(String(`${serverDate.month} ${serverDate.day} ${serverDate.year} ${time} ${serverDate.reference}`));
        });
    },

    echo(args) {
        return new Promise((resolve) => {
            resolve(args.join(" "));
        });
    },

    // ============================
    // help：舰载索引版本（我们自定义）
    // ============================
    help(/* args */) {
        return new Promise((resolve) => {
            const out = [];

            out.push(`<div class="uuc-block">`);
            out.push(`<p class="glow" style="font-size:1.1rem">╔════════════════════════════════╗</p>`);
            out.push(`<p class="glow" style="font-size:1.1rem">║   舰载指令索引 / UUC_GLADIATOR&nbsp;&nbsp;║ </p>`);
            out.push(`<p class="glow" style="font-size:1.1rem">╚════════════════════════════════╝</p>`);
            out.push(`<br>`);

            // 只列我们想公开的
            out.push(`<b>acknowledge</b>    - 确认并回传 Ω-3 指令回执 <br>`);
            out.push(`<b>crew</b>           - 舰员名册 / 在岗信息（crew username/usernumber）<br>`);
            out.push(`<b>profile [id]</b>  - 完整人物档案（profile username）<br>`);
            out.push(`<b>status</b>         - 舰体与战术态势快照<br>`);
            out.push(`<b>login / logout</b> - 登录 / 登出舰载终端<br>`);
            out.push(`<b>clear</b>          - 清屏<br>`);
            out.push(`<b>help</b>           - 显示帮助页面<br>`);

            out.push(`<br>`);
            out.push(`<span style="color:#888">注意：部分档案仅指定舰员可见。</span>`);
            out.push(`</div>`);

            resolve(out);
        });
    },

    login(args) {
        return new Promise((resolve, reject) => {
            // guard: 必须带 username:password
            if (!args || args.length === 0) {
                reject(new UsernameIsEmptyError());
                return;
            }

            let userName = "";
            let passwd = "";
            try {
                [userName, passwd] = userPasswordFrom(args[0]);
            } catch (error) {
                reject(error);
                return;
            }
            if (!userName) {
                reject(new UsernameIsEmptyError());
                return;
            }

            const matchingUser = userList.find((user) => user.userId === userName);
            if (!matchingUser) {
                reject(new UnknownUserError(userName));
                return;
            }
            if (matchingUser.password && matchingUser.password !== passwd) {
                reject(new InvalidPasswordError(userName));
                return;
            }

            userDatabase = matchingUser;

            // 同步当前身份（给 crew/profile 权限用）
            currentLoggedUserId = userDatabase.userId || "visitor";
            localStorage.setItem("loggedUser", currentLoggedUserId);

            setHeader("Login successful");
            resolve();
        });
    },

    logout() {
        return new Promise(() => {
            location.reload();
        });
    },

    exit() {
        return new Promise(() => {
            location.reload();
        });
    },

    history() {
        return new Promise((resolve) => {
            const messageList = history_.map((line, i) => `[${i}] ${line}`); // eslint-disable-line no-undef
            resolve(messageList);
        });
    },

    mail() {
        return new Promise((resolve, reject) => {
            const messageList = mailList
                .filter((mail) => mail.to.includes(userDatabase.userId))
                .map((mail, i) => `[${i}] ${mail.title}`);
            if (messageList.length === 0) {
                reject(new MailServerIsEmptyError());
                return;
            }
            resolve(messageList);
        });
    },

    read(args) {
        return new Promise((resolve, reject) => {
            const mailIndex = Number(args[0]);
            const messageList = mailList.filter((mail) => mail.to.includes(userDatabase.userId));
            const mailAtIndex = messageList[mailIndex];
            if (!mailAtIndex || !mailAtIndex.to.includes(userDatabase.userId)) {
                reject(new InvalidMessageKeyError());
                return;
            }
            let message = [];
            message.push("---------------------------------------------");
            message.push(`From: ${mailAtIndex.from}`);
            message.push(`To: ${userDatabase.userId}@${serverDatabase.terminalID}`);
            message.push("---------------------------------------------");
            message = [...message, ...mailAtIndex.body.split("  ")];
            resolve(message);
        });
    },

    // ============================
    // crew：列在岗信息（公共舰内信息）
    // ============================
    crew(args) {
        return new Promise((resolve, reject) => {
            const db = window.crewProfiles;
            if (!db) {
                reject(new Error("crew database not available on this node"));
                return;
            }

            // 当前登录的用户是谁？
            const requester = (localStorage.getItem("loggedUser") || "visitor").toLowerCase();
            const isCrew = requester !== "visitor";

            // 访客没权限看 crew
            if (!isCrew) {
                resolve([
                    `<div class="uuc-block">`,
                    `<p class='glow' style='color:#ff4d4d'>访问拒绝</p>`,
                    `此终端处于访客/未授权模式。<br>舰员身份验证后可读取舰上在岗信息 (crew)。`,
                    `</div>`
                ]);
                return;
            }

            // 显示顺序 & 编号映射（玩家看到的 [1] [2] ...）
            const rosterOrder = {
                1: "martin",
                2: "lola",
                3: "vincent",
                4: "diana",
                5: "andrew",
                6: "damien"
            };

            // 渲染单个人的“公开卡片”（public）
            function renderPublicRecord(id) {
                const rec = db[id];
                if (!rec || !rec.public) {
                    return [
                        `<div class="uuc-block">`,
                        `<p class='glow' style='color:#ff4d4d'>记录不可用</p>`,
                        `该身份未在此节点登记。`,
                        `</div>`
                    ];
                }

                return [
                    `<div class="uuc-block">`,
                    `<p class='glow' style='font-size:1.1rem'>[在岗信息] ${id.toUpperCase()}</p>`,
                    ...rec.public,
                    `</div>`
                ];
            }

            // 如果没带参数：列花名册
            if (!args || args.length === 0) {
                const listingLines = Object.entries(rosterOrder).map(([num, id]) => {
                    const rec = db[id];
                    const firstLine = rec && rec.public && rec.public[0]
                        ? rec.public[0].split("<br>")[0]
                        : id;
                    return `[${num}] ${firstLine}`;
                });

                resolve([
                    `<div class="uuc-block">`,
                    `<p class='glow' style='font-size:1.1rem'>[CREW ROSTER / 舰内频道]</p>`,
                    ...listingLines,
                    `<br>使用 'crew &lt;编号&gt;' 或 'crew &lt;名字&gt;' 查看该成员的在岗信息。`,
                    `</div>`
                ]);
                return;
            }

            // 有参数：可能是编号，也可能是名字
            let query = args[0].toLowerCase();

            // crew 2 -> 找 rosterOrder[2] 对应谁
            if (!isNaN(parseInt(query))) {
                const mapped = rosterOrder[parseInt(query)];
                if (mapped) {
                    query = mapped;
                } else {
                    resolve([
                        `<div class="uuc-block">`,
                        `<p class='glow' style='color:#ff4d4d'>无结果</p>`,
                        `该编号未登记。`,
                        `</div>`
                    ]);
                    return;
                }
            }

            // 再根据 id 查内容
            const record = db[query];
            if (!record) {
                resolve([
                    `<div class="uuc-block">`,
                    `<p class='glow' style='color:#ff4d4d'>无结果</p>`,
                    `该身份未登记。`,
                    `</div>`
                ]);
                return;
            }

            resolve(renderPublicRecord(query));
        });
    }, // ← 逗号别删，后面还有 ping()

    ping(args) {
        return new Promise((resolve, reject) => {
            if (args === "") {
                reject(new AddressIsEmptyError());
                return;
            }

            $.get(`config/network/${args}/manifest.json`, (serverInfo) => {
                resolve(`Server ${serverInfo.serverAddress} (${serverInfo.serverName}) can be reached`);
            })
            .fail(() => reject(new AddressNotFoundError(args)));
        });
    },

    telnet() {
        return new Promise((_, reject) => {
            reject(new Error("telnet is unsecure and is deprecated - use ssh instead"));
        });
    },

    ssh(args) {
        return new Promise((resolve, reject) => {
            if (args === "") {
                reject(new AddressIsEmptyError());
                return;
            }
            let userName = "";
            let passwd = "";
            let serverAddress = args[0];
            if (serverAddress.includes("@")) {
                const splitted = serverAddress.split("@");
                if (splitted.length !== 2) {
                    reject(new InvalidCommandParameter("ssh"));
                    return;
                }
                serverAddress = splitted[1];
                try {
                    [userName, passwd] = userPasswordFrom(splitted[0]);
                } catch (error) {
                    reject(error);
                    return;
                }
            }
            kernel.connectToServer(serverAddress, userName, passwd).then(resolve).catch(reject);
        });
    }
};

// ============================
// helpers
// ============================

function userPasswordFrom(creds) {
    if (!creds.includes(":")) {
        return [creds, ""];
    }
    const splitted = creds.split(":");
    if (splitted.length !== 2) {
        throw new InvalidCredsSyntaxError();
    }
    return splitted;
}

// ===== 自定义命令直连执行层 =====
function tryRunCustomCommand(cmdName, argsArray) {
    // 1. 如果这个命令是系统内建的（比如 login / mail / help / crew / etc）
    //    我们就不要去抢，让 kernel 后面正常去跑 system[cmdName]
    if (system && typeof system[cmdName] === "function") {
        return false;
    }

    // 2. 找看看有没有我们自定义挂到 window 上的命令
    const fn = window[cmdName];
    if (typeof fn !== "function") {
        return false; // 没有自定义实现，交回去
    }

    // 3. 跑我们自己的实现
    let result;
    try {
        result = fn(argsArray);
    } catch (e) {
        result = {
            delayed: 0,
            clear: false,
            message: [
                `<p class='glow' style='color:#ff4d4d'>Runtime Error in ${cmdName}()</p>`,
                String(e)
            ]
        };
    }

    // 4. 整理输出
    let lines = [];
    if (result && Array.isArray(result.message)) {
        lines = result.message;
    } else if (result && typeof result.message === "string") {
        lines = [result.message];
    } else {
        lines = ["(no output)"];
    }

    lines.forEach(line => output(line));

    // 表示我们已经完整处理了这个命令
    return true;
}

function runSoftware(progName, program, args) {
    return new Promise((resolve) => {
        let msg;
        if (program.message) {
            // 如果 software.json 里这个命令写了固定 message，就用那个静态文本
            msg = { text: program.message, delayed: program.delayed };
        } else {
            // 否则调用真正的实现函数，比如 window.status / window.profile / window.acknowledge
            msg = window[progName](args) || "";
        }

        // 情况 A: 返回是字符串或数组
        if (!msg || msg.constructor === String || msg.constructor === Array) {
            resolve(msg);
            return;
        }

        // 情况 B: 返回是对象
        if (msg && msg.constructor === Object) {
            // case B1: “一发输出然后结束”的命令
            if (!msg.onInput) {
                if (msg.message) {
                    output(msg.message);
                }
                resolve();
                return;
            }

            // case B2: 交互式程序
            if (msg.message) {
                output(msg.message);
            }
            readPrompt(msg.prompt || ">")
                .then((input) => msg.onInput(input))
                .then((finalMsg) => resolve(finalMsg));
            return;
        }

        resolve(msg);
    });
}

/**
 * readPrompt: interactive input capture used by interactive programs
 */
function readPrompt(promptText) {
    return new Promise((resolve) => {
        const prevPromptText = $("#input-line .prompt").text();
        $("#input-line .prompt").text(promptText);
        term.removeCmdLineListeners();
        cmdLine_.addEventListener("keydown", promptSubmitted);
        function promptSubmitted(e) {
            if (e.keyCode === 13) {
                cmdLine_.removeEventListener("keydown", promptSubmitted);
                term.addCmdLineListeners();
                $("#input-line .prompt").text(prevPromptText);
                resolve(this.value.trim());
            }
        }
    });
}

/**
 * List only programs current user can access
 * - program.location: 限制在哪个server可见
 * - program.protection: 限制哪些userId可以跑
 */
function allowedSoftwares() {
    const softwares = {};
    for (const app in softwareInfo) { // eslint-disable-line no-undef
        const program = softwareInfo[app];
        if (program === null) {
            softwares[app] = null;
        } else if (
            (!program.location || program.location.includes(serverDatabase.serverAddress)) &&
            (!program.protection || program.protection.includes(userDatabase.userId))
        ) {
            softwares[app] = program;
        }
    }
    return softwares;
}


/*
 * dweet helpers (unchanged)
 */
const FPS = 60;
const epsilon = 1.5;
/* eslint-disable no-unused-vars */
const C = Math.cos;
const S = Math.sin;
const T = Math.tan;

let lastDweetId = 0;
function dweet(u, width, height, delay, style) {
    width = width || 200;
    height = height || 200;
    delay = delay || 0;
    style = style || "";
    const id = ++lastDweetId;
    let frame = 0;
    let nextFrameMs = 0;
    function loop(frameTime) {
        frameTime = frameTime || 0;
        const c = document.getElementById(id);
        if (!c) {
            console.log(`Stopping dweet rendering: no element with id=${id} found`);
            return;
        }
        requestAnimationFrame(loop);
        if (frameTime < nextFrameMs - epsilon) {
            return; // too fast
        }
        nextFrameMs = Math.max(nextFrameMs + 1000 / FPS, frameTime);
        let time = frame / FPS;
        if (time * FPS | frame - 1 === 0) {
            time += 0.000001;
        }
        frame++;
        const x = c.getContext("2d");
        x.fillStyle = "white";
        x.strokeStyle = "white";
        x.beginPath();
        x.resetTransform();
        x.clearRect(0, 0, width, height);
        u(time, x, c);
    }
    setTimeout(loop, delay + 50);
    return `<canvas id="${id}" width="${width}" height="${height}" style="${style}">`;
}

function R(r, g, b, a) {
    a = typeof a === "undefined" ? 1 : a;
    return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}
