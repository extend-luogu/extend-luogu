import mod from "../core.js";
import { $, lg_usr } from "../utils.js";
import css from "../resources/css/messages.css";

mod.reg("messages", "新消息提醒", ["@/.*"], {}, () => {
    let chat_last_fetch = {};
    let ever_fetched = false;
    let last_fetch_id = 0;

    const uid_self = lg_usr.uid;

    $("body").append(`<div id="exlg-messages-outter"><div id="exlg-messages-container"></div></div>`);

    function msg_show(msg) {
        $("#exlg-messages-container").append(`
        <div class="exlg-message-outter" id="exlg-message-${msg.id}">
            <div class="exlg-message-inner">
                <a href="https://www.luogu.com.cn/user/${msg.sender.uid}" target="_blank">
                    <img class="exlg-message-avatar" src="https://cdn.luogu.com.cn/upload/usericon/${msg.sender.uid}.png">
                </a>
                <div class="exlg-message-username" id="exlg-message-username-${msg.id}"></div>
                <div class="exlg-message-content" id="exlg-message-content-${msg.id}"></div>
                <div class="exlg-message-type">私信</div>
            </div>
            <div class="exlg-message-close" msg-id="${msg.id}" id="exlg-message-close-${msg.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
            </div>
            <a class="exlg-message-show" id="exlg-message-show-${msg.id}" href="https://www.luogu.com.cn/chat" target="_blank">查看</a>
        </div>`);
        $(`#exlg-message-close-${msg.id}`).click(() => { $(`#exlg-message-${msg.id}`).remove(); });
        $(`#exlg-message-show-${msg.id}`).click(() => { $(`#exlg-message-${msg.id}`).remove(); });
        $(`#exlg-message-username-${msg.id}`).text(msg.sender.name);
        $(`#exlg-message-content-${msg.id}`).text(msg.content);
    }

    setInterval(() => {
        $.ajax({
            url: "https://www.luogu.com.cn/chat",
            type: "get",
            headers: { "x-luogu-type": "content-only" },
            success(data) {
                const chat = data.currentData.latestMessages.result;
                if (ever_fetched && chat[0].id !== chat_last_fetch[0].id) {
                    const new_msg = [];
                    for (let i = 0; i < data.currentData.latestMessages.count; ++i) {
                        if (chat[i].id > last_fetch_id) {
                            if (chat[i].sender.uid !== uid_self) new_msg.push(chat[i]);
                            else break;
                        }
                    }
                    for (let i = new_msg.length - 1; i >= 0; --i) {
                        console.log(new_msg[i].content);
                        msg_show(new_msg[i]);
                    }
                }
                ever_fetched = true;
                chat_last_fetch = chat;
                last_fetch_id = chat[0].id;
            },
            error(error) {
                console.log(`Messages fetch error: ${error}`);
            },
        });
    }, 1000);
}, css, "module");
