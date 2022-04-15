import { $, springboard, xss } from "../utils.js";
import mod from "../core.js";
import css from "../resources/css/user-intro-ins.css";

mod.reg_user_tab("user-intro-ins", "用户首页_HTML_显示", "main", null, null, () => {
    $(".introduction > *").each((_, e, $e = $(e)) => {
        const t = $e.text();
        const [, , ins, _arg] = t.match(/^(exlg.|%)([a-z]+):([^]+)$/) ?? [];
        if (!ins) return;
        const arg = _arg.split(/(?<!!)%/g).map((s) => s.replace(/!%/g, "%"));
        const $blog = $($(".user-action").children()[0]);
        if (ins === "html") {
            $e.replaceWith($(`<p exlg="exlg">${xss.process(arg[0])}</p>`));
        } else if (ins === "frame") {
            $e.replaceWith(springboard(
                { type: "page", url: encodeURI(arg[0]), confirm: true },
                `width: ${arg[1]}; height: ${arg[2]};`,
            ));
        } else if (ins === "blog") {
            if ($blog.text().trim() !== "个人博客") return;
            $blog.attr("href", arg);
            $e.remove();
        }
    });
}, css, "module");
