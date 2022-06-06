/* global Pickr */
//* global XNColorPicker */
/* eslint-disable no-new */
import uindow, {
    cur_time, lg_usr, cs_post, log, warn,
} from "../utils.js";
import exlg_alert from "./exlg-dialog-board.js";
import compo from "../compo-core.js";
import mod, { sto } from "../core.js";
import html from "../resources/badge-register.html";
import css from "../resources/css/badge-register.css";
import presets from "../resources/badge-preset.json";
// eslint-disable-next-line import/no-cycle
import { pseudoTagWhitelist, getBadge } from "../modules/sponsor.js";

// TODO: 修改、传参、切换页面、绑定action
// TODO: 更改预览模式、精简 API
let configData = { };
let configProxy;
const regBadge = { };
const lg4NameColor = {
    Red: "rgb(254, 76, 97)",
    Orange: "rgb(243, 156, 17)",
    Green: "rgb(82, 196, 26)",
    Blue: "rgb(52, 152, 219)",
    Gray: "rgb(191, 191, 191)",
    Cheater: "rgb(173, 139, 0)",
    Purple: "rgb(157, 61, 207)",
};

/**
 * 进行一个 badge 的注册和修改
 *
 * @param {object} data 表示传入的 badge 配置
 * @returns {Void}
 */

