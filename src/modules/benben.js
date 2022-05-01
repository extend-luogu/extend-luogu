import uindow, { xss, cs_get, $ } from "../utils.js";
import mod from "../core.js";
import check_svg from "../resources/image/check.svg";

mod.reg("benben", "全网犇犇", "@/", {
    source: {
        ty: "enum", dft: "o2", vals: ["o2", "shy"],
        info: ["Source", "切换全网犇犇获取方式"],
    },
    reply_with_md: {
        ty: "boolean", dft: false, info: ["Reply with markdown", "回复时附上原 markdown"],
    },
}, ({ msto }) => {
    const color = {
        Gray: "gray",
        Blue: "bluelight",
        Green: "green",
        Orange: "orange lg-bold",
        Red: "red lg-bold",
        Purple: "purple lg-bold",
        Cheater: "brown lg-bold",
    };
    // Hack: 我知道后面几行很难看但是我需要模仿洛谷对于那一堆元素中间的空格的处理机制
    const check_html = `&nbsp;<a class="sb_amazeui" target="_blank" href="/discuss/show/142324">$</a>`;
    const check = (lv) => (lv <= 3 ? "" : check_html.replace("$", check_svg.replace("%", lv <= 5 ? "#5eb95e" : lv <= 7 ? "#3498db" : "#f1c40f")));

    const oriloadfeed = uindow.loadFeed;

    uindow.loadFeed = function () {
        if (uindow.feedMode === "all-exlg") {
            cs_get({
                url: (msto.source === "o2") ? (`https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121`) : (`https://bens.rotriw.com/api/list/proxy?page=${uindow.feedPage}`),
                onload: (res) => {
                    const e = JSON.parse(res.response);
                    e.forEach((m) => {
                        const tmpval = marked(xss.process(m.content));
                        $(`
                <li class="am-comment am-comment-primary feed-li" exlg="exlg">
                    <div class="lg-left">
                        <a href="/user/${m.user.uid}" class="center">
                            <img src="https://cdn.luogu.com.cn/upload/usericon/${m.user.uid}.png" class="am-comment-avatar">
                        </a>
                    </div>
                    <div class="am-comment-main">
                        <header class="am-comment-hd">
                            <div class="am-comment-meta">
                                <span class="feed-username">
                                    <a class="lg-fg-${color[m.user.color]}" href="/user/${m.user.uid}" target="_blank">${m.user.name}</a>${check(m.user.ccfLevel)}${m.user.badge ? `&nbsp;<span class="am-badge am-radius lg-bg-${color[m.user.color]}">${m.user.badge}</span>` : ""}
                                </span>
                                ${new Date(m.time * 1000).format("yyyy-mm-dd HH:MM")}
                                <a name="feed-reply">回复</a>
                            </div>
                        </header>
                        <div class="am-comment-bd">
                            <span class="feed-comment">
                                ${tmpval}
                            </span>
                        </div>
                    </div>
                </li>
            `)
                            .appendTo($("ul#feed"))
                            .find("a[name=feed-reply]").on("click", () => {
                                scrollToId("feed-content");
                                setTimeout(
                                    () => $("textarea")
                                        .trigger("focus").val(` || @${m.user.name} : ${msto.reply_with_md ? m.content : $(tmpval).text()}`)
                                        .trigger("input"),
                                    50,
                                );
                            });
                    });
                },
            });
            if (msto.source === "shy") {
                uindow.feedPage++;
                $("#feed-more").children("a").text("点击查看更多...");
            }
        } else {
            oriloadfeed();
        }
    };

    const $sel = $(".feed-selector");
    $(`<li class="feed-selector" id="exlg-benben-selector" data-mode="all-exlg" exlg="exlg"><a style="cursor: pointer">全网动态</a></li>`)
        .appendTo($sel.parent())
        .on("click", (e) => {
            const $this = $(e.currentTarget);
            $sel.removeClass("am-active");
            $this.addClass("am-active");
            if (msto.source === "o2") {
                $("#feed-more").hide();
            }
            uindow.feedPage = 1;
            uindow.feedMode = "all-exlg";
            $("li.am-comment").remove();

            uindow.loadFeed();
        });
}, null, "module");

mod.reg(
    "benben-quickpost",
    "CtrlEnter 发送犇犇",
    "@/",
    null,
    () => $("textarea").whenKey("CtrlEnter", () => $("#feed-submit").trigger("click")),
    null,
    "module",
);

mod.reg(
    "benben-autoshow",
    "犇犇自动展开",
    "@/",
    null,
    () => {
        $("#feed-more").css("display", "none");
        $(uindow).on("DOMNodeInserted", () => {
            $(uindow).off("scroll");
            $(uindow).on("scroll", () => { // Note: 绑定滚动事件
                const scrollBottom = $("body").height() - $(uindow).height() - $(uindow).scrollTop();
                if (scrollBottom < 500 && !$(".am-active").hasAttr("exlg")) {
                    $("#feed-more").trigger("click");
                    // Note: 人类迷惑行为
                    $(uindow).off("scroll");
                }
            });
        });
    },
    `
`,
    "module",
);
