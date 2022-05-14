import mod, { sto } from "../core.js";
import {
    $, cur_time, cs_post, lg_usr,
} from "../utils.js";
import register_badge from "../components/register-badge.js";
import css from "../resources/css/sponsor-tag.css";

const pseudoTagWhitelist = ["100250"];

mod.reg_hook_new("sponsor-tag", "badge 显示", ["@/", "@/paste", "@/discuss/.*", "@/problem/.*", "@/ranking.*", "@/user/\\d*.*"], {
    cache: { ty: "string", dft: "3600", info: ["Cache time", "缓存时间（秒）"] },
    badges: { ty: "string", priv: true },
}, ((loaded, badges, promises) => (async ({ msto, args }) => {
    if ($.isEmptyObject(badges) && msto.badges) { Object.assign(badges, JSON.parse(msto.badges)); }
    const pending = Array.from(args.tar).map((e) => {
        const uid = e.attributes.href.value.slice("/user/".length);
        if (!loaded.has(uid) && !(uid in badges && cur_time() - badges[uid].ts <= msto.cache)) {
            loaded.add(uid);
            return uid;
        }
        return null;
    });
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
                /* "background-size": "contain", */
                /* "background-repeat": "no-repeat", */
            })
            .on("click", () => register_badge());
        return {
            pseudoTag: (pseudoTagWhitelist.includes(uid) ? (bdty !== "luogu4" ? $(`<span class="am-badge am-radius lg-bg-${namecol.slice("lg-fg-".length)}">${text}</span>`) : $(`<span class="lfe-caption" style="color: rgb(255, 255, 255); background: ${namecol};">${text}</span>`).css({
                display: "inline-block",
                padding: "0 8px",
                "box-sizing": "border-box",
                "font-weight": 400,
                "line-height": 1.5,
                "border-radius": "2px",
                "margin-left": "0.2em",
            }))[0] : null),
            exlg: $badge[0],
        };
    };

    const getStyleList = (badgeType, badgeData) => {
        if (badgeType === "luogu3" || !Object.keys(badgeData).includes("lg4")) return badgeData;
        const badgeClone = Object.clone(badgeData);
        delete badgeClone.lg4;
        return Object.assign(Object.clone(badgeData.lg4));
    };

    const findUidByImg = (target, limit) => {
        if (!limit) return;
        const prev = target.previousElementSibling;
        if (prev) {
            const imgElem = prev.tagName.toLowerCase() === "img" ? prev : prev.childNodes.filter((e) => e.tagName.toLowerCase() === "img")[0];
            if (imgElem) return imgElem.getAttribute("src").replace(/[^0-9]/ig, "");
        }
        return findUidByImg(target.parentNode, limit - 1);
    };

    const kthParentNode = (target, k) => (target ? (k ? kthParentNode(target.parentNode, k - 1) : target) : null);

    args.tar.forEach((e) => {
        const $e = $(e);
        if (!$e || $e.hasClass("exlg-badge-username")) return;
        $e.addClass("exlg-badge-username"); // Note: 防止重复加
        let uid = $e.attr("href").slice("/user/".length);

        if (args.ty === "pprovider") {
            const { provider } = _feInstance.currentData.problem;
            if (provider.name === e.innerText.trim()) uid = provider.uid;
        }
        if (args.badgeType === "luogu4" && uid === "ript:void 0") uid = findUidByImg(e, 5);

        const badge = badges[uid];
        if (!badge || !badge.text) return;
        let tar = e,
            tarNext;

        try {
        // eslint-disable-next-line no-cond-assign
            if ((tarNext = tar.nextElementSibling) && ((tarNext.classList ? [...tarNext.classList] : tarNext.className.split(" ")).includes("sb_amazeui"))) tar = tarNext;
        } catch (err) {
            console.log(tarNext, err);
        }
        // eslint-disable-next-line no-cond-assign
        if ((tarNext = tar.nextElementSibling) && ((tarNext.classList ? [...tarNext.classList] : tarNext.className.split(" ")).includes("am-badge"))) tar = tarNext;

        const badgeDom = getBadge(uid, args.badgeType === "luogu4" ? e.childNodes[0].style.color : getColor(e), args.badgeType, getStyleList(args.badgeType, badge));
        // if (tar.parentNode.tagName.toLowerCase() === "h2") badgeDom.exlg 给调整一下大小，懒得写了

        let tmp = kthParentNode(tar, 3);
        if (tmp && ((tmp.classList ? [...tmp.classList] : tmp.className.split(" ")).includes("card"))) {
            if (badgeDom.pseudoTag) tmp.parentNode.appendChild(badgeDom.pseudoTag);
            tmp.parentNode.appendChild(badgeDom.exlg);
        } else {
            const parentRank = {
                solu: 3,
                "user-feed": 3,
                "user-follow": 1,
            }[args.ty] ?? 0;
            const _nbsp = document.createElement("span");
            _nbsp.innerHTML = "&nbsp;";
            tmp = kthParentNode(tar, parentRank);
            console.log(tmp);
            tmp.after(badgeDom.exlg);
            if (parentRank === 0) tmp.after(_nbsp);
            if (badgeDom.pseudoTag) {
                tmp.after(badgeDom.pseudoTag);
                if (parentRank === 0) tmp.after(_nbsp);
            }
        }
    });
}))(new Set(), {}, []), (e) => {
    const _filter = (tar) => !(tar.querySelectorAll("svg").length);
    if (/^\/problem\/.*$/.test(location.pathname)) { // 题目页面
        if (/^\/problem\/solution.*$/.test(location.pathname)) {
            // 题解
            const _tar = Array.from(e.target.querySelectorAll(".card>.info-rows a[target='_blank']")).filter(_filter);
            return {
                args: {
                    tar: _tar, hook: true, ty: "solu", badgeType: "luogu4",
                },
                result: _tar.length,
            };
        } // else
        return { // 题目页面提供者不钩
            args: null, result: 0,
        };
    }
    if (/^\/user\/[0-9]{0,}.*$/.test(location.pathname)) {
        if (location.hash === "#activity") {
            const _tar = Array.from(e.target.querySelectorAll(".feed a[target='_blank']")).filter(_filter);
            return {
                args: {
                    tar: _tar, hook: true, ty: "user-feed", badgeType: "luogu4",
                },
                result: _tar.length,
            };
        }
        if (/^#following/.test(location.hash)) {
            const _tar = Array.from(e.target.querySelectorAll(".follow-container a[target='_blank']")).filter(_filter);
            return {
                args: {
                    tar: _tar, hook: true, ty: "user-follow", badgeType: "luogu4",
                },
                result: _tar.length,
            };
        }
    }
    const _tar = Array.from(e.target.querySelectorAll("a[target='_blank'][href^='/user/']")).filter(_filter);
    return {
        args: {
            tar: _tar, hook: true, ty: "lg3", badgeType: "luogu3",
        },
        result: _tar.length,
    };
}, () => {
    const _filter = (tar) => !(tar.querySelectorAll("svg").length);
    if (/^\/problem\/.*$/.test(location.pathname)) { // 题目页面
        if (/^\/problem\/solution.*$/.test(location.pathname)) {
            // 题解
            return {
                tar: Array.from(document.querySelectorAll(".card>.info-rows a[target='_blank']")).filter(_filter), hook: false, ty: "solu", badgeType: "luogu4",
            };
        } // else
        return { // 题目页面提供者
            tar: Array.from(document.querySelectorAll(".full-container .user a[target='_blank']")).filter(_filter), hook: false, ty: "pprovider", badgeType: "luogu4",
        };
    }
    if (/^\/user\/[0-9]{0,}.*$/.test(location.pathname)) {
        if (location.hash === "#activity") {
            return {
                tar: Array.from(document.querySelectorAll(".feed a[target='_blank']")).filter(_filter), hook: false, ty: "user-feed", badgeType: "luogu4",
            };
        }
        if (/^#following/.test(location.hash)) {
            return {
                tar: Array.from(document.querySelectorAll(".follow-container a[target='_blank']")).filter(_filter),
                hook: false, ty: "user-follow", badgeType: "luogu4",
            };
        }
    }
    return {
        tar: Array.from(document.querySelectorAll("a[target='_blank'][href^='/user/']")).filter(_filter),
        hook: false, ty: "lg3", badgeType: "luogu3",
    };
}, css, "module");
