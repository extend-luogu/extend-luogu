import uindow, { $, exlg_alert, springboard, version_cmp, log } from "../utils.js"
import mod, { sto } from "../core.js"

const update_log = `
*M virtual-participation
 : 修复了无法跳转的 bug
 : 优化了体验
`.trim()

mod.reg_chore("update", "检查更新", "1D", ".*", null, () => {
    $("#exlg-update").remove()
    springboard({ type: "update" }).appendTo($("body")).hide()
    uindow.addEventListener("message", e => {
        if (e.data[0] !== "update") return
        e.data.shift()

        const
            latest = e.data[0],
            version = GM_info.script.version,
            op = version_cmp(version, latest)

        const l = `Comparing version: ${version} ${op} ${latest}`
        log(l)

        // if (uindow.novogui) uindow.novogui.msg(l)
        // Note: NovoGUI 不用力
    })
})

mod.reg("update-log", "更新日志显示", "@/.*", {
    last_version: { ty: "string", priv: true },
}, ({ msto }) => {
    if (location.href.includes("blog")) return // Note: 如果是博客就退出
    const version = GM_info.script.version
    const fix_html = (str) => {
        let res = `<div class="exlg-update-log-text" style="font-family: ${sto["code-block-ex"].copy_code_font};">`
        str.split("\n").forEach(e => {
            res += `<div>${e.replaceAll(" ", "&nbsp;")}</div><br>`
        })
        return res + "</div>"
    }
    switch (version_cmp(msto.last_version, version)) {
    case "==":
        break
    case "<<":
        exlg_alert(fix_html(update_log), `extend-luogu ver. ${version} 更新日志`)
    case ">>":
        msto.last_version = version
    }
}, `
.exlg-update-log-text {
    overflow-x: auto;
    white-space: nowrap;
    text-align: left;
    border: 1px solid #dedede;
}
`)