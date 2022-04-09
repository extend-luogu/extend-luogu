import { $ } from "../utils.js"
import mod from "../core.js"
import css from "../resources/css/code-block-ex.css"

mod.reg_hook_new("code-block-ex", "代码块优化", "@/.*", {
    copy_code_position : { ty: "enum", vals: [ "left", "right" ], dft: "left", info: [ "Copy Button Position", "复制按钮对齐方式" ] },
    code_block_title : { ty: "string", dft: "源代码 - ${lang}", info: [ "Custom Code Title(with Language)", "自定义代码块标题 - 限定语言" ] },
    code_block_title_nolang : { ty: "string", dft: "源代码", info: [ "Custom Code Title(without Language)", "自定义代码块标题 - 默认" ] },
    copy_code_font : { ty: "string", dft: "'Fira Code', Consolas, monospace", info: [ "Code Block Font", "代码块字体" ], strict: true },
    max_show_lines : { ty: "number", dft: -1, min: -1, max: 100, info: [ "Max Lines On Show", "代码块最大显示行数" ], strict: true }
},  ({ msto, args }) => {

    const isRecord = /\/record\/.*/.test(location.href)

    const langs = {
        c: "C", cpp: "C++", pascal: "Pascal", python: "Python", java: "Java", javascript: "JavaScript", php: "PHP", latex: "LaTeX"
    }

    const get_lang = $code => {
        let lang = "undefined"
        if (isRecord) return $($(".value.lfe-caption")[0]).text()
        if ($code.attr("data-rendered-lang")) lang = $code.attr("data-rendered-lang")
        else if ($code.attr("class")) $code.attr("class").split(" ").forEach(cls => {
            if (cls.startsWith("language-")) lang = cls.slice(9)
        })
        return langs[lang]
    }

    args.attr("exlg-copy-code-block", "")

    args.each((_, e, $pre = $(e)) => {
        if (e.parentNode.className === "mp-preview-content" || e.parentNode.parentNode.className === "mp-preview-area") return
        const $btn = isRecord
            ? ($pre.children(".copy-btn"))
            : $(`<div class="exlg-copy">复制</div>`)
                .on("click", () => {
                    if ($btn.text() !== "复制") return // Note: Debounce
                    $btn.text("复制成功").toggleClass("exlg-copied")
                    setTimeout(() => $btn.text("复制").toggleClass("exlg-copied"), 800)
                    GM_setClipboard($pre.text(), "text/plain")
                })

        const $code = $pre.children("code")
        $code.css("font-family", msto.copy_code_font || undefined)
        if (!$code.hasClass("hljs")) $code.addClass("hljs").css("background", "white")
        $btn.addClass(`exlg-copy-${msto.copy_code_position}`)

        const lang = get_lang($code)
        // const title_text = msto.code_block_title.replace("${lang}", (lang ? lang : "Text"))
        const title_text = lang ? msto.code_block_title.replace("${lang}", lang) : msto.code_block_title_nolang
        const $title = isRecord ? $(".lfe-h3").text(title_text) : $(`<h3 class="exlg-code-title" style="/*width: 100%;*/">${title_text}</h3>`)

        if (!isRecord) $pre.before($title.append($btn))
    })
}, (e) => {
    const $tar = $(e.target).find("pre:has(> code:not(.cm-s-default)):not([exlg-copy-code-block])")
    return {
        result: $tar.length,
        args: $tar
    }
}, () => $("pre:has(> code:not(.cm-s-default)):not([exlg-copy-code-block])"), css, "module")