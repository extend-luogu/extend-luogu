// ==UserScript==
// @name           extend-luogu
// @namespace      http://tampermonkey.net/
// @version        2.10.4
//
// @match          https://*.luogu.com.cn/*
// @match          https://*.luogu.org/*
// @match          https://www.bilibili.com/robots.txt?*
// @match          https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121
// @match          https://service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com/release/exlg-nextgen
// @match          https://service-otgstbe5-1305163805.sh.apigw.tencentcs.com/release/exlg-setting
// @match          https://extend-luogu.github.io/exlg-setting/*
// @match          http://localhost:1634/*
//
// @connect        tencentcs.com
// @connect        luogulo.gq
// @connect        bens.rotriw.com
//
// @require        https://cdn.luogu.com.cn/js/jquery-2.1.1.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/js-xss/0.3.3/xss.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/marked/2.0.1/marked.min.js
// @require        https://greasyfork.org/scripts/429255-tm-dat/code/TM%20dat.js?version=955951
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
const mdp = uindow.markdownPalettes
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

// ==Utilities==Functions==

let sto = null

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

const lg_content = url => new Promise((res, rej) =>
    $.get(url + (url.includes("?") ? "&" : "?") + "_contentOnly=1", data => {
        if (data.code !== 200) rej(`Requesting failure code: ${ res.code }.`)
        res(data)
    })
)

const lg_alert = uindow.show_alert
    ? msg => uindow.show_alert("exlg 提醒您", msg.replaceAll("\n", "<br />"))
    : msg => uindow.alert("exlg 提醒您\n" + msg)

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

// ==/Utilities==

// ==Modules==

const mod = {
    _: [],

    data: {},

    path_alias: [
        [ "",        "www.luogu.com.cn" ],
        [ "bili",    "www.bilibili.com" ],
        [ "cdn",     "cdn.luogu.com.cn" ],
        [ "tcs1",    "service-ig5px5gh-1305163805.sh.apigw.tencentcs.com" ],
        [ "tcs2",    "service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com" ],
        [ "tcs3",    "service-otgstbe5-1305163805.sh.apigw.tencentcs.com" ],
        [ "debug",   "localhost:1634" ],
        [ "ghpage",  "extend-luogu.github.io" ],
    ].map(([ alias, path ]) => [ new RegExp(`^@${alias}/`), path ]),

    path_dash_board: [
        "@tcs3/release/exlg-setting", "@debug/exlg-setting/((index|bundle).html)?", "@ghpage/exlg-setting/(index|bundle)(.html)?"
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
            if (! $board.length) $board = $(`
                <div class="lg-article" id="exlg-board" exlg="exlg"><h2>${icon_b}</h2></div>
            `)
                .prependTo(".lg-right.am-u-md-4")
            func({ ...arg, $board: $(`<div></div>`).appendTo($board) })
        }, styl
    ),

    reg_hook: (name, info, path, data, func, hook, styl) => mod.reg(
        name, info, path, data,
        arg => {
            func(arg)
            $("body").bind("DOMNodeInserted", e => hook(e) && func(arg))
        }, styl
    ),

    find: name => mod._.find(m => m.name === name),
    find_i: name => mod._.findIndex(m => m.name === name),

    disable: name => { mod.find(name).on = false },
    enable: name => { mod.find(name).on = true },

    execute: name => {
        const exe = (m, named) => {
            if (! m) error(`Executing named mod but not found: "${name}"`)
            if (m.styl) GM_addStyle(m.styl)
            log(`Executing ${ named ? "named " : "" }mod: "${m.name}"`)
            return m.func({ msto: sto[m.name], named })
        }
        if (name) {
            const m = mod.find(name)
            return exe(m, true)
        }

        const pn = location.href
        for (const m of mod._) {
            m.on = sto[m.name].on
            if (m.on && m.path.some(re => new RegExp(re, "g").test(pn))) {
                if (exe(m) === false) break
            }
        }
    }
}

