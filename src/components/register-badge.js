import { $, cur_time, lg_usr, cs_post } from "../utils.js"
import exlg_alert from "../components/exlg-dialog-board.js"
import compo from "../compo-core.js"
import mod, { sto } from "../core.js"

const register_badge = compo.reg("register-badge", "badge 注册", null, null, is_edit => {
    const title_text = `exlg badge ${ is_edit ? "修改" : "注册" }器`
    exlg_alert(`<div class="exlg-update-log-text exlg-unselectable exlg-badge-page" style="font-family: Consolas;">
    <div style="text-align: center">
        <div style="display:inline-block;text-align: left;padding-top: 10px;">
            <div style="margin: 5px;">
                <span style="height: 1.5em;float: left;padding: .1em;width: 5em;">用户uid</span>
                <input exlg-badge-register type="text" style="padding: .1em;" class="am-form-field exlg-badge-input" placeholder="填写用户名或uid" value=${lg_usr.uid} disabled title="暂不支持为别人注册 badge" name="username">
            </div>
    ${ is_edit ? "" : `<div style="margin: 5px;">
                <span style="height: 1.5em;float: left;padding: .1em;width: 5em;">激活码</span>
                <input exlg-badge-register type="text" style="padding: .1em;" class="am-form-field exlg-badge-input" placeholder="您获取的激活码" name="username"></div>` }
    <div style="margin: 5px;">
                <span style="height: 1.5em;float: left;padding: .1em;width: 5em;">badge</span>
                <input exlg-badge-register type="text" style="margin-bottom: 10px;padding: .1em;" class="am-form-field exlg-badge-input" placeholder="您想要的badge" name="username">
            </div>
            <div style="margin: 5px;">
                <span style="height: 1.5em;float: left;padding: .1em;width: 5em;">背景</span>
                <input exlg-badge-register type="text" style="margin-bottom: 10px;padding: .1em;" class="am-form-field exlg-badge-input" value="mediumturquoise" name="username">
            </div>
            <div style="margin: 5px;">
                <span style="height: 1.5em;float: left;padding: .1em;width: 5em;">前景</span>
                <input exlg-badge-register type="text" style="margin-bottom: 10px;padding: .1em;" class="am-form-field exlg-badge-input" value="#fff" name="username">
            </div>
            <div style="margin: 5px;margin-bottom: 20px;">
                <span style="height: 1.5em;float: left;padding: .1em;width: 5em;">预览</span>
                <span class="exlg-badge-preview"></span>
            </div>
        </div>
        <br>
        <small>Powered by <s>Amaze UI</s> 自行研发，去他妈的 Amaze UI</small>
    </div>
</div>
    `, title_text, async () => {
        $("input[exlg-badge-register]").off("input")

        const $board = $("#exlg-container"), $input = $board.find("input"), $title = $board.find("#exlg-dialog-title")
        const gerr = e => {
            $title.html(e)
            setTimeout(() => $title.html(title_text), 1500)
        }
        if (lg_usr?.uid && !$input[0].value)
            $input[0].value = lg_usr.uid
        if (!$input.get().some(e => e.value)) {
            gerr("[Err] 请检查信息是否填写完整")
            return
        }

        // Note: $input[1] 在注册模式下是激活码，在修改模式下是badge
        const badge = is_edit ? $input[1].value : $input[2].value
        const bg = is_edit ? $input[2].value : $input[3].value
        const fg = is_edit ? $input[3].value : $input[4].value
        $title.html("获取并验证令牌...")
        mod.execute("token")
        let request = {
            uid: $input[0].value,
            token: sto["^token"].token,
            data: {
                text: badge,
                bg: bg,
                fg: fg
            }
        }
        if ( !is_edit ) {
            request["activation"] = $input[1].value
        }
        $title.html("请求中...")
        const res = (await cs_post({
            url: "https://exlg.piterator.com/badge/set",
            data: JSON.stringify(request),
            type: "application/json"
        })).responseText
        const res_json = JSON.parse(decodeURIComponent(res))
        if ( "error" in res_json ) {
            $title.html("[Err] 失败")
            exlg_alert(res_json["error"], "激活 badge 出错")
        }
        else {
            const badges = Object.assign(JSON.parse(sto["sponsor-tag"].badges), res_json.data)
            badges[$input[0].value].ts = cur_time()
            sto["sponsor-tag"].badges = JSON.stringify(badges)
            $title.html("成功")
            exlg_alert("badge 激活成功！感谢您对 exlg 的支持。", "badge 激活成功", () => { location.reload() })
        }
    }, false)

    $(".exlg-badge-preview").attr("style", `
        border-radius: 50px;
        padding-left: 10px;
        padding-right: 10px;
        padding-top: 4px;
        padding-bottom: 4px;
        transition: all .15s;
        display: inline-block;
        min-width: 10px;
        font-size: 1em;
        font-weight: 700;
        line-height: 1;
        vertical-align: baseline;
        white-space: nowrap;
        cursor: pointer;
        margin-left: 2px;
        margin-right: 2px;
    `)
    $("input[exlg-badge-register]").on("input", () => {
        // Note: 当输入数据时加载预览
        const $board = $("#exlg-container"), $input = $board.find("input")
        const badge = is_edit ? $input[1].value : $input[2].value
        const bg = is_edit ? $input[2].value : $input[3].value
        const fg = is_edit ? $input[3].value : $input[4].value
        const $preview = $(".exlg-badge-preview")
        $preview
            .text(badge)
            .css("background", bg)
            .css("color", fg)
    })

    /*
    const $board = $("#exlg-alert, #lg-alert")
    const $btn = $board.find(".am-modal-btn")
    // Note: 重构一次，Date = 20211127 Time = 21:10
    const $cancel = $btn.clone().text("取消")
    const $submit = $btn.clone().text("确定").off("click")
    const $title = $("#exlg-alert-title, #lg-alert-title").on("click", () => $title.html(title_text)).addClass("exlg-unselectable")
    const $dimmer = $(".am-dimmer")
    console.log($board, $cancel, $submit, $dimmer, $title, $btn)
    const clear_foot = () => setTimeout(() => {
        console.log("tried to clear foot!")
        $cancel.remove()
        $submit.remove()
        $title.off("click").removeClass("exlg-unselectable")
        $dimmer.off("click")
        $btn.show()
    }, 200)
    if (uindow.show_alert)
        $(".am-dimmer").on("click", () => {
            clear_foot()
        })
    else
        $(".am-dimmer").off("click").on("click", () => {
            console.log("get dimmered.", $btn)
            $btn.click()
            clear_foot()
        })
    $btn.css("cssText", "display: none!important;")
    $cancel.on("click", () => {
        $btn.click()
        clear_foot()
    })
        .appendTo($btn.parent())
    $submit.on("click", ).appendTo($btn.parent())
    */
})

export default register_badge