const register_badge = compo.reg("register-badge", "badge 注册", null, null, (configuration = null) => {
    // Note: Definitions
    uindow.getconf = () => configData;
    const _allcss = {
        bg: { css: "background", name: "背景", default: "mediumturquoise" },
        fg: { css: "color", name: "字色", default: "white" },
        bd: { css: "border", name: "边框", default: "" },
        ft: { css: "font-family", name: "字体", default: "" },
        fs: { css: "font-size", name: "字号", default: "" }, // Note: max = 1.25rem 1.25em 20px
        fw: { css: "font-weight", name: "字粗", default: "700" },
    };
    const cssKeys = Object.keys(_allcss);
    // Note: import api-colorpicker
    const _test = (evalString) => {
        try {
            // eslint-disable-next-line no-eval
            (0, eval)(evalString);
        } catch (err) {
            warn("Fail to execute the action: ", err);
            return false;
        }
        return true;
    };
    if (_test(GM_getResourceText("colorpicker_temp_new")) || _test(GM_getResourceText("colorpicker_old"))) {
        log("起码至少有一个能用了");
    } else {
        log("废了废了");
        exlg_alert(`这个狗屎页面不能用取色器，错误信息自己看控制台输出<br/>点击确定回到主页。`, "exlg 提醒您", () => location.href = location.origin);
        return;
    }
    if (_test(GM_getResourceText("pickr_resource"))) {
        log("OK Well~");
    } else {
        log("废了废了");
        exlg_alert(`这个狗屎页面不能用取色器，错误信息自己看控制台输出<br/>点击确定回到主页。`, "exlg 提醒您", () => location.href = location.origin);
        return;
    }

    // Note: build panel
    const boardTitle = "exlg badge register ver.7.0: 暂不可用";
    exlg_alert(html.replaceAll("LG_USER_NAME", lg_usr.name)
        .replaceAll("LG_USER_COLOR", lg4NameColor[lg_usr.color]), boardTitle, {
        onopen: (brd) => {
            // set the behavior of regBadge
            // 创建每个窗口
            regBadge.boards = {};
            ["main", "showError", "getPreset", "setbgColor"].forEach(e => regBadge.boards[e] = brd.jsdom.content.querySelector(`div.exlg-regbadge-board[mode="${e}"]`));
            // 搞点东西
            regBadge.errorMessage = regBadge.boards.showError.querySelector(".error-message");

            brd.jsdom.content.querySelector("input[key='uid']").value = lg_usr.uid;
            regBadge.badgePreview = brd.jsdom.content.querySelector("[badge-preview]");
            regBadge.pseudoPreview = brd.jsdom.content.querySelector("[tag-preview]");
            regBadge.badgePresetList = brd.jsdom.content.querySelector(".exlg-regbadge-preset-list");

            regBadge.pseudoInput = brd.jsdom.content.querySelector("input[key='tagText']");
            regBadge.activeInput = brd.jsdom.content.querySelector("input[key='active']");
            regBadge.badgeInput = brd.jsdom.content.querySelector("input[key='badgeText']");
            regBadge.presetInput = brd.jsdom.content.querySelector("input[act='preset-json']");
            regBadge.ccfBadge = brd.jsdom.content.querySelector(".ccf-badge");

            regBadge.JSONerror = brd.jsdom.content.querySelector(".exlg-regbadge-board > span");
            regBadge.JSONerror.style.display = "none";
            // 处理data
            const _data = JSON.parse(sto["sponsor-tag"].badges)[lg_usr.uid];
            if (typeof _data === "undefined") {
                regBadge.isactive = false;
            } else {
                if (configuration === null) {
                    configData = _data;
                } else configData = configuration;
                regBadge.activeInput.value = "已激活";
                regBadge.activeInput.setAttribute("disabled", "");
            }
            console.log(configData);
            regBadge.badgeInput.value = configData.text ??= "";

            if (lg_usr.uid in pseudoTagWhitelist) {
                regBadge.pseudoInput.parentNode.style.display = "";
                regBadge.pseudoInput.value = configData.pseudo ??= pseudoTagWhitelist[lg_usr.uid];
            }
            const _update = (data = configData) => {
                const tmp = {};
                Object.assign(tmp, data);
                tmp.pseudo = lg_usr.badge ?? tmp.pseudo ?? pseudoTagWhitelist[lg_usr.uid];
                const s = getBadge(lg_usr.uid, lg4NameColor[lg_usr.color], "luogu4", tmp, false);
                regBadge.badgePreview.innerHTML = "";
                regBadge.badgePreview.append(s.exlg ?? "(内容为空则不显示)");
                if (s.pseudoTag) {
                    regBadge.pseudoPreview.innerHTML = "";
                    regBadge.pseudoPreview.append(s.pseudoTag);
                }
            };
            // 钩子也要初始化！
            if (lg_usr.ccfLevel < 3) {
                regBadge.ccfBadge.style.cssText = "display: none;";
            } else if (lg_usr.ccfLevel < 6) {
                regBadge.ccfBadge.style.cssText = "--fa-primary-color:#fff; --fa-secondary-color:#52c41a; --fa-secondary-opacity:1;";
            } else if (lg_usr.ccfLevel < 8) {
                regBadge.ccfBadge.style.cssText = "--fa-primary-color:#fff; --fa-secondary-color:#3498db; --fa-secondary-opacity:1;";
            } else {
                regBadge.ccfBadge.style.cssText = "--fa-primary-color:#fff; --fa-secondary-color:#ffc116; --fa-secondary-opacity:1;";
            }
            _update();// 进行一个预览的初始化

            regBadge.setMode = function (md) {
                this.mode = md;
                Object.keys(this.boards).forEach(e => this.boards[e].style.display = "none");
                this.boards[md].style.display = "";
                brd.width = this.boards[md].getAttribute("wd") ?? "500px";
                brd.minHeight = this.boards[md].getAttribute("mh") ?? "300px";
                // 回到 main 的时候重新渲染并修改
                if (md === "main") {
                    _update();
                }
            };
            regBadge.showError = function (message) {
                this.setMode("showError");
                this.errorMessage.innerText = message;
            };
            regBadge.setMode("main");
            let selectedPreset = null;
            regBadge.presetInput.oninput = () => {
                if (selectedPreset) selectedPreset.style.border = "2px solid rgba(0, 0, 0, 0)";
                let tmpData = null,
                    isOK = true;
                document.querySelector(".exlg-regbadge-board > span").style.display = "none";// 取消显示
                try {
                    tmpData = JSON.parse(regBadge.presetInput.value);
                    if (typeof tmpData !== "object" || Array.isArray(tmpData)) {
                        throw new TypeError("JSON ConfigData are supposed to be an Object!");
                    }
                } catch (err) {
                    warn(err);
                    isOK = false;
                    document.querySelector(".exlg-regbadge-board > span").style.display = ""; // 显示
                }
                if (isOK) _update({ text: configData.text, pseudo: configData.pseudo, ...tmpData });
            };
            brd.jsdom.content.querySelector(`button[act="toPreset"]`).onclick = () => {
                regBadge.setMode("getPreset");
                const tmp = {};
                cssKeys.forEach((key) => {
                    tmp[key] = configData[key] ?? "";
                });
                regBadge.presetInput.value = JSON.stringify(tmp); // 记得去掉咱的 text 和 pseudo
                regBadge.presetInput.oninput(); // 强行触发
            };
            // 这里先赋值上，post过去的时候去掉空的
            cssKeys.forEach(e => configData[e] ??= "");
            // 绑定事件
            // proxy: text, ...
            configProxy = new Proxy(configData, {
                get(target, propKey, _proxy) {
                    if (propKey === "pseudo") {
                        return target.pseudo;
                        // return proxy.pseudo = (regBadge.pseudoInput.value = target.pseudo);
                    }
                    if (propKey === "text") {
                        return target.text;
                        // return proxy.text = (regBadge.badgeInput.value = target.text);
                    }
                    if (cssKeys.includes(propKey)) {
                        return target[propKey];
                        // return proxy[propKey] = (_allcss[propKey].inputdom.value = target[propKey]);
                    }
                },
                set(target, propKey, value, _proxy) {
                    // update preview
                    try {
                        if (propKey === "pseudo" || propKey === "text") {
                            (propKey === "pseudo" ? regBadge.pseudoInput : regBadge.badgeInput).value = value;
                            return Reflect.set(target, propKey, value);
                        }
                        if (cssKeys.includes(propKey)) {
                            _allcss[propKey].inputdom.value = value;
                            return Reflect.set(target, propKey, value);
                        }
                        if (propKey === "configString") {
                            regBadge.assignData(JSON.parse(value));
                            return true;
                        }
                    } catch (err) {
                        warn(err);
                    } finally {
                        _update();
                    }
                },
            });
            regBadge.assignData = (obj) => {
                console.log("assign: ", obj);
                // 不能用于设置 pseudo 和 text
                if (typeof obj !== "object" || Array.isArray(obj)) {
                    throw new TypeError("JSON ConfigData are supposed to be an Object!");
                }
                cssKeys.forEach((key) => {
                    configProxy[key] = obj[key] ?? "";
                });
            };
            regBadge.pseudoInput.oninput = () => configProxy.pseudo = regBadge.pseudoInput.value;
            regBadge.badgeInput.oninput = () => configProxy.text = regBadge.badgeInput.value;
            // eslint-disable-next-line no-unused-expressions
            configProxy.pseudo; configProxy.text;
            cssKeys.forEach((key) => {
                const value = _allcss[key];
                /*
                brd.jsdom.content.querySelector("#regbadge-settings").innerHTML += `<span style="margin: 5px;">
                    <span class="exlg-regbadge-fronttitle">${value.name}</span>
                    <span style="float: right;margin-right: 3em;"></span>
                    <input keyId="${key}" exlg-badge-register type="text" style="padding: .1em;" placeholder="" value=""/>
                </span>
                <br/>`;
                */
                const outspan = document.createElement("span");
                outspan.style.margin = "5px";
                const smallTitle = document.createElement("span");
                smallTitle.className = "exlg-regbadge-fronttitle";
                smallTitle.innerText = value.name;
                const inp = document.createElement("input");
                inp.setAttribute("keyId", key);
                inp.setAttribute("exlg-badge-register", "");
                inp.setAttribute("type", "text");
                inp.setAttribute("placeholder", value.default);

                inp.style.padding = ".1em";
                inp.value = configData[key];

                outspan.append(smallTitle);
                outspan.append(inp);
                brd.jsdom.content.querySelector("#regbadge-settings").append(outspan);
                brd.jsdom.content.querySelector("#regbadge-settings").append(document.createElement("br"));
                inp.oninput = () => {
                    configProxy[key] = inp.value;
                };
                _allcss[key].inputdom = inp;
                if (key === "bg") {
                    const toSettings = document.createElement("button");
                    toSettings.innerHTML = "+";
                    outspan.append(toSettings);
                    toSettings.onclick = () => regBadge.setMode("setbgColor");
                }
                if (key === "fg") {
                    const pickerContainer = document.createElement("span");
                    pickerContainer.classList.add("exlg-colpicker");
                    pickerContainer.id = `exlg-pickr-${key}`;
                    // <style>
                    const pickrStyle = document.createElement("style");
                    pickrStyle.innerHTML = GM_getResourceText("pickr_resource_css");
                    outspan.append(pickrStyle);
                    outspan.append(pickerContainer);
                    const pickr = Pickr.create({
                        el: `#exlg-pickr-${key}`,
                        theme: "nano", // 'classic' or 'monolith', or 'nano'
                        swatches: [
                            "rgba(244, 67, 54, 1)",
                            "rgba(233, 30, 99, 0.95)",
                            "rgba(156, 39, 176, 0.9)",
                            "rgba(103, 58, 183, 0.85)",
                            "rgba(63, 81, 181, 0.8)",
                            "rgba(33, 150, 243, 0.75)",
                            "rgba(3, 169, 244, 0.7)",
                            "rgba(0, 188, 212, 0.7)",
                            "rgba(0, 150, 136, 0.75)",
                            "rgba(76, 175, 80, 0.8)",
                            "rgba(139, 195, 74, 0.85)",
                            "rgba(205, 220, 57, 0.9)",
                            "rgba(255, 235, 59, 0.95)",
                            "rgba(255, 193, 7, 1)",
                        ],
                        components: {
                            // Main components
                            preview: true,
                            opacity: true,
                            hue: true,
                            // Input / output Options
                            interaction: {
                                hex: false,
                                rgba: false,
                                hsla: false,
                                hsva: false,
                                cmyk: false,
                                input: true,
                                clear: true,
                                save: true,
                            },
                        },
                    });
                    _allcss[key].isUserSave = false;
                    pickr.on("init", instance => {
                        console.log("Event: \"init\"", instance);
                        // 开局不能被直接扬了
                        const _tmp = configProxy[key];
                        pickr.setColor(regBadge.pseudoPreview.lastElementChild.style[_allcss[key].css]);
                        configProxy[key] = _tmp;
                    })
                        .on("save", (color, instance) => {
                            console.log("Event: \"save\"", color, instance);
                            if (color === null) return; // clear
                            configProxy[key] = color.toHEXA().toString();
                            _allcss[key].isUserSave = true;
                        });
                    _allcss[key].cp = pickr;
                    // 记得取消
                    inp.oninput = () => {
                        configProxy[key] = inp.value;
                        if (!_allcss[key].isUserSave) pickr.setColor(null); // clear
                        _allcss[key].isUserSave = false;
                    };
                }
            });
            // Note: 设置预设
            // Object.entries (presets.forEach())
            Object.keys(presets).forEach((_k) => {
                const title = document.createElement("div");
                title.innerHTML = presets[_k].title;
                title.className = "exlg-regbadge-preset-title";
                regBadge.badgePresetList.append(title);
                Object.keys(presets[_k].presetList).forEach((k, i) => {
                    const { name, config } = presets[_k].presetList[k];
                    const configObj = JSON.parse(config);
                    console.log(name, config, configObj);
                    const option = document.createElement("span");
                    option.style.border = "2px solid rgba(0, 0, 0, 0)";
                    option.append(getBadge(lg_usr.uid, lg4NameColor[lg_usr.color], "luogu4", { text: "exlg", ...configObj }, false).exlg);
                    const nameText = document.createElement("span");
                    nameText.append(name);
                    option.append(nameText);
                    option.onclick = () => {
                        regBadge.presetInput.value = config;
                        regBadge.presetInput.oninput();
                        option.style.border = "2px solid grey";
                        selectedPreset = option;
                    };
                    regBadge.badgePresetList.append(option);
                    if (i & 1) regBadge.badgePresetList.append(document.createElement("br"));
                });
            });

            // debug
            uindow.regBadge = regBadge;
            uindow.configProxy = configProxy;
            // 修改 bg
            regBadge.bgModeSelect = brd.jsdom.content.querySelector("#regbadge-setbgColor-type-select");
            regBadge.bgBoard = {};
            regBadge.bgModeSelect.childNodes.forEach(e => {
                const keyv = e.value;
                if (!keyv) return; // #text
                regBadge.bgBoard[keyv] = brd.jsdom.content.querySelector(`.exlg-regbadge-bg-box[mode="${keyv}"]`);
                console.log(e, keyv, regBadge.bgBoard[keyv]);
            });
            regBadge.bgModeSelect.onchange = function () {
                Object.keys(regBadge.bgBoard).forEach((it) => {
                    regBadge.bgBoard[it].style.display = "none";
                });
                regBadge.bgBoard[this.value].style.display = "";
            };
            regBadge.bgtextInput = regBadge.bgBoard.text.querySelector("input");
            regBadge.bgtextInput.value = configProxy.bg;
            regBadge.bgsingle = Pickr.create({
                el: `span[exlg="bg-single-pickr"]`,
                theme: "nano", // 'classic' or 'monolith', or 'nano'
                swatches: [
                    "rgba(244, 67, 54, 1)",
                    "rgba(233, 30, 99, 0.95)",
                    "rgba(156, 39, 176, 0.9)",
                    "rgba(103, 58, 183, 0.85)",
                    "rgba(63, 81, 181, 0.8)",
                    "rgba(33, 150, 243, 0.75)",
                    "rgba(3, 169, 244, 0.7)",
                    "rgba(0, 188, 212, 0.7)",
                    "rgba(0, 150, 136, 0.75)",
                    "rgba(76, 175, 80, 0.8)",
                    "rgba(139, 195, 74, 0.85)",
                    "rgba(205, 220, 57, 0.9)",
                    "rgba(255, 235, 59, 0.95)",
                    "rgba(255, 193, 7, 1)",
                ],
                components: {
                    // Main components
                    preview: true,
                    opacity: true,
                    hue: true,
                    // Input / output Options
                    interaction: {
                        hex: false,
                        rgba: false,
                        hsla: false,
                        hsva: false,
                        cmyk: false,
                        input: true,
                        clear: true,
                        save: true,
                    },
                },
            });
            /*
            regBadge.bgxnpicker = new XNColorPicker({
                color: "#ff0987",
                selector: "#nopre",
                showprecolor: false, // 显示预制颜色
                prevcolors: null, // 预制颜色，不设置则默认
                showhistorycolor: false, // 显示历史
                historycolornum: 16, // 历史条数
                format: "rgba", // rgba hex hsla,初始颜色类型
                showPalette: true, // 显示色盘
                show: false, // 初始化显示
                lang: "cn", // cn 、en
                colorTypeOption: "single,linear-gradient,radial-gradient",
                onError() {

                },
                onCancel(color) {
                    console.log("cancel", color);
                },
                onChange(color) {
                    console.log("change", color);
                },
                onConfirm(color) {
                    console.log("confirm", color);
                },
            });
            */
        },
        oncancel: () => {
            switch (regBadge.mode) {
            case "success":
            case "main":
                return true;
            default:
                regBadge.setMode("main");
                return false;
            }
        },
        onconfirm: async (brd) => {
            if (regBadge.mode === "success") {
                location.reload();
                return true;
            }
            if (regBadge.mode === "showError") {
                regBadge.setMode("main");
                return false;
            }
            if (regBadge.mode === "getPreset") {
                try {
                    regBadge.assignData(JSON.parse(regBadge.presetInput.value));
                } catch (err) {
                    brd.title = "[Err] 无效json";
                    warn(err);
                    setTimeout((() => brd.title = boardTitle), 1500);
                    return false;
                }
                regBadge.setMode("main");
                return false;
            }
            if (regBadge.mode === "setbgColor") {
                switch (regBadge.bgModeSelect.value) {
                case "text":
                    configProxy.bg = regBadge.bgtextInput.value;
                    break;
                case "lgdefault":
                    configProxy.bg = "${luogu-default}";
                    break;
                case "single":
                    console.log(regBadge.bgsingle.getColor().toHEXA().toString());
                    configProxy.bg = regBadge.bgsingle.getColor().toHEXA().toString();
                    break;
                case "xncolorpicker":
                    configProxy.bg = regBadge.bgxnpicker.getColor();
                    break;
                }
                regBadge.setMode("main");
                return false;
            }
            // check 一下合法性
            // 检查字号合法性
            if (!((msg) => {
                if (!msg) return true;
                brd.title = msg;
                setTimeout((() => brd.title = boardTitle), 1500);
                return false;
            })(((cfg) => {
                if (cfg.fs) {
                    if (/^\d{0,}(.\d{0,})?(px|em)$/.test(cfg.fs) && !["px", "em"].includes(cfg.fs)) {
                        const fsnum = cfg.fs.slice(0, -2);
                        if ((cfg.fs.includes("px") && fsnum > 16) || (cfg.fs.includes("em") && fsnum > 1.0)) {
                            return "[Err] 字号过大，应不超过 16px/1em";
                        }
                    } else {
                        return "[Err] 字号应以 px/em 为单位且合法";
                    }
                }
            })(configData))) return false;
            brd.title = "获取并验证令牌...";
            mod.execute("token");
            // configData 直接用
            const request = {
                uid: lg_usr.uid,
                token: sto["^token"].token,
                data: configData,
            };
            if (!regBadge.isactive) request.activation = regBadge.activeInput.value;
            /*
            if (!request.data.text) {
                brd.title = "[Err] 请填写 badge";
                setTimeout((() => brd.title = boardTitle), 1500);
                return false;
            }
            */
            brd.title = "请求中...";
            const postResult = await cs_post("https://exlg.piterator.com/badge/set", request).data;
            if ("error" in postResult) {
                brd.title = "[Err] 失败";
                regBadge.showError(postResult.error);
                return false;
            }
            // console.log(postResult);
            // Note: 本地缓存
            const badges = Object.assign(JSON.parse(sto["sponsor-tag"].badges), configData);
            badges[request.uid].ts = cur_time();
            sto["sponsor-tag"].badges = JSON.stringify(badges);
            brd.title = "badge 激活成功";
            brd.content = "badge 激活成功！感谢您对 exlg 的<del>打钱</del>支持。";
            regBadge.mode = "success";
            return false;
        },
    }, { width: "800px", min_height: "400px" });
    return regBadge;
}, css);

export default register_badge;
