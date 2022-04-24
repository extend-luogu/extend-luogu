import mod, { sto } from "../core.js";
import {
    $, cur_time, cs_post, lg_usr,
} from "../utils.js";
import register_badge from "../components/register-badge.js";
import css from "../resources/css/sponsor-tag.css";

mod.reg_hook_new("sponsor-tag", "标签显示", ["@/", "@/paste", "@/discuss/.*", "@/problem/.*", "@/ranking.*", "@/user/[0-9]{0,}.*"], {
    cache: { ty: "string", dft: "3600", info: ["Cache time", "缓存时间（秒）"] },
    badges: { ty: "string", priv: true },
}, ((loaded, badges, promises) => (async ({ msto, args }) => {
    if ($.isEmptyObject(badges) && msto.badges) { Object.assign(badges, JSON.parse(msto.badges)); }
    const pending = args.tar.map((_, e) => {
        const uid = e.attributes.href.value.slice("/user/".length);
        if (!loaded.has(uid) && !(uid in badges && cur_time() - badges[uid].ts <= msto.cache)) {
            loaded.add(uid);
            return uid;
        }
        return null;
    }).get();
    if (pending.length) {
        promises.push((async () => {
            Object.assign(badges, Object.fromEntries(Object.entries(
                await cs_post(
                    "https://exlg.piterator.com/badge/mget",
                    {
                        uid: lg_usr.uid,
                        token: sto["^token"].token,
                        data: pending,
                    },
                ).data.data,
            ).map(
                ([uid, badge]) => [uid, Object.assign(badge, { ts: cur_time() })],
            )));
        })());
    }
    await Promise.all(promises);
    msto.badges = JSON.stringify(badges);

    const _color = {
        "lg-fg-purple": "#8e44ad",
        "lg-fg-red": "#e74c3c",
        "lg-fg-orange": "#e67e22",
        "lg-fg-green": "#5eb95e",
        "lg-fg-bluelight": "#0e90d2",
        "lg-fg-gray": "#bbb",
        "lg-fg-brown": "#996600",
    };

    const getColor = (e) => {
        const tmpstr = e.className.slice(e.className.indexOf("lg-fg-"));
        if (tmpstr) return tmpstr.slice(0, tmpstr.indexOf(" "));
        if (e.childNodes.length) return e.childNodes[0].style.color;
        return null;
    };

    const getBadge = (uid, namecol, bdty, {
        bg, fg, text, ft, fw, bd, fs,
    }) => {
        const $badge = $(`<span class="exlg-badge" badge-uid="${uid}" badge-type="${bdty}">${text}</span>`)
            .css({
                background: (bg || "mediumturquoise").replaceAll("${luogu-default}", (namecol.includes("lg-fg-") ? _color[namecol] : namecol)),
                color: fg || "#fff",
                "font-family": ft || "",
                "font-weight": fw || "700",
                "font-size": fs || "",
                border: bd || "",
                "background-size": "contain",
                /* "background-repeat": "no-repeat", */
            })
            .on("click", () => register_badge());
        return uid === "100250" ? (bdty !== "luogu4" ? $(`<span class="am-badge am-radius lg-bg-${namecol.slice("lg-fg-".length)}">${text}</span>`) : $(`<span class="lfe-caption" style="color: rgb(255, 255, 255); background: ${namecol};">${text}</span>`).css({
            display: "inline-block",
            padding: "0 8px",
            "box-sizing": "border-box",
            "font-weight": 400,
            "line-height": 1.5,
            "border-radius": "2px",
            "margin-left": "0.2em",
        })) : $badge;
    };

    args.tar.each((_, e) => {
        const $e = $(e);
        if (!$e || $e.hasClass("exlg-badge-username")) return;
        $e.addClass("exlg-badge-username"); // Note: 防止重复加
        let uid = $e.attr("href").slice("/user/".length);
        if (["user-feed", "user-followers"].includes(args.ty) && uid === "ript:void 0") { // Note: 太草了，原来只要钩头像就行了
            uid = $(e.parentNode.parentNode.previousElementSibling ?? e.parentNode.parentNode.parentNode.previousElementSibling).children("img").attr("src").replace(/[^0-9]/ig, "");
        }
        const badge = badges[uid];
        if (!badge || !badge.text) return;
        if (!Object.keys(badge).includes("lg4")) badge.lg4 = {};
        ["bg", "fg", "ft", "fw", "bd", "fs", "text"].forEach((k) => {
            badge.lg4[k] ||= badge[k];
        });

        let $tar = $e,
            bdty = "undef";
        if ($tar.next().length && ($tar.next().hasClass("sb_amazeui"))) { $tar = $tar.next(); }
        if ($tar.next().length && $tar.next().hasClass("am-badge")) { $tar = $tar.next(); }

        if (["user-feed", "user-followers", "no-hook-luogu4"].includes(args.ty)) bdty = "luogu4";
        else if (e.parentNode.tagName.toLowerCase() === "h2") bdty = "luogu3-h2";
        else if (args.ty === "no-hook" && e.parentNode.className === "wrapper" && !e.className.includes("lg-fg-")) return; // console.log("Fail~", e)// Note: 一旦不小心抓到了 .ops 上面不该抓的就不执行
        else bdty = "luogu3";

        const $badge = getBadge(uid, bdty === "luogu4" ? e.childNodes[0].style.color : getColor(e), bdty, bdty === "luogu4" ? badge.lg4 : badge);
        // Note: user 页面的特殊情况
        if (["user-feed", "user-followers"].includes(args.ty)) $tar.parent().after($badge);
        else $tar.after($badge).after($("<span>&nbsp;</span>"));
    });
}))(new Set(), {}, []), (e) => {
    // console.log(e.target)
    // Note: 这里注意一下，在用户主页等使用了 luogu4 的新版 ui 的地方，在插入 .feed 的时候还没有给 用户名加上 attr
    // Note: 所以我先把 .feed 拎出来再看
    // Note: 以下是用户主页
    if (/^\/user\/[0-9]{0,}.*$/.test(location.pathname)) {
        // Note: 动态（犇犇）|| 关注的人
        if (($(e.target).hasClass("feed") && !$(e.target).hasClass("exlg-badge-feed")) || (/^#following/.test(location.hash) && $(e.target).parent().hasClass("sub-body"))) {
            return {
                result: $(e.target).find(".wrapper > a[target='_blank']").length,
                args: {
                    tar: $(e.target).find(".wrapper > a[target='_blank']"),
                    ty: (/^#following/.test(location.hash) ? "user-followers" : "user-feed"),
                },
            };
        }
    }
    const $tmp = $(e.target).find("a[target='_blank'][href^='/user/']");
    return {
        result: $tmp.length,
        args: {
            tar: $tmp,
            ty: "luogu3",
        },
    };
}, () => {
    if (/^\/user\/[0-9]{0,}.*$/.test(location.pathname)) {
        if (location.hash === "#activity") return { tar: $(".feed .wrapper>a[target='_blank']"), ty: "no-hook-luogu4" };
        if (/^#following/.test(location.hash)) return { tar: $(".follow-container .wrapper>a[target='_blank']"), ty: "no-hook-luogu4" };
    }
    return { tar: $("a[target='_blank'][href^='/user/']"), ty: "no-hook" };
}, css, "module");
