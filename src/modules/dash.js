import uindow, { $, version_cmp, get_latest, exlg_alert } from "../utils.js"
import mod from "../core.js"
import logo from "../resources/logo.js"

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
    const modules = [["Modules", "功能", "tunes", false], ["Core", "核心", "bug_report", true]]
        .map(([name, description, icon, is_main]) => ({
            name, description, icon,
            children: (() => {
                let arr = []
                mod._.forEach((m, nm) => {
                    if (nm.startsWith("@") === is_main)
                        arr.push({
                            rawName: nm,
                            name: nm.replace(/^[@^]/g, ""),
                            description: m.info,
                            settings: Object.entries(mod.data[nm].lvs)
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
                        })
                })
                return arr
            })()
        }))
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

    const $tar = args.$tar
    // console.log(args, $tar)
    const _right_svg = `<svg class="icon" style="width: 1.2em;height: 1.2em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1697"><path d="M644.266667 494.933333l-192 192-29.866667-29.866666 162.133333-162.133334-162.133333-162.133333 29.866667-29.866667 192 192z" fill="#444444" p-id="1698"></path></svg>`
    const __renew_alink = (_i, e, $e = $(e)) => {
        // console.log(e, e.innerHTML)
        $e.addClass("exlg-dash-options")
        e.innerHTML = `<div class="link-title">${e.innerHTML}</div> ${_right_svg}`
    }
    if (args.type === 2) {
        __renew_alink(114514, $tar[0], $tar)
        return
    }

    const create_window = ! $tar.parent().hasClass("mobile-nav-container")
    const $spn = $(`<span id="exlg-dash-window" class="exlg-window" style="display: none;"></span>`).css("left", "-125px")
    const $btn = $(`<div id="exlg-dash" exlg="exlg">exlg</div>`)
        .prependTo($tar)
        .css("backgroundColor", {
            exlg: "cornflowerblue",
            gh_index: "darkblue",
            debug: "steelblue"
            // gh_bundle: "darkslateblue"
        }[msto.source])
        .css("margin-top", $tar.hasClass("nav-container") ? "5px" : "0px")
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

    const renew_dropdown = ($board, $cb) => {
        const _cuser = uindow._feInjection.currentUser
        $board.children(".header").after(`
        <div>
            <a class="exlg-dropdown field" href="//www.luogu.com.cn/user/${_cuser.uid}#following.follower">
                <span class="value">${_cuser.followingCount}</span>
                <span data-v-3c4577b8="" class="key">关注</span>
            </a>
            <a class="exlg-dropdown field" href="//www.luogu.com.cn/user/${_cuser.uid}#following.following">
                <span class="value">${_cuser.followerCount}</span>
                <span data-v-3c4577b8="" class="key">粉丝</span>
            </a>
            <a class="exlg-dropdown field" href="//www.luogu.com.cn/user/notification">
                <span class="value">${_cuser.unreadNoticeCount + _cuser.unreadMessageCount}</span>
                <span data-v-3c4577b8="" class="key">动态</span>
            </a>
        </div>
        `)
        $board.children(".header").after(`
        <div class="exlg-dropdown field">
            <span data-v-3c4577b8="" class="key-small">CCF 评级: <strong>${_cuser.ccfLevel}</strong></span>
            <span data-v-3c4577b8="" class="key-small">咕值排行: <strong>${_cuser.ranking}</strong></span>
        </div>
        `)
        $cb.each(__renew_alink)
        const $exlg = $($cb[5]).clone().attr("href", "javascript:void 0")
        $exlg.on("click", _jump_settings)
        $($cb[5]).after($exlg)
        $exlg.children("div.link-title").html(`<svg data-v-a97ae32a="" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="code" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="svg-inline--fa fa-code fa-w-20"><path data-v-a97ae32a="" fill="currentColor" d="M278.9 511.5l-61-17.7c-6.4-1.8-10-8.5-8.2-14.9L346.2 8.7c1.8-6.4 8.5-10 14.9-8.2l61 17.7c6.4 1.8 10 8.5 8.2 14.9L293.8 503.3c-1.9 6.4-8.5 10.1-14.9 8.2zm-114-112.2l43.5-46.4c4.6-4.9 4.3-12.7-.8-17.2L117 256l90.6-79.7c5.1-4.5 5.5-12.3.8-17.2l-43.5-46.4c-4.5-4.8-12.1-5.1-17-.5L3.8 247.2c-5.1 4.7-5.1 12.8 0 17.5l144.1 135.1c4.9 4.6 12.5 4.4 17-.5zm327.2.6l144.1-135.1c5.1-4.7 5.1-12.8 0-17.5L492.1 112.1c-4.8-4.5-12.4-4.3-17 .5L431.6 159c-4.6 4.9-4.3 12.7.8 17.2L523 256l-90.6 79.7c-5.1 4.5-5.5 12.3-.8 17.2l43.5 46.4c4.5 4.9 12.1 5.1 17 .6z" class=""></path></svg> 插件设置`)
    }
    window.renew_dropdown = () => renew_dropdown($tar.find(".dropdown > .center"), $tar.find(".ops > a"))
    // log($tar.hasClass("user-nav") || $tar.parent().hasClass("user-nav"), $tar.find(".dropdown > .center"))
    if ($tar.hasClass("user-nav") || $tar.parent().hasClass("user-nav")) renew_dropdown($tar.find(".dropdown > .center"), $tar.find(".ops > a"))
    if (create_window) {
        $spn.prependTo($tar)
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

        $(`<h2 align="center" style="margin-top: 5px;margin-bottom: 10px;">${logo}</h2>`).appendTo($spn)
        const $bdiv = $(`<div id="exlg-windiv"></div>`).appendTo($spn)

        const _list = [
            { tag: "vers", title: "版本", buttons: [ ] },
            { tag: "source", title: "源码", buttons: [
                { html: "JsDelivr", url: "https://cdn.jsdelivr.net/gh/extend-luogu/extend-luogu/dist/extend-luogu.min.user.js" },
                { html: "Raw", url: "https://github.com/extend-luogu/extend-luogu/raw/latest/dist/extend-luogu.min.user.js" },
                { html: "FastGit", url: "https://hub.fastgit.xyz/extend-luogu/extend-luogu/raw/latest/dist/extend-luogu.min.user.js" }
            ] },
            { tag: "link", title: "链接", buttons: [
                { html: "官网", url: "https://exlg.cc" },
                { col: "#666", html: `<a style="height: 8px;width: 8px;"><svg aria-hidden="true" height="12" viewBox="0 0 16 16" version="1.1" width="12" data-view-component="true" class="octicon octicon-mark-github">
                <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg></a>Github`, url: "https://github.com/extend-luogu/extend-luogu" },
                { html: "爱发电", url: "https://afdian.net/@extend-luogu" }
            ] },
            { tag: "help", title: "帮助", buttons: [
                { html: "官方", url: "https://github.com/extend-luogu/extend-luogu/blob/main/README.md" },
                { html: "镜像", url: "https://hub.fastgit.xyz/extend-luogu/extend-luogu/blob/main/README.md" },
                { html: "用户协议", url: "https://www.luogu.com.cn/paste/3f7anw16" }
            ] },
            { tag: "lhyakioi", title: "badge", buttons: [
                { html: "注册", onclick: () => exlg_alert("暂未实现，请加群根据群公告操作。") }, // todo: 自动注册 badge
                { html: "修改", onclick: () => exlg_alert("暂未实现，请加群根据群公告操作。") },
            ] }
        ]
        _list.forEach((e) => {
            const $div = $(`<div id="${ e.tag }-div"><span class="exlg-windiv-left-tag">${ e.title }</span></div>`).appendTo($bdiv),
                $span = $("<span></span>").appendTo($div)
            e.buttons.forEach((btn) => {
                let col = btn.col ?? "#66ccff"
                $(`<span class="exlg-windiv-btnspan"></span>`)
                    .append($(`<button class="exlg-windiv-btn" style="background-color: ${ col };border-color: ${ col };">${ btn.html }</button>`)
                        .on("click", btn.onclick ?? (() => location.href = btn.url)))
                    .appendTo($span)
            })
            if (e.tag === "vers") {
                $span.append($(`<span id="version-text" style="min-width: 60%; margin-left: 5px;">
    <span title="当前版本">${ GM_info.script.version }</span>
    <span id="vers-comp-operator" style="margin-left: 5px;"></span>
    <span id="latest-version" style="margin-left: 5px;"></span>
    <span id="annoyingthings"></span></span>"`))
                const $check_btn = $(`<button class="exlg-windiv-btn" style="background-color: red;border-color: red;float: right;margin: 0 20px 0 0;">刷新</button>`),
                    $operator = $span.find("#vers-comp-operator"), $latest = $span.find("#latest-version"), $fuckingdots = $span.find("#annoyingthings")
                const _check = () => {
                    $operator.text(""), $latest.text(""), $fuckingdots.html("")
                    get_latest((latest, op) => {
                        $operator.html(op).css("color", { "<<": "#fe4c61", "==": "#52c41a", ">>": "#3498db" }[op])
                        $latest.text(latest).attr("title", "最新版本")
                        $fuckingdots.html({ "<<": `<i class="exlg-icon exlg-info" name="有新版本"></i>`, ">>": `<i class="exlg-icon exlg-info" name="内测中！"></i>`}[op] || "").children().css("cssText", "position: absolute;display: inline-block;")
                        if (op === "<<" && version_cmp(msto.latest_ignore, latest) === "<<") {
                            const $ignore_vers = $(`<span style="color: red;margin-left: 30px;"><svg class="icon" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" width="24" height="24" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5446"><path d="M512 128c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384-172.3-384-384-384z m0 717.4c-183.8 0-333.4-149.6-333.4-333.4S328.2 178.6 512 178.6 845.4 328.2 845.4 512 695.8 845.4 512 845.4zM651.2 372.8c-9.9-9.9-25.9-9.9-35.8 0L512 476.2 408.6 372.8c-9.9-9.9-25.9-9.9-35.8 0-9.9 9.9-9.9 25.9 0 35.8L476.2 512 372.8 615.4c-9.9 9.9-9.9 25.9 0 35.8 4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4L512 547.8l103.4 103.4c4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4c9.9-9.9 9.9-25.9 0-35.8L547.8 512l103.4-103.4c9.9-9.9 9.9-25.9 0-35.8z" p-id="5447"></path></svg></span>`).on("click", () => {
                                msto.latest_ignore = latest
                                $ignore_vers.hide()
                            }).appendTo($fuckingdots)
                        }
                        if (op === "==") msto.latest_ignore = GM_info.script.version
                    })
                }
                $check_btn.on("click", _check).appendTo($span)
                // Note: TODO: 最后放一个按钮查找，加个最新版本忽略机制，每次忽略之后对于小于等于那个版本的都不管
                // Note: 如果不是最新版本，那么加2个按钮(弹窗通知，忽略，最后一个是查找)
                // Note: 版本老了红色，版本对了绿色，版本新了蓝色（指测试版
                // Note: 新版显示提示。
            }
        })


    }
}, (e) => {
    const $etar = $(e.target)
    if (e.target.tagName.toLowerCase() === "a" && $etar.hasClass("color-none") && $etar.parent().hasClass("ops") && (! $etar.hasClass("exlg-dash-options")))
        return { result: 2, args: { $tar: $(e.target), type: 2 } }
    const $tmp = $etar.find(".user-nav, .nav-container")
    if ($tmp.length/* && !$("#exlg-dash-window").length */) return { result: ($tmp.length), args: { $tar: ($tmp[0].tagName === "DIV" ? $($tmp[0].firstChild) : $tmp), type: 1 } } // Note: 直接用三目运算符不用 if 会触发 undefined 的 tagName
    else return { result: 0 } // Note: 上一行的 div 判断是用来防止变成两行的
}, () => { return { $tar: $("nav.user-nav, div.user-nav > nav, .nav-container"), type: 0 } }, `
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
        width: 300px;
        /* height: 300px; */
        padding: 15px;
        background: white;
        color: black;
        border-radius: 7px;
        box-shadow: rgb(187 227 255) 0px 0px 7px;
    }
    .exlg-windiv-left-tag {
        /* border-right: 1px solid #eee; */
        height: 2em;
        width: 18%;
        margin-right: 10px;
        display: inline-block;
        text-align: center;
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
        margin: 4px;

    }

    .dropdown > .center {
        padding: 0 24px 18px;
    }
    .ops>a>.link-title {
        display: flex;
        align-items: center;
    }
    .ops>a>.link-title>svg {
        margin-right: 8px;
        width: 16px;
    }
    .ops>a[class] {
        width: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2px;
        padding: 6px 14px;
        border-radius: 8px;
        color: var(--text2);
        font-size: 14px;
        cursor: pointer;
        transition: background-color .3s;
        margin-bottom: 0.4em;
        margin-top: 0.4em;
    }
    .ops>a:hover {
        background-color: rgb(227,229,231);
    }

    .exlg-dropdown.field {
        display: inline-block;
        border-left: none;
        padding: 0 .8em;
    }
    .exlg-dropdown.field:hover {
        color: #00aeec!important;
    }
    .exlg-dropdown.field:hover > .value {
        color: #00aeec!important;
    }
    .exlg-dropdown.field:hover > .key {
        color: #00aeec!important;
    }
    .exlg-dropdown.field > .value {
        display: block;
        text-align: center;
        line-height: 1.5;
        font-weight: 700;
        
        color: #6c757d;
        font-size: 18px;
        transition: color .2s;
    }
    .exlg-dropdown.field > .key {
        display: block;
        text-align: center;
        /* font-size: 0.5em; */

        color: #9499a0;
        font-weight: 400;
        font-size: 12px;
        transition: color .2s;
    }
    .exlg-dropdown.field > .key-small {
        display: block;
        text-align: center;
        /* font-size: 0.5em; */

        color: #9499a0;
        font-weight: 400;
        font-size: 8px;
        transition: color .2s;
    }
    
`)