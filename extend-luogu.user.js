// ==UserScript==
// @name           extend-luogu
// @namespace      http://tampermonkey.net/
// @version        2.1.1
//
// @match          https://*.luogu.com.cn/*
// @match          https://*.luogu.org/*
// @match          https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121
// @match          https://service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com/release/exlg-nextgen
// @match          https://service-otgstbe5-1305163805.sh.apigw.tencentcs.com/release/exlg-setting
// @match          https://extend-luogu.github.io/exlg-setting/
// @match          https://www.bilibili.com/robots.txt?*
// @match          localhost:1634
//
// @require        https://cdn.luogu.com.cn/js/jquery-2.1.1.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/js-xss/0.3.3/xss.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/marked/2.0.1/marked.min.js
// @require        https://greasyfork.org/scripts/429255-tm-dat/code/TM%20dat.js?version=951422
//
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_listValues
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

// ==/Utilities==

// ==Modules==

const mod = {
    _: [],

    data: {},

    path_alias: [
        [ "", "www.luogu.com.cn" ],
        [ "bili", "www.bilibili.com" ],
        [ "cdn", "cdn.luogu.com.cn" ],
        [ "tcs1", "service-ig5px5gh-1305163805.sh.apigw.tencentcs.com" ],
        [ "tcs2", "service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com" ],
        [ "tcs3", "service-otgstbe5-1305163805.sh.apigw.tencentcs.com" ]
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
        // FIXME: this seems not to work when the tab loads slowly.
        mod.reg(
            name, info, [ "@/user/*" ], data,
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
            let $board = $("#exlg-board")
            if (! $board.length) $board = $(`
                <div class="lg-article" id="exlg-board" exlg="exlg"><h2>exlg</h2></div> <br />
            `)
                .prependTo(".lg-right.am-u-md-4")
            func({ ...arg, $board: $(`<div></div> <br />`).appendTo($board) })
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
    case "benben":
        document.write(`<iframe src="https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121" exlg="exlg"></iframe>`)
        uindow.addEventListener("message", e => {
            e.data.unshift("benben")
            uindow.parent.postMessage(e.data, "*")
        })
        break
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

mod.reg_main("benben-data", "犇犇数据", "@tcs1/release/APIGWHtmlDemo-1615602121", null, () =>
    uindow.parent.postMessage(JSON.parse(document.body.innerText), "*")
)

mod.reg_main("version-data", "版本数据", "@tcs2/release/exlg-nextgen", null, () =>
    uindow.parent.postMessage([ document.body.innerText ], "*")
)

mod.reg_hook("dash-bridge", "控制桥", "@/.*", {
    debug: { ty: "boolean", dft: false }
}, ({ msto }) => {
    const debug = msto.debug
    $(`<div id="exlg-dash" exlg="exlg">exlg</div>`)
        .prependTo($("nav.user-nav, div.user-nav > nav"))
        .addClass(debug ? "debug" : undefined)
        .on("click", () =>
            uindow.exlg.dash = uindow.open(debug
                ? "localhost:1634"
                : "https://service-otgstbe5-1305163805.sh.apigw.tencentcs.com/release/exlg-setting"
            )
        )
}, () => $(".user-nav").length !== 0 && $("#exlg-dash").length === 0, `
    /* dash */

    #exlg-dash {
        position: relative;
        display: inline-block;

        padding: 1px 10px 3px;

        background-color: cornflowerblue;
        color: white;
        border-radius: 6px;
        box-shadow: 0 0 7px dodgerblue;
    }
    #exlg-dash.debug {
        background-color: darkslateblue;
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
`)

mod.reg_main("dash-board", "控制面板", [ "@tcs3/release/exlg-setting", "localhost:1634/" ], null, () => {
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
        "rgb(191, 191, 191)",
        "rgb(254, 76, 97)",
        "rgb(243, 156, 17)",
        "rgb(255, 193, 22)",
        "rgb(82, 196, 26)",
        "rgb(52, 152, 219)",
        "rgb(157, 61, 207)",
    ]
    const $unrendered = $(".problems > span > a").not(".exlg")
    const $problem = $(".problems")
    const my = uindow._feInjection.currentData
    $unrendered.addClass("exlg")
    $unrendered.each((_, ps, $ps = $(ps)) => {
        if ($ps.parent().children().length !== 2) {
            const piece = $problem.first().find("a").index(ps) === -1 ? 1 : 0
            const index = [ $problem.first().find("a"), $problem.last().find("a") ][piece].index(ps)
            const col = color[my[[ "submittedProblems", "passedProblems" ][piece]][index].difficulty]
            $ps.removeClass("color-default").css("color", col)
        }
        else $ps.removeClass("color-default").css("color", $ps.parent().children().first().css("color"))
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
    }
    const check_svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="%" style="margin-bottom: -3px;" exlg="exlg">
            <path d="M16 8C16 6.84375 15.25 5.84375 14.1875 5.4375C14.6562 4.4375 14.4688 3.1875 13.6562 2.34375C12.8125 1.53125 11.5625 1.34375 10.5625 1.8125C10.1562 0.75 9.15625 0 8 0C6.8125 0 5.8125 0.75 5.40625 1.8125C4.40625 1.34375 3.15625 1.53125 2.34375 2.34375C1.5 3.1875 1.3125 4.4375 1.78125 5.4375C0.71875 5.84375 0 6.84375 0 8C0 9.1875 0.71875 10.1875 1.78125 10.5938C1.3125 11.5938 1.5 12.8438 2.34375 13.6562C3.15625 14.5 4.40625 14.6875 5.40625 14.2188C5.8125 15.2812 6.8125 16 8 16C9.15625 16 10.1562 15.2812 10.5625 14.2188C11.5938 14.6875 12.8125 14.5 13.6562 13.6562C14.4688 12.8438 14.6562 11.5938 14.1875 10.5938C15.25 10.1875 16 9.1875 16 8ZM11.4688 6.625L7.375 10.6875C7.21875 10.8438 7 10.8125 6.875 10.6875L4.5 8.3125C4.375 8.1875 4.375 7.96875 4.5 7.8125L5.3125 7C5.46875 6.875 5.6875 6.875 5.8125 7.03125L7.125 8.34375L10.1562 5.34375C10.3125 5.1875 10.5312 5.1875 10.6562 5.34375L11.4688 6.15625C11.5938 6.28125 11.5938 6.5 11.4688 6.625Z"></path>
        </svg>
    `
    const check = lv => lv <= 3 ? "" : check_svg.replace("%", lv <= 5 ? "#5eb95e" : lv <= 8 ? "#3498db" : "#f1c40f")

    let loaded = false

    const $sel = $(".feed-selector")
    $(`<li class="feed-selector" id="exlg-benben-selector" data-mode="all" exlg="exlg"><a style="cursor: pointer">全网动态</a></li>`)
        .appendTo($sel.parent())
        .on("click", e => {
            const $this = $(e.currentTarget)
            $sel.removeClass("am-active")
            $this.addClass("am-active")

            $("#feed-more").hide()
            $("li.am-comment").remove()

            if (loaded) $("#exlg-benben").attr("src", $("#exlg-benben").attr("src"))
            else {
                springboard({ type: "benben" }).appendTo($("body")).hide()
                loaded = true
            }
        })

    uindow.addEventListener("message", e => {
        if (e.data[0] !== "benben") return
        e.data.shift()
        e.data.forEach(m =>
            $(`
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
    })
})

// FIXME rand-problem-ex

mod.reg("rand-training-problem", "题单内随机跳题", "@/training/[0-9]+", null, () => {
    const $op = $("div.operation")
    $op.children("button").clone(true)
        .appendTo($op)
        .css({
            "border-color": "rgb(80, 200, 219)",
            "background-color": "rgb(80, 200, 219)"
        })
        .text("随机跳题")
        .addClass("exlg")
        .on("click", () => {
            const $info = uindow._feInjection.currentData.training

            if (info.problemCount === 0) return lg_alert("题单不能为空")
            const pid = ~~ (Math.random() * 1.e6) % $info.problemCount
            uindow.location.href = "https://www.luogu.com.cn/problem/" + info.problems[pid].problem.pid
        })
})

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
    let cli_lang = msto.lang || 0

    const cmds = {
        help: (cmd/*string*/) => {
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
        cd: (path/*!string*/) => {
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
        cdd: (forum/*!string*/) => {
            /* jump to the forum named <forum> of discussion. use all the names you can think of. */
            /* 跳转至名为 <forum> 的讨论板块，你能想到的名字基本都有用。 */
            const tar = [
                [ "relevantaffairs",    "gs", "gsq",    "灌水", "灌水区",               "r", "ra" ],
                [ "academics",          "xs", "xsb",    "学术", "学术版",               "a", "ac" ],
                [ "siteaffairs",        "zw", "zwb",    "站务", "站务版",               "s", "sa" ],
                [ "problem",            "tm", "tmzb",   "灌水", "题目总版",             "p"       ],
                [ "service",            "fk", "fksqgd", "反馈", "反馈、申请、工单专版",      "se" ]
            ]
            forum = tar.find(ns => ns.includes(forum))?.[0]
            if (! tar) return cli_error`cdd: unknown forum "${forum}"`
            cmds.cd(`/discuss/lists?forumname=${forum}`)
        },
        cc: (name/*char*/) => {
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
        mod: (action/*!string*/, name/*string*/) => {
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
        dash: (action/*!string*/) => {
            /* for <action> "show|hide|toggle", opearte the exlg dashboard. */
            /* 当 <action> 为 "show|hide|toggle", 显示|隐藏|切换 exlg 管理面板。 */
            if (! [ "show", "hide", "toggle" ].includes(action))
                return cli_error`dash: unknown action "${action}"`
            $("#exlg-dash-window")[action]()
        },
        lang: (lang/*!string*/) => {
            /* for <lang> "en|zh" switch current cli language. */
            /* 当 <lang> 为 "en|zh"，切换当前语言。 */
            try {
                msto.lang = cli_lang = cli_langs.indexOf(lang)
            }
            catch {
                return cli_error`lang: unknown language ${lang}`
            }
        },
        uid: (uid/*!integer*/) => {
            /* jumps to homepage of user whose uid is <uid>. */
            /* 跳转至 uid 为 <uid> 的用户主页。 */
            location.href = `/user/${uid}`
        },
        un: (name/*!string*/) => {
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
            const [ , name, type ] = a.match(/([a-z_]+)\/\*(.+)\*\//)
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
            if (t === "number" || t === "integer") tk[i] = Number(a)
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
    $("#search-user-input").keydown(e => e.key === "Enter" && func())
})

// TODO
mod.reg("update-log", "更新日志显示", "@/*", {
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

