// ==UserScript==
// @name           extend-luogu
// @namespace      http://tampermonkey.net/
// @version        4.2.6
// @description    Makes Luogu more powerful
// @icon           https://exlg.cc/img/logo.png
//
// @match          https://*.luogu.com.cn/*
// @match          https://*.luogu.org/*
// @match          https://www.bilibili.com/robots.txt?*
// @match          https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121
// @match          https://service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com/release/exlg-nextgen
// @match          https://extend-luogu.github.io/exlg-setting-new/*
// @include        http://localhost:1634/*
// @match          https://dash.exlg.cc/*
//
// @connect        tencentcs.com
// @connect        luogulo.gq
// @connect        bens.rotriw.com
// @connect        codeforces.com
// @connect        codeforces.ml
// @connect        kenkoooo.com
//
// @require        https://cdn.luogu.com.cn/js/jquery-2.1.1.min.js
// @require        https://cdn.jsdelivr.net/gh/leizongmin/js-xss@1.0.10/dist/xss.min.js
// @require        https://cdn.jsdelivr.net/gh/markedjs/marked@2.0.1/marked.min.js
// @require        https://cdn.jsdelivr.net/gh/ForkKILLET/TM-dat@main/TM-dat.user.js
//
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_listValues
// @grant          GM_setClipboard
// @grant          GM_xmlhttpRequest
// @grant          unsafeWindow
// ==/UserScript==

// ==Update==

const update_log = `
*M search-user
 : 搜索用户自动忽略其中的空白字符（通常出现在从外面复制名字的时候）
`.trim()

// ==/Update==

// ==Utilities==

const uindow = unsafeWindow

