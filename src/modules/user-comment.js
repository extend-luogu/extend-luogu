import mod from "../core.js";
import { $ } from "../utils.js";
import svg_modify_usercomment from "../resources/image/modify-usercomment.svg";
import css from "../resources/css/user-comment.css";
import exlg_alert from "../components/exlg-dialog-board.js";

let cmts = null;
// mod.reg("user-comment-modifier", "修改用户备注", "")
mod.reg_hook_new("user-comment", "用户备注", ".*", {
    comments: { ty: "string", dft: "{}", priv: true }, // Note: string 只是替代方案，换用 dict 是迟早的
    direct_display: { ty: "boolean", dft: true, info: ["Directly replace username", "直接替换用户名"] },
}, ({ msto, result, args }) => { // Note: 你他妈也知道替代方案是吧
    const _setcomment = ($nm, com, orin = $nm.attr("exlg-usercom")) => {
        if (!$nm) return;
        if (!$nm.length) return;
        if ($nm.length > 1) {
            $nm.each((_i, e) => _setcomment($(e), com));
            return;
        }
        let $tar = $nm;
        if ($nm.children("span[style]").length) $tar = $nm.children("span[style]");
        // console.log($nm, $tar, com ?? orin);

        if (msto.direct_display) {
            $tar.css("white-space", "pre");
            $tar.text(com ?? orin);
        } else {
            $tar.children("span.exlg-usercom-tag").remove();
            if (com) $tar.append(`<span class="exlg-usercmt exlg-usercom-tag">(${com})</span>`);
        }
    };
    if (!result) { // Note: 刚刚加载时
        // Note: 检查是否有空
        cmts = JSON.parse(msto.comments);
        for (const [i, v] of Object.entries(cmts)) if (v === null || v === "") delete cmts[i];
        // Note: 编辑
        if (/^\/user\/[1-9][0-9]{0,}$/.test(location.pathname)) {
            const $username = $(".user-info > div.user-name"),
                orin = $username.text();
            const uid = +location.pathname.slice(6);
            $username.html(``);
            const $name_text = $(`<span id="exlg-name-text"></span>`).appendTo($username);
            $name_text.text(uid in cmts ? cmts[uid] : orin);
            const $cbtn = $(`<span title="修改用户备注">${svg_modify_usercomment}</span>`);
            $username.append($cbtn);
            $cbtn.on("click", () => {
                exlg_alert(`<div>请设置用户 <span style="font-family: Consolas;">${orin} (uid: ${uid})</span> 的备注名。<br/><small>留空则清除备注。</small></div><input exlg-badge-register type="text" style="font-family: Consolas;line-height: 1.5;padding: .1em;" class="am-form-field exlg-badge-input" placeholder="${orin}" name="username" id="exlg-user-com-input">`, "exlg 用户备注", () => {
                    let nn = $("#exlg-user-com-input").val();
                    if (nn.trim() === "") {
                        delete cmts[uid];
                        nn = orin;
                    } else cmts[uid] = nn;
                    _setcomment($(`a[href="/user/${uid}"][target=_blank]`), cmts[uid], orin);
                    msto.comments = JSON.stringify(cmts);
                    $name_text.text(uid in cmts ? cmts[uid] : orin);
                    return true;
                });
                $("#exlg-user-com-input").val(uid in cmts ? cmts[uid] : orin);
            });
        }
    }
    args.forEach((arg) => {
        const $arg = $(arg);
        let uid = arg.href.split("/").lastElem();
        if (typeof $arg.attr("exlg-usercom") !== "undefined") return;
        $arg.attr("exlg-usercom", $arg.text().trim()); // 直接存原本的信息
        if (!uid || uid === "javascript:void 0") {
            // console.log(`no uid ${uid}!`);
            uid = $(arg.parentNode.parentNode.previousElementSibling ?? arg.parentNode.parentNode.parentNode.previousElementSibling).find("img").attr("src").replace(/[^0-9]/ig, "");
        }
        if (uid in cmts) {
            // console.log("each: ", arg);
            _setcomment($arg, cmts[uid]);
        }
    });
}, (e) => {
    if (/^\/user\/[0-9]{0,}.*$/.test(location.pathname)) {
        if (($(e.target).hasClass("feed") && !$(e.target).hasClass("exlg-badge-feed")) || (/^#following/.test(location.hash) && $(e.target).parent().hasClass("sub-body"))) {
            const tmp = e.target.querySelectorAll(".wrapper > a[target='_blank']");
            return {
                result: tmp.length,
                args: tmp,
            };
        }
    }
    const tmp = e.target.querySelectorAll("a[href^=\"/user\"][target=_blank]");
    return {
        result: (tmp.length > 0),
        args: tmp,
    };
}, () => {
    if (/^\/user\/[0-9]{0,}.*$/.test(location.pathname)) {
        if (location.hash === "#activity") return document.querySelectorAll(".feed .wrapper>a[target='_blank']");
        if (/^#following/.test(location.hash)) return document.querySelectorAll(".follow-container .wrapper>a[target='_blank']");
    }
    return document.querySelectorAll("a[target='_blank'][href^='/user/']");
}, css, "module");
