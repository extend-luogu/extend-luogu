// ==UserScript==
// @name           extend-luogu
// @namespace      http://tampermonkey.net/
// @version        3.5
// @description    Make Luogu more powerful.
// @author         optimize_2 ForkKILLET
// @match          https://*.luogu.com.cn/*
// @match          https://*.luogu.org/*
// @match          https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121
// @require        https://cdn.luogu.com.cn/js/jquery-2.1.1.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/marked/1.2.7/marked.js
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          unsafeWindow
// ==/UserScript==

// ==Utilities==

const uindow = unsafeWindow
const $ = jQuery; uindow.$$ = $
const mdp = uindow.markdownPalettes
const log = (...s) => uindow.console.log("%c[exlg]", "color: #0e90d2;", ...s)
const error = (...s) => {
    uindow.console.error("%c[exlg]", "color: #0e90d2;", ...s)
    throw Error(s.join(" "))
}
error.check_fe = fe => {
    if (fe.code !== 200) error(`Requesting failure code: ${ fe.code }.`)
}

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

// ==Modules==

const mod = {
    _: [],
    _user_tab: (func, tab) => {
        const $tabs = $(".items")
        const work = () => {
            if ((location.hash || "#main") !== "#" + tab) return
            $tabs.off("click", work)
            func()
        }
        $tabs.on("click", work)
        work()
    },
    reg: (name, path, func, styl) => mod._.push({
        name, path: Array.isArray(path) ? path : [ path ], func, styl
    }),
    reg_user_tab: (name, tab, vars, func, styl) => mod._.push({
        name, path: [ "@/user/*" ],
        func: () => mod._user_tab(() => {
            log(`Working user tab#${tab} mod: "${name}"`)
            func(vars?.())
        }, tab),
        styl
    }),
    find: name => mod._.find(m => m.name === name),
    disable: name => { mod.find(name).on = false },
    enable: name => { mod.find(name).on = true },
    execute: () => {
        let mods_switch = GM_getValue("mods-switch")
        const init_switch = mods_switch ? false : (mods_switch = {})
        for (const m of mod._)
            m.on = init_switch ? (mods_switch[ m.name ] = true) : mods_switch[ m.name ]
        for (const m of mod._) {
            const pn = location.pathname
            if (m.on && m.path.some((p, _, __, pr = p.replace(/^[a-z]*?@.*?(?=\/)/, "")) => (
                p.startsWith("@/") && location.host === "www.luogu.com.cn" ||
                p.startsWith("@cdn/") && location.host === "cdn.luogu.com.cn" ||
                p.startsWith("@tcs/") && location.host === "service-ig5px5gh-1305163805.sh.apigw.tencentcs.com"
            ) && (
                p.endsWith("*") && pn.startsWith(pr.slice(0, -1)) ||
                pn === pr
            ))) {
                if (m.styl) GM_addStyle(m.styl)
                m.func()
                log(`Executing mod: "${m.name}"`)
                if (m.name[0] === "@") break
            }
        }

        if (init_switch) GM_setValue("mods-switch", mods_switch)
    }
}

