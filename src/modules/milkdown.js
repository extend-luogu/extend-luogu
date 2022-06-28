import { Editor, rootCtx } from "@milkdown/core";
import { nord } from "@milkdown/theme-nord";
import { commonmark } from "@milkdown/preset-commonmark";
import { history } from "@milkdown/plugin-history";
import { clipboard } from "@milkdown/plugin-clipboard";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { math } from "@milkdown/plugin-math";
import { menu } from "@milkdown/plugin-menu";
import { indent, indentPlugin } from "@milkdown/plugin-indent";
import { emoji } from "@milkdown/plugin-emoji";
import { switchTheme } from "@milkdown/utils";
import { tokyo } from "@milkdown/theme-tokyo";
import uindow, { $ } from "../utils.js";
import mod from "../core.js";

let cssAdded = false;

mod.reg_v2({
    name: "milkdown",
    info: "Milkdown",
    path: ["@/.*"],
    cate: "module",
}, {
    milkdown_theme: {
        ty: "enum", dft: "nord", vals: ["nord", "tokyo"], info: [
            "Milkdown theme", "主题",
        ], migration: true,
    },
}, (handler) => {
    handler.hook({
        name: "markdown-replace",
        info: "替换 markdown 编辑器",
    }, null, ({ result, target, gsto }) => {
        if (!result) return;

        if (!cssAdded) {
            cssAdded = true;
            [
                "roboto",
                "material_icons",
                "material_icons_outlined",
            ].forEach((r) => { GM_addStyle(GM_getResourceText(r)); });
        }

        target.each((_, e, $e = $(e), $p = $e.parent()) => {
            $e
                .removeClass("exlg-milkdown-before")
                .addClass("exlg-milkdown-mp")
                .css("display", "none");

            $(`<div data-v-6d5597b1 class="exlg-milkdown mp-editor-container"></div>`)
                .appendTo($p);

            const editor = Editor
                .make()
                .config((ctx) => {
                    ctx.set(rootCtx, document.querySelector(".exlg-milkdown"));
                })
                .config((ctx) => {
                    ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, _prevMarkdown) => {
                        uindow.markdownPalettes.content = markdown;
                    });
                })
                .use(
                    indent.configure(indentPlugin, {
                        type: "space", // Note: available values: 'tab', 'space',
                        size: 2,
                    }),
                )
                .use(emoji)
                .use(menu)
                .use(nord)
                .use(commonmark)
                .use(history)
                .use(clipboard)
                .use(math)
                .use(listener)
                .create();

            const selectedTheme = gsto.milkdown_theme;
            if (selectedTheme === "nord") editor.action(switchTheme(nord));
            else
            if (selectedTheme === "tokyo") editor.action(switchTheme(tokyo));
        });
    }, () => {
        const $tmp = $(".mp-editor-container[data-v-6d5597b1][data-v-aa62436e]");
        $tmp.each((_, e, $e = $(e)) => {
            if (!($e.hasClass("exlg-milkdown-before") || $e.hasClass("exlg-milkdown-mp"))) {
                $e.addClass("exlg-milkdown-before");
            }
        });

        const $target = $(".exlg-milkdown-before");
        if ($target.length) {
            return {
                result: true,
                target: $target,
            };
        }

        return { result: false };
    });
});