mod.reg_main("springboard", "跨域跳板", [ "@bili/robots.txt?.*", "@/robots.txt?.*" ], null, () => {
    const q = new URLSearchParams(location.search)
    switch (q.get("type")) {
    // Note: ->
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
    // Note: <-
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

mod.reg_hook("dash-bridge", "控制桥", "@/.*", {
    source: { ty: "enum", vals: [ "tcs", "debug", "gh_index", "gh_bundle" ], dft: "tcs" }
}, ({ msto }) => {
    const source = msto.source
    $(`<div id="exlg-dash" exlg="exlg">exlg</div>`)
        .prependTo($("nav.user-nav, div.user-nav > nav"))
        .css("backgroundColor", {
            tcs: "cornflowerblue",
            debug: "steelblue",
            gh_index: "darkblue",
            gh_bundle: "darkslateblue"
        }[source])
        .on("click", () => uindow.exlg.dash = uindow.open({
            tcs: "https://service-otgstbe5-1305163805.sh.apigw.tencentcs.com/release/exlg-setting",
            debug: "localhost:1634/dashboard",
            gh_index: "https://extend-luogu.github.io/exlg-setting/index.html",
            gh_bundle: "https://extend-luogu.github.io/exlg-setting/bundle.html",
        }[source]))
}, () => $(".user-nav").length && !$("#exlg-dash").length, `
    /* dash */
    #exlg-dash {
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
`)

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
    }
}, () => {
    const novogui_modules = [
        {
            name: "modules",
            displayName: "Modules",
            children: mod._.map(m => ({
                rawName: m.name,
                name: m.name.replace(/^[@^]/g, ""),
                description: m.info,
                settings: Object.entries(mod.data[m.name].lvs)
                    .filter(([ k, s ]) => k !== "on" && ! s.priv)
                    .map(([ k, s ]) => ({
                        name: k,
                        displayName: k.split("_").map(t => t.toInitialCase()).join(" "),
                        type: { number: "SILDER", boolean: "CHECKBOX", string: "TEXTBOX", enum: "" }[s.ty],
                        ...(s.ty === "boolean" && { type: "CHECKBOX" }),
                        ...(s.ty === "number"  && { type: "SLIDER", minValue: s.min, maxValue: s.max, increment: Math.ceil((s.max - s.min) / 50) }),
                        ...(s.ty === "enum"    && { type: "SELECTBOX", acceptableValues: s.vals })
                    }))
            }))
        }
    ]
    uindow.novogui.init(novogui_modules)
})

mod.reg_chore("update", "检查更新", "1D", mod.path_dash_board, null, () => {
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

        uindow.novogui.msg(l)
    })
})

// TODO
mod.reg("update-log", "更新日志显示", "@/", {
    last_version: { ty: "string", priv: true }
}, ({ msto }) => {
    const version = GM_info.script.version
    switch (version_cmp(msto.last_version, version)) {
    case "==":
        break
    case "<<":
        lg_alert(`新 VER ${version}\n` + "更新日志功能正在维修中……")
    case ">>":
        msto.last_version = version
    }
})

