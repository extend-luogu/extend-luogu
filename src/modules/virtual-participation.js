import mod from "../core.js"
import { exlg_alert, lg_dat, lg_post, lg_content, lg_usr, warn, error, cur_time, $ } from "../utils.js"
import css from "../resources/css/virtual-participation.css"

mod.reg("virtual-participation", "创建重现赛", "@/contest/[0-9]*(#.*)?", {
}, () => {
    if (lg_dat.contest.name.match("Virtual Participation")) {
        const $tabs = $(".items")
        const work = () => {
            if ((location.hash || "#main") === "#problems") {
                if ($(".pid").length !== 0 && lg_dat.contest.startTime > cur_time()) {
                    $("a.title.color-default").on("click", () => {
                        exlg_alert("比赛尚未开始, 请开始后再查看题目")
                        return
                    })
                    $("a.title.color-default").removeAttr("href")
                }
            }
        }
        $tabs.on("click", work)
        work()
        return
    }
    if (lg_dat.contest.endTime > cur_time()) {
        warn("Contest has not started or ended.")
        return
    }
    $("<button id='exlg-vp' class='lfe-form-sz-middle'>重现比赛</button>").appendTo($("div.operation"))
        .click(async () => {
            exlg_alert(`<div>
                <p>设置「${lg_dat.contest.name}」的重现赛</p>
                <p>开始时间：<input type="date" id="vpTmDt"/> <input type="time" id="vpTmClk"/></p>
            </div><br>`, "创建重现赛", async () => {
                let pa = $("#vpTmDt")[0].value.split("-"), pb = $("#vpTmClk")[0].value.split(":")
                let st = new Date(pa[0], pa[1] - 1, pa[2], pb[0], pb[1], 0, 0) // Note: Date 要减一个月
                st = st.getTime() / 1000

                let orig_pids = "", orig_scrs = ""
                $.each(lg_dat.contestProblems, (id, vl) => {
                    if (id)
                        orig_pids += ",", orig_scrs += ","
                    orig_pids += "\"" + vl.problem.pid + "\"",
                    orig_scrs += `"${vl.problem.pid}": ${vl.problem.fullScore}`
                })

                let resp = null
                const cdt = `{
                    "settings":{
                        "name": "Virtual Participation for ${lg_dat.contest.name}",
                        "description": ${JSON.stringify(lg_dat.contest.description)},
                        "visibilityType":5,
                        "invitationCodeType":1,
                        "ruleType":${lg_dat.contest.ruleType},
                        "startTime":${st},
                        "endTime":${st+lg_dat.contest.endTime - lg_dat.contest.startTime},
                        "rated":false,
                        "ratingGroup":null
                    },
                    "hostID":${lg_usr.uid}
                }`
                resp = await lg_post(`/fe/api/contest/new`, cdt)
                let vp_id = resp.id.toString()
                switch (resp.status ?? 200) {
                case 200:
                    vp_id = resp.id.toString()
                    break
                default:
                    error(`Failed to modify contest ${vp_id} with status code ${resp.status}.`)
                }
                resp = null
                try {
                    resp = await lg_post(`/fe/api/contest/editProblem/${vp_id}`,
                        `{
                            "pids":[${orig_pids}],
                            "scores":{${orig_scrs}}
                        }`)
                }
                catch {
                    exlg_alert("<p>本场比赛的题目不公开</p>", "重现赛创建失败")
                    return
                }
                let pc = await lg_content(`/contest/edit/${vp_id}`)
                // Note: 自己创建的比赛自己不会自动加入

                await lg_post(`/fe/api/contest/join/${vp_id}`, `{"code": "${pc.currentData.contest.joinCode}"}`)
                exlg_alert(`<p>邀请码: ${pc.currentData.contest.joinCode}</p>
                    <p>点确定自动跳转</p>`, "重现赛创建成功", () => {
                    location.href = `https://www.luogu.com.cn/contest/${vp_id}`
                })
            }, false)
        })
}, css, "module")
