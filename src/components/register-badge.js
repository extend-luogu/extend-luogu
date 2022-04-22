/* global XNColorPicker */
/* eslint-disable no-new */
import uindow, {
    $, cur_time, lg_usr, cs_post, log, error,
} from "../utils.js";
import exlg_alert from "./exlg-dialog-board.js";
import compo from "../compo-core.js";
import mod, { sto } from "../core.js";
import html from "../resources/badge-register.html";
import css from "../resources/css/badge-register.css";

const srd = { };
const register_badge = compo.reg("register-badge", "badge 注册", null, null, () => {
    // Note: 引入 API 即判断能否使用 eval
    try {
        // eslint-disable-next-line no-eval
        (0, eval)(GM_getResourceText("colorpicker"));
        log("这个页面可以用 eval 的说!芜湖，起飞~");
    } catch (err) {
        log("这个页面并不可以用 eval (悲");
        error(err);
        exlg_alert("这个页面并不可以用 eval 哇，试试其他页面，可以吗可以吗可以吗~诶诶诶诶诶不可以???!呜哇~");
        return;
    }
    const title_text = "exlg badge register ver.7.0: 暂不可用";
    exlg_alert(html, title_text, {
        onconfirm: async () => {
            srd.dom.$title.html("获取并验证令牌...");
            mod.execute("token");
            // eslint-disable-next-line prefer-const
            let data = { text: srd.dom.$text_input[0].value };
            Object.assign(data, srd.parse_data);
            const request = {
                uid: srd.dom.$uid[0].value,
                token: sto["^token"].token,
                data,
            };
            if (!srd.isactive) srd.activation = srd.dom.$act.val();
            if (!request.data.text) {
                srd.gerr("[Err] 请填写 badge");
                return false;
            }
            srd.dom.$title.html("请求中...");
            const res_json = await cs_post("https://exlg.piterator.com/badge/set", request).data;
            if ("error" in res_json) {
                srd.dom.$title.html("[Err] 失败");
                exlg_alert(`<div style="margin-bottom: 1.5em;">
                <div><strong style="color: red;">错误信息:</strong></div>
                <div>${res_json.error}</div>
            </div>
            <small>点击确定以返回。</small>`, "激活 badge 出错", () => {
                    register_badge();
                    return false;
                });
            } else {
                const badges = Object.assign(JSON.parse(sto["sponsor-tag"].badges), res_json.data);
                badges[request.uid].ts = cur_time();
                sto["sponsor-tag"].badges = JSON.stringify(badges);
                srd.dom.$title.html("成功");
                exlg_alert("badge 激活成功！感谢您对 exlg 的支持。", "badge 激活成功", () => { location.reload(); });
            }
            return false;
            /*
            return cs_post("https://exlg.piterator.com/badge/set", request).then((res) => {
                return new Promise((resolve, reject) => {
                    const res_json = res.data;
                    if ("error" in res_json) {
                        $title.html("[Err] 失败");
                        exlg_alert(res_json.error, "激活 badge 出错");
                        resolve(false);
                    } else {
                        const badges = Object.assign(JSON.parse(sto["sponsor-tag"].badges), res_json.data);
                        badges[$input[0].value].ts = cur_time();
                        sto["sponsor-tag"].badges = JSON.stringify(badges);
                        $title.html("成功");
                        exlg_alert("badge 激活成功！感谢您对 exlg 的支持。", "badge 激活成功", () => { location.reload(); });
                        resolve(false);
                    }
                });
            */
            // Note: 不会写异步，爬了
        },
        onopen: () => {
            const $cont = $("#exlg-container");
            const $title = $cont.find("#exlg-dialog-title");
            srd.gerr = (message, timeout = 1500) => {
                $title.html(message);
                setTimeout(() => $title.html(title_text), timeout);
            };
            srd.dom = {
                $title: "#exlg-dialog-title",
                $uid: "input[key='uid']",
                $act: "input[key='active']",
                $prvid: "#regbadge-preview-id",
                $ccf: ".preview-ccf-tag",
                $type: "select",
                $lgbg: "#preview-lg-badge",
                $exlg_badge_prev: ".exlg-badge-preview",
                $text_input: "#regbadge-preview input",
                $text_test: "#regbadge-preview span[fuck=o2]",
                btn: {},
            };

            Object.keys(srd.dom).forEach((key) => srd.dom[key] = key.includes("$") ? $cont.find(srd.dom[key]) : srd.dom[key]);
            srd.current_type = 3;
            srd.refreshInputData = () => {
                Object.keys(srd.customSettings).forEach((key) => srd.customSettings[key].refreshData(srd.current_type));
            };

            srd.customSettings = { };
            srd.parse_data = { lg4: { } };

            $cont.find("input[key][css-key]").each((_, e) => {
                const key = e.getAttribute("key");
                srd.customSettings[key] = {
                    key,
                    csskey: e.getAttribute("css-key"),
                    jsdom: e,
                    jqdom: $(e),
                    defaultvalue: e.placeholder,
                    setData(ty = srd.current_type) {
                        (ty & 1 ? srd.parse_data : srd.parse_data.lg4)[this.key] = this.jsdom.value;
                        if (this.jsdom.value && this.jsdom.value === (ty & 1 ? this.defaultvalue : (srd.parse_data[key] || this.defaultvalue))) delete (ty & 1 ? srd.parse_data : srd.parse_data.lg4)[this.key];
                        // Note: 在改 3 的时候对 4 的影响
                        // Note: 存在 4 并且 与当前 3 相同
                        if ((ty & 1) && (Object.keys(srd.parse_data.lg4).includes(this.key)) && srd.parse_data.lg4[this.key] === srd.parse_data[this.key]) {
                            delete srd.parse_data.lg4[this.key];
                        }
                    },
                    refreshData(ty = srd.current_type) {
                        this.jsdom.value = (srd.parse_data[this.key] || "");
                        if (ty > 3) this.jsdom.value = srd.parse_data.lg4[this.key] || this.jsdom.value;
                    },
                    resetHolder(ty = srd.current_type) {
                        if (ty & 1) {
                            this.jsdom.placeholder = this.defaultvalue;
                        } else this.jsdom.placeholder = srd.parse_data[key] || this.defaultvalue;
                    },
                };
                $(e).on("input", () => {
                    srd.customSettings[key].setData(srd.current_type);
                    srd.updatePreview();
                });
            });
            $cont.find(".exlg-badge-page button").each((_, e) => {
                srd.dom.btn[e.id.slice("regbadge-button-".length)] = e;
            });
            $(srd.dom.btn.recoverall).on("click", () => {
                srd.parse_data = { lg4: { } };
                srd.refreshInputData();
                srd.updatePreview();
                srd.gerr("已清空所有设置选项至默认值");
            });
            $(srd.dom.btn.recover43).on("click", () => {
                if (srd.dom.$type.val() === 3) return srd.gerr("处于 luogu3 编辑模式，操作无效");
                srd.parse_data.lg4 = { };
                srd.refreshInputData();
                srd.updatePreview();
                srd.gerr("成功以 luogu3 覆盖 luogu4 设置");
            });
            $(srd.dom.btn.outprint).on("click", () => {
                const res = JSON.stringify({ text: srd.dom.$text_input[0].value, ...srd.parse_data });
                try {
                    GM_setClipboard(res, "text/plain");
                } catch (err) {
                    srd.gerr("复制至剪贴板失败");
                    log("复制到剪贴板失败, 错误信息: ", err);
                    return;
                }
                srd.gerr("成功复制 json 配置信息至剪贴板");
            });
            srd.dom.$type.on("change", () => {
                srd.current_type = srd.dom.$type.val();
                Object.keys(srd.customSettings).forEach((key) => {
                    srd.customSettings[key].resetHolder();
                    uindow.hsrd = srd;
                });
                srd.refreshInputData();
                srd.updatePreview();
            });

            srd.recalcInputWidth = () => {
                srd.dom.$text_test.text(srd.dom.$text_input[0].value);
                srd.dom.$text_input.css("width", srd.dom.$text_test[0].offsetWidth + 4);
            };

            if (lg_usr?.uid && !srd.dom.$uid[0].value) srd.dom.$uid[0].value = lg_usr.uid;
            srd.dom.$text_input.on("input", srd.recalcInputWidth);

            srd.updatePreview = () => {
                const lColor = {
                    Purple: ["#8e44ad", "rgb(157, 61, 207)"],
                    Red: ["#e74c3c", "rgb(254, 76, 97)"],
                    Orange: ["#e67e22", "rgb(243, 156, 17)"],
                    Green: ["#5eb95e", "rgb(82, 196, 26)"],
                    Blue: ["#0e90d2", "rgb(52, 152, 219)"],
                    Gray: ["#bbb", "rgbrgb(191, 191, 191)"],
                    Cheater: ["#996600", "rgb(173, 139, 0)"],
                };
                const wColor = ["Red", "Orange", "Purple", "Cheater"];
                srd.dom.$prvid.removeAttr("style").text(lg_usr.name);
                if (srd.current_type === 4 || wColor.includes(lg_usr.color)) srd.dom.$prvid.css("font-weight", "bold");
                srd.dom.$prvid.css("color", lColor[lg_usr.color][srd.current_type - 3]);
                [
                    { l: [0, 1, 2], r: "display: none;" },
                    { l: [3, 4, 5], r: "fill: #5eb95e;" },
                    { l: [6, 7], r: "fill: #3498db;" },
                    { l: [8, 9, 10], r: "fill: #f1c40f;" },
                ].forEach((e) => {
                    if (e.l.includes(lg_usr.ccfLevel)) {
                        srd.dom.$ccf[0].style = e.r;
                    }
                });
                if (lg_usr.badge) {
                    srd.dom.$lgbg.html(`<span class="lg${srd.current_type}-badge">${lg_usr.badge}</span>`).css("color", lColor[lg_usr.color][srd.current_type - 3]).show();
                } else srd.dom.$lgbg.hide();
                srd.dom.$exlg_badge_prev.attr("style", `
                    border-radius: 50px;
                    padding-left: 10px;
                    padding-right: 10px;
                    padding-top: 4px;
                    padding-bottom: 4px;
                    transition: all .15s;
                    display: inline-block;
                    min-width: 10px;
                    font-size: 1em;
                    font-weight: 700;
                    line-height: 1;
                    vertical-align: baseline;
                    white-space: nowrap;
                    cursor: pointer;
                    margin-left: 2px;
                    margin-right: 2px;
                `);
                Object.keys(srd.customSettings).forEach((key, _index) => {
                    const obj = srd.customSettings[key];
                    let str = !(srd.current_type & 1)
                        ? (srd.parse_data.lg4[key] || (srd.parse_data[key] || obj.defaultvalue))
                        : (srd.parse_data[key] || obj.defaultvalue);
                    if (key === "bg") {
                        str = str.replaceAll("${luogu-default}", lColor[lg_usr.color][srd.current_type - 3]);
                    }
                    srd.dom.$exlg_badge_prev.css(obj.csskey, str);
                });
                [
                    "minWidth",
                    "fontSize",
                    "fontWeight",
                    "whiteSpace",
                ].forEach((kv) => {
                    srd.dom.$text_test[0].style[kv] = srd.dom.$exlg_badge_prev[0].style[kv];
                }); // 需要的 css 复制过去
                srd.recalcInputWidth();
            };

            const _data = JSON.parse(sto["sponsor-tag"].badges)[lg_usr.uid];
            if (typeof _data !== "undefined") { // Note: 已经有了
                srd.dom.$text_input[0].value = _data.text;
                delete _data.text;
                Object.assign(srd.parse_data, _data);
                srd.dom.$act.val("已激活").attr("disabled", "");
                srd.isactive = true;
            } else { // Note: 没有
                srd.isactive = false;
            }

            srd.refreshInputData();
            srd.updatePreview();
            [
                {
                    selector: ".exlg-bg-colset",
                    defaultColor: "mediumturquoise",
                    id: "bg",
                },
                {
                    selector: ".exlg-fg-colset",
                    defaultColor: "#fff",
                    id: "fg",
                },
            ].forEach((e) => {
                const colpicker = new XNColorPicker({
                    color: e.defaultColor,
                    selector: e.selector,
                    colorTypeOption: "single,linear-gradient,radial-gradient",
                    onError: () => { },
                    onCancel: () => { },
                    onChange: () => { },
                    onConfirm: (color) => {
                        const c = color.colorType === "single" ? color.color.hex : color.color.str;
                        srd.customSettings[e.id].jsdom.value = c;
                        srd.customSettings[e.id].setData();
                        srd.updatePreview();
                    },
                });
                $(srd.customSettings[e.id].jsdom).on("input", (f) => {
                    colpicker.setColor(f.target.value);
                });
            });
        },
    }, { width: "800px", min_height: "400px" });
}, css);

export default register_badge;
