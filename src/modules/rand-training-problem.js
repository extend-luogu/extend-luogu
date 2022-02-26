import { $, exlg_alert, lg_dat } from "../utils.js"
import mod from "../core.js"

mod.reg_hook_new("rand-training-problem", "题单内随机跳题", "@/training/[0-9]+(#.*)?", {
    mode: { ty: "enum", vals: ["unac only", "unac and new", "new only"], dft : "unac and new", info: [
        "Preferences about problem choosing", "随机跳题的题目种类"
    ] }
}, ({ msto, args }) => {
    let ptypes = msto.mode.startsWith("unac") + msto.mode.endsWith("only") * (-1) + 2
    if (! args.length) return // Hack: 这一步明明 result 已经是 0 的情况下还把参数传进去了导致RE
    $(args[0].firstChild).clone(true)
        .appendTo(args)
        .text("随机跳题")
        .addClass("exlg-rand-training-problem-btn")
        .on("click", () => {
            const tInfo = lg_dat.training
            let candProbList = []

            tInfo.problems.some(pb => {
                if (tInfo.userScore.score[pb.problem.pid] === null) {
                    if (ptypes & 1)
                        candProbList.push(pb.problem.pid)
                }
                else if (tInfo.userScore.score[pb.problem.pid] < pb.problem.fullScore && (ptypes & 2))
                    candProbList.push(pb.problem.pid)
            })

            if (!tInfo.problemCount)
                return exlg_alert("题单不能为空")
            else if (!candProbList.length) {
                if (ptypes === 1)
                    return exlg_alert("您已经做完所有新题啦！")
                else if (ptypes === 2)
                    return exlg_alert("您已经订完所有错题啦！")
                else
                    return exlg_alert("您已经切完所有题啦！")
            }

            const pid = ~~ (Math.random() * 1.e6) % candProbList.length
            location.href = "https://www.luogu.com.cn/problem/" + candProbList[pid]
        })
}, (e) => {
    const $tmp = $(e.target).find("div.operation")
    return { result: $tmp.length > 0, args: $tmp }
}, () => $("div.operation"), `
.exlg-rand-training-problem-btn {
    border-color: rgb(52, 52, 52);
    background-color: rgb(52, 52, 52);
}
`)