/* eslint-disable */
/* global XNColorPicker */
import {
    $, cur_time, lg_usr, cs_post, log,
} from "../utils.js";
import exlg_alert from "./exlg-dialog-board.js";
import compo from "../compo-core.js";
import mod, { sto } from "../core.js";
import html from "../resources/badge-register.html";

const register_badge = compo.reg("register-badge", "badge 注册", null, null, () => {
    // Note: 引入 API 即判断能否使用 eval
    try {
        // eslint-disable-next-line no-eval
        (0, eval)(GM_getResourceText("colorpicker"));
        log("这个页面可以用 eval 的说!芜湖，起飞~");
    } catch (err) {
        log("这个页面并不可以用 eval 哇，试试其他页面，可以吗可以吗可以吗~诶诶诶诶诶???!呜哇~");
        exlg_alert("这个页面并不可以用 eval 哇，试试其他页面，可以吗可以吗可以吗~诶诶诶诶诶???!呜哇~")
        return;
    }
    exlg_alert(html, "exlg badge register ver.7.0: 暂不可用", () => {
        
    }, { width: "800px", min_height: "400px" })
})

export default register_badge;