const log = (f, ...s) => uindow.console.log(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
const warn = (f, ...s) => uindow.console.warn(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
const error = (f, ...s) => {
    uindow.console.error(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
    throw Error(s.join(" "))
}

// ==Utilities==Libraries==

const $ = jQuery
const xss = new filterXSS.FilterXSS({
    onTagAttr: (_, k, v) => {
        if (k === "style") return `${k}="${v}"`
    }
})
// const mdp = uindow.markdownPalettes
$.double = (func, first, second) => [func(first), func(second)]

// ==Utilities==Extensions==

Date.prototype.format = function (f, UTC) {
    UTC = UTC ? "UTC" : ""
    const re = {
        "y+": this[`get${UTC}FullYear`](),
        "m+": this[`get${UTC}Month`]() + 1,
        "d+": this[`get${UTC}Date`](),
        "H+": this[`get${UTC}Hours`](),
        "M+": this[`get${UTC}Minutes`](),
        "S+": this[`get${UTC}Seconds`](),
        "s+": this[`get${UTC}Milliseconds`]()
    }
    for (const r in re) if (RegExp(`(${r})`).test(f))
        f = f.replace(RegExp.$1,
            ("000" + re[r]).substr(re[r].toString().length + 3 - RegExp.$1.length)
        )
    return f
}

String.prototype.toInitialCase = function () {
    return this[0].toUpperCase() + this.slice(1)
}

Array.prototype.lastElem = function () {
    return this[this.length-1]
}

// ==Utilities==Functions==

let sto = null, lg_dat, lg_usr

const version_cmp = (v1, v2) => {
    if (! v1) return "<<"

    const op = (x1, x2) => x1 === x2 ? "==" : x1 < x2 ? "<<" : ">>"
    const exs = [ "pre", "alpha", "beta" ]

    const [ [ n1, e1 ], [ n2, e2 ] ] = [ v1, v2 ].map(v => v.split(" "))
    if (n1 === n2) return op(...[ e1, e2 ].map(e => e ? exs.findIndex(ex => ex === e) : Infinity))

    const [ m1, m2 ] = [ n1, n2 ].map(n => n.split("."))
    for (const [ k2, m ] of m1.entries())
        if (m !== m2[k2]) return op(+ m || 0, + m2[k2] || 0)
}

const cur_time = (ratio = 1) => {
    let d = new Date()
    return ~~(d.getTime() / ratio)
}

const lg_content = url => new Promise((res, rej) =>
    $.get(url + (url.includes("?") ? "&" : "?") + "_contentOnly=1", data => {
        if (data.code !== 200) rej(`Requesting failure code: ${ res.code }.`)
        res(data)
    })
)
/*
const exlg_alert_onaction = uindow.show_alert ? () => true : () => {
    if (! ` ${document.body.className.split(' ')} `.includes("lg-alert-built")) {
        $(document.head).append($(`<link rel="stylesheet" href="https://cdn.luogu.com.cn/css/amazeui.min.css">`))
        $(`<div class="am-modal am-modal-alert am-modal-out" tabindex="-1" id="exlg-alert" style="display: none; margin-top: -40px;">
            <div class="am-modal-dialog">
                <div class="am-modal-hd" id="exlg-alert-title"></div>
                <div class="am-modal-bd" id="exlg-alert-message"></div>
                <div class="am-modal-footer">
                    <span class="am-modal-btn">确定</span>
                </div>
            </div></div>`).appendTo($(document.body))
        $(document.body).addClass("lg-alert-built")
        return false
        // Note: 阅读 Amaze UI 源码得出搞法
    }
    return true
}
*/
const lg_alert = uindow.show_alert
    ? (msg, title = "exlg 提醒您") => uindow.show_alert(title, msg)
    : (msg, title = "exlg 提醒您") => uindow.alert(title + "\n" + msg)

let csrf_token = null
const lg_post = (url, data) => $.ajax({
    url: url,
    data: data,
    headers: {
        "x-csrf-token": (csrf_token === null)?
            (csrf_token = $("meta[name=csrf-token]").attr("content")) : csrf_token,
        "content-type":"application/json"
    },
    method: "post",
})

const cs_get = ({url, onload, onerror = err => error(err)}) => GM_xmlhttpRequest({
    url: url,
    method: "GET",
    onload: onload,
    onerror: onerror
})

const springboard = (param, styl) => {
    const q = new URLSearchParams(); for (let k in param) q.set(k, param[k])
    const $sb = $(`
        <iframe id="exlg-${param.type}" src=" https://www.bilibili.com/robots.txt?${q}" style="${styl}" exlg="exlg"></iframe>
    `)
    log("Building springboard: %o", $sb[0])
    return $sb
}

const judge_problem = text => [
    /^AT[1-9][0-9]{0,}$/i,
    /^CF[1-9][0-9]{0,}[A-Z][0-9]?$/i,
    /^SP[1-9][0-9]{0,}$/i,
    /^P[1-9][0-9]{3,}$/i,
    /^UVA[1-9][0-9]{2,}$/i,
    /^U[1-9][0-9]{0,}$/i,
    /^T[[1-9][0-9]{0,}$/i
].some(re => re.test(text))

const register_badge = async () => {
    const parse_badge = (href, func_quit) => cs_get({
        url: href,
        onload: res => {
            let fres = -1
            const e = res.response
            const _operations = [
                {
                    errorcode: 0,
                    message: `"Succeed in creating a new badge!"`,
                    ontitle: "[exlg] 成功创建 badge",
                    onlog: "Successfully created a badge!"
                },
                {
                    errorcode: 1,
                    message: `"Wrong active code!"`,
                    ontitle: "无效激活码",
                    onlog: "Illegal Active Code"
                },
                {
                    errorcode: 2,
                    message: `"Sorry, but the active code has been used!"`,
                    ontitle: "激活码已被使用",
                    onlog: "Expired Active Code"
                },
                {
                    errorcode: 3,
                    message: `"Something went wrong!"`,
                    ontitle: "非法的 badge 内容",
                    onlog: "Illegal Badge Text"
                },
                {
                    errorcode: -1,
                    message: `Fuck CCF up`,
                    ontitle: "未知错误",
                    onlog: "注册 exlg-badge 时出现未知错误, 请联系开发人员"
                },
            ]
            _operations.forEach(f => {
                if(fres !== -1) return
                console.log(e === f.message, f.errorcode === -1, f)
                if (e === f.message || f.errorcode === -1) {
                    fres = f.errorcode
                    $("#exlg-dialog-title").html(f.errorcode ? `[Error] ${f.ontitle}` : f.ontitle)
                    log(f.errorcode ? `Illegal Operation in registering badge: ${f.onlog}(#${f.errorcode})` : f.onlog)
                    if(fres === -1 || ! fres) {
                        func_quit()
                        setTimeout(() => uindow.exlg_alert("badge 注册成功!", "exlg 提醒您"), 400)
                        return
                    }
                }
            })
        }
    })
    const title_text = "exlg badge 注册器 ver.5.0"
    uindow.exlg_alert(`<div class="exlg-update-log-text exlg-unselectable exlg-badge-page" style="font-family: Consolas;">
    <div style="text-align: center">
        <div style="display:inline-block;text-align: left;padding-top: 10px;">
            <div style="margin: 5px;"><span style="height: 1.5em;float: left;padding: .1em;width: 5em;">用户uid</span><input exlg-badge-register type="text" style="padding: .1em;" class="am-form-field exlg-badge-input" placeholder="填写用户名或uid" name="username"></div>
            <div style="margin: 5px;"><span style="height: 1.5em;float: left;padding: .1em;width: 5em;">激活码</span><input exlg-badge-register type="text" style="padding: .1em;" class="am-form-field exlg-badge-input" placeholder="您获取的激活码" name="username"></div>
            <div style="margin: 5px;margin-bottom: 20px;"><span style="height: 1.5em;float: left;padding: .1em;width: 5em;">badge</span><input exlg-badge-register type="text" style="margin-bottom: 10px;padding: .1em;" class="am-form-field exlg-badge-input" placeholder="您想要的badge" name="username"></div>
        </div>
        <br>
        <small>Powered by <s>Amaze UI</s> 自行研发，去他妈的 Amaze UI</small>
    </div>
</div>
    `, title_text, (func_quit) => {
        const $board = $("#exlg-container"), $input =$board.find("input"), $title = $board.find("#exlg-dialog-title")
        if (uindow._feInjection && lg_usr && lg_usr.uid && ! $input[0].value)
            $input[0].value = lg_usr.uid
        if (! ($input[0].value && $input[1].value && $input[2].value)) {
            $title.html("[Err] 请检查信息是否填写完整")
            setTimeout(() => $title.html(title_text), 1500)
            return
        }
        $.get("/api/user/search?keyword=" + $input[0].value, res => {
            if (! res.users[0]) {
                $title.html("[Err] 无法找到指定用户")
                setTimeout(() => $title.html(title_text), 1500)
            }
            else {
                $input[0].value = res.users[0].uid
                const badge_href = `https://service-cmrlfv7t-1305163805.sh.apigw.tencentcs.com/release/${$input[1].value}/${$input[0].value}/${$input[2].value}/`
                parse_badge(badge_href, func_quit)
            }
        })
    }, false)/*
    const $board = $("#exlg-alert, #lg-alert")
    const $btn = $board.find(".am-modal-btn")
    // Note: 重构一次，Date = 20211127 Time = 21:10
    const $cancel = $btn.clone().text("取消")
    const $submit = $btn.clone().text("确定").off("click")
    const $title = $("#exlg-alert-title, #lg-alert-title").on("click", () => $title.html(title_text)).addClass("exlg-unselectable")
    const $dimmer = $(".am-dimmer")
    console.log($board, $cancel, $submit, $dimmer, $title, $btn)
    const clear_foot = () => setTimeout(() => {
        console.log("tried to clear foot!")
        $cancel.remove()
        $submit.remove()
        $title.off("click").removeClass("exlg-unselectable")
        $dimmer.off("click")
        $btn.show()
    }, 200)
    if (uindow.show_alert)
        $(".am-dimmer").on("click", () => {
            clear_foot()
        })
    else
        $(".am-dimmer").off("click").on("click", () => {
            console.log("get dimmered.", $btn)
            $btn.click()
            clear_foot()
        })
    $btn.css("cssText", "display: none!important;")
    $cancel.on("click", () => {
        $btn.click()
        clear_foot()
    })
        .appendTo($btn.parent())
    $submit.on("click", ).appendTo($btn.parent())*/
}

// ==/Utilities==

// ==Modules==

const mod = {
    _: [],

    data: {},

    path_alias: [
        [ "",        ".*\\.luogu\\.(com\\.cn|org)" ],
        [ "dash",    "dash.exlg.cc"],
        [ "cdn",     "cdn.luogu.com.cn" ],
        [ "bili",    "www.bilibili.com" ],
        [ "tcs1",    "service-ig5px5gh-1305163805.sh.apigw.tencentcs.com" ],
        [ "tcs2",    "service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com" ],
        [ "tcs3",    "service-otgstbe5-1305163805.sh.apigw.tencentcs.com" ],
        [ "debug",   "localhost:1634" ],
        [ "ghpage",  "extend-luogu.github.io" ]
    ].map(([ alias, path ]) => [ new RegExp(`^@${alias}/`), path ]),

    path_dash_board: [
        "@dash/((index|bundle)(.html)?)?", "@ghpage/exlg-setting-new/((index|bundle)(.html)?)?", "@debug/exlg-setting/((index|bundle).html)?"
    ],

    reg: (name, info, path, data, func, styl) => {
        if (! Array.isArray(path)) path = [ path ]
        path.forEach((p, i) => {
            mod.path_alias.some(([ re, url ]) => {
                if (p.match(re))
                    return path[i] = p.replace(re, url + "/"), true
            })

            if (! p.endsWith("$")) path[i] += "$"
        })

        mod.data[name] = {
            ty: "object",
            lvs: {
                ...data,
                on: { ty: "boolean", dft: true }
            }
        }

        mod._.push({
            name, info, path, func, styl
        })
    },

    reg_pre : (name, info, path, data, pre, func, styl) => {
        mod.reg(name, info, path, data, func, styl)
        mod._.lastElem().pre = pre
    },

    reg_main: (name, info, path, data, func, styl) =>
        mod.reg("@" + name, info, path, data, arg => (func(arg), false), styl),

    reg_user_tab: (name, info, tab, vars, data, func, styl) =>
        mod.reg(
            name, info, "@/user/.*", data,
            arg => {
                const $tabs = $(".items")
                const work = () => {
                    if ((location.hash || "#main") !== "#" + tab) return
                    log(`Working user tab#${tab} mod: "${name}"`)
                    func({ ...arg, vars })
                }
                $tabs.on("click", work)
                work()
            }, styl
        ),

    reg_chore: (name, info, period, path, data, func, styl) => {
        if (typeof period === "string") {
            const num = + period.slice(0, -1), unit = {
                s: 1000,
                m: 1000 * 60,
                h: 1000 * 60 * 60,
                D: 1000 * 60 * 60 * 24
            }[ period.slice(-1) ]
            if (! isNaN(num) && unit) period = num * unit
            else error(`Parsing period failed: "${period}"`)
        }

        name = "^" + name
        data = {
            ...data,
            last_chore: { ty: "number", priv: true }
        }

        mod.reg(
            name, info, path, data,
            arg => {
                const last = sto[name].last_chore, now = Date.now()

                let nostyl = true
                if (arg.named || ! last || now - last > period) {
                    if (nostyl) {
                        GM_addStyle(styl)
                        nostyl = false
                    }
                    func(arg)
                    sto[name].last_chore = Date.now()
                }
                else log(`Pending chore: "${name}"`)
            }
        )
    },

    reg_board: (name, info, data, func, styl) => mod.reg(
        name, info, "@/", data,
        arg => {
            const icon_b = `
                <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 0 136.14 30.56">
                    <g transform="translate(1.755, 0)" fill="#00a0d8">
                        <g>
                            <path d="M5.02-33.80L34.56-33.80L34.07-28.62L16.96-28.62L15.93-21.92L31.97-21.92L31.48-16.74L14.85-16.74L13.82-8.42L31.97-8.42L31.48-3.24L2.43-3.24L6.59-31.75L5.02-33.80Z" transform="translate(-4.14, 33.9)"></path>
                            <path d="M7.34-32.29L5.78-33.80L16.63-33.80L21.33-25.00L27.54-32.78L26.51-33.80L38.93-33.80L25.49-18.79L34.78-3.24L24.41-3.24L19.76-12.58L11.99-3.24L1.62-3.24L15.12-18.79L7.34-32.29Z" transform="translate(27.23, 33.9)"></path>
                            <path d="M4.00-33.80L16.42-33.80L12.80-8.42L32.99-8.42L32.51-3.24L5.56-3.24Q4.00-3.24 3.21-4.27Q2.43-5.29 2.43-6.86L2.43-6.86L5.56-31.75L4.00-33.80Z" transform="translate(63.8, 33.9)"></path>
                            <path d="M38.83-33.80L37.80-25.00L27.43-25.00L27.92-28.62L15.50-28.62L12.91-8.42L25.33-8.42L25.87-14.63L22.73-19.82L36.72-19.82L34.67-3.24L5.62-3.24Q4.86-3.24 4.21-3.51Q3.56-3.78 3.10-4.27Q2.65-4.75 2.48-5.43Q2.32-6.10 2.54-6.86L2.54-6.86L6.16-33.80L38.83-33.80Z" transform="translate(95.6, 33.9)"></path>
                        </g>
                    </g>
            </svg>
            `
            let $board = $("#exlg-board")
            if (! $board.length)
                $board = $(`
                    <div class="lg-article" id="exlg-board" exlg="exlg"><h2>${icon_b} &nbsp;&nbsp;${GM_info.script.version}</h2></div>
                `)
                    .prependTo(".lg-right.am-u-md-4"),
                $board[0].firstChild.style["font-size"]="1em"
            func({ ...arg, $board: $(`<div></div>`).appendTo($board) })
        }, styl
    ),

    /**
     * @deprecated 请使用 reg_hook_new 来注册钩子
     */
    reg_hook: (name, info, path, data, func, hook, styl) => mod.reg(
        name, info, path, data,
        arg => {
            func(arg)
            $("body").bind("DOMNodeInserted", e => hook(e) && func(arg))
        }, styl
    ),

    reg_hook_new: (name, info, path, data, func, hook, darg, styl) => mod.reg(
        name, info, path, data,
        arg => {
            func({...arg, ...{ result: false, args: darg() }})
            $("body").bind("DOMNodeInserted", (e) => {
                const res = hook(e)
                return res.result && func({...arg, ...res})
            })
        }, styl
    ),

    find: name => mod._.find(m => m.name === name),
    find_i: name => mod._.findIndex(m => m.name === name),

    disable: name => { mod.find(name).on = false },
    enable: name => { mod.find(name).on = true },

    preload: name => {
        const exe = (m, named) => {
            if (! m) error(`Preloading named mod but not found: "${name}"`)
            log(`Preloading ${ named ? "named " : "" }mod: "${m.name}"`)
            m.pred = m.pre({ msto: sto[m.name], named })
        }

        const pn = location.href
        for (const m of mod._) {
            if (sto[m.name].on && m.path.some(re => new RegExp(re, "g").test(pn))) {
                m.willrun = true
                if ("pre" in m)
                    exe(m)
            }
        }
    },

    execute: name => {
        const exe = (m, named) => {
            if (! m) error(`Executing named mod but not found: "${name}"`)
            if (m.styl) GM_addStyle(m.styl)
            log(`Executing ${ named ? "named " : "" }mod: "${m.name}"`)
            try {
                if ("pred" in m)
                    return m.func({ msto: sto[m.name], named, pred: m.pred })
                return m.func({ msto: sto[m.name], named })
            }
            catch (err) {
                warn(err)
            }
        }
        if (name) {
            const m = mod.find(name)
            return exe(m, true)
        }

        for (const m of mod._) {
            m.on = sto[m.name].on
            if (m.willrun) {
                if (exe(m) === false) break
            }
        }
    }
}

mod.reg_main("springboard", "跨域跳板", [ "@bili/robots.txt?.*", "@/robots.txt?.*" ], null, () => {
    const q = new URLSearchParams(location.search)
    switch (q.get("type")) {
    case "update":
        document.write(`<iframe src="https://service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com/release/exlg-nextgen" exlg="exlg"></iframe>`)
        uindow.addEventListener("message", e => {
            e.data.unshift("update")
            uindow.parent.postMessage(e.data, "*")
        })
        break
    case "page":
        const url = q.get("url")
        if (! q.get("confirm") || confirm(`是否加载来自 ${url} 的页面？`))
            document.body.innerHTML = `<iframe src="${url}" exlg="exlg"></iframe>`
        break
    case "dash":
        break
    }
}, `
    iframe {
        border: none;
        display: block;
        width: 100%;
        height: 100%;
    }
    iframe::-webkit-scrollbar {
        display: none;
    }
`)

mod.reg_main("version-data", "版本数据", "@tcs2/release/exlg-nextgen", null, () =>
    uindow.parent.postMessage([ document.body.innerText ], "*")
)

mod.reg_main("dash-board", "控制面板", mod.path_dash_board, {
    msg: {
        ty: "object",
        priv: true,
        lvs: {
            queue: {
                ty: "array", itm: {
                    ty: "object", lvs: {
                        text: { ty: "string" },
                        id: { ty: "number" }
                    }
                }
            },
            last_id: { ty: "number", dft: 0 }
        }
    },
    lang: {
        ty: "enum", dft: "zh", vals: [ "zh", "en" ],
        info: [ "Language of descriptions in the dashboard", "控制面板提示语言" ]
    }
}, () => {
    const modules = [
        {
            name: "Modules",
            description: "功能",
            icon: "tunes",
            children: mod._
                .filter(m => ! m.name.startsWith("@"))
                .map(m => ({
                    rawName: m.name,
                    name: m.name.replace(/^[@^]/g, ""),
                    description: m.info,
                    settings: Object.entries(mod.data[m.name].lvs)
                        .filter(([ k, s ]) => k !== "on" && ! s.priv)
                        .map(([ k, s ]) => ({
                            name: k,
                            displayName: k.split("_").map(t => t.toInitialCase()).join(" "),
                            description: s.info,
                            type: { number: "SILDER", boolean: "CHECKBOX", string: "TEXTBOX", enum: "" }[s.ty],
                            ...(s.ty === "boolean" && { type: "CHECKBOX" }),
                            ...(s.ty === "number"  && { type: "SLIDER", minValue: s.min, maxValue: s.max, increment: s.step }),
                            ...(s.ty === "enum"    && { type: "SELECTBOX", acceptableValues: s.vals })
                        }))
                }))
        },
        {
            name: "Core",
            description: "核心",
            icon: "bug_report",
            children: mod._
                .filter(m => m.name.startsWith("@"))
                .map(m => ({
                    rawName: m.name,
                    name: m.name.replace(/^[@^]/g, ""),
                    description: m.info,
                    settings: Object.entries(mod.data[m.name].lvs)
                        .filter(([ k, s ]) => k !== "on" && ! s.priv)
                        .map(([ k, s ]) => ({
                            name: k,
                            displayName: k.split("_").map(t => t.toInitialCase()).join(" "),
                            description: s.info,
                            type: { number: "SILDER", boolean: "CHECKBOX", string: "TEXTBOX", enum: "" }[s.ty],
                            ...(s.ty === "boolean" && { type: "CHECKBOX" }),
                            ...(s.ty === "number"  && { type: "SLIDER", minValue: s.min, maxValue: s.max, increment: Math.ceil((s.max - s.min) / 50) }),
                            ...(s.ty === "enum"    && { type: "SELECTBOX", acceptableValues: s.vals })
                        }))
                }))
        },
    ]
    console.log(modules)
    uindow.guiStart(modules)
})

mod.reg_hook_new("dash-bridge", "控制桥", "@/.*", {
    source: {
        ty: "enum", vals: [ "exlg", "gh_index", "debug"], dft: "exlg",
        info: [ "The website to open when clicking the exlg button", "点击 exlg 按钮时打开的网页" ]
    },
    enable_rclick: {
        priv: true,
        ty: "boolean", dft: true,
        info:[ "Use Right Click to change source", "右键点击按钮换源" ]
    },
    latest_ignore: { // 最新忽略版本更新提示的版本
        ty: "string", dft: "0.0.0"
    }
}, ({ msto, args }) => {
    if ([ "exlg", "gh_index", "debug"].indexOf(msto.source) === -1) msto.source = "exlg"

    const create_window = ! args.parent().hasClass("mobile-nav-container")
    // console.log(create_window)
    const $spn = $(`<span id="exlg-dash-window" class="exlg-window" style="display: none;width: 300px;"></span>`).css("left", "-125px")
    const $btn = $(`<div id="exlg-dash" exlg="exlg">exlg</div>`)
        .prependTo(args)
        .css("backgroundColor", {
            exlg: "cornflowerblue",
            gh_index: "darkblue",
            debug: "steelblue"
            // gh_bundle: "darkslateblue"
        }[msto.source])
        .css("margin-top", args.hasClass("nav-container") ? "5px" : "0px")
    const _jump_settings = () => uindow.exlg.dash = uindow.open({
        exlg: "https://dash.exlg.cc/index.html",
        gh_index: "https://extend-luogu.github.io/exlg-setting-new/index.html",
        debug: "localhost:1634/dashboard",
    }[msto.source])
    if (msto.enable_rclick)
        $btn.bind("contextmenu", () => false)
            .on("mousedown", (e) => {
                if (! e.button)
                    _jump_settings()
                else if (e.button === 2) {
                    msto.source = {
                        exlg: "gh_index",
                        gh_index: "debug",
                        debug: "exlg",
                    }[msto.source]
                    $btn.css("backgroundColor", {
                        exlg: "cornflowerblue",
                        gh_index: "darkblue",
                        debug: "steelblue"
                    }[msto.source])
                }
            })
    else $btn.on("click", _jump_settings)

    if (create_window) {
        $spn.prependTo(args)
        let mondsh = false, monbrd = false
        $btn.on("mouseenter", () => {
            mondsh = true, $spn.show()
        }).on("mouseleave", () => {
            mondsh = false
            if (!monbrd) {
                setTimeout(() => {
                    if (!monbrd) $spn.hide()
                }, 200)
            }
        })
        $spn.on("mouseenter", () => { monbrd = true })
            .on("mouseleave", () => {
                monbrd = false
                if (! mondsh) $spn.hide()
            })

        $(`<h2 align="center" style="margin-top: 5px;margin-bottom: 10px;"><svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 0 136.14 30.56">
        <g transform="translate(1.755, 0)" fill="#00a0d8">
            <g>
                <path d="M5.02-33.80L34.56-33.80L34.07-28.62L16.96-28.62L15.93-21.92L31.97-21.92L31.48-16.74L14.85-16.74L13.82-8.42L31.97-8.42L31.48-3.24L2.43-3.24L6.59-31.75L5.02-33.80Z" transform="translate(-4.14, 33.9)"></path>
                <path d="M7.34-32.29L5.78-33.80L16.63-33.80L21.33-25.00L27.54-32.78L26.51-33.80L38.93-33.80L25.49-18.79L34.78-3.24L24.41-3.24L19.76-12.58L11.99-3.24L1.62-3.24L15.12-18.79L7.34-32.29Z" transform="translate(27.23, 33.9)"></path>
                <path d="M4.00-33.80L16.42-33.80L12.80-8.42L32.99-8.42L32.51-3.24L5.56-3.24Q4.00-3.24 3.21-4.27Q2.43-5.29 2.43-6.86L2.43-6.86L5.56-31.75L4.00-33.80Z" transform="translate(63.8, 33.9)"></path>
                <path d="M38.83-33.80L37.80-25.00L27.43-25.00L27.92-28.62L15.50-28.62L12.91-8.42L25.33-8.42L25.87-14.63L22.73-19.82L36.72-19.82L34.67-3.24L5.62-3.24Q4.86-3.24 4.21-3.51Q3.56-3.78 3.10-4.27Q2.65-4.75 2.48-5.43Q2.32-6.10 2.54-6.86L2.54-6.86L6.16-33.80L38.83-33.80Z" transform="translate(95.6, 33.9)"></path>
            </g>
        </g>
</svg></h2>`).appendTo($spn)
        const $bdiv = $(`<div id="exlg-windiv"></div>`).appendTo($spn)

        const _list = [
            { tag: "vers", title: "vers", buttons: [ ] },
            { tag: "source", title: "Source", buttons: [
                { col: "#66ccff", html: "JsDelivr", onclick: () => uindow.location.href = "https://cdn.jsdelivr.net/gh/extend-luogu/extend-luogu/extend-luogu.user.js" },
                { col: "#66ccff", html: "Raw", onclick: () => uindow.location.href = "https://github.com/extend-luogu/extend-luogu/raw/main/extend-luogu.user.js" },
                { col: "#66ccff", html: "FastGit", onclick: () => uindow.location.href = "https://hub.fastgit.org/extend-luogu/extend-luogu/raw/main/extend-luogu.user.js" }
            ] },
            { tag: "link", title: "Link", buttons: [
                { col: "#66ccff", html: "Web", onclick: () => uindow.location.href = "https://exlg.cc" },
                { col: "#666", html: `<a style="height: 8px;width: 8px;"><svg aria-hidden="true" height="12" viewBox="0 0 16 16" version="1.1" width="12" data-view-component="true" class="octicon octicon-mark-github">
                <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg></a>Github`, onclick: () => uindow.location.href = "https://github.com/extend-luogu/extend-luogu" },
                { col: "#66ccff", html: "aifadian", onclick: () => uindow.location.href = "https://afdian.net/@extend-luogu" }
            ] },
            { tag: "help", title: "Help", buttons: [
                { col: "#66ccff", html: "fx", onclick: () => uindow.location.href = "https://www.luogu.com.cn/blog/100250/extend-luogu-si-yong-zhi-na" },
                { col: "#66ccff", html: "int128", onclick: () => uindow.location.href = "https://www.luogu.com.cn/blog/NaCl7/extend-luogu-usage" },
                { col: "#66ccff", html: "用户协议", onclick: () => uindow.location.href = "https://www.luogu.com.cn/paste/3f7anw16" }
            ] },
            { tag: "lhyakioi", title: "badge", buttons: [ ] }
        ]
        _list.forEach((e) => {
            const $div = $(`<div id="${ e.tag }-div"><span class="exlg-windiv-left-tag">${ e.title }</span></div>`).appendTo($bdiv),
                $span = $("<span></span>").appendTo($div)
            e.buttons.forEach((btn) => {
                $(`<span class="exlg-windiv-btnspan"></span>`).append($(`<button class="exlg-windiv-btn" style="background-color: ${ btn.col };border-color: ${ btn.col };">${ btn.html }</button>`).on("click", btn.onclick)).appendTo($span)
            })
            if (e.title === "vers") {
                $span.append($(`<span id="version-text" style="min-width: 60%;"><span>${ GM_info.script.version }</span><span id="vers-comp-operator" style="margin-left: 10px;"></span><span id="latest-version" style="margin-left: 10px;"></span><span id="annoyingthings"></span></span>"`))
                const $check_btn = $(`<button class="exlg-windiv-btn" style="background-color: red;border-color: red;float: right;margin: 0 10px 0 0;">刷新</button>`),
                    $operator = $span.find("#vers-comp-operator"), $latest = $span.find("#latest-version"), $fuckingdots = $span.find("#annoyingthings")
                const _check = () => {
                    $("#exlg-update").remove()
                    springboard({ type: "update" }).appendTo($("body")).hide()
                    uindow.addEventListener("message", e => {
                        if (e.data[0] !== "update") return
                        e.data.shift()

                        const
                            latest = e.data[0],
                            version = GM_info.script.version,
                            op = version_cmp(version, latest)

                        const l = `Comparing version: ${version} ${op} ${latest}`
                        log(l)

                        $operator.html(op).css("color", { "<<": "#fe4c61", "==": "#52c41a", ">>": "#3498db" }[op])
                        $latest.html(latest)
                        $fuckingdots.html({ "<<": `<i class="exlg-icon exlg-info" name="有新版本"></i>`, ">>": `<i class="exlg-icon exlg-info" name="内测中！"></i>`}[op] || "").children().css("cssText", "position: absolute;display: inline-block;")
                        if (op === "<<" && version_cmp(msto.latest_ignore, latest) === "<<") {
                            const $ignore_vers = $(`<span style="color: red;margin-left: 30px;"><svg class="icon" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" width="24" height="24" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5446"><path d="M512 128c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384-172.3-384-384-384z m0 717.4c-183.8 0-333.4-149.6-333.4-333.4S328.2 178.6 512 178.6 845.4 328.2 845.4 512 695.8 845.4 512 845.4zM651.2 372.8c-9.9-9.9-25.9-9.9-35.8 0L512 476.2 408.6 372.8c-9.9-9.9-25.9-9.9-35.8 0-9.9 9.9-9.9 25.9 0 35.8L476.2 512 372.8 615.4c-9.9 9.9-9.9 25.9 0 35.8 4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4L512 547.8l103.4 103.4c4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4c9.9-9.9 9.9-25.9 0-35.8L547.8 512l103.4-103.4c9.9-9.9 9.9-25.9 0-35.8z" p-id="5447"></path></svg></span>`).on("click", () => {
                                msto.latest_ignore = latest
                                $ignore_vers.hide()
                            }).appendTo($fuckingdots)
                        }
                        if (op === "==") msto.latest_ignore = GM_info.script.version

                        if (uindow.novogui) uindow.novogui.msg(l)
                    })
                }
                $check_btn.on("click", _check).appendTo($span)
                // Note: TODO: 最后放一个按钮查找，加个最新版本忽略机制，每次忽略之后对于小于等于那个版本的都不管
                // Note: 如果不是最新版本，那么加2个按钮(弹窗通知，忽略，最后一个是查找)
                // Note: 版本老了红色，版本对了绿色，版本新了蓝色（指测试版
                // Note: 新版显示提示。
            }
            if (e.title === "badge") {
                $(`<input type="text" disabled="disabled" style="width: 60%;" />`).appendTo($span)
                $(`<button id="exlg-badge-btn" style="background-color: #ccc;border-color: #666;" class="exlg-windiv-btn" disabled="disabled">提交</button>`).appendTo($span)
            }
        })


    }
}, (e) => {
    const $tmp = $(e.target).find(".user-nav, .nav-container")
    if ($tmp.length) return { result: ($tmp.length), args: ($tmp[0].tagName === "DIV" ? $($tmp[0].firstChild) : $tmp) } // Note: 直接用三目运算符不用 if 会触发 undefined 的 tagName
    else return { result: 0 } // Note: 上一行的 div 判断是用来防止变成两行的
}, () => $("nav.user-nav, div.user-nav > nav, .nav-container"), `
    /* dash */
    #exlg-dash {
        margin-right: 5px;
        position: relative;
        display: inline-block;
        padding: 1px 10px 3px;
        color: white;
        border-radius: 6px;
        box-shadow: 0 0 7px dodgerblue;
        cursor: pointer;
    }
    #exlg-dash > .exlg-warn {
        position: absolute;
        top: -.5em;
        right: -.5em;
    }
    /* global */
    .exlg-icon::before {
        display: inline-block;
        width: 1.3em;
        height: 1.3em;
        margin-left: 3px;
        text-align: center;
        border-radius: 50%;
    }
    .exlg-icon:hover::after {
        display: inline-block;
    }
    .exlg-icon::after {
        display: none;
        content: attr(name);
        margin-left: 5px;
        padding: 0 3px;
        background-color: white;
        box-shadow: 0 0 7px deepskyblue;
        border-radius: 7px;
    }
    .exlg-icon.exlg-info::before {
        content: "i";
        color: white;
        background-color: deepskyblue;
        font-style: italic;
    }
    .exlg-icon.exlg-warn::before {
        content: "!";
        color: white;
        background-color: rgb(231, 76, 60);
        font-style: normal;
    }
    .exlg-unselectable {
        -webkit-user-select: none;
        -moz-user-select: none;
        -o-user-select: none;
        user-select: none;
    }
    :root {
        --exlg-azure:           #7bb8eb;
        --exlg-aqua:            #03a2e8;
        --exlg-indigo:          #3f48cb;
        --std-mediumturquoise:  #48d1cc;
        --std-cornflowerblue:   #6495ed;
        --std-dodgerblue:       #1e90ff;
        --std-white:            #fff;
        --std-black:            #000;
        --lg-gray:              #bbb;
        --lg-gray-2:            #7f7f7f;
        --lg-gray-3:            #6c757d;
        --lg-gray-4:            #414345;
        --lg-gray-5:            #333;
        --lg-gray-6:            #000000bf;
        --lg-blue:              #3498db;
        --lg-blue-button:       #0e90d2;
        --lg-blue-dark:         #34495e;
        --lg-blue-2:            #7cb5ecbf;
        --lg-green:             #5eb95e;
        --lg-green-dark:        #054310c9;
        --lg-green-light:       #5eb95e26;
        --lg-green-light-2:     #c9e7c9;
        --lg-yellow:            #f1c40f;
        --lg-orange:            #e67e22;
        --lg-red:               #e74c3c;
        --lg-red-light:         #dd514c26;
        --lg-red-light-2:       #f5cecd;
        --lg-red-button:        #dd514c;
        --lg-purple:            #8e44ad;
        --argon-indigo:         #5e72e4;
        --argon-red:            #f80031;
        --argon-red-button:     #f5365c;
        --argon-green:          #1aae6f;
        --argon-green-button:   #2dce89;
        --argon-cyan:           #03acca;
        --argon-yellow:         #ff9d09;
        --lg-red-problem:       #fe4c61;
        --lg-orange-problem:    #f39c11;
        --lg-yellow-problem:    #ffc116;
        --lg-green-problem:     #52c41a;
        --lg-blue-problem:      #3498db;
        --lg-purple-problem:    #9d3dcf;
        --lg-black-problem:     #0e1d69;
        --lg-gray-problem:      #bfbfbf;
    }
    .exlg-difficulty-color { font-weight: bold; }
    .exlg-difficulty-color.color-0 { color: rgb(191, 191, 191)!important; }
    .exlg-difficulty-color.color-1 { color: rgb(254, 76, 97)!important; }
    .exlg-difficulty-color.color-2 { color: rgb(243, 156, 17)!important; }
    .exlg-difficulty-color.color-3 { color: rgb(255, 193, 22)!important; }
    .exlg-difficulty-color.color-4 { color: rgb(82, 196, 26)!important; }
    .exlg-difficulty-color.color-5 { color: rgb(52, 152, 219)!important; }
    .exlg-difficulty-color.color-6 { color: rgb(157, 61, 207)!important; }
    .exlg-difficulty-color.color-7 { color: rgb(14, 29, 105)!important; }
    .exlg-window {
        position: absolute;
        top: 35px;
        left: 0px;
        z-index: 65536;
        display: none;
        width: 250px;
        height: 300px;
        padding: 5px;
        background: white;
        color: black;
        border-radius: 7px;
        box-shadow: rgb(187 227 255) 0px 0px 7px;
    }
    .exlg-windiv-left-tag {
        border-right: 1px solid #eee;
        height: 2em;
        width: 18%;
        margin-right: 5px;
        display: inline-block;
    }
    .exlg-windiv-btn {

        font-size: 0.9em;
        /*padding: 0.313em 1em;*/
        display: inline-block;
        flex: none;
        outline: 0;
        cursor: pointer;
        color: #fff;
        font-weight: inherit;
        line-height: 1.5;
        text-align: center;
        vertical-align: middle;
        background: 0 0;
        border-radius: 5px;
        border: 1px solid;
        margin: 5px 5px;

    }
`)

mod.reg_chore("update", "检查更新", "1D", mod.path_dash_board, null, () => {
    $("#exlg-update").remove()
    springboard({ type: "update" }).appendTo($("body")).hide()
    uindow.addEventListener("message", e => {
        if (e.data[0] !== "update") return
        e.data.shift()

        const
            latest = e.data[0],
            version = GM_info.script.version,
            op = version_cmp(version, latest)

        const l = `Comparing version: ${version} ${op} ${latest}`
        log(l)

        if (uindow.novogui) uindow.novogui.msg(l)
    })
})

// TODO
mod.reg("exlg-dialog-board", "exlg_公告板", "@/.*", {
    animation_speed: {
        ty: "enum", dft: ".4s", vals: [ "0s", ".2s", ".25s", ".4s" ],
        info: [ "Speed of Board Animation", "启动消失动画速度" ]
    },
    confirm_position: {
        ty: "enum", dft: "right", vals: [ "left", "right" ],
        info: [ "Position of Confirm Button", "确定按钮相对位置" ]
    }
}, ({ msto }) => {
    const $wrapper = $(`<div class="exlg-dialog-wrapper" id="exlg-wrapper" style="display: none;">
    <div class="exlg-dialog-container container-hide" id="exlg-container" style="${msto.animation_speed === "0s" ? "" : `transition: all ${ msto.animation_speed };` }">
     <div class="exlg-dialog-header">
      <span><strong id="exlg-dialog-title">我做东方鬼畜音mad，好吗</strong></span>
      <div id="header-right" onclick="" style="opacity: 0.5;"><svg class="icon" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5446"><path d="M512 128c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384-172.3-384-384-384z m0 717.4c-183.8 0-333.4-149.6-333.4-333.4S328.2 178.6 512 178.6 845.4 328.2 845.4 512 695.8 845.4 512 845.4zM651.2 372.8c-9.9-9.9-25.9-9.9-35.8 0L512 476.2 408.6 372.8c-9.9-9.9-25.9-9.9-35.8 0-9.9 9.9-9.9 25.9 0 35.8L476.2 512 372.8 615.4c-9.9 9.9-9.9 25.9 0 35.8 4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4L512 547.8l103.4 103.4c4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4c9.9-9.9 9.9-25.9 0-35.8L547.8 512l103.4-103.4c9.9-9.9 9.9-25.9 0-35.8z" p-id="5447"></path></svg></div>
     </div>
     <div class="exlg-dialog-body">
         <div id="exlg-dialog-content">

         </div>
     </div>
    </div>
   </div>`).appendTo($(document.body))
    const wait_time = {"0s": 0, ".2s": 100, ".25s": 250, ".4s": 400 }[msto.animation_speed]
    const wrapper = $wrapper[0], container = wrapper.firstElementChild,
        header = container.firstElementChild.firstElementChild.firstElementChild, content = container.lastElementChild.firstElementChild,
        close_btn = container.firstElementChild.lastElementChild
    const footer = document.createElement("div")
    footer.classList.add("exlg-dialog-footer")
    container.appendChild(footer)
    const btn_accept = document.createElement("button"), btn_cancel = document.createElement("button")
    // btn_accept.classList.add("exlg-dialog-btn-confirm")
    btn_accept.innerHTML = "确定"
    btn_cancel.innerHTML = "取消"
    btn_accept.classList.add("exlg-dialog-btn")
    btn_cancel.classList.add("exlg-dialog-btn")
    if (msto.confirm_position === "left")footer.appendChild(btn_cancel), footer.appendChild(btn_accept)
    else footer.appendChild(btn_accept), footer.appendChild(btn_cancel)
    uindow.exlg_dialog_board = {}
    uindow.exlg_dialog_board._ac_func = function () {}
    uindow.exlg_dialog_board.show_dialog = function() {
        wrapper.style.display="flex"
        setTimeout(() => {
            container.classList.remove("container-hide")
            container.classList.add("container-show")
        }, 50)
    }
    uindow.exlg_dialog_board.hide_dialog = function () {
        container.classList.add("container-hide")
        container.classList.remove("container-show")
        setTimeout(() => wrapper.style.display="none", wait_time)
        // header.innerHTML = "&nbsp;"
        // content.innerHTML = ""
    }
    uindow.exlg_dialog_board.accept_dialog = function () {
        uindow.exlg_dialog_board._ac_func(uindow.exlg_dialog_board.hide_dialog)
        if(uindow.exlg_dialog_board.autoquit) uindow.exlg_dialog_board.hide_dialog()
    }
    container.onclick = (e) => e.stopPropagation()
    close_btn.onclick = btn_cancel.onclick = () => uindow.exlg_dialog_board.hide_dialog()
    btn_accept.onclick =  () => uindow.exlg_dialog_board.accept_dialog()
    uindow.exlg_dialog_board.show_exlg_alert = function (text = "", title = "exlg 提醒您", onaccepted = () => {}, autoquit = true) {
        uindow.exlg_dialog_board.autoquit = autoquit
        uindow.exlg_dialog_board._ac_func = onaccepted
        header.innerHTML = title
        content.innerHTML = text
        uindow.exlg_dialog_board.show_dialog()
    }
    let _mouse_down_on_wrapper = false
    container.onmousedown = (e) => e.stopPropagation()
    wrapper.onmousedown = () => {
        _mouse_down_on_wrapper = true
    }
    wrapper.onmouseup = () => {
        if (_mouse_down_on_wrapper) uindow.exlg_dialog_board.hide_dialog()
        _mouse_down_on_wrapper = false
    }
    uindow.exlg_alert = uindow.exlg_dialog_board.show_exlg_alert
},`
/* input for our badge register */
input[exlg-badge-register] {
    outline: none;
    display: inline-block;
    width: auto;
    padding: 0.5em;
    /* font-size: 1.6rem; */
    line-height: 1.2;
    color: #555;
    vertical-align: middle;
    background-color: #fff;
    background-image: none;
    border: 1px solid #ccc;
    border-radius: 0;
    -webkit-appearance: none;
    -webkit-transition: border-color .15s ease-in-out,-webkit-box-shadow .15s ease-in-out;
    transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}
input[exlg-badge-register]:focus {
    border: 1px solid #3bb4f2;
}
body {
    margin: 0px;
}
.exlg-dialog-footer {
    bottom: 0px;
    position: absolute;
    right: 0px;
    padding: 10px 6px;
}
/*
.exlg-dialog-container.container-show:hover > .exlg-dialog-btn.exlg-dialog-btn-confirm {
    background: rgba(30, 140, 200, 0.80);
}
.exlg-dialog-btn.exlg-dialog-btn-confirm {
    background: rgba(30, 140, 200, 0.20);
}
*/
.exlg-dialog-container.container-show:hover > .exlg-dialog-btn {
    background: rgba(255, 255, 255, 0.80);
}
.exlg-dialog-btn {
    margin: 0px 4px;
    display: inline-block;
    float: right;
    color: #666;
    min-width: 75px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.20);
    padding: 7px 10px;
    border: 1px solid #ddd;
    border-radius: 3px;
}
.exlg-dialog-container.container-hide {
    opacity: 0;
}
.exlg-dialog-container.container-show:hover {
    background: rgba(250, 250, 250, 0.80);
    box-shadow: 0 2px 8px rgb(0 0 0 / 40%);
    opacity: 1;
}
.exlg-dialog-container {
    filter: blur(0);
    position: relative;
    opacity: 0.75;
    background: rgba(204, 204, 204, 0.20);
    width: 500px;
    min-height: 300px;
    border-radius: 5px;
    margin: 0 auto;
    box-shadow: 0 2px 8px rgb(0 0 0 / 25%);
    font-size: 16px;
    line-height: 1.5;
    /* transition: all .4s; */
    backdrop-filter: blur(20px);
}
.exlg-dialog-wrapper {
    position: fixed;
    left: 0px;
    top: 0px;
    background: rgba(0, 0, 0, 0);
    width: 100%;
    height: 100%;
    /* opacity: 0.2;*/
    /* vertical-align: middle; */
    align-items: center;
    display: table-cell;
}
.exlg-dialog-header {
    height: auto;
    border-bottom: 1px solid #eee;
    padding: 11px 20px;
}
.exlg-dialog-body {
    text-align: center;
    margin-bottom: 50px;
    padding: 20px 30px;
    padding-bottom: 10px;
}
#header-right {
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 5px;
    background: rgba(0, 0, 0, 0);
    color: red;
    right: 10px;
    top: 10px;
    text-align: center;
}
`)

mod.reg("update-log", "更新日志显示", "@/.*", {
    last_version: { ty: "string", priv: true },
}, ({ msto }) => {
    if (location.href.includes("blog")) return // Note: 如果是博客就退出
    const version = GM_info.script.version
    const fix_html = (str) => {
        let res = `<div class="exlg-update-log-text" style="font-family: ${sto["code-block-ex"].copy_code_font};">`
        str.split("\n").forEach(e => {
            res += `<div>${e.replaceAll(" ", "&nbsp;")}</div><br>`
        })
        return res + "</div>"
    }
    switch (version_cmp(msto.last_version, version)) {
    case "==":
        break
    case "<<":
        uindow.exlg_alert(fix_html(update_log), `extend-luogu ver. ${version} 更新日志`)
    case ">>":
        msto.last_version = version
    }
}, `
.exlg-update-log-text {
    overflow-x: auto;
    white-space: nowrap;
    text-align: left;
    border: 1px solid #dedede;
}
`)

const emt = {
    EMO: 1,
    TXT: 2
}
mod.reg("emoticon", "表情输入", [ "@/paste", "@/discuss/.*", "@/" ], {
    benben: { ty: "boolean", dft: true, info: ["Show in benben", "犇犇表情"] },
    show: { ty: "boolean", dft: true, info: ["Show in default", "是否默认显示表情栏"] },
    src: { ty: "enum", vals: ["图.tk", "github", "妙.tk", "啧.tk"], dft: "图.tk", info: ["Emoticon Source", "表情源"] },
    height_limit: { ty: "boolean", dft: true, info: ["Expand in default", "是否默认展开表情"] }
}, ({ msto }) => {
    const emo = [
        "kk", "jk", "se", "qq", "xyx", "xia", "cy", "ll", "xk", "qiao", "qiang", "ruo", "mg", "dx", "youl", "baojin", "shq", "lb", "lh", "qd", "fad", "dao", "cd", "kun", "px", "ts", "kl", "yiw", "dk",
        { name: [ "sto" ], slug: "gg", name_display: "sto", width: 40 },
        { name: [ "orz" ], slug: "gh", name_display: "orz", width: 40 },
        { name: [ "qwq" ], slug: "g5", name_display: "qwq", width: 40 },
        { name: [ "hqlm" ], slug: "l0", name_display: "火前留名" },
        { name: [ "sqlm" ], slug: "l1", name_display: "山前留名" },
        { name: [ "xbt" ], slug: "g1", name_display: "屑标题" },
        { name: [ "iee", "wee" ], slug: "g2", name_display: "我谔谔" },
        { name: [ "kg" ], slug: "g3", name_display: "烤咕" },
        { name: [ "gl" ], slug: "g4", name_display: "盖楼" },
        { name: [ "wyy" ], slug: "g6", name_display: "无意义" },
        { name: [ "wgzs" ], slug: "g7", name_display: "违规紫衫" },
        { name: [ "tt" ], slug: "g8", name_display: "贴贴" },
        { name: [ "jbl" ], slug: "g9", name_display: "举报了" },
        { name: [ "%%%", "mmm" ], slug: "ga", name_display: "%%%" },
        { name: [ "ngrb" ], slug: "gb", name_display: "你谷日爆" },
        { name: [ "qpzc", "qp", "zc" ], slug: "gc", name_display: "前排资瓷" },
        { name: [ "cmzz" ], slug: "gd", name_display: "臭名昭著" },
        { name: [ "zyx" ], slug: "ge", name_display: "致远星" },
        { name: [ "zh" ], slug: "gf", name_display: "祝好" },
    ].filter(e => msto.src !== "啧.tk" || typeof e !== "object").map((e, i) => {
        if (typeof(e) === "string")
            return {
                type: emt.EMO,
                name: [e],
                slug: (i >= 10) ? String.fromCharCode(0x61 + (i - 10)) : String.fromCharCode(0x30 + i)
            }
        return { type: emt.TXT, ...e }
    })

    const emo_url = (msto.src === "github") ?
        (({ slug }) => `//cdn.jsdelivr.net/gh/extend-luogu/extend-luogu/img/emoji/${slug}`) : ((msto.src === "啧.tk") ?
            (({ name }) => `//${msto.src}/${name[0]}`) :
            (({ slug }) => `//${msto.src}/${slug}`))

    if (msto.benben && location.pathname === "/") {
        const $txt = $("#feed-content"), txt = $txt[0]
        $("#feed-content").before("<div id='emo-lst'></div>")
        emo.forEach(m => {
            const $emo = $((m.type === emt.EMO)?
                `<button class="exlg-emo-btn" exlg="exlg"><img src="${emo_url(m)}" /></button>`
                :
                `<button class="exlg-emo-btn" exlg="exlg">${m.name_display}</button>`
            ).on("click", () => {
                const preval = txt.value
                const pselstart = txt.selectionStart
                const str1 = preval.slice(0, pselstart) + `![](${emo_url(m)})`
                txt.value = (str1 + preval.slice(txt.selectionEnd))
                txt.focus()
                txt.setSelectionRange(str1.length, str1.length)
            }
            ).appendTo("#emo-lst")
            if (m.width) $emo.css("width", m.width + "px")
            else if(m.type === emt.EMO) $emo.css("width", "40px")
            else $emo.css("width", "83px")
        })
        $("#feed-content").before("<br>")
    }
    const $menu = $(".mp-editor-menu"),
        $txt = $(".CodeMirror-wrap textarea")

    if (! $menu.length) return

    const $emo_menu = $menu.clone().addClass("exlg-emo")
    $menu.after($emo_menu)
    $emo_menu[0].innerHTML = ""

    $("<br />").appendTo($menu)
    $(".mp-editor-ground").addClass("exlg-ext")

    const $ground = $(".mp-editor-ground"), $show_hide = $menu.children().first().clone(true).addClass("exlg-unselectable"), $set_height = $menu.children().first().clone(true).addClass("exlg-unselectable")
    $menu.children().last().before($show_hide)
    $menu.children().last().before($set_height)
    $show_hide.children()[0].innerHTML = (msto.show) ? "隐藏" : "显示"
    if (msto.show) $emo_menu.addClass("exlg-show-emo"), $ground.addClass("exlg-show-emo")
    $show_hide.on("click", () => {
        $show_hide.children()[0].innerHTML = ["显示", "隐藏"][["隐藏", "显示"].indexOf($show_hide.children()[0].innerHTML)]
        $emo_menu.toggleClass("exlg-show-emo")
        $ground.toggleClass("exlg-show-emo")
        msto.show = ! msto.show
    })
    $set_height.children()[0].innerHTML = (msto.height_limit) ? "展开" : "收起"
    if (msto.height_limit) $emo_menu.addClass("exlg-show-emo-short"), $ground.addClass("exlg-show-emo-short")
    else $emo_menu.addClass("exlg-show-emo-long"), $ground.addClass("exlg-show-emo-long")
    $set_height.on("click", () => {
        $set_height.children()[0].innerHTML = ["收起", "展开"][["展开", "收起"].indexOf($set_height.children()[0].innerHTML)]
        $emo_menu.toggleClass("exlg-show-emo-short").toggleClass("exlg-show-emo-long")
        $ground.toggleClass("exlg-show-emo-short").toggleClass("exlg-show-emo-long")
        msto.height_limit = ! msto.height_limit
    })

    emo.forEach(m => {
        const $emo = $((m.type === emt.EMO)?
            `<button class="exlg-emo-btn" exlg="exlg"><img src="${emo_url(m)}" /></button>`
            :
            `<button class="exlg-emo-btn" exlg="exlg">${m.name_display}</button>`
        ).on("click", () => $txt
            .trigger("focus")
            .val(`![](${emo_url(m)})`)
            .trigger("input")
        ).appendTo($emo_menu)
        if (m.width) $emo.css("width", m.width + "px")
        else if(m.type === emt.EMO) $emo.css("width", "40px")
        else $emo.css("width", "83px")
    })
    $emo_menu.append("<div style='height: .35em'></div>")

    /*
    $txt.on("input", e => {
        if (e.originalEvent.data === "/")
            mdp.content = mdp.content.replace(/\/[0-9a-z]\//g, (_, emo_txt) =>
                `![](` + emo_url(emo.find(m => m.includes(emo_txt))) + `)`
            )
    })
    */
    // Hack: 监听输入/，类似qq的表情快捷键功能。但是锅了，所以删掉力
}, `
    .mp-editor-ground.exlg-ext.exlg-show-emo.exlg-show-emo-long {
        top: 8.25em !important;
    }
    .mp-editor-ground.exlg-ext.exlg-show-emo.exlg-show-emo-short {
        top: 4.75em !important;
    }
    .mp-editor-menu > br ~ li {
        position: relative;
        display: inline-block;
        margin: 0;
        padding: 5px 1px;
    }
    .mp-editor-menu.exlg-show-emo.exlg-show-emo-long {
        height: 6em !important;
        overflow: auto;
        background-color: #fff;
    }
    .mp-editor-menu.exlg-show-emo.exlg-show-emo-short {
        height: 2.5em !important;
        overflow: auto;
        background-color: #fff;
    }
    .exlg-emo-btn {
        position: relative;
        top: 0px;
        border: none;
        background-color: #eee;
        border-radius: .7em;
        margin: .1em;
        transition: all .4s;
        height: 2em;
    }
    .exlg-emo-btn:hover {
        background-color: #f3f3f3;
        top: -3px;
    }
    .exlg-emo, .exlg-ext {
        transition: all .15s;
    }
`)

mod.reg_user_tab("user-intro-ins", "主页指令", "main", null, null, () => {
    $(".introduction > *").each((_, e, $e = $(e)) => {
        const t = $e.text()
        let [ , , ins, arg ] = t.match(/^(exlg.|%)([a-z]+):([^]+)$/) ?? []
        if (! ins) return

        arg = arg.split(/(?<!!)%/g).map(s => s.replace(/!%/g, "%"))
        const $blog = $($(".user-action").children()[0])
        switch (ins) {
        case "html":
            $e.replaceWith($(`<p exlg="exlg">${ xss.process(arg[0]) }</p>`))
            break
        case "frame":
            $e.replaceWith(springboard(
                { type: "page", url: encodeURI(arg[0]), confirm: true },
                `width: ${ arg[1] }; height: ${ arg[2] };`
            ))
            break
        case "blog":
            if ($blog.text().trim() !== "个人博客") return
            $blog.attr("href", arg)
            $e.remove()
            break
        }
    })
}, `
    iframe {
        border: none;
        display: block;
    }
    iframe::-webkit-scrollbar {
        display: none;
    }
`)

const msg = {
    NOT_AT_PRACTICE_PAGE: -1,
    NONE: -2,
    COMMENT_TAG: -3,
    NOT_A_PROBLEM_ELEMENT: -4,
    ADD_COMPARE: 1
}
const brds = {
    SUBMITTED_PROBLEMS: 0,
    PASSED_PROBLEMS: 1
}
let last_ptr = -1, last_board = brds.SUBMITTED_PROBLEMS, cosflag = -1, ta = null, my = null
mod.reg_hook_new("user-problem-color", "题目颜色数量和比较", "@/user/[0-9]{0,}.*", {
    problem_compare: { ty: "boolean", strict: true, dft: true, info: ["AC compare", "AC题目比较"] }
}, ({ msto, args }) => {
    const color = [
        [ 191, 191, 191 ],
        [ 254, 76, 97 ],
        [ 243, 156, 17 ],
        [ 255, 193, 22 ],
        [ 82, 196, 26 ],
        [ 52, 152, 219 ],
        [ 157, 61, 207 ],
        [ 14, 29, 105 ]
    ]
    const func = async ($prb, _flag) => {
        if (ta === null) {
            const content = await lg_content(`/user/${ lg_usr.uid }`)
            ta = lg_dat.passedProblems, my = new Set()
            content.currentData.passedProblems.forEach((t, _) => my.add(t.pid))
        }
        let same = 0
        if (_flag) {
            const $ps = $prb[1]
            $ps.querySelectorAll("a").forEach((p, d) => {
                if (d < ta.length && my.has(ta[d].pid)) { // Note: d 在某些情况下会达到 ta.length
                    same ++
                    p.style.backgroundColor = "rgba(82, 196, 26, 0.3)"
                }
            })
        }

        $("#exlg-problem-count-1").html(`<span class="exlg-counter" exlg="exlg">${ ta.length } <> ${ my.size } : ${same}`
            + `<i class="exlg-icon exlg-info" name="ta 的 &lt;&gt; 我的 : 相同"></i></span>`)
    }
    const _color = id => `rgb(${color[id][0]}, ${color[id][1]}, ${color[id][2]})`
    if (typeof(args) === "object" && args.message === msg.ADD_COMPARE) {
        if ((! msto.problem_compare) || lg_dat.user.uid === lg_usr.uid) return
        func([114514, 1919810], false)
        return
    }
    args.forEach(arg => {
        if (arg.target.href === "javascript:void 0") return
        // console.log("arg: ",arg.target, arg)
        // if (! lg_dat[arg.board_id][arg.position])
        arg.target.style.color = _color([(arg.board_id ? lg_dat.passedProblems : lg_dat.submittedProblems)[arg.position].difficulty])
        if ((arg.board_id === brds.PASSED_PROBLEMS && arg.position === lg_dat.passedProblems.length - 1)
         || (lg_dat.passedProblems.length === 0 && arg.board_id === brds.SUBMITTED_PROBLEMS && arg.position === lg_dat.submittedProblems.length - 1)) { // Note: 染色染到最后一个
            $(".exlg-counter").remove()
            const gf = arg.target.parentNode.parentNode.parentNode.parentNode
            const $prb = [gf.firstChild.childNodes[2], gf.lastChild.childNodes[2]]

            for (let i = 0; i < 2; ++ i) {
                const $ps = $prb[i]
                const my = lg_dat[ [ "submittedProblems", "passedProblems" ][i] ]
                $ps.before($(`<span id="exlg-problem-count-${i}" class="exlg-counter" exlg="exlg">${ my.length }</span>`)[0])
            }

            if ((! msto.problem_compare) || lg_dat.user.uid === lg_usr.uid) return
            func($prb, true)
        }
    })
}, (e) => {
    if (location.hash !== "#practice") return { result: false, args: { message: msg.NOT_AT_PRACTICE_PAGE } }
    if ((! lg_dat.submittedProblems.length) && !lg_dat.passedProblems.length) {
        // console.log(e.target)
        if (e.target.className === "card padding-default") {
            if ($(e.target).children(".problems").length) {
                const my = lg_dat[ [ "submittedProblems", "passedProblems" ][cosflag] ]
                $(e.target.firstChild).after(`<span id="exlg-problem-count-${cosflag}" class="exlg-counter" exlg="exlg" style="margin-left: 5px">${ my.length }</span>`)
                if (++ cosflag > 1) return { result: true, args: { message: msg.ADD_COMPARE } }
            }
            else if($(e.target).children(".difficulty-tags").length) {
                cosflag = 0
            }
        }
        return { result: false, args: { message: msg.NONE } }
    }
    if (! e.target.tagName) return { result: false, args: { message: msg.COMMENT_TAG } }
    // console.log(last_ptr, last_board, e, e.target)
    // if (typeof(e.target) === "undefined") {
    //     console.log(e.target)
    // }
    if (e.target.tagName.toLowerCase() !== "a" || e.target.className !== "color-default" || e.target.href.indexOf("/problem/") === -1)
        return { result: false, args: { message: msg.NOT_A_PROBLEM_ELEMENT } }
    const gpid = o => (o ? o.pid : undefined)
    const tar = e.target,
        _onc = [gpid(lg_dat.submittedProblems[0]), gpid(lg_dat.passedProblems[0])].indexOf(tar.href.slice(33)),
        _onchange = !(_onc === -1)
    return {
        result: true,
        args: [{
            onchange: _onchange,
            board_id: (_onchange ? (last_board = _onc) : (last_board)),
            position: (_onchange ? (last_ptr = 0) : (++ last_ptr)),
            target: tar
        }]
    }
}, () => {
    // console.log(lg_dat.submittedProblems.length, lg_dat.passedProblems.length)
    if ((! lg_dat.submittedProblems.length) && !lg_dat.passedProblems.length) {
        $(".exlg-counter").remove()
        const $prb = $(".card.padding-default > .problems")
        for (let i = 0; i < 2; ++ i) {
            const $ps = $($prb[i])
            const my = lg_dat[ [ "submittedProblems", "passedProblems" ][i] ]
            $ps.before(`<span id="exlg-problem-count-${i}" class="exlg-counter" exlg="exlg">${ my.length }</span>`)
        }
        return { message: msg.ADD_COMPARE }
    }
    return []
},`
    .main > .card > h3 {
        display: inline-block;
    }
`)

mod.reg("benben", "全网犇犇", "@/", {
    source: {
        ty: "enum", dft: "o2", vals: [ "o2", "shy" ],
        info: [ "Switch the way of fetching benben", "切换全网犇犇获取方式" ]
    }
}, ({msto}) => {
    const color = {
        Gray: "gray",
        Blue: "bluelight",
        Green: "green",
        Orange: "orange lg-bold",
        Red: "red lg-bold",
        Purple: "purple lg-bold",
        Brown: "brown lg-bold",
    }
    const check_svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="%" style="margin-bottom: -3px;" exlg="exlg">
            <path d="M16 8C16 6.84375 15.25 5.84375 14.1875 5.4375C14.6562 4.4375 14.4688 3.1875 13.6562 2.34375C12.8125 1.53125 11.5625 1.34375 10.5625 1.8125C10.1562 0.75 9.15625 0 8 0C6.8125 0 5.8125 0.75 5.40625 1.8125C4.40625 1.34375 3.15625 1.53125 2.34375 2.34375C1.5 3.1875 1.3125 4.4375 1.78125 5.4375C0.71875 5.84375 0 6.84375 0 8C0 9.1875 0.71875 10.1875 1.78125 10.5938C1.3125 11.5938 1.5 12.8438 2.34375 13.6562C3.15625 14.5 4.40625 14.6875 5.40625 14.2188C5.8125 15.2812 6.8125 16 8 16C9.15625 16 10.1562 15.2812 10.5625 14.2188C11.5938 14.6875 12.8125 14.5 13.6562 13.6562C14.4688 12.8438 14.6562 11.5938 14.1875 10.5938C15.25 10.1875 16 9.1875 16 8ZM11.4688 6.625L7.375 10.6875C7.21875 10.8438 7 10.8125 6.875 10.6875L4.5 8.3125C4.375 8.1875 4.375 7.96875 4.5 7.8125L5.3125 7C5.46875 6.875 5.6875 6.875 5.8125 7.03125L7.125 8.34375L10.1562 5.34375C10.3125 5.1875 10.5312 5.1875 10.6562 5.34375L11.4688 6.15625C11.5938 6.28125 11.5938 6.5 11.4688 6.625Z"></path>
        </svg>
    `
    const check = lv => lv <= 3 ? "" : check_svg.replace("%", lv <= 5 ? "#5eb95e" : lv <= 7 ? "#3498db" : "#f1c40f")

    const oriloadfeed = uindow.loadFeed

    uindow.loadFeed = function () {
        if (uindow.feedMode==="all-exlg") {
            cs_get({
                url: (msto.source === "o2") ? (`https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121`) : (`https://bens.rotriw.com/api/list/proxy?page=${uindow.feedPage}`),
                onload: (res) => {
                    const e = JSON.parse(res.response)
                    e.forEach(m => $(`
                <li class="am-comment am-comment-primary feed-li" exlg="exlg">
                    <div class="lg-left">
                        <a href="/user/${ m.user.uid }" class="center">
                            <img src="https://cdn.luogu.com.cn/upload/usericon/${ m.user.uid }.png" class="am-comment-avatar">
                        </a>
                    </div>
                    <div class="am-comment-main">
                        <header class="am-comment-hd">
                            <div class="am-comment-meta">
                                <span class="feed-username">
                                    <a class="lg-fg-${ color[m.user.color] }" href="/user/${ m.user.uid }" target="_blank">
                                        ${ m.user.name }
                                    </a>
                                    <a class="sb_amazeui" target="_blank" href="/discuss/show/142324">
                                        ${ check(m.user.ccfLevel) }
                                    </a>
                                    ${ m.user.badge ? `<span class="am-badge am-radius lg-bg-${ color[m.user.color] }">${ m.user.badge }</span>` : "" }
                                </span>
                                ${ new Date(m.time * 1000).format("yyyy-mm-dd HH:MM") }
                                <a name="feed-reply">回复</a>
                            </div>
                        </header>
                        <div class="am-comment-bd">
                            <span class="feed-comment">
                                ${ marked(m.content) }
                            </span>
                        </div>
                    </div>
                </li>
            `)
                        .appendTo($("ul#feed"))
                        .find("a[name=feed-reply]").on("click", () => {
                            scrollToId("feed-content")
                            setTimeout(
                                () => $("textarea")
                                    .trigger("focus").val(` || @${ m.user.name } : ${ m.content }`)
                                    .trigger("input"),
                                50
                            )
                        })
                    )
                }
            })
            if (msto.source === "shy"){
                uindow.feedPage++
                $("#feed-more").children("a").text("点击查看更多...")
            }
        }
        else{
            oriloadfeed()
        }
    }

    const $sel = $(".feed-selector")
    $(`<li class="feed-selector" id="exlg-benben-selector" data-mode="all-exlg" exlg="exlg"><a style="cursor: pointer">全网动态</a></li>`)
        .appendTo($sel.parent())
        .on("click", e => {
            const $this = $(e.currentTarget)
            $sel.removeClass("am-active")
            $this.addClass("am-active")
            if (msto.source === "o2") {
                $("#feed-more").hide()
            }
            uindow.feedPage=1
            uindow.feedMode="all-exlg"
            $("li.am-comment").remove()

            uindow.loadFeed()
        })
})

