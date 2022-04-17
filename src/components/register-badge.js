/* eslint-disable no-new */
/* global XNColorPicker */
import {
    $, cur_time, lg_usr, cs_post, log,
} from "../utils.js";
import exlg_alert from "./exlg-dialog-board.js";
import compo from "../compo-core.js";
import mod, { sto } from "../core.js";

const register_badge = compo.reg("register-badge", "badge 注册", null, null, (is_edit) => {
    // Note: 引入 API 即判断能否使用 eval
    let _eval_disabled = false;
    try {
        // eslint-disable-next-line no-eval
        (0, eval)(GM_getResourceText("colorpicker"));
        log("原来洛谷还有能用 eval 的给人用的页面是吧为什么连这个都不能统一一下的");
    } catch (err) {
        log("我操他妈的 CSP 傻逼是吧怎么不让我用 eval");
        _eval_disabled = true;
    }
    // Note: 原本的主程序
    const title_text = `exlg badge ${is_edit ? "修改" : "注册"}器`;
    exlg_alert(`<div class="exlg-update-log-text exlg-unselectable exlg-badge-page" style="font-family: Consolas;">
    <div style="text-align: center">
        <div class="exlg-badge-register" style="display:inline-block;text-align: left;padding-top: 10px;">
            <div style="margin: 5px;">
                <span style="height: 1.5em;float: left;padding: .1em;width: 5em;">用户uid</span>
                <input exlg-badge-register type="text" style="padding: .1em;" class="am-form-field exlg-badge-input" placeholder="填写用户名或uid" value=${lg_usr.uid} disabled title="暂不支持为别人注册 badge" name="username">
            </div>
            <div style="margin: 5px;${is_edit ? "display: none;" : ""}">
                <span style="height: 1.5em;float: left;padding: .1em;width: 5em;">激活码</span>
                <input exlg-badge-register type="text" style="padding: .1em;" class="am-form-field exlg-badge-input" placeholder="您获取的激活码" name="username">
            </div>
            <div style="margin: 5px;">
                <span style="height: 1.5em;float: left;padding: .1em;width: 5em;">badge</span>
                <input exlg-badge-register type="text" style="margin-bottom: 10px;padding: .1em;" class="am-form-field exlg-badge-input" placeholder="您想要的badge" name="username">
            </div>
            <div class="exlg-bg" style="margin: 5px;">
                <span style="height: 1.5em;float: left;padding: .1em;width: 5em;">背景</span>
                <span class="exlg-bg-slector" style="float: left;"></span>
                <input exlg-badge-register type="text" style="margin-bottom: 10px;padding: .1em; width: 171px; line-height: 1.52;" class="am-form-field exlg-badge-input" value="mediumturquoise" name="username">
            </div>
            <div class="exlg-fg" style="margin: 5px;">
                <span style="height: 1.5em;float: left;padding: .1em;width: 5em;">前景</span>
                <span class="exlg-fg-slector" style="float: left; height: 5px;"></span>
                <input exlg-badge-register type="text" style="margin-bottom: 10px;padding: .1em; width: 171px; line-height: 1.52;" class="am-form-field exlg-badge-input" value="#fff" name="username">
            </div>
            <div style="margin: 5px;margin-bottom: 20px;">
                <span style="height: 1.5em;float: left;padding: .1em;width: 5em;">预览</span>
                <span class="exlg-badge-preview"></span>
            </div>
        </div>
    </div>
</div>
    `, title_text, async () => {
        $("input[exlg-badge-register]").off("input");

        const $board = $("#exlg-container"),
            $input = $board.find("input"),
            $title = $board.find("#exlg-dialog-title");
        const gerr = (e) => {
            $title.html(e);
            setTimeout(() => $title.html(title_text), 1500);
        };
        if (lg_usr?.uid && !$input[0].value) $input[0].value = lg_usr.uid;
        if (!$input.get().some((e) => e.value)) {
            gerr("[Err] 请检查信息是否填写完整");
            return;
        }
        const badge = $input[2].value;
        const bg = $input[3].value;
        const fg = $input[4].value;
        // Note: 下面那位你可真是个小天才
        // Note: $input[1] 在注册模式下是激活码，在修改模式下是badge
        /*
        const badge = is_edit ? $input[1].value : $input[2].value
        const bg = is_edit ? $input[2].value : $input[3].value
        const fg = is_edit ? $input[3].value : $input[4].value
        */
        $title.html("获取并验证令牌...");
        mod.execute("token");
        const request = {
            uid: $input[0].value,
            token: sto["^token"].token,
            data: {
                text: badge,
                bg,
                fg,
            },
        };
        if (!is_edit) {
            request.activation = $input[1].value;
        }
        $title.html("请求中...");
        const res_json = await cs_post("https://exlg.piterator.com/badge/set", request).data;
        if ("error" in res_json) {
            $title.html("[Err] 失败");
            exlg_alert(res_json.error, "激活 badge 出错");
        } else {
            const badges = Object.assign(JSON.parse(sto["sponsor-tag"].badges), res_json.data);
            badges[$input[0].value].ts = cur_time();
            sto["sponsor-tag"].badges = JSON.stringify(badges);
            $title.html("成功");
            exlg_alert("badge 激活成功！感谢您对 exlg 的支持。", "badge 激活成功", () => { location.reload(); });
        }
    }, false);

    const $board = $("#exlg-container"),
        $input = $board.find("input");

    const updatePreview = () => {
        // Note: 当输入数据时加载预览
        const $i = $("#exlg-container").find("input");
        const badge = is_edit ? $i[1].value : $i[2].value;
        const bg = is_edit ? $i[2].value : $i[3].value;
        const fg = is_edit ? $i[3].value : $i[4].value;
        const $preview = $(".exlg-badge-preview");
        $preview
            .text(badge)
            .css("background", bg)
            .css("color", fg);
    };

    if (!_eval_disabled) {
        try {
            new XNColorPicker({
                color: "mediumturquoise",
                selector: ".exlg-bg-slector",
                colorTypeOption: "single,linear-gradient,radial-gradient",
                onError: () => { },
                onCancel: () => { },
                onChange: () => { },
                onConfirm: (color) => {
                    const c = color.colorType === "single" ? color.color.hex : color.color.str;
                    if (is_edit) $($input[2]).val(c);
                    else $($input[3]).val(c);
                    updatePreview();
                },
            });
            new XNColorPicker({
                color: "#fff",
                selector: ".exlg-fg-slector",
                colorTypeOption: "single,linear-gradient,radial-gradient",
                onError: () => { },
                onCancel: () => { },
                onChange: () => { },
                onConfirm: (color) => {
                    const c = color.colorType === "single" ? color.color.hex : color.color.str;
                    $($input[is_edit ? 3 : 4]).val(c);
                    updatePreview();
                },
            });
        } catch (err) {
            log("看样子刚才没有插进来啊那没事了");
            _eval_disabled = true;
            $("input.exlg-fg-slector").on("input", updatePreview);
            $("input.exlg-bg-slector").on("input", updatePreview);
        }
    } else {
        $("input.exlg-fg-slector").on("input", updatePreview);
        $("input.exlg-bg-slector").on("input", updatePreview);
    }

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
    `);
    $("input[exlg-badge-register]").on("input", updatePreview);

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
});

export default register_badge;
