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
    // 🔧 尝试直接执行我们定义的自定义命令
    if (tryRunCustomCommand(appName, args)) {
        return;
    }

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

    help(args) {
        return new Promise((resolve) => {
            const programs = allowedSoftwares();
            if (args.length === 0) {
                const cmdNames = Object.keys(system).filter(
                    (cmd) => {
                        const program = programs[cmd];
                        return program !== null && !(program && program.secretCommand) && cmd !== "dumpdb";
                    }
                );
                const progNames = Object.keys(programs).filter(
                    (pName) => programs[pName] && !programs[pName].secretCommand
                );
                Array.prototype.push.apply(cmdNames, progNames);

                // 我们也想把 'crew' 显示出来（如果我们加了 crew）
                if (!cmdNames.includes("crew")) {
                    cmdNames.push("crew"); // <<< 新增: crew 指令出现在 help 列表
                }

                cmdNames.sort();
                resolve([
                    "You can read the help of a specific command by entering as follows: 'help commandName'",
                    "List of useful commands:",
                    `<div class="ls-files">${cmdNames.join("<br>")}</div>`,
                    "You can navigate in the commands usage history using the UP & DOWN arrow keys.",
                    "The TAB key will provide command auto-completion."
                ]);
            } else if (args[0] === "clear") {
                resolve(["Usage:", "> clear", "The clear command will wipe the content of the terminal, but it will not affect the history."]);
            } else if (args[0] === "date") {
                resolve(["Usage:", "> date", "The date command will print the current date-time into terminal."]);
            } else if (args[0] === "echo") {
                resolve(["Usage:", "> echo args", "The echo command will print args into terminal."]);
            } else if (args[0] === "help") {
                resolve(["Usage:", "> help", "The default help message. It will show the commands available on the server."]);
            } else if (args[0] === "history") {
                resolve(["Usage:", "> history", "The history command will list all the commands you already typed in this terminal."]);
            } else if (args[0] === "login") {
                resolve(["Usage:", "> login username:password", "Switch account: log in as another registered user on the server, to access your data files and messages."]);
            } else if (args[0] === "mail") {
                resolve(["Usage:", "> mail", "If you're logged in you can list your mail messages if any."]);
            } else if (args[0] === "ping") {
                resolve([
                    "Usage:",
                    "> ping address",
                    "The ping command will try to reach a valid address.",
                    "If the ping doesn't return a valid response, the address may be incorrect, may not exist or can't be reached locally."
                ]);
            } else if (args[0] === "read") {
                resolve(["Usage:", "> read x", "If you're logged in you can read your mail messages if any."]);
            } else if (args[0] === "ssh") {
                resolve([
                    "Usage:",
                    "> ssh address",
                    "> ssh username@address",
                    "> ssh username:password@address",
                    "You can connect to a valid address to access a specific server on the Internet.",
                    "You may need to specify a username if the server has no default user.",
                    "You may need to specify a password if the user account is protected."
                ]);
            } else if (args[0] === "whoami") {
                resolve(["Usage:", "> whoami", "Display the server you are currently connected to, and the login you are registered with."]);
            } else if (args[0] === "crew") { // <<< 新增
                resolve([
                    "Usage:",
                    "> crew",
                    "> crew <index>",
                    "crew 会列出你在本节点上有权限查看的舰员档案。",
                    "crew <index> 会展开该档案，包含随身装备、心理记录（如果你有权限看）。"
                ]);
            } else if (args[0] in softwareInfo) {
                const customProgram = programs[args[0]];
                if (customProgram.help) {
                    resolve(["Usage:", `> ${args[0]}`, customProgram.help]);
                }
            } else if (args[0] in system && args[0] !== "dumpdb") {
                console.error(`Missing help message for system command: ${args[0]}`);
            } else {
                resolve([`Unknow command ${args[0]}`]);
            }
        });
    },

    login(args) {
        return new Promise((resolve, reject) => {
            if (!args) {
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

            // 同步“谁现在登录了”，给 ACKNOWLEDGE / profile / crew 用
            currentLoggedUserId = userDatabase.userId || "visitor";   // <<< 新增
            localStorage.setItem("loggedUser", currentLoggedUserId);  // <<< 新增

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
    // crew：像 mail 一样浏览船员档案
    // ============================
    crew(args) { // <<< 新增
        return new Promise((resolve, reject) => {
            // 我们假设 crewProfiles / canViewProfile / renderProfileData
            // 已经在全局可访问（例如在 config/software.js 里挂到了 window）
            if (!window.crewProfiles || !window.canViewProfile || !window.renderProfileData) {
                reject(new Error("crew database not available on this node"));
                return;
            }

            const requester = currentLoggedUserId || "visitor";

            // 如果没带参数：列出我能看的所有档案，像 mail 那样列成 [0] [1] [2]...
            if (!args || args.length === 0) {
                const visibleKeys = Object.keys(window.crewProfiles).filter((targetId) => {
                    return window.canViewProfile(requester, targetId);
                });

                if (visibleKeys.length === 0) {
                    resolve([
                        "No accessible crew records.",
                        "(Either you are not authorized, or this node has restricted medical / command data.)"
                    ]);
                    return;
                }

                const listing = visibleKeys.map((id, i) => {
                    // 简单生成“摘要行”用来浏览
                    const summaryLine = window.crewProfiles[id].summary?.[0] || id;
                    return `[${i}] ${summaryLine}`;
                });

                resolve([
                    "<p class='glow' style='font-size:1.1rem'>[CREW ROSTER ACCESS / Ω-3 CHANNEL]</p>",
                    ...listing,
                    "",
                    "Use 'crew <index>' to inspect a profile."
                ]);

                return;
            }

            // 如果有参数，比如 crew 1：尝试展开对应索引
            const chosenIndex = Number(args[0]);
            if (Number.isNaN(chosenIndex)) {
                reject(new Error("Invalid crew index."));
                return;
            }

            const visibleKeys = Object.keys(window.crewProfiles).filter((targetId) => {
                return window.canViewProfile(requester, targetId);
            });

            const targetId = visibleKeys[chosenIndex];
            if (!targetId) {
                reject(new Error("Invalid crew index or insufficient clearance."));
                return;
            }

            const fullProfileLines = window.renderProfileData(targetId);
            resolve(fullProfileLines);
        });
    },

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
  const fn = window[cmdName];
  if (typeof fn !== "function") {
    return false; // 没定义，交给系统默认逻辑
  }

  let result;
  try {
    result = fn(argsArray);
  } catch (e) {
    result = {
      delayed: 0,
      clear: false,
      message: [
        `<p style='color:#ff4d4d'>Runtime Error in ${cmdName}()</p>`,
        String(e)
      ]
    };
  }

  let lines = [];
  if (result && Array.isArray(result.message)) {
    lines = result.message;
  } else if (result && typeof result.message === "string") {
    lines = [result.message];
  } else {
    lines = ["(no output)"];
  }

  lines.forEach(line => output(line));
  return true; // 表示我们自己接管了
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
        // （比如老系统命令直接 resolve("hi") 或 resolve(["line1","line2"])）
        if (!msg || msg.constructor === String || msg.constructor === Array) {
            resolve(msg);
            return;
        }

        // 情况 B: 返回是对象
        if (msg && msg.constructor === Object) {
            // case B1: “一发输出然后结束”的命令
            // 我们的 status / profile / acknowledge 都是这种：
            // { delayed: 30, clear:false, message:[ "...", "..." ] }
            if (!msg.onInput) {
                if (msg.message) {
                    // 直接把 message 打出来
                    output(msg.message);
                }
                // 命令结束
                resolve();
                return;
            }

            // case B2: 真正的交互式程序：它既有 message 又有 onInput
            if (msg.message) {
                output(msg.message);
            }
            readPrompt(msg.prompt || ">")
                .then((input) => msg.onInput(input))
                .then((finalMsg) => resolve(finalMsg));
            return;
        }

        // 兜底（几乎不会走到）
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
