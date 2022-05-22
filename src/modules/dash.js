import uindow, {
    $, version_cmp, lg_usr,
} from "../utils.js";
import mod, { sto } from "../core.js";

// SVGs
import svg_logo from "../resources/image/logo.svg";
import exlg_settings_svg from "../resources/image/settings.svg";
import svg_gayhub from "../resources/image/gayhub.svg";
import svg_cross from "../resources/image/cross.svg";

import register_badge from "../components/register-badge.js";
import get_latest from "../components/get-latest.js";
import css from "../resources/css/dash-bridge.css";
import css_dash from "../resources/css/beautified-dash.css";
import css_dd from "../resources/css/beautified-dropdown.css";
import category from "../category.js";
import compo from "../compo-core.js";
import { scm } from "../schema.js";
import exlg_alert from "../components/exlg-dialog-board.js";

mod.reg_main("dash-board", "控制面板", mod.path_dash_board, {
    msg: {
        ty: "object",
        priv: true,
        lvs: {
            queue: {
                ty: "array", itm: {
                    ty: "object", lvs: {
                        text: { ty: "string" },
                        id: { ty: "number" },
                    },
                },
            },
            last_id: { ty: "number", dft: 0 },
        },
    },
    lang: {
        ty: "enum", dft: "zh", vals: ["zh", "en"],
        info: ["Language of descriptions in the dashboard", "控制面板提示语言"],
    },
    load_speed: {
        ty: "number", dft: 10, min: 0, max: 10, info: ["Dash animation speed", "dash 动画速度"],
    },
}, () => {
    const toSettings = (scmRoot, path = []) => Object.entries(scmRoot)
        .filter(([k, s]) => (path.length || k !== "on") && !s.priv)
        .flatMap(([k, s]) => (s.ty === "object" ? toSettings(s.lvs, path.concat(k)) : {
            name: path.concat(k),
            displayName: k.split("_").map((t) => t.toInitialCase()).join(" "),
            description: s.info,
            type: {
                number: "SLIDER", boolean: "CHECKBOX", string: "TEXTBOX", enum: "SELECTBOX",
            }[s.ty],
            ...(s.ty === "number" && { minValue: s.min, maxValue: s.max, increment: s.step }),
            ...(s.ty === "enum" && { acceptableValues: s.vals }),
        }));
    const modules = [...category._]
        .map(([name, {
            description, alias, icon, unclosable,
        }]) => ({
            name, description, icon,
            children: (name === "component" ? [...compo._] : [...mod._].filter(([, m]) => m.cate === name))
                .map(([nm, m]) => ({
                    rawName: alias + nm,
                    name: nm,
                    description: m.info,
                    unclosable,
                    // Note: 有个傻狗注释掉了然后出锅了，我不说是谁。
                    settings: toSettings(scm[alias + nm]?.lvs ?? {}),
                })),
        }));
    console.log(modules);
    uindow.guiStart(modules);
});
mod.reg_hook_new("dash-bridge", "控制桥", "@/.*", {
    source: {
        ty: "enum", vals: ["exlg", "gh_index", "debug"], dft: "exlg",
        info: ["The website to open when clicking the exlg button", "点击 exlg 按钮时打开的网页"],
    },
    beautify_dropdown: {
        ty: "boolean", dft: true,
        info: ["Beautify Dropdown", "右上角用户信息卡美化"],
    },
    beautify_dash: {
        ty: "boolean", dft: true,
        info: ["Beautify Dash Board", "控制桥面板美化"],
    },
    enable_rclick: {
        ty: "boolean", dft: true,
        info: ["Use Right Click to change source", "右键点击按钮换源"],
    },
    latest_ignore: { // Note: 最新忽略版本更新提示的版本
        ty: "string", dft: "0.0.0",
    },
}, ({ msto, args }) => {
    if (["exlg", "gh_index", "debug"].indexOf(msto.source) === -1) msto.source = "exlg";

    const { $tar } = args;
    const jumpSettings = () => uindow.exlg.dash = uindow.open({
        exlg: "https://dash.exlg.cc/index.html",
        gh_index: "https://extend-luogu.github.io/exlg-setting-new/index.html",
        debug: "localhost:1634/index.html",
    }[msto.source]);

    // Note: 美化
    if (msto.beautify_dropdown) {
        GM_addStyle(css_dd);
        const renewAlink = (_i, e, $e = $(e)) => {
            $e.addClass("exlg-dash-options");
            e.innerHTML = `<div class="link-title">${e.innerHTML}</div>`;
        };
        if (args.type === 2) {
            renewAlink(0, $tar[0], $tar);
            return;
        } // Note: 因为这个原因要放到最前面去，否则会先执行 $btn.prependTo($tar).
        const renewDropdown = ($board, $cb) => {
            // Note: 测试过了不然没办法保证这个 css 只在全页面出现一次
            $board.children(".header").after(`<style>${css_dd}</style>`)
                .after(`
                <div style="margin-top: 0.4em;">
                    <a class="exlg-dropdown field" href="//www.luogu.com.cn/user/${lg_usr.uid}#following.following">
                        <span class="value">${lg_usr.followingCount}</span>
                        <span data-v-3c4577b8="" class="key">关注</span>
                    </a>
                    <a class="exlg-dropdown field" href="//www.luogu.com.cn/user/${lg_usr.uid}#following.follower">
                        <span class="value">${lg_usr.followerCount}</span>
                        <span data-v-3c4577b8="" class="key">粉丝</span>
                    </a>
                    <a class="exlg-dropdown field" href="//www.luogu.com.cn/user/notification">
                        <span class="value">${lg_usr.unreadNoticeCount + lg_usr.unreadMessageCount}</span>
                        <span data-v-3c4577b8="" class="key">动态</span>
                    </a>
                </div>
                `)
                .after(`
                <div class="exlg-dropdown field">
                    <span data-v-3c4577b8="" class="key-small">CCF 评级: <strong>${lg_usr.ccfLevel}</strong> | 咕值排行: <strong>${lg_usr.ranking}</strong></span>
                </div>
                `);
            $cb.each(renewAlink);
            const $exlg = $($cb[5]).clone().attr("href", "javascript:void 0");
            $exlg.on("click", jumpSettings);
            $($cb[5]).after($exlg);
            $exlg.children("div.link-title").html(`${exlg_settings_svg} 插件设置`);
        };
        if ($tar.hasClass("user-nav") || $tar.parent().hasClass("user-nav")) renewDropdown($tar.find(".dropdown > .center"), $tar.find(".ops > a"));
    }

    // Note: 按钮
    const $hov = $(`<span id="exlg-dash-wrapper"></span>`).prependTo($tar);
    const $spn = $(`<span id="exlg-dash-window" class="exlg-window"></span>`).css("left", "-125px");
    const $btn = $(`<div id="exlg-dash" exlg="exlg">exlg</div>`)
        .prependTo($hov)
        .css("backgroundColor", {
            exlg: "cornflowerblue",
            gh_index: "darkblue",
            debug: "steelblue",
            // gh_bundle: "darkslateblue"
        }[msto.source])
        .css("margin-top", $tar.hasClass("nav-container") ? "5px" : "0px");
    if (msto.enable_rclick) {
        $btn.on("contextmenu", false)
            .on("mousedown", (e) => {
                if (!e.button) jumpSettings();
                else if (e.button === 2) {
                    msto.source = {
                        exlg: "gh_index",
                        gh_index: "debug",
                        debug: "exlg",
                    }[msto.source];
                    $btn.css("backgroundColor", {
                        exlg: "cornflowerblue",
                        gh_index: "darkblue",
                        debug: "steelblue",
                    }[msto.source]);
                }
            });
    } else $btn.on("click", jumpSettings);

    // Note: 创建窗口。
    const create_window = !$tar.parent().hasClass("mobile-nav-container");
    if (create_window) {
        if (msto.beautify_dash) {
            $spn.append(`<style>${css_dash}</style>`);
        }
        $spn.appendTo($hov);

        $(`<h2 align="center" style="margin-top: 5px;margin-bottom: 10px;">${svg_logo}</h2>`).appendTo($spn);
        const $bdiv = $(`<div id="exlg-windiv"></div>`).appendTo($spn);

        const _list = [
            { tag: "vers", title: "版本", buttons: [] },
            {
                tag: "source", title: "源码", buttons: [
                    { html: "OSS", url: "https://exlg.oss-cn-shanghai.aliyuncs.com/latest/dist/extend-luogu.min.user.js" },
                    { html: "JsDelivr", url: `https://fastly.jsdelivr.net/gh/extend-luogu/extend-luogu${sto["#get-latest"].fetch_preview ? "@preview" : ""}/dist/extend-luogu.min.user.js` },
                    { html: "Raw", url: `https://github.com/extend-luogu/extend-luogu/raw/${sto["#get-latest"].fetch_preview ? "preview" : "latest"}/dist/extend-luogu.min.user.js` },
                    /*
                    { html: "FastGit", url: "https://hub.fastgit.xyz/extend-luogu/extend-luogu/raw/latest/dist/extend-luogu.min.user.js" },
                    */
                ],
            },
            {
                tag: "link", title: "链接", buttons: [
                    { html: "官网", url: "https://exlg.cc" },
                    {
                        col: "#666", html: `<a style="height: 8px;width: 8px;">${svg_gayhub}</a>Github`, url: "https://github.com/extend-luogu/extend-luogu",
                    },
                    { html: "爱发电", url: "https://afdian.net/@extend-luogu" },
                ],
            },
            {
                tag: "help", title: "帮助", buttons: [
                    { html: "官方文档", url: "https://docs.exlg.cc" },
                    { html: "用户协议", url: "https://docs.exlg.cc/POLICY.html" },
                ],
            },
            {
                tag: "badge", title: "badge", buttons: [
                    { html: "注册/修改", onclick: () => register_badge() },
                ],
            },
            {
                tag: "debug", title: "debug", buttons: [
                    {
                        html: "清除所有油猴缓存", onclick: () => {
                            exlg_alert(`你确定要这么做吗？<br/><strong style="color: red;">数据将不可恢复！</strong>`, "exlg 警告！", () => {
                                GM_listValues().forEach(GM_deleteValue);
                                location.reload();
                                return true;
                            });
                        },
                    },
                    {
                        html: "刷新 token", onclick: () => {
                            exlg_alert(`点击确定以刷新用户 token。`, "exlg 提醒您", async () => {
                                await mod.execute("token");
                                location.reload();
                                return true;
                            });
                        },
                    },
                ],
            },
        ];

        _list.forEach((e) => {
            const $div = $(`<div id="${e.tag}-div"><span class="exlg-windiv-left-tag">${e.title}</span></div>`).appendTo($bdiv),
                $span = $("<span></span>").appendTo($div);
            e.buttons.forEach((btn) => {
                const col = btn.col ?? "#66ccff";
                $(`<span class="exlg-windiv-btnspan"></span>`)
                    .append($(`<button class="exlg-windiv-btn" style="background-color: ${col};border-color: ${col};">${btn.html}</button>`)
                        .on("click", btn.onclick ?? (() => location.href = btn.url)))
                    .appendTo($span);
            });
            if (e.tag === "vers") {
                $span.append($(`<span id="version-text" style="min-width: 60%; margin-left: 5px;">
    <span title="当前版本">${GM_info.script.version}</span>
    <span id="vers-comp-operator" style="margin-left: 5px;"></span>
    <span id="latest-version" style="margin-left: 5px;"></span>
    <span id="annoyingthings"></span></span>"`));
                const $check_btn = $(`<button class="exlg-windiv-btn" style="background-color: red;border-color: red;float: right;margin: 0 20px 0 0;">刷新</button>`),
                    $operator = $span.find("#vers-comp-operator"),
                    $latest = $span.find("#latest-version"),
                    $fuckingdots = $span.find("#annoyingthings");
                const _check = async () => {
                    $operator.text("");
                    $latest.text("");
                    $fuckingdots.html("");
                    const [latest, op] = await get_latest();
                    $operator.html(op).css("color", { "<<": "#fe4c61", "==": "#52c41a", ">>": "#3498db" }[op]);
                    $latest.text(latest).attr("title", "最新版本");
                    $fuckingdots.html({ "<<": `<i class="exlg-icon exlg-info" name="有新版本"></i>`, ">>": `<i class="exlg-icon exlg-info" name="内测中！"></i>` }[op] || "").children().css("cssText", "position: absolute;display: inline-block;");
                    if (op === "<<" && version_cmp(msto.latest_ignore, latest) === "<<") {
                        const $ignore_vers = $(`<span style="color: red;margin-left: 30px;">${svg_cross}</span>`).on("click", () => {
                            msto.latest_ignore = latest;
                            $ignore_vers.hide();
                        }).appendTo($fuckingdots);
                    }
                    if (op === "==") msto.latest_ignore = GM_info.script.version;
                };
                $check_btn.on("click", _check).appendTo($span);
                // Note: TODO: 最后放一个按钮查找，加个最新版本忽略机制，每次忽略之后对于小于等于那个版本的都不管
                // Note: 如果不是最新版本，那么加 2 个按钮 (弹窗通知，忽略，最后一个是查找)
                // Note: 版本老了红色，版本对了绿色，版本新了蓝色（指测试版
                // Note: 新版显示提示。
            }
        });
    }
}, (e) => {
    const $etar = $(e.target);
    if (e.target.tagName.toLowerCase() === "a" && $etar.hasClass("color-none") && $etar.parent().hasClass("ops") && (!$etar.hasClass("exlg-dash-options"))) return { result: 2, args: { $tar: $(e.target), type: 2 } };
    const $tmp = $etar.find(".user-nav, .nav-container");
    if ($tmp.length && (!$tmp.find("#exlg-dash-window").length)) return { result: ($tmp.length), args: { $tar: ($tmp[0].tagName === "DIV" ? $($tmp[0].firstChild) : $tmp), type: 1 } }; // Note: 直接用三目运算符不用 if 会触发 undefined 的 tagName
    return { result: 0 }; // Note: 上一行的 div 判断是用来防止变成两行的
}, () => ({ $tar: $("nav.user-nav, div.user-nav > nav, .nav-container"), type: 0 }), css, "core");
