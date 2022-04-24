import mod from "../core.js";
import uindow, { $, sleep } from "../utils.js";
import exlg_alert from "../components/exlg-dialog-board.js";

mod.reg(
    "meta-discussion-guiding",
    "元讨论引导",
    ["@/discuss/lists\\?forumname=(siteaffairs|problem|academics|relevantaffairs|service).*"],
    {},
    () => {
        const meta_discussion_id = "432028";
        const remeta_words_regex = [/exlg/i, /ex(tend)?[- ]luogu/i, /badge/i];

        const $newpost_section = $("#newpost");
        const $newpost_title = $(".lg-input-title");
        const $newpost_submit = $("#submitpost");
        const $newpost_submit_wrapper = $newpost_submit.wrap("<div></div>").parent();

        // Note: 添加专贴说明和链接
        const discuss_link = `<a href="/discuss/${meta_discussion_id}"><b>专贴</b></a>`;
        $newpost_section.after(`<p>exlg 相关问题请在 ${discuss_link} 讨论</p>`);

        // Note: 识别 "exlg" 关键字，引导用户去专贴讨论
        $newpost_submit_wrapper[0].addEventListener("click", (evt) => {
            const post_content = uindow.markdownPalettes.content?.toLowerCase();
            const post_title = $newpost_title.val();
            const exist_meta_words = remeta_words_regex.map(re => [post_content.match(re)?.[0], post_title.match(re)?.[0]]).flat().filter((s, i, a) => s && s !== a[i + 1]);

            if (exist_meta_words.length) {
                evt.stopPropagation();
                let $confirm_input;
                exlg_alert(
                    `检测到您将要发送的讨论内容包含与 exlg 有关的关键词：<br />` +
                    `${exist_meta_words.map((s) => `“${s}”`).join(", ")}<br />` +
                    `建议前往 ${discuss_link} 讨论。<br />` +
                    `这是为了防止占用讨论资源，营造一个更高质量的社区。 <br />` +
                    `我们很担心 exlg 相关讨论霸占版面，造成负面影响。<br />` +
                    `<span style="color: orange">` +
                        `<b>洛谷管理员提醒您：发布无意义讨论可能导致禁言。</b> <br />` +
                        `<small>* 无意义讨论包括但不限于“大家看得到我的 badge 吗” 等等</small>` +
                    `</span> <br />` +
                    `如果您确定要发送，请在下方输入框键入 “放心” 后确定。<br/><small comment>（输入框过一会才会出现）</small>`,
                    "exlg 提醒您",
                    {
                        onconfirm: () => {
                            if (!$confirm_input) return false;
                            if ($confirm_input.val() !== "放心") return false;
                            setTimeout($newpost_submit.trigger("click"), 500);
                            return true;
                        },
                        onopen: async ({ dom: { $main } }) => {
                            // Note: 3 秒后显示输入框
                            await sleep(3000);
                            $main.find("small[comment]").remove();
                            $confirm_input = $(`<input type="text" />`).appendTo($main);
                        },
                    },
                );
            }
        }, true); // Note: 使用事件捕获
    },
    "",
    "module",
);