mod.reg("rand-problem-ex", "随机跳题_ex", "@/", {
    exrand_difficulty: {
        ty: "tuple",
        lvs: [
            { ty: "boolean", dft: false, strict: true, repeat: 8 }
        ],
        priv: true
    },
    exrand_source: {
        ty: "tuple",
        lvs: [
            { ty: "boolean", dft: false, strict: true, repeat: 5 }
        ],
        priv: true
    }
}, ({msto}) => {
    const dif_list = [
        {
            text: "入门",
            color: "red",
            id: 1
        },
        {
            text: "普及-",
            color: "orange",
            id: 2
        },
        {
            text: "普及/提高-",
            color: "yellow",
            id: 3
        },
        {
            text: "普及+/提高",
            color: "green",
            id: 4
        },
        {
            text: "提高+/省选-",
            color: "blue",
            id: 5
        },
        {
            text: "省选/NOI-",
            color: "purple",
            id: 6
        },
        {
            text: "NOI/NOI+/CTSC",
            color: "black",
            id: 7
        },
        {
            text: "暂无评定",
            color: "gray",
            id: 0
        }
    ]
    const src_list = [
        {
            text: "洛谷题库",
            color: "red",
            id: "P"
        },
        {
            text: "Codeforces",
            color: "orange",
            id: "CF"
        },
        {
            text: "SPOJ",
            color: "yellow",
            id: "SP"
        },
        {
            text: "ATcoder",
            color: "green",
            id: "AT"
        },
        {
            text: "UVA",
            color: "blue",
            id: "UVA"
        }
    ]

    const func_jump_problem = (str) => { // Note: 跳转题目
        if (judge_problem(str)) str = str.toUpperCase()
        if (str === "" || typeof (str) === "undefined") uindow.show_alert("提示", "请输入题号")
        else location.href = "https://www.luogu.com.cn/problemnew/show/" + str
    }

    let mouse_on_board = false, mouse_on_dash = false

    // Note: 重新构建界面
    let $input = $("input[name='toproblem']")
    $input.after($input.clone()).remove()
    $input = $("input[name='toproblem']")

    let $jump = $(".am-btn[name='goto']")
    $jump.after($jump.clone()).remove()
    $jump = $(".am-btn[name='goto']")

    const $btn_list = $jump.parent()

    $(".am-btn[name='gotorandom']").text("随机")
    const $jump_exrand = $(`<button class="am-btn am-btn-success am-btn-sm" name="gotorandomex">随机ex</button>`).appendTo($btn_list)

    $jump.on("click", () => {
        if (/^[0-9]+.?[0-9]*$/.test($input.val())) $input.val("P" + $input.val())
        func_jump_problem($input.val())
    })
    $input.on("keydown", e => {
        if (e.keyCode === 13) $jump.click()
    })
    // Note: board
    const $board = $(`<span id="exlg-exrand-window" class="exlg-window" style="display: block;">
    <br>
    <ul></ul>
    </span>`).appendTo($btn_list).hide()
        .on("mouseenter", () => { mouse_on_board = true })
        .on("mouseleave", () => {
            mouse_on_board = false
            if (!mouse_on_dash) {
                $board.hide()
            } // Hack: 维护onboard
        })
    $(".lg-index-stat>h2").text("问题跳转 ").append($(`<div id="exlg-dash-0" class="exlg-rand-settings">ex设置</div>`))
    const $ul = $board.children("ul").css("list-style-type", "none")

    const $exrand_menu = $(`<div id="exlg-exrand-menu"></div>`).appendTo($ul)
    $("<br>").appendTo($ul)
    const $exrand_diff = $(`<div id="exlg-exrand-diff" class="smallbtn-list"></div>`).appendTo($ul)
    const $exrand_srce = $(`<div id="exlg-exrand-srce" class="smallbtn-list"></div>`).appendTo($ul).hide()

    const $entries = $.double((text) => $(`<div class="exlg-rand-settings exlg-unselectable exrand-entry">${text}</div>`).appendTo($exrand_menu), "题目难度", "题目来源")
    $entries[0].after($(`<span class="exlg-unselectable">&nbsp;&nbsp;</span>`))
    $entries[0].addClass("selected").css("margin-right", "38px")

    $.double(([$entry, $div]) => {
        $entry.on("click", () => {
            $(".exrand-entry").removeClass("selected")
            $entry.addClass("selected")
            $(".smallbtn-list").hide()
            $div.show()
        })
    }, [$entries[0], $exrand_diff], [$entries[1], $exrand_srce])

    $.double(([$parent, obj_list, msto_proxy]) => {
        const $lists = $.double(([classname, desctext]) => $(`<span class="${classname}">
        <span class="lg-small lg-inline-up exlg-unselectable">${desctext}</span>
        <br>
        </span>`).appendTo($parent), ["exrand-enabled", "已选择"], ["exrand-disabled", "未选择"])
        obj_list.forEach((obj, index) => {
            const $btn = $.double(($p) => $(`<div class="exlg-smallbtn exlg-unselectable">${obj.text}</div>`).css("background-color", `var(--lg-${obj.color}-problem)`).appendTo($p), $lists[0], $lists[1])
            $.double((b) => {
                $btn[b].on("click", () => {
                    $btn[b].hide()
                    $btn[1 - b].show()
                    msto_proxy[index] = !! b
                })
                if (msto_proxy[index] === (!! b)) $btn[b].hide()
            }, 0, 1)
        })
    }, [$exrand_diff, dif_list, msto.exrand_difficulty], [$exrand_srce, src_list, msto.exrand_source])

    $("#exlg-dash-0").on("mouseenter", () => {
        mouse_on_dash = true

        $.double(([$p, mproxy]) => {
            // Kill: const _$smalldash = [$p.children(".exrand-enabled").children(".exlg-smallbtn"), $p.children(".exrand-disabled").children(".exlg-smallbtn")]

            $.double(([jqstr, bln]) => {
                $p.children(jqstr).children(".exlg-smallbtn").each((i, e, $e = $(e)) => (mproxy[i] === bln) ? ($e.show()) : ($e.hide()))
            }, [".exrand-enabled", true], [".exrand-disabled", false])
        }, [$exrand_diff, msto.exrand_difficulty], [$exrand_srce, msto.exrand_source]) // Hack: 防止开两个页面瞎玩的情况
        $board.show() // Hack: 鼠标放在dash上开window
    })
        .on("mouseleave", () => {
            mouse_on_dash = false // Hack: 离开dash和board超过200ms直接关掉
            if (!mouse_on_board) {
                setTimeout(() => {
                    if (!mouse_on_board) $board.hide()
                }, 200)
            }
        })

    const exrand_poi = async () => { // Note: 异步写法（用到了lg_content）
        const result = $.double(([l, msto_proxy, _empty]) => {
            let g = []
            l.forEach((e, i) => {
                if (msto_proxy[i]) g.push(e.id)
            })
            if (!g.length) g = _empty
            return g[Math.floor(Math.random() * g.length)]
        }, [dif_list, msto.exrand_difficulty, [0, 1, 2, 3, 4, 5, 6, 7]], [src_list, msto.exrand_source, ["P"]])
        let res = await lg_content(`/problem/list?difficulty=${result[0]}&type=${result[1]}&page=1`)

        const
            problem_count = res.currentData.problems.count,
            page_count = Math.ceil(problem_count / 50),
            rand_page = Math.floor(Math.random() * page_count) + 1

        res = await lg_content(`/problem/list?difficulty=${result[0]}&type=${result[1]}&page=${rand_page}`)
        const
            list = res.currentData.problems.result,
            rand_idx = Math.floor(Math.random() * list.length),
            pid = list[rand_idx].pid
        location.href = `/problem/${pid}`
    }

    $jump_exrand.on("click", exrand_poi)
},`
.exlg-rand-settings {
    position: relative;
    display: inline-block;
    padding: 1px 5px 1px 5px;
    background-color: white;
    border: 1px solid #6495ED;
    color: cornflowerblue;
    border-radius: 6px;
    font-size: 12px;
    position: relative;
    top: -2px;
}
.exlg-rand-settings.selected {
    background-color: cornflowerblue;
    border: 1px solid #6495ED;
    color: white;
}
.exlg-rand-settings:hover {
    box-shadow: 0 0 7px dodgerblue;
}
.exlg-smallbtn {
    position: relative;
    display: inline-block;
    padding: 1px 5px 1px;
    color: white;
    border-radius: 6px;
    font-size: 12px;
    margin-left: 1px;
    margin-right: 1px;
}
.exrand-enabled{
    width: 49%;
    float: left;
}
.exrand-disabled{
    width: 49%;
    float: right;
}
`)

