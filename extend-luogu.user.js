// ==UserScript==
// @name           extend-luogu
// @namespace      http://tampermonkey.net/
// @version        4.4.1
// @description    Make Luogu more powerful.
// @author         optimize_2 ForkKILLET
// @match          https://*.luogu.com.cn/*
// @match          https://*.luogu.org/*
// @match          https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121
// @require        https://cdn.luogu.com.cn/js/jquery-2.1.1.min.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/js-xss/0.3.3/xss.min.js
// @require        https://cdnjs.cloudflare.com/ajax/libs/marked/2.0.1/marked.min.js
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          unsafeWindow
// ==/UserScript==

// ==Utilities==

const uindow = unsafeWindow
const $ = jQuery
const mdp = uindow.markdownPalettes
const log = (...s) => uindow.console.log("%c[exlg]", "color: #0e90d2;", ...s)
const warn = (...s) => uindow.console.warn("%c[exlg]", "color: #0e90d2;", ...s)
const error = (...s) => {
    uindow.console.error("%c[exlg]", "color: #0e90d2;", ...s)
    throw Error(s.join(" "))
}
error.check_fe = fe => {
    if (fe.code !== 200) error(`Requesting failure code: ${ fe.code }.`)
}
const xss = new filterXSS.FilterXSS({
    onTagAttr: (t, k, v, w) => {
        if (k === "style") return `${k}="${v}"`
    }
})

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

const version_cmp = (v1, v2) => {
    const op = (x1, x2) => x1 === x2 ? "==" : x1 < x2 ? "<<" : ">>"
    const exs = [ "pre", "alpha", "beta" ]

    const [ [ n1, e1 ], [ n2, e2 ] ] = [ v1, v2 ].map(v => v.split(" "))
    if (n1 === n2) return op(...[ e1, e2 ].map(e => e ? exs.findIndex(ex => ex === e) : Infinity))

    const [ m1, m2 ] = [ n1, n2 ].map(n => n.split("."))
    for (const [ k2, m ] of m1.entries())
        if (m !== m2[k2]) return op(+ m || 0, + m2[k2] || 0)
}

// ==Modules==

const mod = {
    _: [],

    reg: (name, path, func, styl) => mod._.push({
        name, path: Array.isArray(path) ? path : [ path ], func, styl
    }),
    reg_main: (name, path, func, styl) =>
        mod.reg("@" + name, path, () => (func(), false), styl),
    reg_user_tab: (name, tab, vars, func, styl) =>
        // FIXME: this seems not to work when the tab loads slowly.
        mod.reg(
            name, [ "@/user/*" ],
            () => {
                const $tabs = $(".items")
                const work = () => {
                    if ((location.hash || "#main") !== "#" + tab) return
                    log(`Working user tab#${tab} mod: "${name}"`)
                    $tabs.off("click", work)
                    func(typeof vars === "function" ? vars() : vars)
                }
                $tabs.on("click", work)
                work()
            }, styl
        ),
    reg_chore: (name, period, path, func, styl) => {
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
        mod.reg(
            "^" + name, path, named => {
                const rec = GM_getValue("mod-chore-rec") ?? {}
                const last = rec[name], now = Date.now()

                let nostyl = true
                if (named || ! last || now - last > period) {
                    func()
                    if (nostyl) {
                        GM_addStyle(styl)
                        nostyl = false
                    }
                    rec[name] = Date.now()
                    GM_setValue("mod-chore-rec", rec)
                }
                else log(`Pending chore: "${name}"`)
            }
        )
    },

    find: name => mod._.find(m => m.name === name),
    find_i: name => mod._.findIndex(m => m.name === name),

    disable: name => { mod.find(name).on = false },
    enable: name => { mod.find(name).on = true },

    execute: name => {
        const exe = (m, named) => {
            if (! m) error(`Executing named mod but not found: "${name}"`)
            if (m.styl) GM_addStyle(m.styl)
            log(`Executing ${ named ? "named " : "" }mod: "${m.name}"`)
            return m.func(named)
        }
        if (name) {
            const m = mod.find(name)
            return exe(m, true)
        }

        mod.map = GM_getValue("mod-map")
        const map_init = mod.map ? false : (mod.map = {})
        for (const m of mod._)
            m.on = map_init ? (mod.map[ m.name ] = true) : mod.map[ m.name ]
        for (const m of mod._) {
            const pn = location.pathname
            if (m.on && m.path.some((p, _, __, pr = p.replace(/^[a-z]*?@.*?(?=\/)/, "")) => (
                p.startsWith("@/") && location.host === "www.luogu.com.cn" ||
                p.startsWith("@cdn/") && location.host === "cdn.luogu.com.cn" ||
                p.startsWith("@tcs/") && location.host === "service-ig5px5gh-1305163805.sh.apigw.tencentcs.com"
            ) && (
                p.endsWith("*") && pn.startsWith(pr.slice(0, -1)) ||
                pn === pr
            )))
                if (exe(m) === false) return
        }

        if (map_init) GM_setValue("mod-map", mod.map)
    }
}

