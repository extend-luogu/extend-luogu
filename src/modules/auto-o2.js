import mod from "../core.js";
import { $, hookSelector } from "../utils.js";

mod.reg_v2({
    name: "auto-o2",
    info: "自动开启 O2",
    path: "@/problem/[A-Z0-9]+(#.*)?",
    cate: "module",
}, {
    on: { ty: "boolean", dft: false },
    mode: {
        ty: "enum", dft: "lastSubmitted", vals: ["lastSubmitted", "lastChecked", "always"], info: ["Mode", "模式"],
    },
    last_enabled: { ty: "boolean", dft: false, priv: true },
}, (handler) => {
    handler.hook({
        name: "submit-detector",
        info: "提交检测",
    }, null, ({ gsto, args }) => {
        if (gsto.mode === "lastSubmitted") {
            $(args).on("click", () => { gsto.last_enabled = $("input[id^=check]").is(":checked"); });
        }
    }, hookSelector("button[data-v-01cd4e24]"));

    handler.hook({
        name: "o2-checker",
        info: "钩取开启 o2",
    }, null, ({ gsto, args }) => {
        // Note: 不先 off 会出大问题
        if (gsto.mode === "lastChecked") {
            $(args).off("click");
        }
        if (gsto.mode === "always" || (gsto.mode === "lastChecked" && gsto.last_enabled)) {
            $(args).trigger("click");
        }
        if (gsto.mode === "lastChecked") {
            $(args).on("click", (e) => { gsto.last_enabled = e.currentTarget.checked; });
        }
    }, hookSelector("input[id^=check]"));
});
