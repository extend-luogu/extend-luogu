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
/**
 * 创建一个 exlg 公告版。
 * @argument {String} text  exlg 公告板显示的内容 (html)。默认为空。
 * @argument {String} title exlg 公告板显示的标题 (html)。默认为"exlg 提醒您"。
 * @argument {Object} actions exlg 公告板在被点击时的行为。
 * @argument {Object} windowArgs 对于窗口的自定义参数。
 * @argument {Function} actions.onopen (brd) 在创建公告板时执行的函数(可以是 async)。默认为 `() => {}`。
 * @argument {Function} actions.onconfirm (brd) 在点击确定时执行的函数，应当返回一个 `Boolean`。若返回 `true`，则关闭公告板。默认为 `() => true`。
 * @argument {Function} actions.oncancel (brd) 在点击取消时执行的函数，应当返回一个 `Boolean`。若返回 `true`，则关闭公告板。默认为 `() => true`。
 * @argument {Function} actions.onclose (brd) 在点击右上角红叉关闭时执行的函数，应当返回一个 `Boolean`。若返回 `true`，则关闭公告板。默认为 `() => true`。
 * @argument {String} width 弹出公告板窗口的宽度。默认为 `500px`。
 * @argument {String} min_height 弹出公告板窗口的最小高度。默认为 `300px`。
 * @returns {Object} 该 object(hrd) 也是所有 action 的参数。
 * 该 object 包含：
 * - `dom`: 一系列的 jQuery 元素，下面列出了它们分别对应的选择器。
 * >
 * >0. `$wrap`: `#exlg-wrapper`, `.exlg-dialog-wrapper`
 * >1. `$cont`: `#exlg-container`, `.exlg-dialog-container`
 * >2. `$head`: `.exlg-dialog-header > #exlg-dialog-title`
 * >3. `$main`: `.exlg-dialog-body > #exlg-dialog-content`
 * >4. `$close`: `#header-right`
 * >
 * - `wait_time`: 原则上，窗口切换显示状态所需要的时间 (以毫秒为单位)。
 * - `hide_dialog`/`show_dialog`: 用于关闭/打开窗口的方法。**原则上不应被直接调用。**
 * - `resolve_result`: 用于 resolve 的方法。
 * - `then`: 无需解释。
 */
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
            // if (_mon_flag) brd.hide_dialog(); // Note: 有 bug，弃用了
            _mon_flag = false;
        });
    const [$cont, $head, $main, $close] = ["#exlg-container", "#exlg-dialog-title", "#exlg-dialog-content", "#header-right"].map((n) => $wrap.find(n));
    const [$confirm, $cancel] = (msto.confirm_position === "right" ? [0, 1] : [1, 0]).map((n) => $wrap.find(`button[btn-rnk="${n}"]`));

    $confirm.text("确定");
    $cancel.text("取消");

    $confirm.on("click", async () => {
        if (await brd.action.onconfirm?.(brd) ?? true) brd.hide_dialog();
        brd.resolve_result("confirmed");
    });
    $cancel.on("click", async () => {
        if (await brd.action.oncancel?.(brd) ?? true) brd.hide_dialog();
        brd.resolve_result("canceled");
    });
    $close.on("click", async () => {
        if (await brd.action.onclose?.(brd) ?? true) brd.hide_dialog();
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
        "min-height": min_height ?? "300px",
        width: width ?? "500px", // Note: 没填需要回到默认值，不然开了一下注册器之后后面全是宽窗口
    });
    brd.show_dialog();
    brd.action.onopen?.(brd);
    return brd;
}, css);

// export { exlg_alert as default };
export default exlg_alert;
