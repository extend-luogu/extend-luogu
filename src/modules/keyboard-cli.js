import uindow, { $, warn, log, lg_usr } from "../utils.js"
import mod, { sto } from "../core.js"

mod.reg("keyboard-and-cli", "键盘操作与命令行", "@/.*", {
    lang: { ty: "enum", dft: "en", vals: [ "en", "zh" ] }
}, ({ msto }) => {
    const $cli = $(`<div id="exlg-cli" exlg="exlg"></div>`).appendTo($("body"))
    const $cli_input = $(`<input id="exlg-cli-input" />`).appendTo($cli)

    let cli_is_log = false
    const cli_log = (sp, ...tp) => {
        cli_is_log = true
        const m = sp.map((s, i) =>
            s.split(/\b/).map(w => cli_lang_dict[w]?.[ cli_lang - 1 ] ?? w).join("") +
            (tp[i] || "")
        ).join("")
        return $cli_input.val(m)
    }
    const cli_error = (sp, ...tp) =>
        warn(cli_log(sp, ...tp).addClass("error").val())
    const cli_clean = () => {
        cli_is_log = false
        return $cli_input.val("").removeClass("error")
    }
    const cli_history = []
    let cli_history_index = 0
    const cli_langs = [ "en", "zh" ], cli_lang_dict = {
        ".": [ "。" ],
        ",": [ "，" ],
        "!": [ "！" ],
        "?": [ "？" ],
        "cli":        [ "命令行" ],
        "current":    [ "当前" ],
        "language":   [ "语言" ],
        "available":  [ "可用" ],
        "command":    [ "命令" ],
        "commands":   [ "命令" ],
        "unknown":    [ "未知" ],
        "forum":      [ "板块" ],
        "target":     [ "目标" ],
        "mod":        [ "模块" ],
        "action":     [ "操作" ],
        "illegal":    [ "错误" ],
        "param":      [ "参数" ],
        "expected":   [ "期望" ],
        "type":       [ "类型" ],
        "lost":       [ "缺失" ],
        "essential":  [ "必要" ],
        "user":       [ "用户" ]
    }
    let cli_lang = cli_langs.indexOf(msto.lang) || 0

    const gcmd = (name, arg, help, fn) => {
        arg = arg.replace(/ /g, "").split(",").map(e => {
            let ret = {}
            if (e[0] === "[") {
                ret.essential = false
                e = e.slice(1, -1)
            }
            else {
                ret.essential = true
            }
            [ ret.name, ret.type ] = e.split(":")
            return ret
        })
        return { name, arg, help, fn }
    }

    const cmds = [
        gcmd("help", "[cmd: string]", [
            "get the help of <cmd>. or list all cmds.",
            "获取 <cmd> 的帮助。空则列出所有",
        ], cmd => {
            if (! cmd)
                cli_log`exlg cli. current language: ${cli_lang}, available commands: ${ Object.keys(cmds).join(", ") }`
            else {
                const f = cmds[cmd]
                if (! f) return cli_error`help: unknown command "${cmd}"`

                const arg = f.arg.map(a => {
                    const i = a.name + ": " + a.type
                    return a.essential ? `<${i}>` : `[${i}]`
                }).join(" ")
                cli_log`${cmd} ${arg} ${ f.help[cli_lang] }`
            }
        }),
        gcmd("cd", "path: string", [
            "jump to <path>, relative path is OK.",
            "跳转至 <path>，支持相对路径。",
        ], path => {
            let tar
            if (path[0] === "/") tar = path
            else {
                const pn = location.pathname.replace(/^\/+/, "").split("/")
                const pr = path.split("/")
                pr.forEach(d => {
                    if (d === ".") return
                    if (d === "..") pn.pop()
                    else pn.push(d)
                })
                tar = pn.join("/")
            }
            location.href = location.origin + "/" + tar.replace(/^\/+/, "")
        }),
        gcmd("cdd", "forum: string", [
            "jump to the forum named <forum> of discussion. use all the names you can think of.",
            "跳转至名为 <forum> 的讨论板块，你能想到的名字基本都有用。",
        ], forum => {
            const tar = [
                [ "relevantaffairs",    "gs", "gsq",    "灌水", "灌水区",               "r", "ra" ],
                [ "academics",          "xs", "xsb",    "学术", "学术版",               "a", "ac" ],
                [ "siteaffairs",        "zw", "zwb",    "站务", "站务版",               "s", "sa" ],
                [ "problem",            "tm", "tmzb",   "题目", "题目总版",             "p"       ],
                [ "service",            "fk", "fksqgd", "反馈", "反馈、申请、工单专版",      "se" ]
            ]
            forum = tar.find(ns => ns.includes(forum))?.[0]
            if (! tar) return cli_error`cdd: unknown forum "${forum}"`
            cmds.cd.fn(`/discuss/lists?forumname=${forum}`)
        }),
        gcmd("cc", "[name: char]", [
            "jump to <name>, \"h|p|c|r|d|i|m|n\" stands for home|problem|contest|record|discuss|I myself|message|notification. or jump home.",
            "跳转至 [name]，\"h|p|c|r|d|i|m|n\" 代表：主页|题目|比赛|评测记录|讨论|个人中心|私信|通知。空则跳转主页。",
        ], name => {
            name = name || "h"
            const tar = {
                h: "/",
                p: "/problem/list",
                c: "/contest/list",
                r: "/record/list",
                d: "/discuss/lists",
                i: "/user/" + lg_usr.uid,
                m: "/chat",
                n: "/user/notification",
            }[name]
            if (tar) cmds.cd.fn(tar)
            else cli_error`cc: unknown target "${name}"`
        }),
        gcmd("mod", "action: string, [name: string]", [
            "for <action> \"enable|disable|toggle\", opearte the mod named <name>.",
            "当 <action> 为 \"enable|disable|toggle\"，对名为 <name> 的模块执行对应操作：启用|禁用|切换。",
        ], (action, name) => {
            switch (action) {
            case "enable":
            case "disable":
            case "toggle":
                if (!mod.has(name)) return cli_error`mod: unknown mod "${name}"`
                sto[name].on = {
                    enable: () => true, disable: () => false, toggle: now => ! now
                }[action](sto[name].on)
                break
            default:
                return cli_error`mod: unknown action "${action}"`
            }
        }),
        gcmd("dash", "action: string", [
            "for <action> \"show|hide|toggle\", opearte the exlg dashboard.",
            "当 <action> 为 \"show|hide|toggle\", 显示|隐藏|切换 exlg 管理面板。",
        ], action => {
            if (! [ "show", "hide", "toggle" ].includes(action))
                return cli_error`dash: unknown action "${action}"`
            $("#exlg-dash-window")[action]()
        }),
        gcmd("lang", "lang: string", [
            "for <lang> \"en|zh\" switch current cli language.",
            "当 <lang> 为 \"en|zh\"，切换当前语言。",
        ], lang => {
            try {
                msto.lang = lang
                cli_lang = cli_langs.indexOf(lang)
            }
            catch {
                return cli_error`lang: unknown language ${lang}`
            }
        }),
        gcmd("uid", "uid: integer", [
            "jumps to homepage of user whose uid is <uid>.",
            "跳转至 uid 为 <uid> 的用户主页。",
        ], uid => location.href = `/user/${uid}`),
        gcmd("un", "name: string", [
            "jumps to homepage of user whose username is like <name>.",
            "跳转至用户名与 <name> 类似的用户主页。",
        ], name => {
            $.get("/api/user/search?keyword=" + name, res => {
                if (! res.users[0])
                    cli_error`un: unknown user "${name}".`
                else
                    location.href = "/user/" + res.users[0].uid
            })
        }),
    ].reduce((tot, cmd) => {
        tot[cmd.name] = cmd
        return tot
    }, {})

    const parse = cmd => {
        log(`Parsing command: "${cmd}"`)

        const tk = cmd.trim().replace(/^\//, "").split(" ")
        const n = tk.shift()
        if (! n) return
        const f = cmds[n]
        if (! f) return cli_error`exlg: unknown command "${n}"`
        let i = -1, a; for ([ i, a ] of tk.entries()) {
            const t = f.arg[i].type
            if (t === "number" || t === "integer") tk[i] = + a
            if (
                t === "char" && a.length === 1 ||
                t === "number" && ! isNaN(tk[i]) ||
                t === "integer" && ! isNaN(tk[i]) && ! (tk[i] % 1) ||
                t === "string"
            ) ;
            else return cli_error`${n}: illegal param "${a}", expected type ${t}.`
        }
        if (f.arg[i + 1]?.essential) return cli_error`${n}: lost essential param "${ f.arg[i + 1].name }"`
        f.fn(...tk)
    }

    $cli_input.on("keydown", e => {
        switch (e.key) {
        case "Enter":
            if (cli_is_log) return cli_clean()
            const cmd = $cli_input.val()
            cli_history.push(cmd)
            cli_history_index = cli_history.length
            parse(cmd)
            if (! cli_is_log) return cli_clean()
            break
        case "/":
            if (cli_is_log) cli_clean()
            break
        case "Escape":
            $cli.hide()
            break
        case "ArrowUp":
        case "ArrowDown":
            const i = cli_history_index + { ArrowUp: -1, ArrowDown: +1 }[ e.key ]
            if (i < 0 || i >= cli_history.length) return
            cli_history_index = i
            $cli_input.val(cli_history[i])
            break
        }
    })

    $(uindow).on("keydown", e => {
        const $act = $(document.activeElement)
        if ($act.is("body")) {
            const rel = { ArrowLeft: "prev", ArrowRight: "next" }[ e.key ]
            if (rel) return $(`a[rel=${rel}]`)[0].click()

            if (e.shiftKey) {
                const y = { ArrowUp: 0, ArrowDown: 1e6 }[ e.key ]
                if (y !== undefined) uindow.scrollTo(0, y)
            }

            if (e.key === "/") {
                $cli.show()
                cli_clean().trigger("focus")
            }
        }
        else if ($act.is("[name=captcha]") && e.key === "Enter")
            $("#submitpost, #submit-reply")[0].click()
    })
}, `
    #exlg-cli {
        position: fixed;
        top: 0;
        z-index: 65536;
        display: none;
        width: 100%;
        height: 40px;
        background-color: white;
        box-shadow: 0 0 7px dodgerblue;
    }
    #exlg-cli-input {
        display: block;
        height: 100%;
        width: 100%;
        border: none;
        outline: none;
        font-family: "Fira Code", "consolas", "Courier New", monospace;
    }
    #exlg-cli-input.error {
        background-color: indianred;
    }
`)