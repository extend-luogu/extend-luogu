import { $, lg_dat } from "../utils.js";
import mod from "../core.js";
import css from "../resources/css/rand-training-problem.css";
import exlg_alert from "../components/exlg-dialog-board.js";

mod.reg_hook_new("rand-training-problem", "题单内随机跳题", "@/training/[0-9]+(#.*)?", {
    mode: {
        ty: "enum", vals: ["unac only", "unac and new", "new only"], dft: "unac and new", info: [
            "Preferences about problem choosing", "随机跳题的题目种类",
        ],
    },
}, ({ msto, args }) => {
    const ptypes = msto.mode.startsWith("unac") + msto.mode.endsWith("only") * (-1) + 2;
    if (!args.length) return; // Hack: 这一步明明 result 已经是 0 的情况下还把参数传进去了导致 RE
    $(args[0].firstChild).clone(true)
        .appendTo(args)
        .text("随机跳题")
        .addClass("exlg-rand-training-problem-btn")
        .on("click", () => {
            const tInfo = lg_dat.training;
            const candProbList = [];

            for (const pb of tInfo.problems) {
                if (tInfo.userScore === null) { // Hack: 非 P 全未作时 tInfo.userScore 返回 null
                    candProbList.push(pb.problem.pid);
                } else {
                    const score = tInfo.userScore.score[pb.problem.pid];
                    if (score === null && (ptypes & 1)) {
                        candProbList.push(pb.problem.pid);
                    } else if (score < pb.problem.fullScore && (ptypes & 2)) {
                        candProbList.push(pb.problem.pid);
                    }
                }
            }

            if (!tInfo.problemCount) return exlg_alert("题单不能为空");
            if (!candProbList.length) {
                if (ptypes === 1) return exlg_alert("您已经做完所有新题啦！");
                if (ptypes === 2) return exlg_alert("您已经订完所有错题啦！");
                return exlg_alert("您已经切完所有题啦！");
            }

            const pid = ~~(Math.random() * 1.e6) % candProbList.length;
            location.href = `https://www.luogu.com.cn/problem/${candProbList[pid]}`;
        });
}, (e) => {
    const $tmp = $(e.target).find("div.operation");
    return { result: $tmp.length > 0, args: $tmp };
}, () => $("div.operation"), css, "module");
