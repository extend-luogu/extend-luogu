import mod from "../core.js";
import { $ } from "../utils.js";
import css from "../resources/css/tasklist-ex.css";

mod.reg("tasklist-ex", "任务计划 ex", "@/", {
    auto_clear: { ty: "boolean", dft: true, info: ["Hide accepted problems", "隐藏已经 AC 的题目"] },
    rand_problem_in_tasklist: { ty: "boolean", dft: true, info: ["Random problem in tasklist", "任务计划随机跳题"] },
}, ({ msto }) => {
    /* const _$board = $("button[name=task-edit]").parent().parent() // Note: 如果直接$div:has(.tasklist-item) 那么当任务计划为空.. */
    const actTList = [];
    $.each($("div.tasklist-item"), (_, prob, $e = $(prob)) => {
        const pid = $e.attr("data-pid");

        if (prob.innerHTML.search(/check/g) === -1) {
            if (msto.rand_problem_in_tasklist) actTList.push(pid);
        }
        if ($e.find("i").hasClass("am-icon-check")) $e.addClass("tasklist-ac-problem");
    });

    const $toggle_AC = $(`<div>[<a id="toggle-button">隐藏已AC</a>]</div>`);
    $("button[name=task-edit]").parent().after($toggle_AC);

    const $ac_problem = $(".tasklist-ac-problem");
    const $toggle = $("#toggle-button").on("click", () => {
        $ac_problem.toggle();
        $toggle.text(`${["隐藏", "显示"][+(msto.auto_clear = !msto.auto_clear)]}已 AC`);
    });

    if (msto.auto_clear) $toggle.click();

    if (msto.rand_problem_in_tasklist) {
        const $btn = $(`<button name="task-rand" class="am-btn am-btn-sm am-btn-success lg-right">随机</button>`);
        $("button[name='task-edit']").before($btn);
        $btn.addClass("exlg-rand-tasklist-problem-btn")
            .click(() => {
                const tid = ~~(Math.random() * 1.e6) % actTList.length;
                location.href += `problem/${actTList[tid]}`;
            });
    }
}, css, "module");
