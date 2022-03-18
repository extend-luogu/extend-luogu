import mod from "../core.js"
import { $, exlg_alert } from "../utils.js"

mod.reg("malicious-code-identifier", "有害代码检查器", [ "@/discuss/\\d+(\\?page\\=\\d+)*$" ], {
    strength : { ty: "number", dft: 3, min: 1, max: 5, step: 1, info: [ "Strength", "强度" ], strict: true }
},  ({ msto }) => {
    const text = $("code").text().toLowerCase()
    const st = msto.strength
    let behavior = []
    let system = false
    if (st >= 1) {
        if (text.match("net user")) behavior.push("高危 操作用户")
        if (text.match("shutdown")) behavior.push("高危 关机")
        if (text.match("socksorkstation")) behavior.push("高危 锁定桌面")
    }
    if (st >= 2) {
        if (text.match("taskkill")) behavior.push("危险 关闭进程")
    }
    if (st >= 3) {
        if (text.match("windows.h")) behavior.push("可疑 关闭进程")
        if (text.match("system")) {
            behavior.push("可疑 调用系统函数")
            system = true
        }
        if (text.match("encode") && system) {
            behavior.push("高危 存在加密字符串")
        }
    }
    if (behavior.length !== 0) {
        debugger
        exlg_alert(behavior.join("</br>").replace("高危", `<a class = "exlg-high-risk">[高危]</a>`)
            .replace("危险", `<a class = "exlg-med-risk">[危险]</a>`)
            .replace("可疑", `<a class = "exlg-low-risk">[可疑]</a>`), "发现有害代码")
    }
}, `
.exlg-high-risk {
    color: #dd514c;
}
.exlg-med-risk {
    color: #ff5722;
}
.exlg-low-risk {
    color: #8c8c8c;
}
`)