mod.reg_hook_new("code-block-ex", "代码块优化", "@/.*", {
    show_code_lang : { ty: "boolean", dft: true, strict: true, info: [ "Show Language Before Codeblocks", "显示代码块语言" ] },
    copy_code_position : { ty: "enum", vals: [ "left", "right" ], dft: "left", info: [ "Copy Button Position", "复制按钮对齐方式" ] },
    code_block_title : { ty: "string", dft: "源代码 - ${lang}", info: [ "Custom Code Title", "自定义代码块标题" ] },
    copy_code_font : { ty: "string", dft: "'Fira Code', Consolas, monospace", info: [ "Code Block Font", "代码块字体" ], strict: true },
    max_show_lines : { ty: "number", dft: -1, min: -1, max: 100, info: [ "Max Lines On Show", "代码块最大显示行数" ], strict: true }
},  ({ msto, args }) => {

    const isRecord = /\/record\/.*/.test(location.href)

    const langs = {
        c: "C", cpp: "C++", pascal: "Pascal", python: "Python", java: "Java", javascript: "JavaScript", php: "PHP", latex: "LaTeX"
    }

    const get_lang = $code => {
        let lang = "undefined"
        if (isRecord) return $($(".value.lfe-caption")[0]).text()
        if ($code.attr("data-rendered-lang")) lang = $code.attr("data-rendered-lang")
        else if ($code.attr("class")) $code.attr("class").split(" ").forEach(cls => {
            if (cls.startsWith("language-")) lang = cls.slice(9)
        })
        return langs[lang]
    }

    args.attr("exlg-copy-code-block", "")

    args.each((_, e, $pre = $(e)) => {
        if (e.parentNode.className === "mp-preview-content" || e.parentNode.parentNode.className === "mp-preview-area") return
        const $btn = isRecord
            ? ($pre.children(".copy-btn"))
            : $(`<div class="exlg-copy">复制</div>`)
                .on("click", () => {
                    if ($btn.text() !== "复制") return // Note: Debounce
                    $btn.text("复制成功").toggleClass("exlg-copied")
                    setTimeout(() => $btn.text("复制").toggleClass("exlg-copied"), 800)
                    GM_setClipboard($pre.text(), { type: "text", mimetype: "text/plain" })
                })

        const $code = $pre.children("code")
        $code.css("font-family", msto.copy_code_font || undefined)
        if (! $code.hasClass("hljs")) $code.addClass("hljs").css("background", "white")
        $btn.addClass(`exlg-copy-${msto.copy_code_position}`)

        const lang = get_lang($code)
        const title_text = ((msto.show_code_lang && lang) ? ( msto.code_block_title.replace("${lang}", lang)) : ("源代码"))
        const $title = isRecord ? $(".lfe-h3").text(title_text) : $(`<h3 class="exlg-code-title" style="width: 100%;">${title_text}</h3>`)

        if (! isRecord) $pre.before($title.append($btn))
    })
}, (e) => {
    const $tar = $(e.target).find("pre:has(> code:not(.cm-s-default)):not([exlg-copy-code-block])")
    return {
        result: $tar.length,
        args: $tar
    }
}, () => $("pre:has(> code:not(.cm-s-default)):not([exlg-copy-code-block])"), `
.exlg-copy {
    position: relative;
    display: inline-block;
    border: 1px solid #3498db;
    border-radius: 3px;
    background-color: rgba(52, 152, 219, 0);
    color: #3498db;
    font-family: -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", "Noto Sans", "Noto Sans CJK SC", "Noto Sans CJK", "Source Han Sans", "PingFang SC", "Segoe UI", "Microsoft YaHei", sans-serif;
    flex: none;
    outline: 0;
    cursor: pointer;
    font-weight: normal;
    line-height: 1.5;
    text-align: center;
    vertical-align: middle;
    background: 0 0;
    font-size: 12px;
    padding: 0 5px;
    margin-left: 1px;
}
.exlg-copy.exlg-copy-right {
    float: right;
}
.exlg-copy:hover {
    background-color: rgba(52, 152, 219, 0.1);
}
div.exlg-copied {
    background-color: rgba(52, 152, 219, 0.9)!important;
    color: white!important;
}
.copy-btn {
    font-size: .8em;
    padding: 0 5px;
}
.lfe-form-sz-middle {
    font-size: 0.875em;
    padding: 0.313em 1em;
}
.exlg-code-title {
    margin: 0;
    font-family: inherit;
    font-size: 1.125em;
    color: inherit;
}
`)

