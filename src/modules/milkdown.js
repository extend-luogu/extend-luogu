import mod from "../core.js";
import { $ } from "../utils.js";
import { Editor } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import { commonmark } from '@milkdown/preset-commonmark';

mod.reg_v2({
    name: "milkdown",
    info: "Milkdown",
    path: ["@/.*"],
    cate: "module"
}, {}, (handler) => {
    handler.hook({
        name: "markdown-replace",
        info: "替换 markdown 编辑器"
    }, null, ({ result, target }) => {
        if (!result) return;
        target.each((_, e, $e=$(e), $p=$e.parent()) => {
            $e.remove();
            $(`<div class="exlg-milkdown"></div>`)
                .appendTo($p);
        })
    }, () => {
        const tmp = $(".mp-editor-container");
        if (tmp.length > 0) {
            return {
                result: true,
                target: tmp
            };
        }
        return { result: false };
    });
});