mod.reg("emoticon", "表情输入", [ "@/discuss/lists", "@/discuss/show/.*" ], {
    show: { ty: "boolean", dft: true }
}, () => {
    const emo = [
        { type: "emo", name: [ "kk" ], slug: "0" },
        { type: "emo", name: [ "jk" ], slug: "1" },
        { type: "emo", name: [ "se" ], slug: "2" },
        { type: "emo", name: [ "qq" ], slug: "3" },
        { type: "emo", name: [ "xyx" ], slug: "4" },
        { type: "emo", name: [ "xia" ], slug: "5" },
        { type: "emo", name: [ "cy" ], slug: "6" },
        { type: "emo", name: [ "ll" ], slug: "7" },
        { type: "emo", name: [ "xk" ], slug: "8" },
        { type: "emo", name: [ "qiao" ], slug: "9" },
        { type: "emo", name: [ "qiang" ], slug: "a" },
        { type: "emo", name: [ "ruo" ], slug: "b" },
        { type: "emo", name: [ "mg" ], slug: "c" },
        { type: "emo", name: [ "dx" ], slug: "d" },
        { type: "emo", name: [ "youl" ], slug: "e" },
        { type: "emo", name: [ "baojin" ], slug: "f" },
        { type: "emo", name: [ "shq" ], slug: "g" },
        { type: "emo", name: [ "lb" ], slug: "h" },
        { type: "emo", name: [ "lh" ], slug: "i" },
        { type: "emo", name: [ "qd" ], slug: "j" },
        { type: "emo", name: [ "fad" ], slug: "k" },
        { type: "emo", name: [ "dao" ], slug: "l" },
        { type: "emo", name: [ "cd" ], slug: "m" },
        { type: "emo", name: [ "kun" ], slug: "n" },
        { type: "emo", name: [ "px" ], slug: "o" },
        { type: "emo", name: [ "ts" ], slug: "p" },
        { type: "emo", name: [ "kl" ], slug: "q" },
        { type: "emo", name: [ "yiw" ], slug: "r" },
        { type: "emo", name: [ "dk" ], slug: "s" },
        { type: "txt", name: [ "hqlm" ], slug: "l0", name_display: "火前留名" },
        { type: "txt", name: [ "sqlm" ], slug: "l1", name_display: "山前留名" },
        { type: "txt", name: [ "xbt" ], slug: "g1", name_display: "屑标题" },
        { type: "txt", name: [ "iee", "wee" ], slug: "g2", name_display: "我谔谔" },
        { type: "txt", name: [ "kg" ], slug: "g3", name_display: "烤咕" },
        { type: "txt", name: [ "gl" ], slug: "g4", name_display: "盖楼" },
        { type: "txt", name: [ "qwq" ], slug: "g5", name_display: "QωQ" },
        { type: "txt", name: [ "wyy" ], slug: "g6", name_display: "无意义" },
        { type: "txt", name: [ "wgzs" ], slug: "g7", name_display: "违规紫衫" },
        { type: "txt", name: [ "tt" ], slug: "g8", name_display: "贴贴" },
        { type: "txt", name: [ "jbl" ], slug: "g9", name_display: "举报了" },
        { type: "txt", name: [ "%%%", "mmm" ], slug: "ga", name_display: "%%%" },
        { type: "txt", name: [ "ngrb" ], slug: "gb", name_display: "你谷日爆" },
        { type: "txt", name: [ "qpzc", "qp", "zc" ], slug: "gc", name_display: "前排资瓷" },
        { type: "txt", name: [ "cmzz" ], slug: "gd", name_display: "臭名昭著" },
        { type: "txt", name: [ "zyx" ], slug: "ge", name_display: "致远星" },
        { type: "txt", name: [ "zh" ], slug: "gf", name_display: "祝好" },
        { type: "txt", name: [ "sto" ], slug: "gg", name_display: "sto" },
        { type: "txt", name: [ "orz" ], slug: "gh", name_display: "orz" },
    ]
    const emo_url = name => `//图.tk/${name}`
    const $menu = $(".mp-editor-menu"),
        $txt = $(".CodeMirror-wrap textarea")
    $("<br />").appendTo($menu)
    $(".mp-editor-ground").addClass("exlg-ext")

    emo.forEach(m => {
        $((m.type === "emo")?
            `<button class="exlg-emo-btn" exlg="exlg"><img src="${emo_url(m.slug)}" /></button>`
            :
            `<button class="exlg-emo-btn" exlg="exlg">${m.name_display}</button>`
        ).on("click", () => $txt
            .trigger("focus")
            .val(`![](${emo_url(m.slug)})`)
            .trigger("input")
        ).appendTo($menu)
    })
    $menu.append("<div style='height: .35em'></div>")

    $txt.on("input", e => {
        if (e.originalEvent.data === "/")
            mdp.content = mdp.content.replace(/\/[0-9a-z]\//g, (_, emo_txt) =>
                `![](` + emo_url(emo.find(m => m.includes(emo_txt))) + `)`
            )
    })
}, `
    .mp-editor-ground.exlg-ext {
        top: 6em !important;
    }
    .mp-editor-menu > br ~ li {
        position: relative;
        display: inline-block;
        margin: 0;
        padding: 5px 1px;
    }
    .mp-editor-menu {
        height: 6em !important;
        overflow: auto;
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

mod.reg_user_tab("user-problem-compare", "题目数量和比较", "practice", null, null, async () => {
    $(".exlg-counter").remove()
    $(".problems").each((i, ps, $ps = $(ps)) => {
        const my = uindow._feInjection.currentData[ [ "submittedProblems", "passedProblems" ][i] ]
        $ps.before($(`<span id="exlg-problem-count-${i}" class="exlg-counter" exlg="exlg">${ my.length }</span>`))
    })

    if (uindow._feInjection.currentData.user.uid === uindow._feInjection.currentUser.uid) return

    const my = await lg_content(`/user/${ uindow._feInjection.currentUser.uid }`)
    const ta = uindow._feInjection.currentData.passedProblems

    let same = 0
    const $ps = $($(".problems")[1])
    $ps.find("a").each((d, p, $p = $(p)) => {
        if (my.some(m => m.pid === ta[d].pid)) {
            same ++
            $p.css("backgroundColor", "rgba(82, 196, 26, 0.3)")
        }
    })
    $("#exlg-problem-count-1").html(`<span class="exlg-counter" exlg="exlg">${ ta.length } <> ${ my.length } : ${same}`
        + `<i class="exlg-icon exlg-info" name="ta 的 &lt;&gt; 我的 : 相同"></i></span>`)

}, `
    .main > .card > h3 {
        display: inline-block;
    }
`)

mod.reg_hook("user-problem-color", "题目颜色", "@/user/.*", null, () => {
    const color = [
        [ 191, 191, 191 ],
        [ 254, 76, 97 ],
        [ 243, 156, 17 ],
        [ 255, 193, 22 ],
        [ 82, 196, 26 ],
        [ 52, 152, 219 ],
        [ 157, 61, 207 ],
        [ 0, 0, 0 ]
    ]
    const $unrendered = $(".problems > span > a").not(".exlg")
    const $problem = $(".problems")
    const my = uindow._feInjection.currentData
    $unrendered.addClass("exlg")
    $unrendered.each((_, ps, $ps = $(ps)) => {
        if ($ps.parent().children().length !== 2) {
            const piece = $problem.first().find("a").index(ps) === -1 ? 1 : 0
            const index = [ $problem.first().find("a"), $problem.last().find("a") ][piece].index(ps)
            $ps.removeClass("color-default").addClass("am-badge").addClass("am-radius").css("color",
                "rgb(" + color[my[[ "submittedProblems", "passedProblems" ][piece]][index].difficulty].join(", ") + ")"
            )
        }
        else (
            $ps.removeClass("color-default").addClass("am-badge").addClass("am-radius")
        ).css("color", $ps.parent().children().first().css("color"))
    })

    if (uindow._feInjection.currentData.user.uid === uindow._feInjection.currentUser.uid) return
}, () => $(".problems > span > a").not(".exlg").length, `
    .main > .card > h3 {
        display: inline-block;
    }
`)

mod.reg("benben", "全网犇犇", "@/", null, () => {
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
    const check = lv => lv <= 3 ? "" : check_svg.replace("%", lv <= 5 ? "#5eb95e" : lv <= 8 ? "#3498db" : "#f1c40f")

    const oriloadfeed=unsafeWindow.loadFeed

    unsafeWindow.loadFeed = function (){
                if (unsafeWindow.feedMode=="all-exlg")
                {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: `https://bens.rotriw.com/api/list/proxy?page=${unsafeWindow.feedPage}`,
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
                        },
                        onerror: error
                    })
                    unsafeWindow.feedPage++
                    $('#feed-more').children('a').text('点击查看更多...')
                }
                else
                {
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

            //$("#feed-more").hide()
            unsafeWindow.feedPage=1
            unsafeWindow.feedMode="all-exlg"
            $("li.am-comment").remove()
            unsafeWindow.loadFeed()
        })
})

