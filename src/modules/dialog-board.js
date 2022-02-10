import { $, exlg_dialog_board } from "../utils.js"
import mod from "../core.js"

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
    const $wrapper = $(`<div class="exlg-dialog-wrapper" id="exlg-wrapper" style="display: none;">
    <div class="exlg-dialog-container container-hide" id="exlg-container" style="${msto.animation_speed === "0s" ? "" : `transition: all ${ msto.animation_speed };` }">
     <div class="exlg-dialog-header">
      <span><strong id="exlg-dialog-title">我做东方鬼畜音mad，好吗</strong></span>
      <div id="header-right" onclick="" style="opacity: 0.5;"><svg class="icon" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5446"><path d="M512 128c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384-172.3-384-384-384z m0 717.4c-183.8 0-333.4-149.6-333.4-333.4S328.2 178.6 512 178.6 845.4 328.2 845.4 512 695.8 845.4 512 845.4zM651.2 372.8c-9.9-9.9-25.9-9.9-35.8 0L512 476.2 408.6 372.8c-9.9-9.9-25.9-9.9-35.8 0-9.9 9.9-9.9 25.9 0 35.8L476.2 512 372.8 615.4c-9.9 9.9-9.9 25.9 0 35.8 4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4L512 547.8l103.4 103.4c4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4c9.9-9.9 9.9-25.9 0-35.8L547.8 512l103.4-103.4c9.9-9.9 9.9-25.9 0-35.8z" p-id="5447"></path></svg></div>
     </div>
     <div class="exlg-dialog-body">
         <div id="exlg-dialog-content">

         </div>
     </div>
    </div>
   </div>`).appendTo($(document.body))
    const wait_time = {"0s": 0, ".2s": 100, ".25s": 250, ".4s": 400 }[msto.animation_speed]
    const wrapper = $wrapper[0], container = wrapper.firstElementChild,
        header = container.firstElementChild.firstElementChild.firstElementChild, content = container.lastElementChild.firstElementChild,
        close_btn = container.firstElementChild.lastElementChild
    const footer = document.createElement("div")
    footer.classList.add("exlg-dialog-footer")
    container.appendChild(footer)
    const btn_accept = document.createElement("button"), btn_cancel = document.createElement("button")
    // btn_accept.classList.add("exlg-dialog-btn-confirm")
    btn_accept.innerHTML = "确定"
    btn_cancel.innerHTML = "取消"
    btn_accept.classList.add("exlg-dialog-btn")
    btn_cancel.classList.add("exlg-dialog-btn")
    if (msto.confirm_position === "left")
        footer.appendChild(btn_cancel), footer.appendChild(btn_accept)
    else
        footer.appendChild(btn_accept), footer.appendChild(btn_cancel)
    container.onclick = (e) => e.stopPropagation()
    close_btn.onclick = btn_cancel.onclick = exlg_dialog_board.hide_dialog
    btn_accept.onclick = exlg_dialog_board.accept_dialog

    let _mouse_down_on_wrapper = false
    container.onmousedown = (e) => e.stopPropagation()
    wrapper.onmousedown = () => {
        _mouse_down_on_wrapper = true
    }
    wrapper.onmouseup = () => {
        if (_mouse_down_on_wrapper) exlg_dialog_board.hide_dialog()
        _mouse_down_on_wrapper = false
    }
    Object.assign(exlg_dialog_board, {
        wrapper,
        container,
        wait_time,
        header,
        content,
    })
},`
/* input for our badge register */
input[exlg-badge-register] {
    outline: none;
    display: inline-block;
    width: auto;
    padding: 0.5em;
    /* font-size: 1.6rem; */
    line-height: 1.2;
    color: #555;
    vertical-align: middle;
    background-color: #fff;
    background-image: none;
    border: 1px solid #ccc;
    border-radius: 0;
    -webkit-appearance: none;
    -webkit-transition: border-color .15s ease-in-out,-webkit-box-shadow .15s ease-in-out;
    transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}
input[exlg-badge-register]:focus {
    border: 1px solid #3bb4f2;
}
body {
    margin: 0px;
}
.exlg-dialog-footer {
    bottom: 0px;
    position: absolute;
    right: 0px;
    padding: 10px 6px;
}
/*
.exlg-dialog-container.container-show:hover > .exlg-dialog-btn.exlg-dialog-btn-confirm {
    background: rgba(30, 140, 200, 0.80);
}
.exlg-dialog-btn.exlg-dialog-btn-confirm {
    background: rgba(30, 140, 200, 0.20);
}
*/
.exlg-dialog-container.container-show:hover > .exlg-dialog-btn {
    background: rgba(255, 255, 255, 0.80);
}
.exlg-dialog-btn {
    margin: 0px 4px;
    display: inline-block;
    float: right;
    color: #666;
    min-width: 75px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.20);
    padding: 7px 10px;
    border: 1px solid #ddd;
    border-radius: 3px;
}
.exlg-dialog-container.container-hide {
    opacity: 0;
}
.exlg-dialog-container.container-show:hover {
    background: rgba(250, 250, 250, 0.80);
    box-shadow: 0 2px 8px rgb(0 0 0 / 40%);
    opacity: 1;
}
.exlg-dialog-container {
    filter: blur(0);
    position: relative;
    opacity: 0.75;
    background: rgba(204, 204, 204, 0.20);
    width: 500px;
    min-height: 300px;
    border-radius: 5px;
    margin: 0 auto;
    box-shadow: 0 2px 8px rgb(0 0 0 / 25%);
    font-size: 16px;
    line-height: 1.5;
    /* transition: all .4s; */
    backdrop-filter: blur(20px);
}
.exlg-dialog-wrapper {
    position: fixed;
    left: 0px;
    top: 0px;
    background: rgba(0, 0, 0, 0);
    width: 100%;
    height: 100%;
    /* opacity: 0.2;*/
    /* vertical-align: middle; */
    align-items: center;
    display: table-cell;
}
.exlg-dialog-header {
    height: auto;
    border-bottom: 1px solid #eee;
    padding: 11px 20px;
}
.exlg-dialog-body {
    text-align: center;
    margin-bottom: 50px;
    padding: 20px 30px;
    padding-bottom: 10px;
}
#header-right {
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 5px;
    background: rgba(0, 0, 0, 0);
    color: red;
    right: 10px;
    top: 10px;
    text-align: center;
}
`)