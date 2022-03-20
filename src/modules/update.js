import { exlg_alert, version_cmp, get_latest } from "../utils.js"
import mod, { sto } from "../core.js"
import update_log from "../resources/update-log.js"

mod.reg_chore("update", "检查更新", "1D", ".*", null, () => {
    get_latest(ver => exlg_alert(`<p>检测到新版本 ${ver}，点击确定将安装。</p>`, "检测到新版本",
        () => location.href = `https://hub.fastgit.xyz/extend-luogu/extend-luogu/raw/${ver}/dist/extend-luogu.min.user.js`))
})

const dev_op = ["$", "#<@"].map(s => s.split(""))
const human_lang = {
    Ty: {
        "-": "添加",
        "x": "删减",
        "!": "重大",
        "*": "修改",
        "^": "修复",
        "$": "重构",
    },
    Op: {
        "-": "特性",
        "?": "文档",
        "#": "依赖",
        "<": "代码风格",
        ">": "命令",
        "M": "模块",
        "H": "钩子",
        "@": "GitHub Action",
    }
}
mod.reg("update-log", "更新日志显示", "@/.*", {
    last_version: { ty: "string", priv: true },
    style: { ty: "enum", vals: ["Commit Message", "自然语言"], get: "id", info: [
        "The way to display log", "显示 Log 的方式"
    ]},
    keep_dev: { ty: "boolean", dft: true, info: [
        "Keep developer messages", "保留开发者更新信息"
    ]},
}, ({ msto }) => {
    if (location.href.includes("blog")) return // Note: 如果是博客就退出
    const version = GM_info.script.version
    let lstdo = false
    const fix_html = (str) => {
        let res = `<div class="exlg-update-log-text" style="font-family: ${sto["code-block-ex"].copy_code_font};">`
        str.split("\n").forEach(e => {
            let trmde = e.trimStart()
            if (trmde.length) {
                if (!msto.keep_dev) {
                    if (trmde[0] === ":") {
                        if (!lstdo)
                            return
                    }
                    else if (dev_op.some((v, i) => v.includes(trmde[i]))) {
                        lstdo = false
                        return
                    }
                    else
                        lstdo = true
                }
                else
                    lstdo = false
                if (msto.style === 1 && trmde[0] !== ":")
                    e = " ".repeat(e.length - trmde.length) + human_lang.Ty[trmde[0]] + human_lang.Op[trmde[1]] + trmde.substring(2)
            }
            res += `<div>${e.replace(/ /g, "&nbsp;")}</div>` // Note: 为了兼容不用 replaceAll
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
    /* border: 1px solid #dedede; */
}
`)