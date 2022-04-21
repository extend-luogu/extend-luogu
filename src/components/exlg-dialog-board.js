/**
 * 20:20, Apr.20 2022
 * 完成了一次重构。包括：
 *  - 分离 html 文件
 *  - 重写代码结构
 *  - 重设 api
 * by minstdfx
 */
import { $ } from "../utils.js";
import compo from "../compo-core.js";
import css from "../resources/css/exlg-dialog-board.css";
import bhtml from "../resources/exlg-dialog-board.html";

let brd = {};
const exlg_alert = compo.reg("exlg-dialog-board", "exlg 公告板", {
    animation_speed: {
        ty: "enum", dft: ".4s", vals: ["0s", ".2s", ".25s", ".4s"],
        info: ["Speed of Board Animation", "启动消失动画速度"],
    },
    confirm_position: {
        ty: "enum", dft: "left", vals: ["left", "right"],
        info: ["Position of Confirm Button", "确定按钮相对位置"],
    },
}, ({ msto }) => {
    let _mon_flag = false;
    const $wrap = $(bhtml).appendTo($(document.body))
        .on("mouseup", () => {
            // if (_mon_flag) brd.hide_dialog(); // Note: 有 bug, 弃用了
            _mon_flag = false;
        });
    const [$cont, $head, $main, $close] = ["#exlg-container", "#exlg-dialog-title", "#exlg-dialog-content", "#header-right"].map((n) => $wrap.find(n));
    const [$confirm, $cancel] = (msto.confirm_position === "right" ? [0, 1] : [1, 0]).map((n) => $wrap.find(`button[btn-rnk="${n}"]`));

    $confirm.text("确定");
    $cancel.text("取消");

    $confirm.on("click", async () => {
        if (await brd.action.onconfirm?.() ?? true) brd.hide_dialog();
        brd.resolve_result("confirmed");
    });
    $cancel.on("click", async () => {
        if (await brd.action.oncancel?.() ?? true) brd.hide_dialog();
        brd.resolve_result("canceled");
    });
    $close.on("click", async () => {
        if (await brd.action.onclose?.() ?? true) brd.hide_dialog();
        brd.resolve_result("closed");
    });

    // Note: 下面那么写是为了强迫症（
    $cont.on("click", (e) => e.stopPropagation());
    $cont.on("mousedown", (e) => ((_mon_flag = true) && e.stopPropagation()));
    if (msto.animation_speed !== "0s") $cont.css("transition", msto.animation_speed);

    brd = {
        dom: {
            $wrap, $cont, $head, $main, $close,
        },
        wait_time: {
            "0s": 0, ".2s": 100, ".25s": 250, ".4s": 400,
        }[msto.animation_speed],
        show_dialog() {
            this.dom.$wrap.css("display", "flex");
            setTimeout(() => {
                this.dom.$cont.removeClass("container-hide").addClass("container-show");
            }, 50);
        },
        hide_dialog() {
            this.dom.$cont.addClass("container-hide").removeClass("container-show");
            setTimeout(() => this.dom.$wrap.hide(), this.wait_time);
            this.resolve_result("cancel");
        },
        resolve_result(res) {
            this._resolve?.(res);
        },
        then() {
            return new Promise((resolve) => {
                this._resolve = resolve;
            });
        },
    };
}, (
    _,
    text = "",
    title = "exlg 提醒您",
    action = {},
    { width, min_height } = {},
) => {
    brd.action = typeof action === "function" ? { onconfirm: action } : action;
    brd.dom.$head.html(title);
    brd.dom.$main.html(text ?? "exlg 提醒您");
    brd.dom.$cont.css({
        "min-height": min_height,
        width,
    });
    brd.show_dialog();
    brd.action.onopen?.();
    return brd;
}, css);

// export { exlg_alert as default };
export default exlg_alert;
