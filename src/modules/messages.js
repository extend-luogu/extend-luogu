import mod from "../core.js";
import {
    $, lg_usr, sharedFunction, log,
} from "../utils.js";
import css from "../resources/css/messages.css";

mod.reg("messages", "新消息提醒", ["@/.*"], {}, () => {
    if (window.location.href.search("/chat") !== -1) {
        return;
    }
    const $container = $("body").append(`<div id="exlg-messages-outter"><div id="exlg-messages-container"></div></div>`)
        .find("#exlg-messages-container");
    /**
     *
     * @param msg
     */
    function msg_show(msg) {
        const $curbd = $(`
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
        $container.append($curbd)
            .on("click", `#exlg-message-close-${msg.id}, #exlg-message-show-${msg.id}`, () => { $curbd.remove(); });
        $(`#exlg-message-username-${msg.id}`).text(msg.sender.name);
        $(`#exlg-message-content-${msg.id}`).text(msg.content);
    }

    sharedFunction("exlg-message", (bc) => {
        const socket = new WebSocket("wss://ws.luogu.com.cn/ws");
        socket.onopen = () => socket.send(JSON.stringify({
            type: "join_channel",
            channel: "chat",
            channel_param: String(lg_usr.uid),
            exclusive_key: null,
        }));
        socket.onmessage = (e) => {
            bc.postMessage(e.data);
            const u = JSON.parse(e.data);
            if (u._ws_type === "server_broadcast" && u.message instanceof Object && u.message.sender.uid !== lg_usr.uid) {
                msg_show(u.message);
            }
        };
    }, (msg) => {
        const u = JSON.parse(msg);
        if (u._ws_type === "server_broadcast" && u.message instanceof Object && u.message.sender.uid !== lg_usr.uid) {
            msg_show(u.message);
        }
    });

    const listenBroadcast = (channel) => {
        const ch = new BroadcastChannel(channel);
        ch.onmessage = (ev) => {
            log(channel, ": ", ev.data);
        };
    };
    listenBroadcast("exlg-message-ctrl");
    listenBroadcast("exlg-message-data");
}, css, "module");
