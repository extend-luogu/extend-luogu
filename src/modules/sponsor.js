import mod from "../core.js"
import { $, cur_time, cs_post } from "../utils.js"
import register_badge from "../components/register-badge.js"
import css from "../resources/css/sponsor-tag.css"

mod.reg_hook_new("sponsor-tag", "标签显示", [ "@/", "@/paste", "@/discuss/.*", "@/problem/.*", "@/ranking.*" ], {
    cache: { ty: "string", dft: "3600", info: [ "Cache time", "缓存时间（秒）" ] },
    badges: { ty: "string", priv: true }
}, ((loaded, badges, promises) => (async ({ msto, args: users }) => {
    if ($.isEmptyObject(badges) && msto.badges)
        Object.assign(badges, JSON.parse(msto.badges))
    const pending = users.map((_, e) => {
        const uid = e.attributes.href.value.slice("/user/".length)
        if (!loaded.has(uid) && !(uid in badges && cur_time() - badges[uid].ts <= msto.cache)) {
            loaded.add(uid)
            return uid
        }
    }).get()
    if (pending.length)
        promises.push((async () => {
            Object.assign(badges, Object.fromEntries(Object.entries(
                JSON.parse((await cs_post({
                    url: "https://exlg.piterator.com/badge/mget",
                    data: JSON.stringify(pending),
                    type: "application/json",
                })).responseText).data
            ).map(
                ([ uid, badge ]) => [ uid, Object.assign(badge, {ts: cur_time()}) ]
            )))
        })())
    await Promise.all(promises)
    msto.badges = JSON.stringify(badges)

    users.each((_, e) => {
        const $e = $(e)
        if (!$e || $e.hasClass("exlg-badge-username")) return
        $e.addClass("exlg-badge-username") // Note: 删掉这行会出刷犇犇的bug，一开始我以为每个元素被添加一次所以问题不大 但是事实证明我是傻逼
        const badge = badges[$e.attr("href").slice("/user/".length)]
        if (!badge.text) return
        let $tar = $e
        if ($tar.next().length && ($tar.next().hasClass("sb_amazeui")))
            $tar = $tar.next()
        if ($tar.next().length && $tar.next().hasClass("am-badge"))
            $tar = $tar.next()
        $tar.after($(`<span class="exlg-badge">${badge.text}</span>`)
            .css("background", badge.bg || "mediumturquoise")
            .css("color", badge.fg || "#fff")
            .off("contextmenu")
            .on("contextmenu", () => false)
            .on("mousedown", (e) => {
                if (e.button === 2) location.href = "https://www.luogu.com.cn/paste/1t9f67wk"
                else if (e.button === 0) register_badge()
            })
        )
    })
}))(new Set(), {}, []), (e) => {
    const $tmp = $(e.target).find("a[target='_blank'][href^='/user/']")
    return {
        result: $tmp.length,
        args: $tmp
    }
}, () => $("a[target='_blank'][href^='/user/']"), css, "module")
