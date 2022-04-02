import { $, log, exlg_alert, lg_usr, cs_get } from "../utils.js"
import compo from "../compo-core.js"

// Note: 它坏了
const register_badge = compo.reg("register-badge", "Badge_注册", null, async () => {
    const parse_badge = (href, func_quit) => cs_get({
        url: href,
        onload: res => {
            let fres = -1
            const e = res.response
            const _operations = [
                {
                    errorcode: 0,
                    message: `"Succeed in creating a new badge!"`,
                    ontitle: "[exlg] 成功创建 badge",
                    onlog: "Successfully created a badge!"
                },
                {
                    errorcode: 1,
                    message: `"Wrong active code!"`,
                    ontitle: "无效激活码",
                    onlog: "Illegal Active Code"
                },
                {
                    errorcode: 2,
                    message: `"Sorry, but the active code has been used!"`,
                    ontitle: "激活码已被使用",
                    onlog: "Expired Active Code"
                },
                {
                    errorcode: 3,
                    message: `"Something went wrong!"`,
                    ontitle: "非法的 badge 内容",
                    onlog: "Illegal Badge Text"
                },
                {
                    errorcode: -1,
                    message: `Fuck CCF up`,
                    ontitle: "未知错误",
                    onlog: "注册 exlg-badge 时出现未知错误, 请联系开发人员"
                },
            ]
            _operations.forEach(f => {
                if(fres !== -1) return
                console.log(e === f.message, f.errorcode === -1, f)
                if (e === f.message || f.errorcode === -1) {
                    fres = f.errorcode
                    $("#exlg-dialog-title").html(f.errorcode ? `[Error] ${f.ontitle}` : f.ontitle)
                    log(f.errorcode ? `Illegal Operation in registering badge: ${f.onlog}(#${f.errorcode})` : f.onlog)
                    if(fres === -1 || ! fres) {
                        func_quit()
                        setTimeout(() => exlg_alert("badge 注册成功!", "exlg 提醒您"), 400)
                        return
                    }
                }
            })
        }
    })
    const title_text = "exlg badge 注册器 ver.5.0"
    exlg_alert(`<div class="exlg-update-log-text exlg-unselectable exlg-badge-page" style="font-family: Consolas;">
    <div style="text-align: center">
        <div style="display:inline-block;text-align: left;padding-top: 10px;">
            <div style="margin: 5px;"><span style="height: 1.5em;float: left;padding: .1em;width: 5em;">用户uid</span><input exlg-badge-register type="text" style="padding: .1em;" class="am-form-field exlg-badge-input" placeholder="填写用户名或uid" name="username"></div>
            <div style="margin: 5px;"><span style="height: 1.5em;float: left;padding: .1em;width: 5em;">激活码</span><input exlg-badge-register type="text" style="padding: .1em;" class="am-form-field exlg-badge-input" placeholder="您获取的激活码" name="username"></div>
            <div style="margin: 5px;margin-bottom: 20px;"><span style="height: 1.5em;float: left;padding: .1em;width: 5em;">badge</span><input exlg-badge-register type="text" style="margin-bottom: 10px;padding: .1em;" class="am-form-field exlg-badge-input" placeholder="您想要的badge" name="username"></div>
        </div>
        <br>
        <small>Powered by <s>Amaze UI</s> 自行研发，去他妈的 Amaze UI</small>
    </div>
</div>
    `, title_text, (func_quit) => {
        const $board = $("#exlg-container"), $input =$board.find("input"), $title = $board.find("#exlg-dialog-title")
        if (lg_usr?.uid && ! $input[0].value)
            $input[0].value = lg_usr.uid
        if (! ($input[0].value && $input[1].value && $input[2].value)) {
            $title.html("[Err] 请检查信息是否填写完整")
            setTimeout(() => $title.html(title_text), 1500)
            return
        }
        $.get("/api/user/search?keyword=" + $input[0].value, res => {
            if (! res.users[0]) {
                $title.html("[Err] 无法找到指定用户")
                setTimeout(() => $title.html(title_text), 1500)
            }
            else {
                $input[0].value = res.users[0].uid
                const badge_href = `https://service-cmrlfv7t-1305163805.sh.apigw.tencentcs.com/release/${$input[1].value}/${$input[0].value}/${$input[2].value}/`
                parse_badge(badge_href, func_quit)
            }
        })
    }, false)/*
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
    $submit.on("click", ).appendTo($btn.parent())*/
}, null)

export default register_badge