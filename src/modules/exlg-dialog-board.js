import { $, exlg_dialog_board } from "../utils.js"
import mod from "../core.js"
import css from "../resources/css/exlg-dialog-board.css"

mod.reg("exlg-dialog-board", "exlg_公告板", "@/.*", {
    animation_speed: {
        ty: "enum", dft: ".4s", vals: [ "0s", ".2s", ".25s", ".4s" ],
        info: [ "Speed of Board Animation", "启动消失动画速度" ]
    },
    confirm_position: {
        ty: "enum", dft: "right", vals: [ "left", "right" ],
        info: [ "Position of Confirm Button", "确定按钮相对位置" ]
    }
}, ({ msto }) => {
    let $wrap, $cont, $head, $main, _mouse_down_on_wrapper = false
    $wrap = $(`<div class="exlg-dialog-wrapper" id="exlg-wrapper" style="display: none;">`)
        .append($cont = $(`<div class="exlg-dialog-container container-hide" id="exlg-container" style="${msto.animation_speed === "0s" ? "" : `transition: all ${ msto.animation_speed };` }"></div>`)
            .append($(`<div class="exlg-dialog-header">`)
                .append($head = $(`<strong id="exlg-dialog-title">我做东方鬼畜音mad，好吗</strong>`))
                .append($(`<div id="header-right" onclick="" style="opacity: 0.5;"><svg class="icon" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5446"><path d="M512 128c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384-172.3-384-384-384z m0 717.4c-183.8 0-333.4-149.6-333.4-333.4S328.2 178.6 512 178.6 845.4 328.2 845.4 512 695.8 845.4 512 845.4zM651.2 372.8c-9.9-9.9-25.9-9.9-35.8 0L512 476.2 408.6 372.8c-9.9-9.9-25.9-9.9-35.8 0-9.9 9.9-9.9 25.9 0 35.8L476.2 512 372.8 615.4c-9.9 9.9-9.9 25.9 0 35.8 4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4L512 547.8l103.4 103.4c4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4c9.9-9.9 9.9-25.9 0-35.8L547.8 512l103.4-103.4c9.9-9.9 9.9-25.9 0-35.8z" p-id="5447"></path></svg></div>`)
                    .on("click", () => exlg_dialog_board.hide_dialog())) // Note: 不这么写 this 会变化
            ).append($(`<div class="exlg-dialog-body">`)
                .append($main = $(`<div id="exlg-dialog-content">`))
            ).append($(`<div class="exlg-dialog-footer">`)
                .append($(`<button class="exlg-dialog-btn">确定</button>`)
                    .on("click", () => exlg_dialog_board.accept_dialog()))
                [msto.confirm_position === "left" ? "prepend" : "append"]($(`<button class="exlg-dialog-btn">取消</button>`)
                    .on("click", () => exlg_dialog_board.hide_dialog()))
            ).on("click", e => e.stopPropagation())
            .on("mousedown", e => e.stopPropagation())
        ).on("mousedown", () => (_mouse_down_on_wrapper = true))
        .on("mouseup", () => {
            if (_mouse_down_on_wrapper)
                exlg_dialog_board.hide_dialog()
            _mouse_down_on_wrapper = false
        })
        .appendTo($(document.body))
    const [wrapper, container, header, content] = [$wrap, $cont, $head, $main]

    Object.assign(exlg_dialog_board, {
        wrapper, container, header, content,
        wait_time: {"0s": 0, ".2s": 100, ".25s": 250, ".4s": 400 }[msto.animation_speed],
    })
}, css)