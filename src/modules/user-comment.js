import mod from "../core.js"
import { $, exlg_alert } from "../utils.js"
import css from "../resources/css/user-comment.css"

let cmts = null
// mod.reg("user-comment-modifier", "修改用户备注", "")
mod.reg_hook_new("user-comment", "用户备注", ".*", {
    comments: { ty: "string", dft: "{}", priv: true }, // Note: string 只是替代方案，换用 dict 是迟早的
    direct_display: { ty: "boolean", dft: true, info: [ "Directly replace username", "直接替换用户名" ] },
}, ({ msto, result, args }) => { // Note: 你他妈也知道替代方案是吧
    const _setcomment = ($nm, com) => {
        if (!com || !$nm) return
        if (!$nm.length) return
        if ($nm.length !== 1) {
            $nm.each((_i, e) => _setcomment($(e), com))
            return
        }
        if ($nm.children("span[style]").length) $nm = $nm.children("span[style]")

        $nm.css("white-space", "pre")
        if (msto.direct_display)
            $nm.text(com)
        else
            $nm.append(`<span class="exlg-usercmt exlg-usercom-tag">(${com})</span>`)
    }
    if (!result) {
        cmts = JSON.parse(msto.comments)
        for (let [ i, v ] of Object.entries(cmts))
            if (v === null || v === "")
                delete cmts[i]
        if (/^\/user\/[1-9][0-9]{0,}$/.test(location.pathname)) {
            const $username = $(".user-info > div.user-name"), orin = $username.text()
            const uid = parseInt(location.pathname.slice(6))
            $username.html(``)
            const $name_text = $(`<span id="exlg-name-text"></span>`).appendTo($username)
            $name_text.text(uid in cmts ? cmts[uid] : orin)
            const $cbtn = $(`<span title="修改用户备注"><svg class="icon exlg-usercom-edit" style="width: 1.2em;height: 1.2em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="942"><path d="M295.384615 708.923077h433.23077a19.692308 19.692308 0 1 1 0 39.384615h-433.23077a19.692308 19.692308 0 1 1 0-39.384615zM590.769231 303.576615L618.653538 275.692308l72.979693 73.019077-27.844923 27.844923L590.769231 303.576615z m-236.307693 196.923077L382.345846 472.615385l89.284923 89.324307-27.844923 27.844923L354.461538 500.499692zM401.329231 616.841846l308.342154-308.342154-55.689847-55.689846-308.381538 308.342154-8.152615 63.881846 63.881846-8.192z m-93.065846-74.043077l317.833846-317.833846a39.384615 39.384615 0 0 1 55.729231 0l55.689846 55.689846a39.384615 39.384615 0 0 1 0 55.689846l-317.833846 317.833847-127.763693 16.344615 16.344616-127.724308z" p-id="943"></path></svg></span>`)
            $username.append($cbtn)
            $cbtn.on("click", () => {
                exlg_alert(`<div>请设置用户 <span style="font-family: Consolas, monospace;">${orin} (uid: ${uid})</span> 的备注名<br>留空则清除备注。</div><input exlg-badge-register type="text" style="font-family: Consolas, monospace;line-height: 1.5;padding: .1em;" class="am-form-field exlg-badge-input" placeholder="填写用户名或uid" name="username" id="exlg-user-com-input">`, "exlg 用户备注", () => {
                    let nn = $("#exlg-user-com-input").val()
                    if (nn.trim() === "") {
                        delete cmts[uid]
                        nn = orin
                    }
                    else
                        cmts[uid] = nn
                    // $(`a[href="/user/${uid}"][target=_blank]`).text(nn).css("white-space", "pre")
                    // Note: 摆烂了 ,5ab 没有写包括但不限于用户主页的适配，这里不应该显示。
                    // Note: 写上去事迟早的
                    _setcomment($(`a[href="/user/${uid}"][target=_blank]`))
                    msto.comments = JSON.stringify(cmts)
                    $name_text.text(uid in cmts ? cmts[uid] : orin)
                }, true)
                $("#exlg-user-com-input").val(uid in cmts ? cmts[uid] : orin)
            })
        }
    }
    args.forEach(arg => {
        let $arg = $(arg), uid = arg.href.split("/").lastElem()
        if ($arg.hasClass("exlg-usercmt"))
            return
        $arg.addClass("exlg-usercmt")
        if (uid in cmts) {
            _setcomment($arg, cmts[uid])
            // Kill: $arg.text(cmts[uid])
        }
    })
}, e => {
    let tmp = e.target.querySelectorAll("a[href^=\"/user\"][target=_blank]")
    return {
        result: (tmp.length > 0),
        args: tmp,
    }
}, () => document.querySelectorAll("a[href^=\"/user\"][target=_blank]"), css)