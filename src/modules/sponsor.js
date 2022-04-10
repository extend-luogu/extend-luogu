import mod, { sto } from "../core.js"
import { $, cur_time, cs_get, cs_post } from "../utils.js"
import register_badge from "../components/register-badge.js"
import css from "../resources/css/sponsor-tag.css"

mod.reg_chore("sponsor-list", "获取标签列表", "1D", "@/.*", {
    tag_list: { ty: "string", priv: true }
}, ({ msto }) => {
    cs_get({
        url: `https://service-cmrlfv7t-1305163805.sh.apigw.tencentcs.com/release/get/0/0/`,
        onload: res => {
            msto.tag_list = decodeURIComponent(res.responseText)
        }
    })
})

mod.reg_hook_new("sponsor-tag", "标签显示", [ "@/", "@/paste", "@/discuss/.*", "@/problem/.*", "@/ranking.*" ], {
    use_new: { ty: "boolean", dft: false, info: [ "Enable new", "启用新版后端（实验性）" ] },
    cache: { ty: "string", dft: "3600", info: [ "Cache time", "缓存时间（秒）（仅限新版）" ] },
    tag_list: { ty: "string", priv: true },
    tag_cache: { ty: "string", priv: true }
}, async ({ msto, args }) => {
    let tag_list = {}
    if ( typeof (msto.tag_cache) === "undefined" ) {
        msto.tag_cache = "{}"
    }
    let cache = JSON.parse(msto.tag_cache)
    if ( msto.use_new ) {
        let tag_uid_list = []
        const require_badge = ($e) => {
            if (!$e || $e.hasClass("exlg-badge-required-username")) return
            if (!/\/user\/[1-9][0-9]{0,}/.test($e.attr("href"))) return
            $e.addClass("exlg-badge-required-username")
            const user_uid = $e.attr("href").slice("/user/".length)
            if( !(user_uid in cache) || cur_time() - cache[user_uid].ts > Number(msto.cache) ) {
                tag_uid_list.push(user_uid)
            }
            else {
                if ( "text" in cache[user_uid] ) {
                    tag_list[user_uid] = cache[user_uid].text
                }
            }
        }
        args.each((_, e) => require_badge($(e)))
        const res = (await cs_post({
            url: "https://exlg.piterator.com/badge/mget/",
            data: JSON.stringify(tag_uid_list),
            type: "application/json"
        })).responseText
        const tag_list_response = JSON.parse(decodeURIComponent(res)).data
        for (const [ key, value ] of Object.entries(tag_list_response)) {
            if ( "text" in value ) {
                tag_list[key] = value.text
                cache[key] = {}
                cache[key].text = value.text
                if ( "bg" in value ) cache[key].bg = value.bg
                if ( "fg" in value ) cache[key].fg = value.fg
                cache[key].ts = cur_time()
            }
            else {
                cache[key] = {}
                cache[key].ts = cur_time()
            }
        }
        msto.tag_cache = JSON.stringify(cache)
    }
    else {
        // $("span.wrapper:has(a[target='_blank'][href]) > span:has(a[target='_blank'][href]):not(.hover):not(.exlg-sponsor-tag)").addClass("exlg-sponsor-tag") // Note: usernav的span大钩钩
        tag_list = JSON.parse(sto["^sponsor-list"].tag_list)
    }

    const add_badge = ($e) => {
        if (!$e || $e.hasClass("exlg-badge-username")) return
        if (!/\/user\/[1-9][0-9]{0,}/.test($e.attr("href"))) return
        $e.addClass("exlg-badge-username") // Note: 删掉这行会出刷犇犇的bug，一开始我以为每个元素被添加一次所以问题不大 但是事实证明我是傻逼
        const user_uid = $e.attr("href").slice("/user/".length), tag = tag_list[user_uid]
        if (!tag) return
        const $badge = $(user_uid === "100250" ? `<span class="am-badge am-radius lg-bg-red" style="margin-left: 4px;">${ tag }</span>` : `<span class="exlg-badge">${ tag }</span>`)
            .off("contextmenu")
            .on("contextmenu", () => false)
            .on("mousedown", (e) => {
                if (e.button === 2) location.href = "https://www.luogu.com.cn/paste/asz40850"
                else if (e.button === 0) register_badge()
            })
        if (user_uid !== "100250" && msto.use_new) {
            $badge
                .css("background", "bg" in cache[user_uid] ? cache[user_uid].bg : "mediumturquoise")
                .css("color", "fg" in cache[user_uid] ? cache[user_uid].fg : "#fff")
        }
        else if (user_uid !== "100250") {
            $badge
                .css("background", "mediumturquoise")
                .css("color", "#fff")
        }
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
}, () => $("a[target='_blank'][href]"), css, "module")
