import mod from "../core.js"
import { msg } from "../defs.js"
import { $, judge_problem, lg_dat, lg_content } from "../utils.js"

import hidesol_css from "../resources/css/hide-solution.css"
import backtocont_css from "../resources/css/back-to-contest.css"

mod.reg("dbc-jump", "双击题号跳题", "@/.*", null, () => {
    $(document).on("dblclick", e => {
        const pid = window.getSelection().toString().trim().toUpperCase()
        const url = e.ctrlkey
            ? $(".ops > a[href*=blog]").attr("href") + "solution-"
            : "https://www.luogu.com.cn/problem/"
        if (judge_problem(pid)) window.open(url + pid)
    })
})

mod.reg("hide-solution", "隐藏题解", [ "@/problem/[A-Z0-9]+", "@/problem/solution/.*" ], { // Note: 为了避免识别成题目列表
    hidesolu: { ty: "boolean", dft: false, priv: true },
    on: { ty: "boolean", dft: false }
}, () => /@\/problem\/[A-Z0-9]+/g.test(location.href) && $("a[href^=\"/problem/solution\"]").addClass("sol-btn"), hidesol_css)

mod.reg_hook_new("back-to-contest", "返回比赛列表", [
    "@/problem/[A-Z0-9]+\\?contestId=[1-9][0-9]{0,}",
], null, ({ args }) => {
    const $info_rows = args.$info_rows, $pre = $(`<a class="exlg-back-to-contest"></a>`),
        cid = args.cid, pid = args.pid
    if ((!pid) || (!cid)) return
    if ($info_rows.children(".exlg-back-to-contest").length > 0) return // Note: 防止重复
    $pre.attr("href", `/contest/${ cid }#problems`)
        .html(`<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="door-open" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="svg-inline--fa fa-door-open fa-w-20">
            <path data-v-450d4937="" data-v-303bbf52="" fill="currentColor" d="M624 448h-80V113.45C544 86.19 522.47 64 496 64H384v64h96v384h144c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16zM312.24 1.01l-192 49.74C105.99 54.44 96 67.7 96 82.92V448H16c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h336V33.18c0-21.58-19.56-37.41-39.76-32.17zM264 288c-13.25 0-24-14.33-24-32s10.75-32 24-32 24 14.33 24 32-10.75 32-24 32z"></path>
            </svg>返回列表`)
        .appendTo($info_rows)
}, (e) => {
    const tar = e.target, cid = lg_dat.contest.id,
        pid = lg_dat.problem.pid
    return { args: { cid, pid, $info_rows: $(tar.parentNode) }, result: (tar.tagName.toLowerCase() === "a" && (tar.href || "").includes("/record/list") && tar.href.slice(tar.href.indexOf("/record/list")) === `/record/list?pid=${ pid }&contestId=${ cid }`) }
}, () => ({ cid: lg_dat.contest.id, pid: lg_dat.problem.pid, $info_rows: $(".info-rows").parent() }), backtocont_css)

mod.reg_hook_new("submission-color", "记录难度可视化", "@/record/list.*", null, async ({ args }) => {
    if (args && args.type === "show") {
        if ($("div.problem > div > a > span.pid").length && !$(".exlg-difficulty-color").length) {
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
    if (!tar || (!tar.tagName)) return { args: msg.COMMENT_TAG, result: false }
    if (tar.tagName.toLowerCase() === "a" && (tar.href || "").includes("/problem/")/* && judge_problem(tar.href.slice(tar.href.indexOf("/problem/") + 9))*/ && ` ${ tar.parentNode.parentNode.className } `.includes(" problem ")) { // Note: 如果是标签的话，查看它的父亲是否为最后一个。如果是，更新数据。对于其他的不管。
        if (!tar.parentNode.parentNode.parentNode.nextSibling) return { args: { type: "modified - update", target: tar.parentNode.parentNode.parentNode.parentNode }, result: true }
        else return { args: { type: "modified - not the last one.", target: null }, result: false }
    }
    return { args: { type: "modified - not that one.", target: null }, result: false }
}, () => ({ type: "show" }), ``
)

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