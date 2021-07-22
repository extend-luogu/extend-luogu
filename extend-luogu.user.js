// ==UserScript==
// @name           extend-luogu
// @namespace      http://tampermonkey.net/
// @version        2.7.7
//
// @match          https://*.luogu.com.cn/*
// @match          https://*.luogu.org/*
// @match          https://www.bilibili.com/robots.txt?*
// @match          https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121
// @match          https://service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com/release/exlg-nextgen
// @match          https://service-otgstbe5-1305163805.sh.apigw.tencentcs.com/release/exlg-setting
// @match          https://extend-luogu.github.io/exlg-setting/*
// @match          localhost:1634/*
//
// @connect        tencentcs.com
//
// @require        https://cdn.luogu.com.cn/js/jquery-2.1.1.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/js-xss/0.3.3/xss.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/marked/2.0.1/marked.min.js
// @require        https://greasyfork.org/scripts/429255-tm-dat/code/TM%20dat.js?version=952068
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

const judge_problem = (text) => { // Note: 判断字符串是否为题号, B不算在内
    if (text.match(/^AT[1-9][0-9]{0,}$/i)) return true
    if (text.match(/^CF[1-9][0-9]{0,}[A-Z][0-9]?$/i)) return true
    if (text.match(/^SP[1-9][0-9]{0,}$/i)) return true
    if (text.match(/^P[1-9][0-9]{3,}$/i)) return true
    if (text.match(/^UVA[1-9][0-9]{2,}$/i)) return true
    if (text.match(/^U[1-9][0-9]{0,}$/i)) return true
    if (text.match(/^T[[1-9][0-9]{0,}$/i)) return true
    return false
}

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
                const last = sto[name].chore, now = Date.now()

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
            // const icon = `<svg xmlns="http://www.w3.org/2000/svg" height="40" viewBox="0 0 136.14 30.56"><g transform="translate(1.755, 0)" fill="#00a0d8"><g><path d="M5.02-33.80L34.56-33.80L34.07-28.62L16.96-28.62L15.93-21.92L31.97-21.92L31.48-16.74L14.85-16.74L13.82-8.42L31.97-8.42L31.48-3.24L2.43-3.24L6.59-31.75L5.02-33.80Z" transform="translate(-4.14, 33.9)"></path><path d="M7.34-32.29L5.78-33.80L16.63-33.80L21.33-25.00L27.54-32.78L26.51-33.80L38.93-33.80L25.49-18.79L34.78-3.24L24.41-3.24L19.76-12.58L11.99-3.24L1.62-3.24L15.12-18.79L7.34-32.29Z" transform="translate(27.23, 33.9)"></path><path d="M4.00-33.80L16.42-33.80L12.80-8.42L32.99-8.42L32.51-3.24L5.56-3.24Q4.00-3.24 3.21-4.27Q2.43-5.29 2.43-6.86L2.43-6.86L5.56-31.75L4.00-33.80Z" transform="translate(-4.14, 66.055)"></path><path d="M38.83-33.80L37.80-25.00L27.43-25.00L27.92-28.62L15.50-28.62L12.91-8.42L25.33-8.42L25.87-14.63L22.73-19.82L36.72-19.82L34.67-3.24L5.62-3.24Q4.86-3.24 4.21-3.51Q3.56-3.78 3.10-4.27Q2.65-4.75 2.48-5.43Q2.32-6.10 2.54-6.86L2.54-6.86L6.16-33.80L38.83-33.80Z" transform="translate(27.23, 66.055)"></path></g></g></svg>`
            const icon_b = `<svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 0 136.14 30.56"><g transform="translate(1.755, 0)" fill="#00a0d8"><g><path d="M5.02-33.80L34.56-33.80L34.07-28.62L16.96-28.62L15.93-21.92L31.97-21.92L31.48-16.74L14.85-16.74L13.82-8.42L31.97-8.42L31.48-3.24L2.43-3.24L6.59-31.75L5.02-33.80Z" transform="translate(-4.14, 33.9)"></path><path d="M7.34-32.29L5.78-33.80L16.63-33.80L21.33-25.00L27.54-32.78L26.51-33.80L38.93-33.80L25.49-18.79L34.78-3.24L24.41-3.24L19.76-12.58L11.99-3.24L1.62-3.24L15.12-18.79L7.34-32.29Z" transform="translate(27.23, 33.9)"></path><path d="M4.00-33.80L16.42-33.80L12.80-8.42L32.99-8.42L32.51-3.24L5.56-3.24Q4.00-3.24 3.21-4.27Q2.43-5.29 2.43-6.86L2.43-6.86L5.56-31.75L4.00-33.80Z" transform="translate(63.8, 33.9)"></path><path d="M38.83-33.80L37.80-25.00L27.43-25.00L27.92-28.62L15.50-28.62L12.91-8.42L25.33-8.42L25.87-14.63L22.73-19.82L36.72-19.82L34.67-3.24L5.62-3.24Q4.86-3.24 4.21-3.51Q3.56-3.78 3.10-4.27Q2.65-4.75 2.48-5.43Q2.32-6.10 2.54-6.86L2.54-6.86L6.16-33.80L38.83-33.80Z" transform="translate(95.6, 33.9)"></path></g></g></svg>`
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

        const pn = uindow.location.href
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
}, () => $(".user-nav").length !== 0 && $("#exlg-dash").length === 0, `
    /* dash */
    #exlg-dash {
        position: relative;
        display: inline-block;
        padding: 1px 10px 3px;
        color: white;
        border-radius: 6px;
        box-shadow: 0 0 7px dodgerblue;
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

    [exlgcolor='red'] {
        background-color: rgb(254, 76, 97);
    }
    [exlgcolor='orange'] {
        background-color: rgb(243, 156, 17);
    }
    [exlgcolor='yellow'] {
        background-color: rgb(255, 193, 22);
    }
    [exlgcolor='green'] {
        background-color: rgb(82, 196, 26);
    }
    [exlgcolor='blue'] {
        background-color: rgb(52, 152, 219);
    }
    [exlgcolor='purple'] {
        background-color: rgb(157, 61, 207);
    }
    [exlgcolor='black'] {
        background-color: rgb(14, 29, 105);
    }
    [exlgcolor='grey'] {
        background-color: rgb(191, 191, 191);
    }
`)

