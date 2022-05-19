import {
    $,
    springboard,
    xss,
    lg_content,
} from "../utils.js";
import mod from "../core.js";
import css from "../resources/css/user-intro-ins.css";

mod.reg_user_tab("user-intro-ins", "用户首页_HTML_显示", "main", null, null, () => {
    /**
     * 创建用户自定义版面
     */
    function regTab() {
        $(".introduction > *").each(async (_, e, $e = $(e)) => {
            const t = $e.text();
            const [, , ins, _arg] = t.match(/^(exlg.|%)([a-z|-]+):([^]+)$/) ?? [];
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
            } else if (ins === "html-paste") {
                if (arg[0].trim() === "") return;
                const res = await lg_content(`/paste/${arg[0].trim()}`);
                $e.replaceWith($(`<p exlg="exlg">${xss.process(res.currentData.paste.data)}</p>`));
            }
        });
    }
    regTab();

    /**
     * 寻找深层第一个子节点
     *
     * @param $dist 根节点
     * @param time  子节点层数
     */
    function findSon($dist, time) {
        if (time === 0) {
            return $dist;
        }
        return $(findSon($($dist.children()[0]), time - 1));
    }
    findSon($("section.main"), 3).addClass("lg-editt");
    // Note: 现在只做到按 cancel 时重加载
    $("button.lg-editt").on("click", async () => {
        const $divv = findSon($("section.main"), 2);
        const $son0 = $($divv.children()[0]);
        const $son1 = $($divv.children()[1]);
        $son0.addClass("lg-editt");
        $son1.addClass("lg-editt");
        regTab();
    });
}, css, "module");