mod.reg_hook_new("rand-training-problem", "题单内随机跳题", "@/training/[0-9]+(#.*)?", {
    mode: { ty: "enum", vals: ["unac only", "unac and new", "new only"], dft : "unac and new", info: [
        "Preferences about problem choosing", "随机跳题的题目种类"
    ] }
}, ({ msto, args }) => {
    let ptypes = msto.mode.startsWith("unac") + msto.mode.endsWith("only") * (-1) + 2
    if (! args.length) return // Hack: 这一步明明 result 已经是 0 的情况下还把参数传进去了导致RE
    $(args[0].firstChild).clone(true)
        .appendTo(args)
        .text("随机跳题")
        .addClass("exlg-rand-training-problem-btn")
        .on("click", () => {
            const tInfo = lg_dat.training
            let candProbList = []

            tInfo.problems.some(pb => {
                if (tInfo.userScore.score[pb.problem.pid] === null) {
                    if (ptypes & 1)
                        candProbList.push(pb.problem.pid)
                }
                else if (tInfo.userScore.score[pb.problem.pid] < pb.problem.fullScore && (ptypes & 2))
                    candProbList.push(pb.problem.pid)
            })

            if (!tInfo.problemCount)
                return uindow.exlg_alert("题单不能为空")
            else if (!candProbList.length) {
                if (ptypes === 1)
                    return uindow.exlg_alert("您已经做完所有新题啦！")
                else if (ptypes === 2)
                    return uindow.exlg_alert("您已经订完所有错题啦！")
                else
                    return uindow.exlg_alert("您已经切完所有题啦！")
            }

            const pid = ~~ (Math.random() * 1.e6) % candProbList.length
            location.href = "https://www.luogu.com.cn/problem/" + candProbList[pid]
        })
}, (e) => {
    const $tmp = $(e.target).find("div.operation")
    return { result: $tmp.length > 0, args: $tmp }
}, () => $("div.operation"), `
.exlg-rand-training-problem-btn {
    border-color: rgb(52, 52, 52);
    background-color: rgb(52, 52, 52);
}
`)

