import mod from "../core.js"
import { $ } from "../utils.js"
import css from "../resources/css/emoticon.css"

const emt = {
    EMO: 1,
    TXT: 2
}
mod.reg("emoticon", "表情输入", [ "@/paste", "@/discuss/.*", "@/" ], {
    benben: { ty: "boolean", dft: true, info: [ "Show in benben", "犇犇表情" ] },
    show: { ty: "boolean", dft: true, info: [ "Show in default", "是否默认显示表情栏" ] },
    src: { ty: "enum", vals: [ "图.tk", "github", "妙.tk", "啧.tk" ], dft: "图.tk", info: [ "Emoticon Source", "表情源" ] },
    height_limit: { ty: "boolean", dft: true, info: [ "Expand in default", "是否默认展开表情" ] }
}, ({ msto }) => {
    const emo = [
        "kk", "jk", "se", "qq", "xyx", "xia", "cy", "ll", "xk", "qiao", "qiang", "ruo", "mg", "dx", "youl", "baojin", "shq", "lb", "lh", "qd", "fad", "dao", "cd", "kun", "px", "ts", "kl", "yiw", "dk",
        { name: [ "sto" ], slug: "gg", name_display: "sto", width: 40 },
        { name: [ "orz" ], slug: "gh", name_display: "orz", width: 40 },
        { name: [ "qwq" ], slug: "g5", name_display: "qwq", width: 40 },
        { name: [ "hqlm" ], slug: "l0", name_display: "火前留名" },
        { name: [ "sqlm" ], slug: "l1", name_display: "山前留名" },
        { name: [ "xbt" ], slug: "g1", name_display: "屑标题" },
        { name: [ "iee", "wee" ], slug: "g2", name_display: "我谔谔" },
        { name: [ "kg" ], slug: "g3", name_display: "烤咕" },
        { name: [ "gl" ], slug: "g4", name_display: "盖楼" },
        { name: [ "wyy" ], slug: "g6", name_display: "无意义" },
        { name: [ "wgzs" ], slug: "g7", name_display: "违规紫衫" },
        { name: [ "tt" ], slug: "g8", name_display: "贴贴" },
        { name: [ "jbl" ], slug: "g9", name_display: "举报了" },
        { name: [ "%%%", "mmm" ], slug: "ga", name_display: "%%%" },
        { name: [ "ngrb" ], slug: "gb", name_display: "你谷日爆" },
        { name: [ "qpzc", "qp", "zc" ], slug: "gc", name_display: "前排资瓷" },
        { name: [ "cmzz" ], slug: "gd", name_display: "臭名昭著" },
        { name: [ "zyx" ], slug: "ge", name_display: "致远星" },
        { name: [ "zh" ], slug: "gf", name_display: "祝好" },
    ].filter(e => msto.src !== "啧.tk" || typeof e !== "object").map((e, i) => {
        if (typeof (e) === "string")
            return {
                type: emt.EMO,
                name: [ e ],
                slug: (i >= 10) ? String.fromCharCode(0x61 + (i - 10)) : String.fromCharCode(0x30 + i)
            }
        return { type: emt.TXT, ...e }
    })

    const emo_url = (msto.src === "github") ?
        (({ slug }) => `//cdn.jsdelivr.net/gh/extend-luogu/extend-luogu/img/emoji/${slug}`) : ((msto.src === "啧.tk") ?
            (({ name }) => `//${msto.src}/${name[0]}`) :
            (({ slug }) => `//${msto.src}/${slug}`))

    if (msto.benben && location.pathname === "/") {
        const $txt = $("#feed-content"), txt = $txt[0]
        $("#feed-content").before("<div id='emo-lst'></div>")
        emo.forEach(m => {
            const $emo = $((m.type === emt.EMO)?
                `<button class="exlg-emo-btn" exlg="exlg"><img src="${emo_url(m)}" /></button>`
                :
                `<button class="exlg-emo-btn" exlg="exlg">${m.name_display}</button>`
            ).on("click", () => {
                const preval = txt.value
                const pselstart = txt.selectionStart
                const str1 = preval.slice(0, pselstart) + `![](${emo_url(m)})`
                txt.value = (str1 + preval.slice(txt.selectionEnd))
                txt.focus()
                txt.setSelectionRange(str1.length, str1.length)
            }
            ).appendTo("#emo-lst")
            if (m.width) $emo.css("width", m.width + "px")
            else if(m.type === emt.EMO) $emo.css("width", "40px")
            else $emo.css("width", "83px")
        })
        $("#feed-content").before("<br>")
    }
    const $menu = $(".mp-editor-menu"),
        $txt = $(".CodeMirror-wrap textarea")

    if (!$menu.length) return

    const $emo_menu = $menu.clone().addClass("exlg-emo").text("")
    $menu.after($emo_menu).append("<br />")

    const $ground = $(".mp-editor-ground").addClass("exlg-ext"),
        $show_hide = $menu.children().first().clone(true).addClass("exlg-unselectable"),
        $set_height = $menu.children().first().clone(true).addClass("exlg-unselectable")
    $menu.children().last().before($show_hide)
    $menu.children().last().before($set_height)
    $show_hide.children().attr("title", "").text((msto.show) ? "隐藏" : "显示")
    if (msto.show) $emo_menu.addClass("exlg-show-emo"), $ground.addClass("exlg-show-emo")
    $show_hide.on("click", () => {
        $show_hide.children()[0].innerHTML = [ "显示", "隐藏" ][[ "隐藏", "显示" ].indexOf($show_hide.children()[0].innerHTML)]
        $emo_menu.toggleClass("exlg-show-emo")
        $ground.toggleClass("exlg-show-emo")
        msto.show = !msto.show
    })
    $set_height.children().attr("title", "").text((msto.height_limit) ? "展开" : "收起")
    if (msto.height_limit) $emo_menu.addClass("exlg-show-emo-short"), $ground.addClass("exlg-show-emo-short")
    else $emo_menu.addClass("exlg-show-emo-long"), $ground.addClass("exlg-show-emo-long")
    $set_height.on("click", () => {
        $set_height.children()[0].innerHTML = [ "收起", "展开" ][[ "展开", "收起" ].indexOf($set_height.children()[0].innerHTML)]
        $emo_menu.toggleClass("exlg-show-emo-short").toggleClass("exlg-show-emo-long")
        $ground.toggleClass("exlg-show-emo-short").toggleClass("exlg-show-emo-long")
        msto.height_limit = !msto.height_limit
    })

    emo.forEach(m => {
        const $emo = $((m.type === emt.EMO)?
            `<button class="exlg-emo-btn" exlg="exlg"><img src="${emo_url(m)}" /></button>`
            :
            `<button class="exlg-emo-btn" exlg="exlg">${m.name_display}</button>`
        ).on("click", () => $txt
            .trigger("focus")
            .val(`![](${emo_url(m)})`)
            .trigger("input")
        ).appendTo($emo_menu)
        if (m.width) $emo.css("width", m.width + "px")
        else if(m.type === emt.EMO) $emo.css("width", "40px")
        else $emo.css("width", "83px")
    })
    $emo_menu.append("<div style='height: .35em'></div>")

    /*
    $txt.on("input", e => {
        if (e.originalEvent.data === "/")
            mdp.content = mdp.content.replace(/\/[0-9a-z]\//g, (_, emo_txt) =>
                `![](` + emo_url(emo.find(m => m.includes(emo_txt))) + `)`
            )
    })
    */
    // Hack: 监听输入/，类似qq的表情快捷键功能。但是锅了，所以删掉力
}, css, "module")