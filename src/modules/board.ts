import mod from "../core.js";
import { $, cs_get } from "../utils.js";
import css from "../resources/css/benben-ranklist.css";
import html from "../resources/search-user.html";
import exlg_alert from "../components/exlg-dialog-board.js";

mod.reg_board("search-user", "用户查找", null, ({ $board }) => {
    $board.html(html);
    const $search_user = $("#search-user");
    const func = () => {
        $search_user.prop("disabled", true);
        $.get(`/api/user/search?keyword=${$("[name=username]").val().trim()}`, (res) => {
            if (!res.users[0]) {
                $search_user.prop("disabled", false);
                exlg_alert("无法找到指定用户");
            } else location.href = `/user/${res.users[0].uid}`;
        });
    };
    $search_user.on("click", func);
    $("#search-user-input").whenKey("Enter", func);
}, null, "module");

mod.reg_board("benben-ranklist", "犇犇龙王排行榜", {
    show: { ty: "boolean", dft: true, info: ["Show in default", "是否默认展开"] },
}, ({ msto, $board }) => {
    // Note: Add the title.
    $board.html(`<h3 id="bb-rnklst-h2">犇犇排行榜 <span id="bb-rnklst-btn" class="bb-rnklst-span"> [<a>${msto.show ? "收起" : "展开"}</a>]</span><span style="float: right;" class="bb-rnklst-span"> [<a id="refresh-bbrnk">刷新</a>]</span></h3><ol style="display: ${msto.show ? "block" : "none"}" id="bb-rnklst"></ol>`);
    const $list = $board.find("#bb-rnklst"),
        $fbtn = $board.find("#bb-rnklst-btn > a").on("click", () => {
            msto.show = !msto.show;
            $fbtn.text(msto.show ? "收起" : "展开");
            $list.toggle();
        });
    const refresh = () => cs_get({
        url: `https://bens.rotriw.com/ranklist?_contentOnly=1`,
        onload(res) {
            // let s=`<h3 id="bb-rnklst-h2">犇犇排行榜 <span id="bb-rnklst-btn" class="bb-rnklst-span"> [<a>${ msto.show ? "收起" : "展开" }</a>]</span><span style="float: right;" class="bb-rnklst-span"> [<a id="refresh-bbrnk">刷新</a>]</span></h3>`
            $(JSON.parse(res.response)).each((index, obj) => {
                $(`<li class="bb-rnkitm">
                    <span>
                        <a href="https://bens.rotriw.com/user/${obj[2]}">${obj[1]}</a>
                        <span>${obj[0]} 条</span>
                    </span>
                </li>`).appendTo($list);
            });
        },
    });
    $board.find("#refresh-bbrnk").on("click", () => { $list.html(""); refresh(); });
    refresh();
}, css, "module");