mod.reg("tasklist-ex", "任务计划_ex", "@/", {
    auto_clear: { ty: "boolean", dft: true, info: ["Hide accepted problems", "隐藏已经 AC 的题目"] },
    rand_problem_in_tasklist: { ty: "boolean", dft: true, info: ["Random problem in tasklist", "任务计划随机跳题"]}
}, ({ msto }) => {
    /* const _$board = $("button[name=task-edit]").parent().parent() // Note: 如果直接$div:has(.tasklist-item) 那么当任务计划为空.. */
    let actTList = []
    $.each($("div.tasklist-item"), (_, prob, $e = $(prob)) => {
        const pid = $e.attr("data-pid")

        if (prob.innerHTML.search(/check/g) === -1) {
            if (msto.rand_problem_in_tasklist)
                actTList.push(pid)
        }
        if ($e.find("i").hasClass("am-icon-check")) $e.addClass("tasklist-ac-problem")
    })

    const $toggle_AC = $(`<div>[<a id="toggle-button">隐藏已AC</a>]</div>`)
    $("button[name=task-edit]").parent().after($toggle_AC)

    const $ac_problem = $(".tasklist-ac-problem")
    const $toggle = $("#toggle-button").on("click", () => {
        $ac_problem.toggle()
        $toggle.text([ "隐藏", "显示" ][ + (msto.auto_clear = ! msto.auto_clear) ] + "已 AC")
    })

    if (msto.auto_clear) $toggle.click()

    if (msto.rand_problem_in_tasklist) {
        let $btn = $(`<button name="task-rand" class="am-btn am-btn-sm am-btn-success lg-right">随机</button>`)
        $("button[name='task-edit']").before($btn)
        $btn.addClass("exlg-rand-tasklist-problem-btn")
            .click(() => {
                let tid = ~~ (Math.random() * 1.e6) % actTList.length
                location.href += `problem/${ actTList[tid] }`
            })
    }
}, `
.exlg-rand-tasklist-problem-btn {
    margin-left: 0.5em;
}
`)