mod.reg_main("springboard", "@/robots.txt", () => {
    const q = new URLSearchParams(location.search)
    if (q.has("benben")) {
        document.write(`<iframe src="https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121"></iframe>`)
        uindow.addEventListener("message", e => uindow.parent.postMessage(e.data, "*"))
    }
    else if (q.has("url")) {
        const url = q.get("url")
        if (confirm(`是否加载来自 ${url} 的页面？`))
            document.body.innerHTML = `<iframe src="${url}"></iframe>`
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

mod.reg_main("benben-data", "@tcs/release/APIGWHtmlDemo-1615602121", () => {
    const data = JSON.parse(document.body.innerText)
    uindow.parent.postMessage(data, "*")
})

mod.reg("dash", "@/*", () => {
    const $dash = $(`<div id="exlg-dash">exlg</div>`).prependTo($("nav.user-nav, div.user-nav > nav"))
    const $win = $(`
<span id="exlg-dash-window">
    <p>
        <b>版本</b> <a id="exlg-dash-version-update">检查更新</a> <br />
        <a href="https://github.com/optimize-2/extend-luogu">GitHub</a> <br />
        <a href="https://cdn.jsdelivr.net/gh/optimize-2/extend-luogu@latest/extend-luogu.user.js">JsDelivr</a>
        <i class="exlg-icon exlg-info" name="一键更新"></i>
        <br />
        <span id="exlg-dash-verison">${ GM_info.script.version }</span>
    </p>
    <p>
        <b>模块管理</b> <a id="exlg-dash-mods-save">保存</a>
        <ul id="exlg-dash-mods"></ul>
    </p>
    <p>
        <b>关于</b> <br />
        <a href="https://www.luogu.com.cn/team/33255">官方团队 33255</a> <br />
        <a href="https://qm.qq.com/cgi-bin/qm/qr?k=ODbPTKWbZfGq3ll3yBfjdDKWDPhJhlX4&jump_from=webapi">QQ群 817265691</a> <br />
    </p>
</span>
    `)
        .appendTo($dash)
        .on("click", e => e.stopPropagation())
    $(`<i class="exlg-icon exlg-warn"></i>`).hide().appendTo($dash)

    const $mods = $("#exlg-dash-mods")
    mod._.forEach(m => {
        const $m = $(`<li><input type="checkbox" /></span> ${ m.name }</li>`).appendTo($mods)
        $m.children("input")
            .prop("checked", m.on).prop("disabled", m.name === "dash")
            .on("change", () => {
                mod.map[ m.name ] = ! mod.map[ m.name ]
            })
    })
    $("#exlg-dash-mods-save").on("click", () => GM_setValue("mod-map", mod.map))
    $("#exlg-dash-version-update").on("click", () => mod.execute("^update"))

    $dash.on("click", e => $win.toggle())
}, `
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
#exlg-dash-window {
    position: absolute;
    top: 35px;
    left: 0px;
    z-index: 65536;
    display: none;

    width: 200px;
    height: 600px;
    padding: 5px;

    background: white;
    color: black;

    border-radius: 7px;
    box-shadow: rgb(187 227 255) 0px 0px 7px;
}
#exlg-dash-mods {
    list-style: none;
    padding: 0;
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

mod.reg("emoticon", [ "@/discuss/lists", "@/discuss/show/*" ], () => {
    const emo = [
        [ "62224", [ "qq" ] ],
        [ "62225", [ "cy" ] ],
        [ "62226", [ "kel", "kl" ] ],
        [ "62227", [ "kk" ] ],
        [ "62228", [ "dk" ] ],
        [ "62230", [ "xyx", "hj" ] ],
        [ "62234", [ "jk" ] ],
        [ "62236", [ "qiang", "up", "+", "zan" ] ],
        [ "62238", [ "ruo", "dn", "-", "cai" ] ],
        [ "62239", [ "ts" ] ],
        [ "62240", [ "yun" ] ],
        [ "62243", [ "yiw", "yw", "?" ] ],
        [ "62244", [ "se", "*" ] ],
        [ "62246", [ "px" ] ],
        [ "62248", [ "wq" ] ],
        [ "62250", [ "fad", "fd" ] ],
        [ "69020", [ "youl", "yl" ] ]
    ]
    const emo_url = id => `https://cdn.luogu.com.cn/upload/pic/${id}.png`
    const $menu = $(".mp-editor-menu"),
        $txt = $(".CodeMirror-wrap textarea"),
        $nl = $("<br />").appendTo($menu),
        $grd = $(".mp-editor-ground").addClass("exlg-ext")

    emo.forEach(m => {
        const url = emo_url(m[0])
        $(`<li class="exlg-emo"><img src="${url}" /></li>`)
            .on("click", () => $txt
                .trigger("focus")
                .val(`![${ m[1][0] }](${url})`)
                .trigger("input")
            )
            .appendTo($menu)
    })
    const $emo = $(".exlg-emo")

    const $fold = $(`<li>表情 <i class="fa fa-chevron-left"></li>`)
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
                `![${emo_txt}](` + emo_url(emo.find(m => m[1].includes(emo_txt))[0]) + `)`
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

mod.reg_chore("update", "1D", "@/*", () => {
    $.get("https://www.luogu.com.cn/team/33255?_contentOnly=true" /* exlg team */, res => {
        error.check_fe(res)
        const
            latest = res.currentData.team.setting.description.match(/VER {(.*?)}/)?.[1],
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

mod.reg_user_tab("user-intro-ins", "main", null, () => {
    $(".introduction > *").each((_, e, $e = $(e)) => {
        const t = $e.text()
        let [ , , ins, arg ] = t.match(/^(exlg.|%)([a-z]+):([^]+)$/) ?? []
        if (! ins) return

        arg = arg.split(/(?<!!)%/g).map(s => s.replaceAll("!%", "%"))
        const $blog = $($(".user-action").children()[0])
        switch (ins) {
        case "html":
            $e.replaceWith($(`<p>${ xss.process(arg[0]) }</p>`))
            break
        case "frame":
            $e.replaceWith($(`<iframe src="/robots.txt?url=${ encodeURI(arg[0]) }"`
                + `style="width: ${ arg[1] }; height: ${ arg[2] };"></iframe>`
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

mod.reg_user_tab("user-problem", "practice", () => ({
    color: [
        "rgb(191, 191, 191)",
        "rgb(254, 76, 97)",
        "rgb(243, 156, 17)",
        "rgb(255, 193, 22)",
        "rgb(82, 196, 26)",
        "rgb(52, 152, 219)",
        "rgb(157, 61, 207)",
        "rgb(14, 29, 105)"
    ]
}), ({ color }) => {
    $(".problems").each((i, ps, $ps = $(ps)) => {
        const my = uindow._feInjection.currentData[ [ "submittedProblems", "passedProblems" ][i] ]
        $ps.find("a").each((d, p, $p = $(p)) =>
            $p.removeClass("color-default").css("color", color[ my[d].difficulty ])
        )
        $ps.before($(`<span id="exlg-problem-count-${i}">${ my.length }</span>`))
    })

    if (uindow._feInjection.currentData.user.uid === uindow._feInjection.currentUser.uid) return

    $.get(`/user/${ uindow._feInjection.currentUser.uid }?_contentOnly=true`, res => {
        error.check_fe(res)
        const my = res.currentData.passedProblems
        const ta = uindow._feInjection.currentData.passedProblems

        let same = 0
        const $ps = $($(".problems")[1])
        $ps.find("a").each((d, p, $p = $(p)) => {
            if (my.some(m => m.pid === ta[d].pid)) {
                same ++
                $p.css("backgroundColor", "rgba(82, 196, 26, 0.3)")
            }
        })
        $("#exlg-problem-count-1").html(`<span>${ ta.length } <> ${ my.length } : ${same}`
            + `<i class="exlg-icon exlg-info" name="ta 的 &lt;&gt; 我的 : 相同"></i></span>`)
    })
}, `
.main > .card > h3 {
    display: inline-block;
}
`)

mod.reg("user-css-load", "@/*", () => {}, GM_getValue("user-css"))
mod.reg("user-css-edit", "@/theme/list", () => {
    const $ps = $(`
<div id="exlg-user-css">
    <h2>自定义 CSS <a>保存刷新</a></h2>
    <textarea/>
</div>
`)
        .appendTo(".full-container")
    const $t = $ps.children("textarea").val(GM_getValue("user-css"))
    $ps.find("a").on("click", () => {
        GM_setValue("user-css", $t.val())
        location.reload()
    })
}, `
#exlg-user-css {
    display: block;
    box-sizing: border-box;
    padding: 1.3em;
    margin-bottom: 1.3em;

    background-color: white;
    box-shadow: 0 0 7px dodgerblue;
}
#exlg-user-css a {
    font-weight: normal;
    font-size: 20px;
}
#exlg-user-css > textarea {
    width: 100%;
    min-height: 100px;
}
`)

mod.reg("benben", "@/", () => {
    const color = {
        Gray: "gray",
        Blue: "bluelight",
        Green: "green",
        Orange: "orange lg-bold",
        Red: "red lg-bold",
        Purple: "purple lg-bold",
    }
    const check_svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="%" style="margin-bottom: -3px;">
    <path d="M16 8C16 6.84375 15.25 5.84375 14.1875 5.4375C14.6562 4.4375 14.4688 3.1875 13.6562 2.34375C12.8125 1.53125 11.5625 1.34375 10.5625 1.8125C10.1562 0.75 9.15625 0 8 0C6.8125 0 5.8125 0.75 5.40625 1.8125C4.40625 1.34375 3.15625 1.53125 2.34375 2.34375C1.5 3.1875 1.3125 4.4375 1.78125 5.4375C0.71875 5.84375 0 6.84375 0 8C0 9.1875 0.71875 10.1875 1.78125 10.5938C1.3125 11.5938 1.5 12.8438 2.34375 13.6562C3.15625 14.5 4.40625 14.6875 5.40625 14.2188C5.8125 15.2812 6.8125 16 8 16C9.15625 16 10.1562 15.2812 10.5625 14.2188C11.5938 14.6875 12.8125 14.5 13.6562 13.6562C14.4688 12.8438 14.6562 11.5938 14.1875 10.5938C15.25 10.1875 16 9.1875 16 8ZM11.4688 6.625L7.375 10.6875C7.21875 10.8438 7 10.8125 6.875 10.6875L4.5 8.3125C4.375 8.1875 4.375 7.96875 4.5 7.8125L5.3125 7C5.46875 6.875 5.6875 6.875 5.8125 7.03125L7.125 8.34375L10.1562 5.34375C10.3125 5.1875 10.5312 5.1875 10.6562 5.34375L11.4688 6.15625C11.5938 6.28125 11.5938 6.5 11.4688 6.625Z"></path>
</svg>`
    const check = lv => lv <= 3 ? "" : check_svg.replace("%", lv <= 5 ? "#5eb95e" : lv <= 8 ? "#3498db" : "#f1c40f")

    let loaded = false

    const $sel = $(".feed-selector")
    $(`<li class="feed-selector" id="exlg-benben-selector" data-mode="all"><a style="cursor: pointer">全网动态</a></li>`)
        .appendTo($sel.parent())
        .on("click", e => {
            const $this = $(e.currentTarget)
            $sel.removeClass("am-active")
            $this.addClass("am-active")

            $("#feed-more").hide()
            $("li.am-comment").remove()

            if (loaded) $("#exlg-benben").attr("src", $("#exlg-benben").attr("src"))
            else {
                const $sb = $(`<iframe id="exlg-benben" src="https://www.luogu.com.cn/robots.txt?benben"></iframe>`)
                    .appendTo($("body")).hide()
                log("Building springboard:", $sb[0])
                loaded = true
            }
        })

    uindow.addEventListener("message", e => {
        log("Listening message:", e.data)

        e.data.forEach(m =>
            $(`
<li class="am-comment am-comment-primary feed-li">
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
                <a name="feed-reply" onclick="">回复</a>
            </div>
        </header>
        <div class="am-comment-bd">
            <span class="feed-comment">
                ${ marked(m.content) }
            </span>
        </div>
    </div>
</li>`)
                .appendTo($("ul#feed"))
                .find("a[name=feed-reply]").on("click", () =>
                    $("textarea")
                        .trigger("focus").val(` || @${ m.user.name }: ${ m.content }`)
                        .trigger("input")
                )
        )
    })
})

mod.reg("rand-problem", "@/", () => {
    $($(".lg-index-stat")[0]).append(`
<h2>按难度随机跳题</h2>
<select class="am-form-field" name="rand-problem-rating" autocomplete="off" placeholder="选择难度">
    <option value="0">暂无评定</option>
    <option value="1">入门</option>
    <option value="2">普及-</option>
    <option value="3">普及/提高-</option>
    <option value="4">普及+/提高</option>
    <option selected value="5">提高+/省选-</option>
    <option value="6">省选/NOI-</option>
    <option value="7">NOI/NOI+/CTSC</option>
</select>
<select class="am-form-field" name="rand-problem-source" autocomplete="off" placeholder="选择来源">
    <option selected value="P">洛谷题库</option>
    <option value="CF">CodeForces</option>
    <option value="SP">SPOJ</option>
    <option value="AT">AtCoder</option>
    <option value="UVA">UVa</option>
</select>
<br />
<button class="am-btn am-btn-sm am-btn-primary" id="rand-problem">跳转</button>
    `)
    $("#rand-problem").click(() => {
        const rating = $("[name=rand-problem-rating]").val(), source = $("[name=rand-problem-source]").val()
        $.get(`/problem/list?difficulty=${rating}&type=${source}&page=1&_contentOnly=1`,
            res => {
                error.check_fe(res)
                const
                    problem_count = res.currentData.problems.count,
                    page_count = Math.ceil(problem_count / 50),
                    rand_page = Math.floor(Math.random() * page_count) + 1
                $.get(`/problem/list?difficulty=${rating}&type=${source}&page=${rand_page}&_contentOnly=1`,
                    res => {
                        error.check_fe(res)
                        const
                            list = res.currentData.problems.result,
                            rand_idx = Math.floor(Math.random() * list.length),
                            pid = list[rand_idx].pid
                        location.href = `/problem/${pid}`
                    }
                )
            }
        )
    })
}, `
.am-u-md-3 > .lg-index-stat {
    overflow-y: scroll !important;
}
`)

mod.reg("keyboard-and-cli", "@/*", () => {
    const $cli = $(`<div id="exlg-cli"></div>`).appendTo($("body"))
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
    }
    let cli_lang = GM_getValue("cli-lang") || 0

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
            name ??= "h"
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
            /* for <action> "enable|disable|toggle", opearte the mod named <name>. for <action> "save", save modification. */
            /* 当 <action> 为 "enable|disable|toggle"，对名为 <name> 的模块执行对应操作：启用|禁用|切换。当 <action> 为 "save"，保存修改。 */
            const i = mod.find_i(name)
            switch (action) {
            case "enable":
            case "disable":
            case "toggle":
                if (i < 0) return cli_error`mod: unknown mod "${name}"`
                const $mod = $($("#exlg-dash-mods").children()[i]).children()
                $mod.prop("checked", {
                    enable: () => true, disable: () => false, toggle: now => ! now
                }[action]($mod.prop("checked"))).trigger("change")
                break
            case "save":
                GM_setValue("mod-map", mod.map)
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
            lang = cli_langs.indexOf(lang)
            if (lang < 0) return cli_error`lang: unknown language ${lang}`
            GM_setValue("cli-lang", cli_lang = lang)
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
}

#exlg-cli-input.error {
    background-color: indianred;
}
`)

$(() => mod.execute())
log("Lauching")

Object.assign(uindow, {
    exlg: { mod, marked, log, error },
    $$: $, xss, version_cmp
})

