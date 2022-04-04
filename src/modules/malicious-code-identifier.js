import mod from "../core.js"
import { $, exlg_alert } from "../utils.js"
import css from "../resources/css/malicious-code-identifier.css"

mod.reg("malicious-code-identifier", "有害代码检查器", [ "@/discuss/\\d+(\\?page\\=\\d+)*$" ], {
    strength : { ty: "number", dft: 3, min: 1, max: 5, step: 1, info: [ "Strength", "强度" ], strict: true }
},  ({ msto }) => {
    const text = $("code").text().toLowerCase()
    const st = msto.strength
    let behavior = []
    let system = text.match("system") && !(text.match("System.out") || text.match("import java"))
    if (st >= 1) {
        if (system && text.match("net user")) behavior.push("高危 操作用户")
        if (system && text.match("shutdown")) behavior.push("高危 关机")
        if (system && text.match("socksorkstation")) behavior.push("高危 锁定桌面")
        if (system && text.match("reg add")) behavior.push("高危 注册进程")
    }
    if (st >= 2) {
        if (system && text.match("taskkill")) behavior.push("危险 关闭进程")
        if (system && text.match("setcursorpos")) behavior.push("危险 修改光标")
    }
    if (st >= 3) {
        if (text.match("windows.h")) behavior.push("可疑 引用 windows.h")
        if (system) {
            behavior.push("可疑 调用系统函数")
            system = true
        }
        if (system && (text.match("encode") || text.match("decode"))) {
            behavior.push("高危 存在加密字符串")
        }
    }
    if (behavior.length !== 0) {
        exlg_alert(behavior.join("</br>").replaceAll("高危", `<a class = "exlg-high-risk">[高危]</a>`)
            .replaceAll("危险", `<a class = "exlg-med-risk">[危险]</a>`)
            .replaceAll("可疑", `<a class = "exlg-low-risk">[可疑]</a>`), "发现有害代码")
    }
}, css)