mod.reg("dbc-jump", "双击题号跳题", "@/.*", null, () => {
    $(document).on("dblclick", e => {
        const pid = window.getSelection().toString().trim().toUpperCase()
        const url = e.ctrlkey
            ? $(".ops > a[href*=blog]").attr("href") + "solution-"
            : "https://www.luogu.com.cn/problem/"
        if (judge_problem(pid)) window.open(url + pid)
    })
})

mod.reg_pre("hide-solution", "隐藏题解", "@/problem/solution/.*", {
    hidesolu: { ty: "boolean", dft: false, info: ["Hide Solution", "隐藏题解"] }
}, async ({ msto }) => (msto.hidesolu) ? (GM_addStyle(".item-row { display: none; }")) : "memset0珂爱", null)

mod.reg_hook_new("back-to-contest", "返回比赛题单", [
    "@/problem/[A-Z0-9]+\\?contestId=[1-9][0-9]{0,}",
], null, ({ args }) => {
    const $info_rows = args.$info_rows, $pre = $(`<a class="exlg-back-to-contest"></a>`),
        cid = args.cid, pid = args.pid
    if ((! pid) || (! cid)) return
    $pre.attr("href", `/contest/${ cid }#problems`)
        .html(`<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="door-open" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="svg-inline--fa fa-door-open fa-w-20">
            <path data-v-450d4937="" data-v-303bbf52="" fill="currentColor" d="M624 448h-80V113.45C544 86.19 522.47 64 496 64H384v64h96v384h144c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16zM312.24 1.01l-192 49.74C105.99 54.44 96 67.7 96 82.92V448H16c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h336V33.18c0-21.58-19.56-37.41-39.76-32.17zM264 288c-13.25 0-24-14.33-24-32s10.75-32 24-32 24 14.33 24 32-10.75 32-24 32z"></path>
            </svg>返回列表`)
        .appendTo($info_rows)
}, (e) => {
    const tar = e.target, cid = lg_dat.contest.id,
        pid = lg_dat.problem.pid
    // console.log(e.target, tar.tagName, tar.href ? tar.href.slice(tar.href.indexOf("/record/list")): "", tar.style)
    // if (tar.tagName.toLowerCase() === "a" && (tar.href || "").includes("/record/list") && tar.href.slice(tar.href.indexOf("/record/list")) === `/record/list?pid=${ pid }&contestId=${ cid }`) console.log(tar, tar.parentNode)
    return { args: { cid, pid, $info_rows: $(tar.parentNode) } ,result: (tar.tagName.toLowerCase() === "a" && (tar.href || "").includes("/record/list") && tar.href.slice(tar.href.indexOf("/record/list")) === `/record/list?pid=${ pid }&contestId=${ cid }`) }
}, () => { return { cid: lg_dat.contest.id, pid: lg_dat.problem.pid, $info_rows: $(".info-rows").parent() } }, `
.exlg-back-to-contest {
    text-decoration: none;
    float: right;
    color: rgb(231, 76, 60);
}
.exlg-back-to-contest:hover {
    color: rgb(231, 76, 60);
}
`)

mod.reg("virtual-participation", "创建重现赛", "@/contest/[0-9]*(#.*)?", {
    vp_id: { ty: "string", dft: "0", priv: true },
    orig_dat: { ty: "object", priv: true, lvs: {
        st_tm: { ty: "number" },
        pids: { ty: "string" },
        scrs: { ty: "string" }
    }}
}, ({ msto }) => {
    if (lg_dat.contest.id.toString() === msto.vp_id) {
        warn("You cannot vp the virtual contest.")
        if (msto.orig_dat.st_tm <= cur_time(1000) && lg_dat.contestProblems.length === 0) {
            lg_post(`/fe/api/contest/editProblem/${msto.vp_id}`,
                `{
                    "pids":[${msto.orig_dat.pids}],
                    "scores":{${msto.orig_dat.scrs}}
                }`
            ).then(() => {
                alert("比赛即将开始，页面将自动重新加载")
                location.reload()
            })
        }
        return
    }
    if (lg_dat.contest.endTime > cur_time(1000)) {
        warn("Contest has not started or ended.")
        return
    }
    $("<button id='exlg-vp' class='lfe-form-sz-middle'>重现比赛</button>").appendTo($("div.operation"))
        .click(async () => {
            uindow.exlg_alert(`<div>
                <p>设置「${lg_dat.contest.name}」的重现赛
                <p>开始时间：<input type="date" id="vpTmDt"/> <input type="time" id="vpTmClk"/></p>
            </div><br>`, "创建重现赛", async () => {
                let pa = $("#vpTmDt")[0].value.split("-"), pb = $("#vpTmClk")[0].value.split(":")
                let st = new Date(pa[0], pa[1] - 1, pa[2], pb[0], pb[1], 0, 0) // Note: Date 要减一个月
                st = st.getTime() / 1000

                msto.orig_dat.pids = msto.orig_dat.scrs = ""
                msto.orig_dat.st_tm = st
                $.each(lg_dat.contestProblems, (id, vl) => {
                    if (id)
                        msto.orig_dat.pids += ",", msto.orig_dat.scrs += ","
                    msto.orig_dat.pids += "\"" + vl.problem.pid + "\"",
                    msto.orig_dat.scrs += `"${vl.problem.pid}": ${vl.problem.fullScore}`
                })

                let newc = (msto.vp_id === "0"), cdt = `{
                    "settings":{
                        "name": "Virtual Participation for ${lg_dat.contest.name}",
                        "description": ${JSON.stringify(lg_dat.contest.description)},
                        "visibilityType":5,
                        "invitationCodeType":1,
                        "ruleType":${lg_dat.contest.ruleType},
                        "startTime":${st},
                        "endTime":${st+lg_dat.contest.endTime - lg_dat.contest.startTime},
                        "rated":false,
                        "ratingGroup":null
                    },
                    "hostID":${lg_usr.uid}
                }`, resp = await lg_post(`/fe/api/contest/${newc ? "new" : ("edit/" + msto.vp_id)}`, cdt)
                switch (resp.status){
                case 200:
                    msto.vp_id = resp.id.toString()
                    break
                case 404:
                    msto.vp_id = (await lg_post(`/fe/api/contest/new`, cdt)).id.toString()
                    newc = true
                    break
                }
                await lg_post(`/fe/api/contest/editProblem/${msto.vp_id}`,`{"pids":[],"scores":{"P1000":100}}`)

                // Note: 自己创建的比赛自己不会自动加入
                if (newc) {
                    let pc = await lg_content(`/contest/edit/${msto.vp_id}`)
                    lg_post(`/fe/api/contest/join/${msto.vp_id}`, `{"code": "${pc.currentData.contest.joinCode}"}`)
                }
                location.href = `https://www.luogu.com.cn/contest/${msto.vp_id}`
            })
        })
}, `
#exlg-vp {
    margin-right: .5em;
    display: inline-block;
    flex: none;
    outline: 0;
    cursor: pointer;
    color: #fff;
    font-weight: inherit;
    line-height: 1.5;
    text-align: center;
    vertical-align: middle;
    background: 0 0;
    border-radius: 3px;
    border: 1px solid;
    border-color: #52c41a;
    background-color: #52c41a;
}
`)