mod.reg("rand-problem-ex", "随机跳题ex", "@/", {
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
        .mouseenter(() => {mouse_on_board = true})
        .mouseleave(() => {
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

    $("#exlg-dash-0").mouseenter(() => {
        mouse_on_dash = true
        console.log(222)
        $.double(([$p, mproxy]) => {
            const $smalldash = [$p.children(".exrand-enabled").children(".exlg-smallbtn"), $p.children(".exrand-disabled").children(".exlg-smallbtn")]
            console.log($smalldash)
            $.double(([jqstr, bln]) => {
                $p.children(jqstr).children(".exlg-smallbtn").each((i, e, $e = $(e)) => (mproxy[i] === bln) ? ($e.show()) : ($e.hide()))
            }, [".exrand-enabled", true], [".exrand-disabled", false])
        }, [$exrand_diff, msto.exrand_difficulty], [$exrand_srce, msto.exrand_source]) // Hack: 防止开两个页面瞎玩的情况
        $board.show() // Hack: 鼠标放在dash上开window
    })
        .mouseleave(() => {
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
.exrand-enabled{
    width: 49%;
    float: left;
}
.exrand-disabled{
    width: 49%;
    float: right;
}
`)

mod.reg_hook("code-block-ex", "代码块优化", "@/.*", {
    show_code_lang : { ty: "boolean", dft: true, strict: true, info: ["Show Language Before Codeblocks", "显示代码块语言"] },
    copy_code_position : { ty: "enum", vals: ["left", "right"], dft: "left", info: ["Copy Button Position", "复制按钮对齐方式"] },
    code_block_title : { ty: "string", dft: "源代码 - ${lang}", info: ["Custom Code Title", "自定义代码块标题"] },
    copy_code_font : { ty: "string", dft: "Fira Code", strict: true }
},  ({ msto }) => {

    const isRecord = /\/record\/.*/.test(location.href)

    const langs = {
        c: "C", cpp: "C++", pascal: "Pascal", python: "Python", java: "Java", javascript: "Javascript", php: "PHP", latex: "Latex"
    }

    const get_lang = $code => {
        let lang = ""
        if (isRecord) return $($(".value.lfe-caption")[0]).text()
        if ($code.attr("data-rendered-lang")) lang = $code.attr("data-rendered-lang")
        else  $code.attr("class").split(" ").forEach(cls => {
            if (cls.startsWith("language-")) lang = cls.slice(9)
        })
        return langs[lang]
    }

    const $cb = $("pre:has(> code:not(.cm-s-default)):not([exlg-copy-code-block])").attr("exlg-copy-code-block", "")

    $cb.each((_, e, $pre = $(e)) => {
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

        if (! msto.show_code_lang) return
        const lang = get_lang($code)
        const $title = isRecord ? $(".lfe-h3") : $(`<h3 class="exlg-code-title" style="width: 100%;">源代码 </h3>`)
        if (lang) $title.text((msto.code_block_title.replace("${lang}", lang)) + (isRecord ? "" : " ")) // Note: record 不用加空格

        if (! isRecord) $pre.before($title.append($btn))
    })
}, () => ($("pre:has(> code:not(.cm-s-default)):not([exlg-copy-code-block])").length), `
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

mod.reg("rand-training-problem", "题单内随机跳题", "@/training/[0-9]+(#.*)?", {
    mode: { ty: "enum", vals: ["unac only", "unac and new", "new only"], dft : "unac and new", info: [
        "Preferences about problem choosing", "随机跳题的题目种类"
    ] }
}, ({ msto }) => {
    let ptypes = msto.mode.startsWith("unac") + msto.mode.endsWith("only") * (-1) + 2
    const $op = $("div.operation")
    $op.children("button").clone(true)
        .appendTo($op)
        .text("随机跳题")
        .addClass("exlg-rand-training-problem-btn")
        .on("click", () => {
            const tInfo = uindow._feInjection.currentData.training
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
                return lg_alert("题单不能为空")
            else if (!candProbList.length) {
                if (ptypes === 1)
                    return lg_alert("您已经做完所有新题啦！")
                else if (ptypes === 2)
                    return lg_alert("您已经订完所有错题啦！")
                else
                    return lg_alert("您已经切完所有题啦！")
            }

            const pid = ~~ (Math.random() * 1.e6) % candProbList.length
            location.href = "https://www.luogu.com.cn/problem/" + candProbList[pid]
        })
}, `
.exlg-rand-training-problem-btn {
    border-color: rgb(52, 52, 52);
    background-color: rgb(52, 52, 52);
}
`)

mod.reg("tasklist-ex", "任务计划ex", "@/", {
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

mod.reg("hide-solution", "隐藏题解", ["@/problem/solution/.*", "@/problem/[^list].*"], {
    hidesolu: { ty: "boolean", dft: false, info: ["Hide Solution", "隐藏题解"] }
}, ({ msto }) => (msto.hidesolu) ? ( (/\/problem\/solution\/.*/.match(location.href)) ? (location.href = location.href.replace("/solution", "")) : ($("a[href^='/problem/solution']").hide()) ) : "memset0珂爱")

mod.reg_hook("submission-color", "记录难度可视化", "@/record/list.*", null, async () => {
    if ($(".exlg-difficulty-color").length) return
    const u = await lg_content(location.href)
    const dif = u.currentData.records.result.map((u) => u.problem.difficulty)
    $("div.problem > div > a > span.pid").each((i, e, $e = $(e)) => {
        $e.addClass("exlg-difficulty-color").addClass(`color-${dif[i]}`)
    })
}, () => $("div.problem > div > a > span.pid").length && ! $(".exlg-difficulty-color").length
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
            /* jump to [name], "h|p|c|r|d|i|m|n" stands for home|problem|record|discuss|I myself|message|notification. or jump home. */
            /* 跳转至 [name]，"h|p|c|r|d|i|m|n" 代表：主页|题目|评测记录|讨论|个人中心|私信|通知。空则跳转主页。 */
            name = name || "h"
            const tar = {
                h: "/",
                p: "/problem/list",
                c: "/contest/list",
                r: "/record/list",
                d: "/discuss/lists",
                i: "/user/" + uindow._feInjection.currentUser.uid,
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
        $.get("/api/user/search?keyword=" + $("[name=username]").val(), res => {
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

mod.reg_board("benben-ranklist", "犇犇龙王排行榜",null,({ $board })=>{
    GM_xmlhttpRequest({
        method: "GET",
        url: `https://bens.rotriw.com/ranklist?_contentOnly=1`,
        onload: function(res) {
            let s="<h3>犇犇排行榜</h3>"
            s+="<div>"
            $(JSON.parse(res.response)).each((index, obj) => {
                s+=`<div class="bb-rnklst-${index + 1}">
                    <span class="bb-rnklst-ind${(index < 9) ? (" bb-top-ten") : ("")}">${index + 1}.</span>
                    <a href="https://bens.rotriw.com/user/${obj[2]}">${obj[1]}</a>
                    <span style="float: right;">共 ${obj[0]} 条</span>
                </div>`
            })
            s+="</div><br>"
            $board.html(s)
        }
    })
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
`)

mod.reg("discussion-save", "讨论保存", "@/discuss/show/.*", {
    auto_save_discussion : { ty: "boolean", dft: false, strict: true, info: ["Discussion Auto Save", "自动保存讨论"] }
}, ({msto}) => {
    const save_func = () => GM_xmlhttpRequest({
        method: "GET",
        url: `https://luogulo.gq/save.php?url=${window.location.href}`,
        onload: (res) => {
            if (res.status === 200) {
                log("Discuss saved")
            }
            else {
                log(`Fail: ${res}`)
            }
        },
        onerror: (err) => {
            log(`Error:${err}`)
        }
    })
    const $btn = $(`<button class="am-btn am-btn-success am-btn-sm" name="save-discuss">保存讨论</button>`).on("click", () => {
        $btn.prop("disabled", true)
        $btn.text("保存成功")
        save_func()
        setTimeout(() => {
            $btn.removeAttr("disabled")
            $btn.text("保存讨论")
        }, 1000)
    }).css("margin-top", "5px")
    const $btn2 = $(`<a class="am-btn am-btn-success am-btn-sm" name="save-discuss" style="border-color: rgb(255, 193, 22); background-color: rgb(255, 193, 22);color: #fff;" href="https://luogulo.gq/show.php?url=${location.href}">查看备份</a>`).css("margin-top", "5px")
    $("section.lg-summary").find("p").append($(`<br>`)).append($btn).append($("<span>&nbsp;</span>")).append($btn2)
    if (msto.auto_save_discussion) save_func()
})

mod.reg_chore("sponsor-list", "获取标签列表", "1D", "@/.*", {
    tag_list: { ty: "string", priv: true }
}, ({msto}) => {
    GM_xmlhttpRequest({
        method: "GET",
        url: `https://service-cmrlfv7t-1305163805.sh.apigw.tencentcs.com/release/get/0/0/`,
        onload: (res) => {
            msto["tag_list"] = decodeURIComponent(res.responseText)
        },
        onerror: (err) => {
            error(err)
        }
    })
})

mod.reg_hook("sponsor-tag", "标签显示", "@/.*", {
    tag_list: { ty: "string", priv: true }
}, () => {
    const isDiscuss = /\/discuss\/show\/.*/.test(location.href)
    $("span.wrapper:has(a[target='_blank'][href]) > span:has(a[target='_blank'][href]):not(.hover):not(.exlg-sponsor-tag)").addClass("exlg-sponsor-tag") // Note: usernav的span大钩钩
    const add_badge = ($e) => {
        if (!$e) return
        if (!$e.children("a[target='_blank'][href]").length) return
        const $name = $e.children("a[target='_blank'][href]")
        if (!$name.text().length) return
        const href = $name.attr("href")
        if (!href) return
        if (href.lastIndexOf(prefix) === 0) {
            const uid = href.substring(prefix.length)
            const tag = tag_list[uid]
            if (tag !== undefined) {
                $e.find(".exlg-badge").remove()
                if (isDiscuss) { // Note: discuss/show
                    (($e.children(".sb_amazeui").length) ? ($e.children(".sb_amazeui")) : ($e.children("a[target='_blank'][href]"))).after($(`<span class="exlg-badge">${tag}</span>`))
                }
                else if ($e[0].tagName === "H2") { // Note: h2处有一点点麻烦
                    $(`<span class="exlg-badge">${tag}</span>`).appendTo($e.addClass("exlg-sponsor-tag").children(":last-child"))
                }
                else $(`<span class="exlg-badge">${tag}</span>`).appendTo($e.addClass("exlg-sponsor-tag"))
            }
        }
        if (href !== "javascript:void 0") $e.addClass("exlg-sponsor-tag")
    }
    const tag_list = JSON.parse(sto["^sponsor-list"].tag_list),
        $users = $("span:has(a[target='_blank'][href]):not(.hover):not(.exlg-sponsor-tag)"),
        prefix = "/user/"
    add_badge($("h2:has(a[target='_blank'][href]):not(.exlg-sponsor-tag)"))
    if (isDiscuss) {
        $("div.am-comment-meta:has(a[target='_blank'][href]):not(.exlg-sponsor-tag)").each((_, e) => add_badge($(e)))
    }
    $users.each((_, e) => add_badge($(e)))
    /*
    const whref = window.location.href
    const hprefix = "https://www.luogu.com.cn/user/"
    if (whref.lastIndexOf(hprefix) === 0) {
        const uid = whref.substring(hprefix.length).split("#")[0],
            tag = tag_list[uid],
            $title = $("div.user-name").not(".exlg-sponsor-tag")
        if (tag !== undefined) {
            $(`<span class="exlg-badge">${tag}</span>`).appendTo(
                $title.addClass("exlg-sponsor-tag")
            )
        }
    }
    */
}, (e) => {
    return false // Hack: 严重的bug必须修掉, 但是先暂时这样了
    return (!($(e.target).hasClass("exlg-badge"))) &&
    ($("span:has(a[target='_blank'][href]):not(.hover):not(.exlg-sponsor-tag)").length || (/\/discuss\/show\/.*/.test(location.href) && $("div.am-comment-meta:has(a[target='_blank'][href]):not(.exlg-sponsor-tag)").length))
}, `
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

mod.reg("benben-emoticon", "犇犇表情输入", [ "@/" ], {
    show: { ty: "boolean", dft: true }
}, () => {
    const emo = [
        { type: "emo", name: [ "kk" ], slug: "0" },
        { type: "emo", name: [ "jk" ], slug: "1" },
        { type: "emo", name: [ "se" ], slug: "2" },
        { type: "emo", name: [ "qq" ], slug: "3" },
        { type: "emo", name: [ "xyx" ], slug: "4" },
        { type: "emo", name: [ "xia" ], slug: "5" },
        { type: "emo", name: [ "cy" ], slug: "6" },
        { type: "emo", name: [ "ll" ], slug: "7" },
        { type: "emo", name: [ "xk" ], slug: "8" },
        { type: "emo", name: [ "qiao" ], slug: "9" },
        { type: "emo", name: [ "qiang" ], slug: "a" },
        { type: "emo", name: [ "ruo" ], slug: "b" },
        { type: "emo", name: [ "mg" ], slug: "c" },
        { type: "emo", name: [ "dx" ], slug: "d" },
        { type: "emo", name: [ "youl" ], slug: "e" },
        { type: "emo", name: [ "baojin" ], slug: "f" },
        { type: "emo", name: [ "shq" ], slug: "g" },
        { type: "emo", name: [ "lb" ], slug: "h" },
        { type: "emo", name: [ "lh" ], slug: "i" },
        { type: "emo", name: [ "qd" ], slug: "j" },
        { type: "emo", name: [ "fad" ], slug: "k" },
        { type: "emo", name: [ "dao" ], slug: "l" },
        { type: "emo", name: [ "cd" ], slug: "m" },
        { type: "emo", name: [ "kun" ], slug: "n" },
        { type: "emo", name: [ "px" ], slug: "o" },
        { type: "emo", name: [ "ts" ], slug: "p" },
        { type: "emo", name: [ "kl" ], slug: "q" },
        { type: "emo", name: [ "yiw" ], slug: "r" },
        { type: "emo", name: [ "dk" ], slug: "s" },
        { type: "txt", name: [ "hqlm" ], slug: "l0", name_display: "火前留名" },
        { type: "txt", name: [ "sqlm" ], slug: "l1", name_display: "山前留名" },
        { type: "txt", name: [ "xbt" ], slug: "g1", name_display: "屑标题" },
        { type: "txt", name: [ "iee", "wee" ], slug: "g2", name_display: "我谔谔" },
        { type: "txt", name: [ "kg" ], slug: "g3", name_display: "烤咕" },
        { type: "txt", name: [ "gl" ], slug: "g4", name_display: "盖楼" },
        { type: "txt", name: [ "qwq" ], slug: "g5", name_display: "QωQ" },
        { type: "txt", name: [ "wyy" ], slug: "g6", name_display: "无意义" },
        { type: "txt", name: [ "wgzs" ], slug: "g7", name_display: "违规紫衫" },
        { type: "txt", name: [ "tt" ], slug: "g8", name_display: "贴贴" },
        { type: "txt", name: [ "jbl" ], slug: "g9", name_display: "举报了" },
        { type: "txt", name: [ "%%%", "mmm" ], slug: "ga", name_display: "%%%" },
        { type: "txt", name: [ "ngrb" ], slug: "gb", name_display: "你谷日爆" },
        { type: "txt", name: [ "qpzc", "qp", "zc" ], slug: "gc", name_display: "前排资瓷" },
        { type: "txt", name: [ "cmzz" ], slug: "gd", name_display: "臭名昭著" },
        { type: "txt", name: [ "zyx" ], slug: "ge", name_display: "致远星" },
        { type: "txt", name: [ "zh" ], slug: "gf", name_display: "祝好" },
        { type: "txt", name: [ "sto" ], slug: "gg", name_display: "sto" },
        { type: "txt", name: [ "orz" ], slug: "gh", name_display: "orz" },
    ]
    const $txt = $("#feed-content"), emo_url = name => `//图.tk/${name}`, txt = $txt[0]
    $("#feed-content").before("<div id='emo-lst'></div>")
    emo.forEach(m => {
        $((m.type === "emo")?
            `<button class="exlg-emo-btn" exlg="exlg"><img src="${emo_url(m.slug)}" /></button>`
            :
            `<button class="exlg-emo-btn" exlg="exlg">${m.name_display}</button>`
        ).on("click", () => {
            const preval = txt.value
            const pselstart = txt.selectionStart
            const str1 = preval.slice(0, pselstart) + `![](${emo_url(m.slug)})`
            txt.value = (str1 + preval.slice(txt.selectionEnd))
            txt.focus()
            txt.setSelectionRange(str1.length, str1.length)
        }
        ).appendTo("#emo-lst")
    })
    $("#feed-content").before("<br>")
    $txt.on("input", e => {
        if (e.originalEvent.data === "/")
            mdp.content = mdp.content.replace(/\/(.{1,5})\//g, (_, emo_txt) =>
                `![](` + emo_url(emo.find(m => m.name.includes(emo_txt)).slug) + `)`
            )
    })
}, `
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
`)

mod.reg("user-css", "自定义样式表", ".*", {
    css: { ty: "string" }
}, ({ msto }) => GM_addStyle(msto.css)
)

$(() => {
    log("Exposing")

    Object.assign(uindow, {
        exlg: {
            mod,
            log, error,
            springboard, version_cmp,
            lg_alert, lg_content,
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

    log("Launching")
    mod.execute()
})

