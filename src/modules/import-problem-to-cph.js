import { $, lg_content } from "../utils.js";
import mod from "../core.js";
import exlg_alert from "../components/exlg-dialog-board.js";

mod.reg_lfe("import-problem-to-cph", "添加到 cph", ["@/problem/[A-Z]+[0-9]+[A-Z]*(#.*)?(\\?contestId=[0-9]*)?", "@/record/.*", "@/contest/[0-9]+(#.*)?"], {
    auto_hide_button: {
        ty: "boolean",
        dft: true,
        strict: true,
        info: ["Auto Hide Button", "自动隐藏按钮"],
    },
    problem_template: {
        ty: "string",
        dft: "Luogu_${pid}",
        info: ["Custom Problemname Template (Not Contest)", "自定义题目名称格式（非比赛）"],
    },
    contest_template: {
        ty: "string",
        dft: "Luogu_${cid}_${pid}",
        info: ["Custom Problemname Template (Contest)", "自定义题目名称格式（比赛）"],
    },
}, async (msto) => {
    /**
     * Used to import problem to cph
     *
     * @param href link of the problem
     * @param type import type
     * @param conid
     */
    function import_cph(href, type = "problem", conid = 0) {
        $.get(href, (elem) => {
            /**
             * 将 str 转 element
             *
             * @param html
             */
            function htmlToElement(html) {
                return new DOMParser().parseFromString(html, "text/html").documentElement;
            }

            let p;
            elem = htmlToElement(elem);
            for (const scriptElem of elem.querySelectorAll("script")) {
                const script = scriptElem.textContent;
                if (script.startsWith("window._feInjection")) {
                    const startQuoteIndex = script.indexOf("\"");
                    const endQuoteIndex = script.substr(startQuoteIndex + 1).indexOf("\"");
                    const encodedData = script.substr(startQuoteIndex + 1, endQuoteIndex);

                    p = JSON.parse(decodeURIComponent(encodedData)).currentData.problem;
                }
            }
            if (p == null) {
                throw new Error("Failed to find problem data");
            }
            const dt = [];
            for (const x of p.samples) {
                dt.push({ input: x[0], output: x[1] });
            }

            let name = msto.msto.problem_template;
            if (type === "contest") {
                name = msto.msto.contest_template;
                name = name.replace("${cid}", `${conid}`);
            }
            name = name.replace("${pid}", p.pid);
            GM_xmlhttpRequest({
                url: "http://localhost:27121/",
                method: "POST",
                data: JSON.stringify({
                    batch: { id: "exlg", size: 1 },
                    name,
                    group: "Luogu",
                    url: href,
                    interactive: "false",
                    memoryLimit: Math.floor(Math.max(...p.limits.memory) / 1024),
                    timeLimit: Math.max(...p.limits.time),
                    tests: dt,
                    input: { type: "stdin" },
                    output: { type: "stdout" },
                    language: { java: { mainClass: "Main", taskClass: p.pid } },
                    testType: "single",
                }),
                onload(res) {
                    if (res.status === 502) {
                        exlg_alert("未启动 cph，传输失败！");
                    }
                },
                onerror() {
                    exlg_alert("未启动 cph，传输失败！");
                },
            });
        });
    }


    if (!$("div.operation").length || window.location.href.search("/record/") !== -1) return;

    const pms = new Promise((resolve) => {
        GM_xmlhttpRequest({
            url: "http://localhost:27121/",
            method: "POST",
            onload() {
                resolve(true);
            },
            onerror() {
                resolve(false);
            },
        });
    });

    /**
     * 注册 `传送至 cph` 按钮
     */
    function regi_exlg_cph() {
        if (window.location.href.search("/contest/") !== -1) {
            $("button.exlg-cph").click(async () => {
                let { href } = window.location;
                const loc = href.search("#");
                if (loc !== -1) {
                    href = href.substring(0, loc);
                }
                const data = await lg_content(href);
                if (data.currentData.contestProblems === null) {
                    exlg_alert("比赛未开始！");
                }
                const problemList = data.currentData.contestProblems;
                for (let i = 0; i < problemList.length; i++) {
                    import_cph(`https://www.luogu.com.cn/problem/${problemList[i].problem.pid}`, "contest", data.currentData.contest.id);
                }
            });
        } else {
            $("button.exlg-cph").click(() => {
                import_cph(window.location.href);
            });
        }
    }

    const enabled = await pms;
    if (!enabled && msto.msto.auto_hide_button) {
        return;
    }
    $("button.lfe-form-sz-middle").addClass("lg-btm");
    if (window.location.href.search("#submit") === -1) {
        if ($("button.exlg-cph").length === 0) {
            $("div.operation").append("<button data-v-7ade990c=\"\" data-v-43063e73=\"\" type=\"button\" class=\"exlg-cph lfe-form-sz-middle\" data-v-2dfcfd35=\"\" style=\"border-color: rgb(52, 152, 219); background-color: rgb(52, 152, 219);\"> 传送至 cph </button>");
            regi_exlg_cph();
        }
    }
    $("button.lg-btm").click(() => {
        if (window.location.href.search("#submit") === -1) {
            if ($("button.exlg-cph").length === 0) {
                $("button.lfe-form-sz-middle").addClass("lg-btm");
                $("div.operation").append("<button data-v-7ade990c=\"\" data-v-43063e73=\"\" type=\"button\" class=\"exlg-cph lfe-form-sz-middle\" data-v-2dfcfd35=\"\" style=\"border-color: rgb(52, 152, 219); background-color: rgb(52, 152, 219);\"> 传送至 cph </button>");
                regi_exlg_cph();
            }
        } else {
            $("button.exlg-cph").remove();
        }
    });
}, null, "module");
