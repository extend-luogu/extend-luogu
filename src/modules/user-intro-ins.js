import { $, springboard, xss } from "../utils.js"
import mod from "../core.js"
import css from "../resources/css/user-intro-ins.css"

mod.reg_user_tab("user-intro-ins", "用户首页_HTML_显示", "main", null, null, () => {
    $(".introduction > *").each((_, e, $e = $(e)) => {
        const t = $e.text()
        let [ , , ins, arg ] = t.match(/^(exlg.|%)([a-z]+):([^]+)$/) ?? []
        if (!ins) return

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
}, css, "module")