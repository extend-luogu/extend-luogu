import mod from "../core.js"
import { $ } from "../utils.js"

let cmts = null
mod.reg_hook_new("user-comment", "用户备注", ".*", {
    comments: { ty: "string", dft: "{}", priv: true } // Note: string 只是替代方案，换用 dict 是迟早的
}, ({ msto, result, args }) => {
    if (!result) {
        cmts = JSON.parse(msto.comments)
    }
    args.forEach(arg => {
        let $arg = $(arg), uid = arg.href.split("/").lastElem(), un = $arg.text().trim()
        if ($arg.hasClass("exlg-usercmt"))
            return
        $arg.addClass("exlg-usercmt")
        $arg.on("mousedown", e => {
            e.stopPropagation()
            if (e.button === 2) {
                $.get(`https://www.luogu.com.cn/api/user/search?keyword=${uid}`, res => {
                    let orin = res.users[0].name, nn = prompt(`请设置用户 ${orin}（uid: ${uid}）的备注名，留空则删除备注`, cmts[uid] ?? un)
                    if (nn === "") {
                        delete cmts[uid]
                        nn = orin
                    }
                    else
                        cmts[uid] = nn
                    $(`a[href="/user/${uid}"][target=_blank]`).text(nn)
                    msto.comments = JSON.stringify(cmts)
                })
            }
            return false
        })
        if (uid in cmts)
            $arg.text(cmts[uid])
    })
}, e => {
    let tmp = e.target.querySelectorAll("a[href^=\"/user\"][target=_blank]")
    return {
        result: (tmp.length > 0),
        args: tmp,
    }
}, () => document.querySelectorAll("a[href^=\"/user\"][target=_blank]"), null)