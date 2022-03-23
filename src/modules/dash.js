import uindow, { version_cmp, get_latest, exlg_alert } from "../utils.js"
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

    const create_window = ! args.parent().hasClass("mobile-nav-container")
    const $spn = $(`<span id="exlg-dash-window" class="exlg-window" style="display: none;"></span>`).css("left", "-125px")
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
            ] },
            { tag: "outdated", title: "过时文档", buttons: [
                { html: "fx", url: "https://www.luogu.com.cn/blog/100250/extend-luogu-si-yong-zhi-na" },
                { html: "int128", url: "https://www.luogu.com.cn/blog/NaCl7/extend-luogu-usage" }
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
`)