mod.reg_hook_new("submission-color", "记录难度可视化", "@/record/list.*", null, async ({ args }) => {
    if (args && args.type === "show") {
        if ($("div.problem > div > a > span.pid").length && ! $(".exlg-difficulty-color").length) {
            const u = await lg_content(location.href)
            const dif = u.currentData.records.result.map((u) => u.problem.difficulty)
            $("div.problem > div > a > span.pid").each((i, e, $e = $(e)) => {
                $e.addClass("exlg-difficulty-color").addClass(`color-${dif[i]}`)
            })
        }
        return
    }
    if ($(".exlg-difficulty-color").length) return
    const u = await lg_content(location.href)
    const dif = u.currentData.records.result.map((u) => u.problem.difficulty)
    $(args.target).find("div.problem > div > a > span.pid").each((i, e, $e = $(e)) => {
        $e.addClass("exlg-difficulty-color").addClass(`color-${dif[i]}`)
    })
}, (e) => {
    const tar = e.target
    // console.log(e.target, tar.tagName)
    if (!tar || (! tar.tagName)) return { args: msg.COMMENT_TAG, result: false }
    if (tar.tagName.toLowerCase() === "a" && (tar.href || "").includes("/problem/")/* && judge_problem(tar.href.slice(tar.href.indexOf("/problem/") + 9))*/ && ` ${ tar.parentNode.parentNode.className } `.includes(" problem ")) { // Note: 如果是标签的话，查看它的父亲是否为最后一个。如果是，更新数据。对于其他的不管。
        if (! tar.parentNode.parentNode.parentNode.nextSibling) return { args: { type: "modified - update", target: tar.parentNode.parentNode.parentNode.parentNode }, result: true }
        else return { args: { type: "modified - not the last one.", target: null }, result: false }
    }
    return { args: { type: "modified - not that one.", target: null }, result: false }
}, () => { return { type: "show" } }, ``
)

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

    const cmds = {
        help: (cmd/* string*/) => {
            /* get the help of <cmd>. or list all cmds. */
            /* 获取 <cmd> 的帮助。空则列出所有。 */
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
        },
        cd: (path/* !string*/) => {
            /* jump to <path>, relative path is OK. */
            /* 跳转至 <path>，支持相对路径。 */
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
        },
        cdd: (forum/* !string*/) => {
            /* jump to the forum named <forum> of discussion. use all the names you can think of. */
            /* 跳转至名为 <forum> 的讨论板块，你能想到的名字基本都有用。 */
            const tar = [
                [ "relevantaffairs",    "gs", "gsq",    "灌水", "灌水区",               "r", "ra" ],
                [ "academics",          "xs", "xsb",    "学术", "学术版",               "a", "ac" ],
                [ "siteaffairs",        "zw", "zwb",    "站务", "站务版",               "s", "sa" ],
                [ "problem",            "tm", "tmzb",   "题目", "题目总版",             "p"       ],
                [ "service",            "fk", "fksqgd", "反馈", "反馈、申请、工单专版",      "se" ]
            ]
            forum = tar.find(ns => ns.includes(forum))?.[0]
            if (! tar) return cli_error`cdd: unknown forum "${forum}"`
            cmds.cd(`/discuss/lists?forumname=${forum}`)
        },
        cc: (name/* char*/) => {
            /* jump to [name], "h|p|c|r|d|i|m|n" stands for home|problem|contest|record|discuss|I myself|message|notification. or jump home. */
            /* 跳转至 [name]，"h|p|c|r|d|i|m|n" 代表：主页|题目|比赛|评测记录|讨论|个人中心|私信|通知。空则跳转主页。 */
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
            if (tar) cmds.cd(tar)
            else cli_error`cc: unknown target "${name}"`
        },
        mod: (action/* !string*/, name/* string*/) => {
            /* for <action> "enable|disable|toggle", opearte the mod named <name>. */
            /* 当 <action> 为 "enable|disable|toggle"，对名为 <name> 的模块执行对应操作：启用|禁用|切换。 */
            const i = mod.find_i(name)
            switch (action) {
            case "enable":
            case "disable":
            case "toggle":
                if (i < 0) return cli_error`mod: unknown mod "${name}"`
                sto[name].on = {
                    enable: () => true, disable: () => false, toggle: now => ! now
                }[action](sto[name].on)
                break
            default:
                return cli_error`mod: unknown action "${action}"`
            }
        },
        dash: (action/* !string*/) => {
            /* for <action> "show|hide|toggle", opearte the exlg dashboard. */
            /* 当 <action> 为 "show|hide|toggle", 显示|隐藏|切换 exlg 管理面板。 */
            if (! [ "show", "hide", "toggle" ].includes(action))
                return cli_error`dash: unknown action "${action}"`
            $("#exlg-dash-window")[action]()
        },
        lang: (lang/* !string*/) => {
            /* for <lang> "en|zh" switch current cli language. */
            /* 当 <lang> 为 "en|zh"，切换当前语言。 */
            try {
                msto.lang = lang
                cli_lang = cli_langs.indexOf(lang)
            }
            catch {
                return cli_error`lang: unknown language ${lang}`
            }
        },
        uid: (uid/* !integer*/) => {
            /* jumps to homepage of user whose uid is <uid>. */
            /* 跳转至 uid 为 <uid> 的用户主页。 */
            location.href = `/user/${uid}`
        },
        un: (name/* !string*/) => {
            /* jumps to homepage of user whose username is like <name>. */
            /* 跳转至用户名与 <name> 类似的用户主页。 */
            $.get("/api/user/search?keyword=" + name, res => {
                if (! res.users[0])
                    cli_error`un: unknown user "${name}".`
                else
                    location.href = "/user/" + res.users[0].uid
            })
        }
    }
    for (const f of Object.values(cmds)) {
        [ , f.arg, f.help ] = f.toString().match(/^\((.*?)\) => {((?:\n +\/\*.+?\*\/)+)/)
        f.arg = f.arg.split(", ").map(a => {
            const [ , name, type ] = a.match(/([a-z_]+)\/\* (.+)\*\//)
            return {
                name, essential: type[0] === "!", type: type.replace(/^!/, "")
            }
        })
        f.help = f.help.trim().split("\n").map(s => s.match(/\/\* (.+) \*\//)[1])
    }
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
        f(...tk)
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

// FIXME codeblock-ex

mod.reg_board("search-user", "查找用户名", null, ({ $board }) => {
    $board.html(`
        <h3>查找用户</h3>
        <div class="am-input-group am-input-group-primary am-input-group-sm">
            <input type="text" class="am-form-field" placeholder="例：kkksc03，可跳转站长主页" name="username" id="search-user-input">
        </div>
        <p>
            <button class="am-btn am-btn-danger am-btn-sm" id="search-user">跳转</button>
        </p>
    `)
    const func = () => {
        $search_user.prop("disabled", true)
        $.get("/api/user/search?keyword=" + $("[name=username]").val().replace(/\s/g, ""), res => {
            if (! res.users[0]) {
                $search_user.prop("disabled", false)
                lg_alert("无法找到指定用户")
            }
            else location.href = "/user/" + res.users[0].uid
        })
    }
    const $search_user = $("#search-user").on("click", func)
    $("#search-user-input").keydown(e => { e.key === "Enter" && func() })
})

mod.reg_board("benben-ranklist", "犇犇龙王排行榜", {
    show: { ty: "boolean", dft: true, info: ["Show in default", "是否默认展开"] }
},({ msto, $board })=>{
    // Note: Add the title.
    $board.html(`<h3 id="bb-rnklst-h2">犇犇排行榜 <span id="bb-rnklst-btn" class="bb-rnklst-span"> [<a>${ msto.show ? "收起" : "展开" }</a>]</span><span style="float: right;" class="bb-rnklst-span"> [<a id="refresh-bbrnk">刷新</a>]</span></h3><div style="display: ${ msto.show ? "block" : "none" }" id="bb-rnklst-div"></div>`)
    const $list = $board.find("#bb-rnklst-div"), $fbtn = $board.find("#bb-rnklst-btn > a").on("click", () => {
        msto.show = ! msto.show
        $fbtn.text(msto.show ? "收起" : "展开")
        $list.toggle()
    })
    const refresh = cs_get({
        url: `https://bens.rotriw.com/ranklist?_contentOnly=1`,
        onload: function(res) {
            // console.log($board, $list)
            // let s=`<h3 id="bb-rnklst-h2">犇犇排行榜 <span id="bb-rnklst-btn" class="bb-rnklst-span"> [<a>${ msto.show ? "收起" : "展开" }</a>]</span><span style="float: right;" class="bb-rnklst-span"> [<a id="refresh-bbrnk">刷新</a>]</span></h3>`
            $(JSON.parse(res.response)).each((index, obj) => {
                $(`<div class="bb-rnklst-${index + 1}">
                    <span class="bb-rnklst-ind${(index < 9) ? (" bb-top-ten") : ("")}">${index + 1}.</span>
                    <a href="https://bens.rotriw.com/user/${obj[2]}">${obj[1]}</a>
                    <span style="float: right;">共 ${obj[0]} 条</span>
                </div>`).appendTo($list)
            })
        }
    })
    $board.find("#refresh-bbrnk").on("click", () => { $list.html(""), refresh() })
    refresh()
},`
.bb-rnklst-1 > .bb-rnklst-ind {
    color: var(--lg-red);
    font-weight: 900;
}
.bb-rnklst-2 > .bb-rnklst-ind {
    color: var(--lg-orange);
    font-weight: 900;
}
.bb-rnklst-3 > .bb-rnklst-ind {
    color: var(--lg-yellow);
    font-weight: 900;
}
.bb-rnklst-ind.bb-top-ten {
    margin-right: 9px;
}
.bb-rnklst-span {
    font-size: 1em;font-weight: normal;
}
`)

mod.reg("discussion-save", "讨论保存", [ "@/discuss/\\d+(\\?page\\=\\d+)*$" ], {
    auto_save_discussion : { ty: "boolean", dft: false, strict: true, info: ["Discussion Auto Save", "自动保存讨论"] }
}, ({ msto }) => {
    const $btn = $(`<button class="am-btn am-btn-success am-btn-sm" name="save-discuss">保存讨论</button>`)
    $btn.on("click", () => {
        $btn.prop("disabled", true)
        $btn.text("保存中...")
        cs_get({
            url: `https://luogulo.gq/save.php?url=${window.location.href}`,
            onload: res => {
                if (res.status === 200) {
                    if (res.response === "success") {
                        log("Discuss saved")
                        $btn.text("保存成功")
                        setTimeout(() => {
                            $btn.text("保存讨论")
                            $btn.removeAttr("disabled")
                        }, 1000)
                    }
                    else {
                        log(`Discuss unsuccessfully saved, return data: ${ res.response }`)
                        $btn.text("保存失败")
                        $btn.toggleClass("am-btn-success").toggleClass("am-btn-warning")
                        setTimeout(() => {
                            $btn.text("保存讨论")
                            $btn.removeAttr("disabled")
                            $btn.toggleClass("am-btn-success").toggleClass("am-btn-warning")
                        }, 1000)
                    }
                }
                else {
                    log(`Fail to save discuss: ${res}`)
                    $btn.toggleClass("am-btn-success").toggleClass("am-btn-danger")
                    setTimeout(() => {
                        $btn.text("保存讨论")
                        $btn.removeAttr("disabled")
                        $btn.toggleClass("am-btn-success").toggleClass("am-btn-danger")
                    }, 1000)
                }
            },
            onerror: err => {
                log(`Error:${err}`)
                $btn.removeAttr("disabled")
            }
        })
    })
        .css("margin-top", "5px")
    const $btn2 = $(`<a class="am-btn am-btn-warning am-btn-sm" name="save-discuss" href="https://luogulo.gq/show.php?url=${location.href}">查看备份</a>`).css("margin-top", "5px")
    $("section.lg-summary").find("p").append($(`<br>`)).append($btn).append($("<span>&nbsp;</span>")).append($btn2)
    if (msto.auto_save_discussion) $btn.click()
},`
.am-btn-warning {
    border-color: rgb(255, 193, 22);
    background-color: rgb(255, 193, 22);
    color: #fff;
}
.am-btn-warning:hover {
    border-color: #f37b1d;
    background-color: #f37b1d;
    color: #fff;
}
.am-btn {
    outline: none;
}
`)

mod.reg_chore("sponsor-list", "获取标签列表", "1D", "@/.*", {
    tag_list: { ty: "string", priv: true }
}, ({ msto }) => {
    cs_get({
        url: `https://service-cmrlfv7t-1305163805.sh.apigw.tencentcs.com/release/get/0/0/`,
        onload: res => {
            msto["tag_list"] = decodeURIComponent(res.responseText)
        }
    })
})

mod.reg_chore("atdiff-fetch", "获取_AtCoder_难度", "10D", "@/problem/AT.*", {
    atdiff: { ty: "string", priv: true },
}, ({ msto }) => {
    let dif = {}
    cs_get({
        url: "https://kenkoooo.com/atcoder/resources/problem-models.json",
        onload: res => {
            let rdif = JSON.parse(res.responseText)
            for (let ky in rdif)
                dif[ky] = rdif[ky].difficulty
            msto.atdiff = JSON.stringify(dif)
        }
    })
})

mod.reg_pre("original-difficulty", "显示原始难度", ["@/problem/CF.*", "@/problem/AT.*"], {
    cf_src: { ty: "enum", dft: "codeforces.com", vals: [ "codeforces.com", "codeforces.ml" ], info: [
        "Codeforces problem source", "CF 题目源"
    ]},
}, async ({ msto }) => {
    return new Promise((resolve, reject) => {
        let pn = location.pathname.match(/(CF|AT)([0-9]|[A-Z])*$/g)[0].substring(2)
        if (location.pathname.includes("CF")) {
            let pid = pn.match(/^[0-9]*/g)[0], ops = pn.substring(pid.length)
            cs_get({
                url: `https://${msto.cf_src}/problemset/problem/${pid}/${ops}`,
                onload: res => {
                    const rv = $(res.responseText).find("span[title=Difficulty]").text().trim()
                    resolve(rv ? rv.substring(1) : undefined)
                },
                onerror: err => {
                    error(err)
                    reject(err)
                }
            })
        }
        else {
            let dif = JSON.parse(sto["^atdiff-fetch"].atdiff)
            let pid = lg_dat.problem.description.match(RegExp("^.{22}[-./A-Za-z0-9_]*"))[0].match(RegExp("[^/]*$"))
            if (!(pid in dif))
                resolve(undefined)
            else
                resolve(Math.round(dif[pid] >= 400 ? dif[pid] : 400 / Math.exp(1.0 - dif[pid] / 400)))
        }
    })
},({ pred }) => {
    let x = document.querySelectorAll("div.field"), y = x[3].cloneNode(true)
    x[3].after(y)
    let t = y.querySelectorAll("span")
    t[0].innerText = "原始难度"
    t[1].innerText = "获取中"
    pred.then(d => {
        if (d === undefined)
            d = "不可用"
        t[1].innerText = d
    })
})

mod.reg_hook_new("sponsor-tag", "标签显示", [ "@/", "@/paste", "@/discuss/.*", "@/problem/.*", "@/ranking.*" ], {
    tag_list: { ty: "string", priv: true }
}, ({ args }) => {
    // $("span.wrapper:has(a[target='_blank'][href]) > span:has(a[target='_blank'][href]):not(.hover):not(.exlg-sponsor-tag)").addClass("exlg-sponsor-tag") // Note: usernav的span大钩钩
    const tag_list = JSON.parse(sto["^sponsor-list"].tag_list)
    const add_badge = ($e) => {
        if (! $e || $e.hasClass("exlg-badge-username")) return
        if (! /\/user\/[1-9][0-9]{0,}/.test($e.attr("href"))) return
        $e.addClass("exlg-badge-username") // Note: 删掉这行会出刷犇犇的bug，一开始我以为每个元素被添加一次所以问题不大 但是事实证明我是傻逼
        const user_uid = $e.attr("href").slice("/user/".length), tag = tag_list[user_uid]
        if (! tag) return
        const $badge = $(user_uid === "100250" ? `<span class="am-badge am-radius lg-bg-red" style="margin-left: 4px;">${ tag }</span>` : `<span class="exlg-badge">${ tag }</span>`).off("contextmenu").on("contextmenu", () => false).on("mousedown", (e) => {
            if (e.button === 2) location.href = "https://www.luogu.com.cn/paste/asz40850"
            else if (e.button === 0) register_badge()
        })
        let $tar = $e
        if ($tar.next().length && $tar.next().hasClass("sb_amazeui")) $tar = $tar.next()
        if ($tar.next().length && $tar.next().hasClass("am-badge")) $tar = $tar.next()
        $tar.after($badge)
    }
    args.each((_, e) => add_badge($(e)))
}, (e) => {
    const $tmp = $(e.target).find("a[target='_blank'][href]")
    return {
        result: $tmp.length,
        args: $tmp
    }
}, () => $("a[target='_blank'][href]"),`
.exlg-badge {
    border-radius: 50px;
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 4px;
    padding-bottom: 4px;
    transition: all .15s;
    display: inline-block;
    min-width: 10px;
    font-size: 1em;
    font-weight: 700;
    background-color: mediumturquoise;
    color: #fff;
    line-height: 1;
    vertical-align: baseline;
    white-space: nowrap;
    cursor: pointer;
    margin-left: 2px;
    margin-right: 2px;
}
`)

mod.reg("mainpage-discuss-limit", "主页讨论个数限制", [ "@/" ], {
    max_discuss : { ty: "number", dft: 12, min: 4, max: 16, step: 1, info: [ "Max Discussions On Show", "主页讨论显示上限" ], strict: true }
}, ({ msto }) => {
    let $discuss
    if (location.href.includes("blog")) return // Note: 如果是博客就退出
    $(".lg-article").each((_, e, $e = $(e)) => {
        const title = e.childNodes[1]
        if (title && title.tagName.toLowerCase() === "h2" && title.innerText.includes("讨论"))
            $discuss = $e.children(".am-panel")
    })
    $discuss.each((i, e, $e = $(e)) => {
        if (i >= msto.max_discuss) $e.hide()
    })
})

mod.reg("user-css", "自定义样式表", ".*", {
    css: { ty: "string" }
}, ({ msto }) => GM_addStyle(msto.css)
)

if (location.host === "www.luogu.com.cn" && !/blog/g.test(location.href)) {
    if (/(\?|&)_contentOnly($|=)/g.test(location.search))
        error("Content-Only pages.")
    if (uindow._feInjection.code !== 200)
        error("Luogu failed to load. Exlg stops loading.")
    lg_dat = uindow._feInjection.currentData
    lg_usr = uindow._feInjection.currentUser
}
log("Exposing")

Object.assign(uindow, {
    exlg: {
        mod,
        log, error,
        springboard, version_cmp,
        lg_alert, lg_content, register_badge,
        TM_dat: {
            reload_dat: () => {
                raw_dat = null
                return load_dat(mod.data, {
                    map: s => {
                        s.root = ! s.rec
                        s.itmRoot = s.rec === 2
                    }
                })
            },
            type_dat, proxy_dat, load_dat, save_dat, clear_dat, raw_dat
        }
    },
    GM: {
        GM_info, GM_addStyle, GM_setClipboard, GM_xmlhttpRequest,
        GM_getValue, GM_setValue, GM_deleteValue, GM_listValues
    },
    $$: $, xss, marked
})

const init_sto = chance => {
    try {
        sto = uindow.exlg.TM_dat.sto = uindow.exlg.TM_dat.reload_dat()
    }
    catch(err) {
        if (chance) {
            lg_alert("存储代理加载失败，清存重试中……")
            clear_dat()
            init_sto(chance - 1)
        }
        else {
            lg_alert("失败次数过多，自闭中。这里建议联系开发人员呢。")
            throw err
        }
    }
}
init_sto(1)

mod.preload()

$(() => {
    log("Launching")
    mod.execute()
})