mod.reg_main("dash-board", "控制面板", [ "@tcs3/release/exlg-setting", "@debug/dashboard/", "@ghpage/exlg-setting/(index|bundle)(.html)?" ], null, () => {
    const novogui_modules = [
        {
            name: "modules",
            displayName: "Modules",
            children: mod._.map(m => ({
                rawName: m.name,
                name: m.name.replace(/^[@^]/g, ""),
                description: m.description,
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

mod.reg("emoticon", "表情输入", [ "@/discuss/lists", "@/discuss/show/.*" ], {
    show: { ty: "boolean", dft: true }
}, () => {
    // Kill:
    // const emo = [
    //     [ "62224", [ "qq" ] ],
    //     [ "62225", [ "cy" ] ],
    //     [ "62226", [ "kel", "kl" ] ],
    //     [ "62227", [ "kk" ] ],
    //     [ "62228", [ "dk" ] ],
    //     [ "62230", [ "xyx", "hj" ] ],
    //     [ "62234", [ "jk" ] ],
    //     [ "62236", [ "qiang", "up", "+", "zan" ] ],
    //     [ "62238", [ "ruo", "dn", "-", "cai" ] ],
    //     [ "62239", [ "ts" ] ],
    //     [ "62240", [ "yun" ] ],
    //     [ "62243", [ "yiw", "yw", "?" ] ],
    //     [ "62244", [ "se", "*" ] ],
    //     [ "62246", [ "px" ] ],
    //     [ "62248", [ "wq" ] ],
    //     [ "62250", [ "fad", "fd" ] ],
    //     [ "69020", [ "youl", "yl" ] ]
    // ]
    // const emo_url = id => `https://cdn.luogu.com.cn/upload/pic/${id}.png`

    const emo = [ "qq", "cy", "kel", "dk", "kk", "xyx", "jk", "ts", "yun", "yiw", "se", "px", "wq", "fad", "xia", "jy", "qiao", "youl", "qiang", "ruo", "shq", "mg", "dx", "tyt", ]
    const emo_url = name => `https://xn--9zr.tk/${name}`
    const $menu = $(".mp-editor-menu"),
        $txt = $(".CodeMirror-wrap textarea"),
        $nl = $("<br />").appendTo($menu),
        $grd = $(".mp-editor-ground").addClass("exlg-ext")

    emo.forEach(m => {
        const url = emo_url(m)
        $(`<li class="exlg-emo" exlg="exlg"><img src="${url}" /></li>`)
            .on("click", () => $txt
                .trigger("focus")
                .val(`![${ m[1][0] }](${url})`)
                .trigger("input")
            )
            .appendTo($menu)
    })
    const $emo = $(".exlg-emo")

    const $fold = $(`<li exlg="exlg">表情 <i class="fa fa-chevron-left"></li>`)
        .on("click", () => {
            $nl.toggle()
            $emo.toggle()
            $fold.children().toggleClass("fa-chevron-left fa-chevron-right")
            $grd.toggleClass("exlg-ext")
        })
    $nl.after($fold)

    $txt.on("input", e => {
        if (e.originalEvent.data === "/")
            mdp.content = mdp.content.replace(/\/(.{1,5})\//g, (_, emo_txt) =>
                `![${emo_txt}](` + emo_url(emo.find(m => m.includes(emo_txt))) + `)`
            )
    })
}, `
    .mp-editor-ground.exlg-ext {
        top: 80px !important;
    }
    .mp-editor-menu > br ~ li {
        position: relative;
        display: inline-block;
        margin: 0;
        padding: 5px 1px;
    }
`)

mod.reg_chore("update", "脚本升级", "1D", "@/.*", null, () => {
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

        if (op === "<<") $("#exlg-dash > .exlg-warn").show()
        $("#exlg-dash-verison").html(l.split(": ")[1]
            .replace(">>", `<span style="color: #5eb95e;">&gt;&gt;</span>`)
            .replace("==", `<span style="color: #5eb95e;">==</span>`)
            .replace("<<", `<span style="color: #e74c3c;">&lt;&lt;</span>`)
        )
    })
})

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
}, () => $(".problems > span > a").not(".exlg").length !== 0, `
    .main > .card > h3 {
        display: inline-block;
    }
`)

mod.reg("user-css-load", "加载用户样式", "@/.*", {
    css: { ty: "string" }
}, ({ msto }) => GM_addStyle(msto.css)
)

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

    const $sel = $(".feed-selector")
    $(`<li class="feed-selector" id="exlg-benben-selector" data-mode="all" exlg="exlg"><a style="cursor: pointer">全网动态</a></li>`)
        .appendTo($sel.parent())
        .on("click", e => {
            const $this = $(e.currentTarget)
            $sel.removeClass("am-active")
            $this.addClass("am-active")

            $("#feed-more").hide()
            $("li.am-comment").remove()

            GM_xmlhttpRequest({
                method: "GET",
                url: `https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121`,
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
                        .find("a[name=feed-reply]").on("click", () =>
                            $("textarea")
                                .trigger("focus").val(` || @${ m.user.name } : ${ m.content }`)
                                .trigger("input")
                        )
                    )
                },
                onerror: (err) => {
                    error(err)
                }
            })
        })

    /*
    uindow.addEventListener("message", e => {

    })
    */
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
    const difficulty_html = [
        `<div exlgcolor="red"    class="exlg-difficulties exlg-unselectable">入门</div>`,
        `<div exlgcolor="orange" class="exlg-difficulties exlg-unselectable">普及-</div>`,
        `<div exlgcolor="yellow" class="exlg-difficulties exlg-unselectable">普及/提高-</div>`,
        `<div exlgcolor="green"  class="exlg-difficulties exlg-unselectable">普及+/提高</div>`,
        `<div exlgcolor="blue"   class="exlg-difficulties exlg-unselectable">提高+/省选-</div>`,
        `<div exlgcolor="purple" class="exlg-difficulties exlg-unselectable">省选/NOI-</div>`,
        `<div exlgcolor="black"  class="exlg-difficulties exlg-unselectable">NOI/NOI+/CTSC</div>`,
        `<div exlgcolor="grey"   class="exlg-difficulties exlg-unselectable">暂无评定</div>`
    ]
    const source_html = [
        `<div exlgcolor="red"    class="exlg-difficulties exlg-unselectable">洛谷题库</div>`,
        `<div exlgcolor="orange" class="exlg-difficulties exlg-unselectable">Codeforces</div>`,
        `<div exlgcolor="yellow" class="exlg-difficulties exlg-unselectable">SPOJ</div>`,
        `<div exlgcolor="green"  class="exlg-difficulties exlg-unselectable">ATcoder</div>`,
        `<div exlgcolor="blue"   class="exlg-difficulties exlg-unselectable">UVA</div>`
    ]

    const func_jump_problem = (str) => { // Note: 很好理解
        if (judge_problem(str)) str = str.toUpperCase()
        if (str === "" || typeof (str) === "undefined") uindow.show_alert("提示", "请输入题号")
        else location.href = "https://www.luogu.com.cn/problemnew/show/" + str
    }
    // start to do fucking things.
    let mouse_on_board = false, mouse_on_dash = false
    if ($("#exlg-rand-diffs").length) return // Note: 防重复

    // Note: 对于界面的修正
    // Note: input框套皮
    let $input = $("input[name='toproblem']")
    $input.after($input.clone()).remove()
    $input = $("input[name='toproblem']")

    // Note: 跳转按钮
    let $jump = $(".am-btn[name='goto']")
    $jump.after($jump.clone()).remove()
    $jump = $(".am-btn[name='goto']")

    // Note: 避免分成两行
    const $jump_rand = $(".am-btn[name='gotorandom']").text("随机")

    // Note: 随机ex按钮好耶！！
    $jump_rand.after($(`<button class="am-btn am-btn-success am-btn-sm" name="gotorandomex" id="gtrdex">随机ex</button>`))

    // Note: set behavior
    $jump.on("click", () => {
        if (/^[0-9]+.?[0-9]*$/.test($input.val())) $input.val("P" + $input.val())
        func_jump_problem($input.val())
    })
    $input.on("keydown", e => {
        if (e.keyCode === 13) $jump.click()
    })

    // Note: exrand部分
    const $jump_exrand = $("#gtrdex")
    $(".lg-index-stat>h2").text("问题跳转 ").append(`<div id="exlg-dash-0" class="exlg-rand-settings">ex设置</div>`)
    const exrand_setting = $("#exlg-dash-0")
    exrand_setting.mouseenter(() => {
        mouse_on_dash = true
        $("#exlg-dash-0-window").show() // Hack: 鼠标放在dash上开window
    })
        .mouseleave(() => {
            mouse_on_dash = false // Hack: 离开dash和board超过200ms直接关掉
            if (!mouse_on_board) {
                setTimeout(() => {
                    if (!mouse_on_board) $("#exlg-dash-0-window").hide()
                }, 200)
            }
        })
    const $board = $(`<span id="exlg-dash-0-window" class="exlg-window" style="display: block;"><p></p><ul id="exlg-rand-diffs">
<div>
<span class=".exlg-title-span">
<div id="button-showdiff" class="exlg-rand-settings selected exlg-unselectable">题目难度</div>
<span class="exlg-unselectable">&nbsp;&nbsp;</span>
<div id="button-showsrce" class="exlg-rand-settings exlg-unselectable">题目来源</div>
</span>
</div>
<p></p>
<div id="exlg-exrd-diff">
<span style="width: 49%; float: left " id="exlg-exrd-diff-1">
<span class="lg-small lg-inline-up exlg-unselectable">已选择</span><p></p>
</span>
<span style="width: 49%; float: right" id="exlg-exrd-diff-0">
<span class="lg-small lg-inline-up exlg-unselectable">未选择</span><p></p>
</span>
</div>
<div id="exlg-exrd-srce" style="display:none;">
<span style="width: 49%; float: left " id="exlg-exrd-srce-1">
<span class="lg-small lg-inline-up exlg-unselectable">已选择</span><p></p>
</span>
<span style="width: 49%; float: right" id="exlg-exrd-srce-0">
<span class="lg-small lg-inline-up exlg-unselectable">未选择</span><p></p>
</span>
</div>
</ul><p></p></span>`).hide()
    $jump_exrand.after($board)
    $jump_exrand.before("&nbsp;")
    $board.mouseenter(() => {mouse_on_board = true})
        .mouseleave(() => {
            mouse_on_board = false
            if (!mouse_on_dash) {
                $("#exlg-dash-0-window").hide()
            }
        }) // Hack: 维护onboard

    // Note: 切换界面的按钮
    const $btn_diff = $("#button-showdiff"), $btn_srce = $("#button-showsrce")
    const $diff_div = $("#exlg-exrd-diff") , $srce_div = $("#exlg-exrd-srce")
    $btn_diff.on("click", () => {
        $btn_diff.addClass("selected")
        $btn_srce.removeClass("selected")
        $diff_div.show()
        $srce_div.hide()
    })
    $btn_srce.on("click", () => {
        $btn_diff.removeClass("selected")
        $btn_srce.addClass("selected")
        $diff_div.hide()
        $srce_div.show()
    })

    for (let i = 0; i < difficulty_html.length; ++ i) {
        const $btn = $(difficulty_html[i]).attr("unselectable", "on")
            .on("click", () => { // Note: 建一个dash而已
                $btn.hide()
                $("#exlg-exrd-diff-0").find(`div[exlgcolor='${$btn.attr("exlgcolor")}']`).show()
                msto.exrand_difficulty[i] = false
            }).appendTo($("#exlg-exrd-diff-1"))
        if (!msto.exrand_difficulty[i]) $btn.hide()
    }
    for (let i = 0; i < difficulty_html.length; ++ i) {
        const $btn = $(difficulty_html[i]).attr("unselectable", "on")
            .on("click", () => {
                $btn.hide()
                $("#exlg-exrd-diff-1").find(`div[exlgcolor='${$btn.attr("exlgcolor")}']`).show()
                msto.exrand_difficulty[i] = true
            }).appendTo($("#exlg-exrd-diff-0"))
        if (msto.exrand_difficulty[i]) $btn.hide()
    }
    for (let i = 0; i < source_html.length; ++ i) {
        const $btn = $(source_html[i]).attr("unselectable", "on")
            .on("click", () => {
                $btn.hide()
                $("#exlg-exrd-srce-0").find(`div[exlgcolor='${$btn.attr("exlgcolor")}']`).show()
                msto.exrand_source[i] = false
            }).appendTo($("#exlg-exrd-srce-1"))
        if (!msto.exrand_source[i]) $btn.hide()
    }
    for (let i = 0; i < source_html.length; ++ i) {
        const $btn = $(source_html[i]).attr("unselectable", "on")
            .on("click", () => {
                $btn.hide()
                $("#exlg-exrd-srce-1").find(`div[exlgcolor='${$btn.attr("exlgcolor")}']`).show()
                msto.exrand_source[i] = true
            }).appendTo($("#exlg-exrd-srce-0"))
        if (msto.exrand_source[i]) $btn.hide()
    }
    const exrand_poi = async () => { // Note: 异步写法（用到了lg_content）
        let difficulty_list = [], source_list = []
        for (i = 0; i < difficulty_html.length; ++ i) {
            if (msto.exrand_difficulty[i]) difficulty_list.push((i + 1) % 8)
        }
        for (let i = 0; i < source_html.length; ++ i) {
            if (msto.exrand_source[i]) source_list.push(i)
        }
        // Note: 未选中的缺省选项
        if (difficulty_list.length === 0) difficulty_list = [0, 1, 2, 3, 4, 5, 6, 7]
        if (source_list.length === 0) source_list  = [0]

        const difficulty = difficulty_list[Math.floor(Math.random() * difficulty_list.length)]
        const source = ["P","CF","SP","AT","UVA"][source_list[Math.floor(Math.random() * source_list.length)]]
        let res = await lg_content(`/problem/list?difficulty=${difficulty}&type=${source}&page=1`)
        // Note: 随机而已问题不大
        const
            problem_count = res.currentData.problems.count,
            page_count = Math.ceil(problem_count / 50),
            rand_page = Math.floor(Math.random() * page_count) + 1

        res = await lg_content(`/problem/list?difficulty=${difficulty}&type=${source}&page=${rand_page}`)
        const
            list = res.currentData.problems.result,
            rand_idx = Math.floor(Math.random() * list.length),
            pid = list[rand_idx].pid
        location.href = `/problem/${pid}`
    }
    $jump_exrand.on("click", exrand_poi)
    /*
    // KiLL: 不知道干什么的东西(
    const css_load_here = '';
    const node_style=document.createElement("style");
    node_style.innerHTML = css_load_here;
    document.head.append(node_style);
    */
},`
#exlg-rand-diffs {
    list-style-type: none
}
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
.exlg-difficulties {
    position: relative;
    display: inline-block;
    padding: 1px 5px 1px;
    color: white;
    border-radius: 6px;
    font-size: 12px;
    margin-left: 1px;
    margin-right: 1px;
}
.exlg-rand-settings:hover {
    box-shadow: 0 0 7px dodgerblue;
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
`)


