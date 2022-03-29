import mod from "../core.js"
import { $ } from "../utils.js"

mod.reg("blog", "博客Ex", "@/blogAdmin/article/edit/.*", {
    format: { ty: "boolean", dft: true, info: ["Enable format", "显示格式化按钮"] },
    hotkeys: { ty: "boolean", dft: true, info: ["Enable hotkeys", "快捷键"] }
}, ({ msto }) => {
    const $menu = $(".mp-editor-menu")
    if (msto.format) {
        $menu.append("<li data-v-6d5597b1=\"\" class=\"mp-divider\"><span data-v-6d5597b1=\"\">|</span></li>")
        $menu.append($("<li data-v-6d5597b1=\"\"></li>").append($("<a data-v-6d5597b1=\"\" title=\"自动排版\" unslectable=\"on\" class=\"exlg-format-btn\"></a>").append("<i data-v-6d5597b1=\"\" unslectable=\"on\" class=\"fa fa-check\"></i>")))
        $(".exlg-format-btn").on("click", () => {
            let text = unsafeWindow.articleEditor.content
            text = text.replaceAll(/([\u4e00-\u9fa5])([a-z])/igu,"$1 $2")
            text = text.replaceAll(/([a-z])([\u4e00-\u9fa5])/igu,"$1 $2")
            text = text.replaceAll(/([\u4e00-\u9fa5])(\$)/igu,"$1 $2")
            text = text.replaceAll(/(\$)([\u4e00-\u9fa5])/igu,"$1 $2")
            unsafeWindow.articleEditor.content = text
        })
    }
    if (msto.hotkeys) {
        $(unsafeWindow).keypress((e) => {
            if (e.ctrlKey && e.which === 2) {
                $("a[title='粗体']")[0].click()
            }
            else if (e.ctrlKey && e.which === 9) {
                $("a[title='斜体']")[0].click()
            }
            else if (e.ctrlKey && e.shiftKey && e.which === 24) {
                $("a[title='删除线']")[0].click()
            }
        })
    }
}, `
`)