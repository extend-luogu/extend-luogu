import uindow, { $, cs_post } from "../utils.js";
import mod from "../core.js";

mod.reg_v2({
    name: "blog",
    info: "博客 ex",
    path: ["@/blogAdmin/article/edit/.*", "@/blogAdmin/article/new"],
    cate: "module",
}, null, (handler) => {
    handler.onload({
        name: "format",
        info: "按照洛谷题解标准格式化",
    }, {
        on: {
            ty: "boolean", dft: true, info: ["Enable format", "显示格式化按钮"], migration: "format",
        },
        cloud: {
            ty: "boolean", dft: true, info: ["Enable cloud format", "启用云格式化"], migration: true,
        },
    }, ({ msto }) => {
        const $menu = $(".mp-editor-menu");
        $menu.append("<li data-v-6d5597b1=\"\" class=\"mp-divider\"><span data-v-6d5597b1=\"\">|</span></li>");
        $menu.append($("<li data-v-6d5597b1=\"\"></li>").append($("<a data-v-6d5597b1=\"\" title=\"自动排版\" unslectable=\"on\" class=\"exlg-format-btn\"></a>").append("<i data-v-6d5597b1=\"\" unslectable=\"on\" class=\"fa fa-check\"></i>")));
        $(".exlg-format-btn").on("click", async () => {
            let text = uindow.articleEditor.content;
            if (!msto.cloud) {
                text = text.replaceAll(/([\u4e00-\u9fa5])([a-z])/igu, "$1 $2");
                text = text.replaceAll(/([a-z])([\u4e00-\u9fa5])/igu, "$1 $2");
                text = text.replaceAll(/([\u4e00-\u9fa5])(\$)/igu, "$1 $2");
                text = text.replaceAll(/(\$)([\u4e00-\u9fa5])/igu, "$1 $2");
            } else {
                text = await cs_post(
                    "https://exlgcs.jin-dan.site/autocorrect",
                    { content: text },
                ).data.data;
            }
            uindow.articleEditor.content = text;
        });
    });

    handler.onload({
        name: "hotkeys",
        info: "编辑快捷键",
    }, {
        on: {
            ty: "boolean", dft: true, info: ["Enable hotkeys", "快捷键"], migration: "hotkeys",
        },
    }, () => {
        $(uindow).whenKey({
            CtrlB: () => $("a[title='粗体']")[0].click(),
            CtrlI: () => $("a[title='斜体']")[0].click(),
            CtrlShiftX: () => $("a[title='删除线']")[0].click(),
        });
    });
});
