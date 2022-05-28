import mod, { sto } from "../core.js";
import {
    $, cur_time, cs_post, lg_usr,
} from "../utils.js";
import register_badge from "../components/register-badge.js";
import css from "../resources/css/sponsor-tag.css";

export const pseudoTagWhitelist = { 100250: "风神少女" };

const allTargets = [
    { // 题解
        pathTest: /^\/problem\/solution.*$/,
        domSelector: ".card>.info-rows a[target='_blank']",
        type: { displayType: "luogu4", elementType: "solu", anceLevel: 3 },
    },
    { // 出题人
        pathTest: /^\/problem\/.*$/,
        domSelector: ".full-container .user a[target='_blank']",
        type: { displayType: "luogu4", elementType: "prob", anceLevel: 0 },
    },
    { // 个人主页 - 动态
        pathTest: ({ pathname, hash }) => (/^\/user\/[0-9]{0,}.*$/.test(pathname) && hash === "activity"),
        domSelector: ".feed a[target='_blank']",
        type: { displayType: "luogu4", elementType: "user-feed", anceLevel: 3 },
    },
    { // 个人主页 - 关注
        pathTest: ({ pathname, hash }) => (/^\/user\/[0-9]{0,}.*$/.test(pathname) && /^#following/.test(hash)),
        domSelector: ".follow-container a[target='_blank']",
        type: { displayType: "luogu4", elementType: "user-follow", anceLevel: 1 },
    },
    { // 默认(谷三代前端)
        pathTest: () => true,
        domSelector: "a[target='_blank'][href^='/user/']",
        type: { displayType: "luogu3", elementType: "luogu3", anceLevel: 0 },
    },
];
const ccfLevelTagFilter = (tar) => !(tar.querySelectorAll("svg").length);

mod.reg_hook_new("sponsor-tag", "badge 显示", ["@/", "@/paste", "@/discuss/.*", "@/problem/.*", "@/ranking.*", "@/user/\\d*.*"], {
    cache: { ty: "string", dft: "3600", info: ["Cache time", "缓存时间（秒）"] },
    badges: { ty: "string", priv: true },
}, ((loaded, badges, promises) => (async ({ msto, args: { domList, type: { displayType, elementType, anceLevel } } }) => {
    if ($.isEmptyObject(badges) && msto.badges) { Object.assign(badges, JSON.parse(msto.badges)); }
    const pending = Array.from(domList).map((e) => {
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
        bg, fg, text, ft, fw, bd, fs, pseudo,
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
        if (Object.keys(pseudoTagWhitelist).includes(uid) && (!pseudo)) {
            /*
            try {
                const s = JSON.parse(text);
                if (typeof s === "object") {
                    [$badge[0].innerText, pseudo] = s;
                }
            } catch (err) {
                // 说明是正常的 text 呗...
                // 那就什么都不做，嗯嗯，啊对对对。
            }
            */
            pseudo ??= pseudoTagWhitelist[uid]; // if still..
        }
        return {
            pseudoTag: ((Object.keys(pseudoTagWhitelist).includes(uid) && pseudo) ? (bdty !== "luogu4" ? $(`<span class="am-badge am-radius lg-bg-${namecol.slice("lg-fg-".length)}">${pseudo}</span>`) : $(`<span class="lfe-caption" style="color: rgb(255, 255, 255); background: ${namecol};">${pseudo}</span>`).css({
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

    domList.forEach((e) => {
        // header
        const $e = $(e);
        if (!$e || $e.hasClass("exlg-badge-username")) return;
        $e.addClass("exlg-badge-username"); // Note: 防止重复加
        // get uid
        let uid = $e.attr("href").slice("/user/".length);
        if (elementType === "prob") {
            const { provider } = _feInstance.currentData.problem;
            if (provider.name === e.innerText.trim()) uid = provider.uid;
        }
        if (displayType === "luogu4" && uid === "ript:void 0") uid = findUidByImg(e, 5);
        const badge = badges[uid];
        if (!badge || (!badge.text && !(Object.keys(pseudoTagWhitelist).includes(uid) && badge.pseudo))) return;

        let [tar, tarNext] = [e, e.nextElementSibling];
        if (tarNext && ((tarNext.classList ? [...tarNext.classList] : tarNext.className.split(" ")).includes("sb_amazeui"))) tar = tarNext;
        tarNext = tar.nextElementSibling;
        if (tarNext && ((tarNext.classList ? [...tarNext.classList] : tarNext.className.split(" ")).includes("am-badge"))) tar = tarNext;

        const badgeDom = getBadge(uid, displayType === "luogu4" ? e.childNodes[0].style.color : getColor(e), displayType, getStyleList(displayType, badge));
        let tmp = kthParentNode(tar, 3);
        if (tmp && ((tmp.classList ? [...tmp.classList] : tmp.className.split(" ")).includes("card"))) {
            if (badgeDom.pseudoTag) tmp.parentNode.appendChild(badgeDom.pseudoTag);
            tmp.parentNode.appendChild(badgeDom.exlg);
        } else {
            const _nbsp = document.createElement("span");
            _nbsp.innerHTML = "&nbsp;";
            tmp = kthParentNode(tar, anceLevel);
            tmp.after(badgeDom.exlg);
            if (anceLevel === 0) tmp.after(_nbsp);
            if (badgeDom.pseudoTag) {
                tmp.after(badgeDom.pseudoTag);
                if (anceLevel === 0) tmp.after(_nbsp);
            }
        }
    });
}))(new Set(), {}, []), (e) => {
    let _res = { args: null, result: false };
    allTargets.every(({ pathTest, domSelector, type }) => {
        if ((typeof pathTest === "function") ? pathTest(location) : pathTest.test(location.pathname)) {
            return (_res = ((() => {
                const domList = Array.from(e.target.querySelectorAll(domSelector)).filter(ccfLevelTagFilter);
                return {
                    args: { type, domList },
                    result: Boolean(domList?.length),
                };
            })()), 0);
        }
        return 1;
    });
    return _res;
}, () => {
    let _res = { args: null, result: false };
    allTargets.every(({ pathTest, domSelector, type }) => {
        if ((typeof pathTest === "function") ? pathTest(location) : pathTest.test(location.pathname)) {
            return (_res = ((() => {
                const domList = Array.from(document.querySelectorAll(domSelector)).filter(ccfLevelTagFilter);
                return { type, domList };
            })()), 0);
        }
        return 1;
    });
    return _res;
}, css, "module");