mod.reg_hook("code-block-ex", "代码块优化", "@/.*", {
    show_code_lang : { ty: "boolean", dft: true, strict: true, info: ["Show Language Before Codeblocks", "显示代码块语言"] },
    copy_code_position : { ty: "enum", vals: ["left", "right"], dft: "left", info: ["Copy Button Position", "复制按钮对齐方式"] },
    code_block_title : { ty: "string", dft: "源代码 - ${lang}", info: ["Custom Code Title", "自定义代码块标题"] },
    copy_code_font : { ty: "string", dft: "Fira Code", strict: true }
},  ({ msto }) => {

    if (/\/blogAdmin\/.*/.test(location.href)) return

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

    const $cb = $("pre:has(> code):not([exlg-copy-code-block])").attr("exlg-copy-code-block", "")
    if ($cb.length) log(`Scanning code block:`, $cb.length)
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
}, () => (!/\/blogAdmin\/.*/.test(location.href) && $("pre:has(> code):not([exlg-copy-code-block])").length !== 0), `
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
    problem_type: { ty: "enum", vals: ["unac only", "unac and new", "new only"], dft : "unac and new", info: [
        "Preferences about problem choosing", "随机跳题的题目种类"
    ] }
}, ({ msto }) => {
    let ptypes = msto.problem_type.startsWith("unac") + msto.problem_type.endsWith("only") * (-1) + 2
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

            if (tInfo.problemCount === 0)
                return lg_alert("题单不能为空")
            else if (candProbList.length === 0) {
                if (ptypes === 1)
                    return lg_alert("您已经做完所有新题啦！")
                else if (ptypes === 2)
                    return lg_alert("您已经订完所有错题啦！")
                else
                    return lg_alert("您已经切完所有题啦！")
            }

            const pid = ~~ (Math.random() * 1.e6) % candProbList.length
            uindow.location.href = "https://www.luogu.com.cn/problem/" + candProbList[pid]
        })
}, `
.exlg-rand-training-problem-btn {
    border-color: rgb(52, 52, 52);
    background-color: rgb(52, 52, 52);
}
`)

mod.reg("tasklist-ex", "更好的任务列表", "@/", {
    auto_clear: { ty: "boolean", dft: true, info: ["Clear accepted problems", "清理已经 AC 的题目"] },
    rand_problem_in_tasklist: { ty: "boolean", dft: true, info: ["Random problem in tasklist", "任务栏随机跳题"]}
}, ({ msto }) => {
    let actTList = []
    $.each($$("div.tasklist-item"), (_, prob) => {
        let pid = $(prob).attr("data-pid")
        if (prob.innerHTML.search(/check/g) === -1) {
            if (msto.rand_problem_in_tasklist)
                actTList.push(pid)
        }
        else if (msto.auto_clear) {
            $.ajax({ // FIXME: Unable to send requests (maybe because of async/await?)
                type: "post",
                url: "/fe/api/problem/tasklistRemove",
                data: JSON.stringify({
                    pid: pid
                }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
            })
            $("div.tasklist-item[data-pid=" + pid + "]").hide()
        }
    })

    if (msto.rand_problem_in_tasklist) {
        let $btn = $("button[name=task-edit]")
        $btn.clone().appendTo($btn.parent())
        $btn.addClass("exlg-rand-tasklist-problem-btn")
            .text("随机")
            .removeAttr("onclick")
            .click(() => {
                let tid = ~~ (Math.random() * 1.e6) % actTList.length
                location.href += `problem/${actTList[tid]}`
            })
    }
}, `
.exlg-rand-tasklist-problem-btn {
    margin-left: 0.5em;
    border-color: rgb(36, 190, 36);
    background-color: rgb(36, 190, 36);
}
`)

mod.reg("dbc-jump", "双击题号跳题", "@/.*", null, () => {
    $(document).on("dblclick", (event) => {
        const selection = window.getSelection()
        const selected = selection.toString().replace(" ", "").toUpperCase()
        let url
        if (event.ctrlKey) {
            const myBlog = $(".ops>a[href*=blog]")[0]
            url = myBlog.href + "solution-"
        }
        else url = "https://www.luogu.com.cn/problem/"
        if (judge_problem(selected)) window.open(url + selected)
    })
})

mod.reg_hook("submission-color", "记录难度可视化", "@/record/list.*", null, async () => {
    if ($(".exlg-difficulty-color").length) return
    const u = await lg_content(window.location.href)
    const dif = u.currentData.records.result.map((u) => u.problem.difficulty)
    $("div.problem>div>a>span.pid").each((i, e, $e = $(e)) => {
        $e.addClass("exlg-difficulty-color").addClass(`color-${dif[i]}`)
    })
}, () => $("div.problem>div>a>span.pid").length !== 0 && $(".exlg-difficulty-color").length === 0, `
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
    const tag_list = JSON.parse(sto["^sponsor-list"].tag_list),
        $name = $("a[target='_blank'][href]").not(".exlg"),
        prefix = "/user/"
    $name.each((i, e, $e = $(e)) => {
        const href = $e.attr("href")
        if (href.lastIndexOf(prefix) === 0) {
            const uid = href.substring(prefix.length)
            const tag = tag_list[uid]
            if (tag !== undefined) {
                $e.find(".exlg-badge").remove()
                $(`<span class="exlg-badge">${tag}</span>`).appendTo(
                    $e.addClass("exlg")
                )
            }
        }
        if (href !== "javascript:void 0") $e.addClass("exlg")
    })
    const whref = window.location.href
    const hprefix = "https://www.luogu.com.cn/user/"
    if (whref.lastIndexOf(hprefix) === 0) {
        const uid = whref.substring(hprefix.length).split("#")[0],
            tag = tag_list[uid],
            $title = $("div.user-name").not(".exlg")
        if (tag !== undefined) {
            $(`<span class="exlg-badge">${tag}</span>`).appendTo(
                $title.addClass("exlg")
            )
        }
    }
}, (e) => {
    return ($(e.target).hasClass("exlg-badge") === false) &&
    ($("a[target='_blank'][href]").not(".exlg").length !== 0)
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

$(() => {
    log("Exposing")

    const init_sto = chance => {
        try {
            sto = load_dat(mod.data, {
                map: s => {
                    s.root = ! [ "object", "tuple" ].includes(s.ty)
                    return s
                }
            })
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

    Object.assign(uindow, {
        exlg: {
            mod,
            log, error,
            springboard, version_cmp,
            lg_alert, lg_content,
            TM_dat: {
                sto,
                type_dat, proxy_dat, load_dat, save_dat, clear_dat
            }
        },
        $$: $, xss, marked
    })

    log("Launching")
    mod.execute()
})
