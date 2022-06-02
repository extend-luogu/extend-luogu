/* global XNColorPicker */
/* eslint-disable no-new */
import uindow, {
    $, cur_time, lg_usr, cs_post, log, warn,
} from "../utils.js";
import exlg_alert from "./exlg-dialog-board.js";
import compo from "../compo-core.js";
import mod, { sto } from "../core.js";
import html from "../resources/badge-register.html";
import css from "../resources/css/badge-register.css";

const srd = { };

/**
 * 进行一个 badge 的注册和修改
 *
 * @param {object} data 表示传入的 badge 配置
 * @returns {Void}
 */

const register_badge = compo.reg("register-badge", "badge 注册", null, null, (configuration = null) => {
    // Note: 暴露的接口，因为注册器坏掉了，过几天修
    /*
    uindow.postBadge = (data, uid) => cs_post("https://exlg.piterator.com/badge/set", {
        uid,
        token: sto["^token"].token,
        data,
    });
    */
    // Note: 引入 API 即判断能否使用 eval
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
        log("这个页面可以用取色器");
    } else {
        log("这个页面不能用取色器");
        exlg_alert(`这个页面不能用取色器呢<br/>点击确定回到主页<br/><br/>错误信息请自行查看控制台输出`, "exlg 提醒您", () => location.href = location.origin);
        return;
    }
    /*
    try {
        // eslint-disable-next-line no-eval
        (0, eval)(GM_getResourceText("colorpicker"));
        log("这个页面可以用 eval 的说！芜湖，起飞~");
    } catch (err) {
        log("这个页面并不可以用 eval (悲");
        exlg_alert("这个页面不可以用 eval 哇，能不能...试一下其他页面的说...<br/>可以吗可以吗可以吗~<br/> - 诶诶诶诶诶不可以？??!<br/>呜哇~达咩！<br/><small>(选项一：[确定] “*诶呦我操，这是好的*”)<br/>(选项二：[取消] *你够了，我无法忍受，你的行为*)&nbsp;</small>", "来自 exlg 娘的提示！", () => location.href = location.origin);
        warn("错误信息: ", err);
        return;
    }
    */
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
            if (!srd.isactive) request.activation = srd.dom.$act.val();
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
                    register_badge(srd.parse_data);
                    return false;
                });
            } else {
                const badges = Object.assign(JSON.parse(sto["sponsor-tag"].badges), res_json.data);
                badges[request.uid].ts = cur_time();
                sto["sponsor-tag"].badges = JSON.stringify(badges);
                srd.dom.$title.html("成功");
                exlg_alert("badge 激活成功！感谢您对 exlg 的<del>打钱</del>支持。", "badge 激活成功", () => { location.reload(); });
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
            const lColor = {
                Purple: ["#8e44ad", "rgb(157, 61, 207)"],
                Red: ["#e74c3c", "rgb(254, 76, 97)"],
                Orange: ["#e67e22", "rgb(243, 156, 17)"],
                Green: ["#5eb95e", "rgb(82, 196, 26)"],
                Blue: ["#0e90d2", "rgb(52, 152, 219)"],
                Gray: ["#bbb", "rgb(191, 191, 191)"],
                Cheater: ["#996600", "rgb(173, 139, 0)"],
            };
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
                    setData(ty = srd.current_type) { // Note: 写入 parse-data
                        (ty & 1 ? srd.parse_data : srd.parse_data.lg4)[this.key] = this.jsdom.value;
                        if (this.jsdom.value && this.jsdom.value === (ty & 1 ? this.defaultvalue : (srd.parse_data[key] || this.defaultvalue))) delete (ty & 1 ? srd.parse_data : srd.parse_data.lg4)[this.key];
                        // Note: 在改 3 的时候对 4 的影响
                        // Note: 存在 4 并且 与当前 3 相同
                        if ((ty & 1) && (Object.keys(srd.parse_data.lg4).includes(this.key)) && srd.parse_data.lg4[this.key] === srd.parse_data[this.key]) {
                            delete srd.parse_data.lg4[this.key];
                        }
                    },
                    refreshData(ty = srd.current_type) { // Note: 读入 parse-data
                        this.jsdom.value = (srd.parse_data[this.key] || "");
                        if (ty > 3) this.jsdom.value = srd.parse_data.lg4[this.key] || this.jsdom.value;
                        if (this.colorpicker) this.colorpicker.refreshPicker();
                    },
                    resetHolder(ty = srd.current_type) {
                        if (ty & 1) {
                            this.jsdom.placeholder = this.defaultvalue;
                        } else this.jsdom.placeholder = srd.parse_data[key] || this.defaultvalue;
                    },
                };
                $(e).on("input", () => {
                    srd.customSettings[key].setData(srd.current_type);
                    if (srd.customSettings[key].colorpicker) srd.customSettings[key].colorpicker.refreshPicker();
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
            $(srd.dom.btn.exportJSON).on("click", () => {
                let res = { };
                try {
                    res = JSON.stringify({ text: srd.dom.$text_input[0].value, ...srd.parse_data });
                    if (res.lg4 && res.lg4.text) delete res.lg4.text;
                    // 去掉 lg4.text
                } catch (err) {
                    srd.gerr("导出配置 json 失败");
                    warn("导出配置 json 失败，错误信息: ", err);
                    return;
                }
                try {
                    GM_setClipboard(res, "text/plain");
                } catch (err) {
                    srd.gerr("复制至剪贴板失败");
                    warn("复制到剪贴板失败，错误信息: ", err);
                    return;
                }
                srd.gerr("成功复制 json 配置信息至剪贴板");
            });
            $(srd.dom.btn.importJSON).on("click", () => {
                const _tmp_data = srd.parse_data;
                exlg_alert(`<textarea class="exlg-regbadge-configinput" rows="8" style="font-family: 'Fira Code', 'Fira Mono', Consolas;"></textarea>`, "请输入 json 配置", {
                    onconfirm: () => {
                        const str = $("textarea.exlg-regbadge-configinput").val();
                        let obj = null;
                        try {
                            obj = JSON.parse(str);
                            if (typeof obj !== "object") throw new TypeError("obj are expected to be an object.");
                        } catch (err) {
                            log("无法正确解析配置: ", err);
                            $("#exlg-dialog-title").html("无法正确解析配置");
                            setTimeout(() => $("#exlg-dialog-title").html("请输入 json 配置"), 1500);
                            $("textarea.exlg-regbadge-configinput").val("");
                            return false;
                        }
                        register_badge(obj);
                        return false;
                    },
                    onopen: () => {
                        $("textarea.exlg-regbadge-configinput").val(JSON.stringify(_tmp_data));
                    },
                });
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
                // Hack: 千万不要忘了删掉测试代码！！！！！！！！
                if (lg_usr.badge) {
                    srd.dom.$lgbg.html(`<span class="lg${srd.current_type}-badge" style="background-color: ${lColor[lg_usr.color][srd.current_type - 3]};">${lg_usr.badge}</span>`).show();
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
            if (typeof _data !== "undefined" && typeof _data.text !== "undefined") {
                srd.dom.$text_input[0].value = _data.text; // Note: 已经有了
                delete _data.text;
                if (configuration === null) Object.assign(srd.parse_data, _data);
                srd.dom.$act.val("已激活").attr("disabled", "");
                srd.isactive = true;
            } else { // Note: 没有
                srd.isactive = false;
            }

            // console.log(configuration);
            if (configuration !== null) {
                configuration.text = configuration.text ?? "";
                Object.assign(srd.parse_data, configuration);
                srd.dom.$text_input[0].value = configuration.text;
            }

            $("input[key='bg'][css-key], input[key='fg'][css-key]").each((i, e, $e = $(e)) => $e.on("input", () => {
                e.value = e.value.replaceAll("to top", "0deg")
                    .replaceAll("to right", "90deg")
                    .replaceAll("to bottom", "180deg")
                    .replaceAll("to left", "270deg")
                    .replaceAll("to top right", "45deg")
                    .replaceAll("to right top", "45deg")
                    .replaceAll("to bottom right", "135deg")
                    .replaceAll("to right bottom", "135deg")
                    .replaceAll("to bottom left", "225deg")
                    .replaceAll("to left bottom", "225deg")
                    .replaceAll("to top left", "315deg")
                    .replaceAll("to left top", "315deg");
            }));

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
                const dominput = srd.customSettings[e.id].jsdom;
                const getInputString = () => {
                    let str = dominput.value || dominput.placeholder;
                    if (e.id === "bg") str = str.replaceAll("${luogu-default}", lColor[lg_usr.color][srd.current_type - 3]);
                    return str;
                };
                const colpicker = new XNColorPicker({
                    color: getInputString() ?? e.defaultColor,
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
                colpicker.getColorString = getInputString;
                colpicker.refreshPicker = function () {
                    this.setColor(this.getColorString());
                };
                srd.customSettings[e.id].colorpicker = colpicker;
                /*
                $(dominput).on("input", () => {

                });
                */
            });
        },
    }, { width: "800px", min_height: "400px" });
}, css);

export default register_badge;