mod.reg("@springboard", "@/robots.txt", () => {
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

mod.reg("@benben-data", "@tcs/release/APIGWHtmlDemo-1615602121", () => {
    const data = JSON.parse(document.body.innerText)
    uindow.parent.postMessage(data, "*")
})

mod.reg("dash", "@/*", () => {
    const $dash = $(`<div id="exlg-dash">exlg</div>`).prependTo($(".user-nav > nav"))
    const $win = $(`
<span id="exlg-dash-window">
    <p><b>版本</b> <span id="exlg-dash-verison">${ GM_info.script.version }</span></p>
    <p><b>模块管理</b> <a id="exlg-dash-mods-save">保存刷新</a>
    <ul id="exlg-dash-mods"></ul></p>
	<p><a href="https://github.com/optimize-2/extend-luogu">GitHub</a></p>
</span>
    `)
        .appendTo($dash)
        .on("click", e => e.stopPropagation())

    const $mods = $("#exlg-dash-mods")
    const mods_switch = GM_getValue("mods-switch")
    mod._.forEach(m => {
        const $m = $(`<li><input type="checkbox" /></span> ${ m.name }</li>`).appendTo($mods)
        $m.children("input")
            .prop("checked", m.on).prop("disabled", m.name === "dash")
            .on("change", () => {
                mods_switch[ m.name ] = ! mods_switch[ m.name ]
            })
    })
    $("#exlg-dash-mods-save").on("click", () => {
        GM_setValue("mods-switch", mods_switch)
        location.reload()
    })

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
#exlg-dash-mods > li > span {
    
}

/* global */

.exlg-info::before {
    content: "i";

    display: inline-block;
    padding: 0 10px 0 8px;
    margin-left: 3px;

    color: white;
    background-color: deepskyblue;
    font-style: italic;
    font-weight: bold;

    border-radius: 50%;
}
.exlg-info:hover::after {
    display: inline-block;
}
.exlg-info::after {
    display: none;
    content: attr(name);
    
    margin-left: 5px;
    padding: 0 3px;

    background-color: white;
    box-shadow: 0 0 7px deepskyblue;
    
    border-radius: 7px;
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

    const $fold = $(`<li>exlg <i class="fa fa-chevron-left"></li>`)
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

mod.reg("update", "@/*", () => {
    $.get("https://www.luogu.com.cn/paste/ijxozv3z", data => {
        const
            latest = data.match(/(%5C%2F){3}(.+?)(%5C%2F){3}/)[2].replaceAll("%20", " "),
            version = GM_info.script.version
        const v = [ version, latest ].map(s => {
            const [ nu, ex ] = s.split(" ")
            return { nu: + nu, ex: ex ? [ "pre", "alpha", "beta" ].indexOf(ex) : -1 }
        })
        let l = `Comparing version: ${version} -- ${latest}`
        if (v[0].nu < v[1].nu || v[0].nu === v[1].nu && v[0].ex < v[1].ex) {
            l = l.replace("--", "!!")
            const $alert = $(`<div>`
                + `<button type="button" class="am-btn am-btn-warning am-btn-block">onclick="">extend-luogu 已有更新的版本 ${latest}. 点我更新</button>`
                + `</div>`)
            $("#app").before($alert)
            $alert.children().on("click", () => uindow.open("/paste/fnln7ze9"))
        }
        log(l)
        $("#exlg-dash-verison").html(l.split(": ")[1])
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
        case "frame":
            arg[0] = `<iframe src="/robots.txt?url=${ encodeURI(arg[0]) }"`
                   + `style="width: ${ arg[1] }; height: ${ arg[2] };"></iframe>`
        case "html":
            $e.replaceWith($(arg[0]))
            break
        case "blog":
            if ($blog.text().trim() !== "个人博客") return
            $blog.attr("href", arg)
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
            + `<i class="exlg-info" name="ta 的 &lt;&gt; 我的 : 相同"></i></span>`)
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
    margin-bottom: 1.3em;
    background-color: #fff;
    box-shadow: 0 1px 3px rgb(26 26 26 / 10%);
    box-sizing: border-box;
    padding: 1.3em;
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
    const check_color = [ "#3498db", "#f1c40f", "#5eb95e" ]
    const check = lv => ~~ (lv / 3)
        ? `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="${ check_color[ ~~ (lv / 3) - 1 ]}" style="margin-bottom: -3px;">
        <path d="M16 8C16 6.84375 15.25 5.84375 14.1875 5.4375C14.6562 4.4375 14.4688 3.1875 13.6562 2.34375C12.8125 1.53125 11.5625 1.34375 10.5625 1.8125C10.1562 0.75 9.15625 0 8 0C6.8125 0 5.8125 0.75 5.40625 1.8125C4.40625 1.34375 3.15625 1.53125 2.34375 2.34375C1.5 3.1875 1.3125 4.4375 1.78125 5.4375C0.71875 5.84375 0 6.84375 0 8C0 9.1875 0.71875 10.1875 1.78125 10.5938C1.3125 11.5938 1.5 12.8438 2.34375 13.6562C3.15625 14.5 4.40625 14.6875 5.40625 14.2188C5.8125 15.2812 6.8125 16 8 16C9.15625 16 10.1562 15.2812 10.5625 14.2188C11.5938 14.6875 12.8125 14.5 13.6562 13.6562C14.4688 12.8438 14.6562 11.5938 14.1875 10.5938C15.25 10.1875 16 9.1875 16 8ZM11.4688 6.625L7.375 10.6875C7.21875 10.8438 7 10.8125 6.875 10.6875L4.5 8.3125C4.375 8.1875 4.375 7.96875 4.5 7.8125L5.3125 7C5.46875 6.875 5.6875 6.875 5.8125 7.03125L7.125 8.34375L10.1562 5.34375C10.3125 5.1875 10.5312 5.1875 10.6562 5.34375L11.4688 6.15625C11.5938 6.28125 11.5938 6.5 11.4688 6.625Z"></path>
    </svg>`
        : ""

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
                    </a>&nbsp
                    <a class="sb_amazeui" target="_blank" href="/discuss/show/142324">
                        ${ check(m.user.ccfLevel) }
                    </a>
                    ${ m.user.badge ? `<span class="am-badge am-radius lg-bg-${ color[m.user.color] }">${ m.user.badge }</span>` : "" }
                </span>&nbsp;
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

mod.reg("keyboard", [ "@/discuss/lists", "@/discuss/show/*" ], () => {
    uindow.addEventListener("keydown", e => {
        const $act = $(document.activeElement)
        if ($act.is("body")) {
            const rel = { ArrowLeft: "prev", ArrowRight: "next" }[e.code]
            if (rel) $(`a[rel=${rel}]`)[0].click()
        }
        else if ($act.is("[name=captcha]") && e.code === "Enter")
            $("#submitpost, #submit-reply")[0].click()
    })
})

$(mod.execute)
log("Lauching")

Object.assign(uindow, { exlg: { mod, marked, log, error } })

