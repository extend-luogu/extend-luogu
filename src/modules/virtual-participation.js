import mod from "../core.js"
import { exlg_alert, lg_dat, lg_post, lg_content, lg_usr, warn, cur_time, $ } from "../utils.js"

mod.reg("virtual-participation", "创建重现赛", "@/contest/[0-9]*(#.*)?", {
    vp_id: { ty: "string", dft: "0", priv: true },
    orig_dat: { ty: "object", priv: true, lvs: {
        st_tm: { ty: "number" },
        pids: { ty: "string" },
        scrs: { ty: "string" }
    }}
}, ({ msto }) => {
    if (lg_dat.contest.id.toString() === msto.vp_id) {
        warn("You cannot vp the virtual contest.")
        if (msto.orig_dat.st_tm <= cur_time(1000) && lg_dat.contestProblems.length === 0) {
            lg_post(`/fe/api/contest/editProblem/${msto.vp_id}`,
                `{
                    "pids":[${msto.orig_dat.pids}],
                    "scores":{${msto.orig_dat.scrs}}
                }`
            ).then(() => {
                alert("比赛即将开始，页面将自动重新加载")
                location.reload()
            })
        }
        return
    }
    if (lg_dat.contest.endTime > cur_time(1000)) {
        warn("Contest has not started or ended.")
        return
    }
    $("<button id='exlg-vp' class='lfe-form-sz-middle'>重现比赛</button>").appendTo($("div.operation"))
        .click(async () => {
            exlg_alert(`<div>
                <p>设置「${lg_dat.contest.name}」的重现赛
                <p>开始时间：<input type="date" id="vpTmDt"/> <input type="time" id="vpTmClk"/></p>
            </div><br>`, "创建重现赛", async () => {
                let pa = $("#vpTmDt")[0].value.split("-"), pb = $("#vpTmClk")[0].value.split(":")
                let st = new Date(pa[0], pa[1] - 1, pa[2], pb[0], pb[1], 0, 0) // Note: Date 要减一个月
                st = st.getTime() / 1000

                msto.orig_dat.pids = msto.orig_dat.scrs = ""
                msto.orig_dat.st_tm = st
                $.each(lg_dat.contestProblems, (id, vl) => {
                    if (id)
                        msto.orig_dat.pids += ",", msto.orig_dat.scrs += ","
                    msto.orig_dat.pids += "\"" + vl.problem.pid + "\"",
                    msto.orig_dat.scrs += `"${vl.problem.pid}": ${vl.problem.fullScore}`
                })

                let newc = (msto.vp_id === "0"), cdt = `{
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
                }`, resp = await lg_post(`/fe/api/contest/${newc ? "new" : ("edit/" + msto.vp_id)}`, cdt)
                switch (resp.status){
                case 200:
                    msto.vp_id = resp.id.toString()
                    break
                case 404:
                    msto.vp_id = (await lg_post(`/fe/api/contest/new`, cdt)).id.toString()
                    newc = true
                    break
                }
                await lg_post(`/fe/api/contest/editProblem/${msto.vp_id}`,`{"pids":[],"scores":{"P1000":100}}`)

                // Note: 自己创建的比赛自己不会自动加入
                if (newc) {
                    let pc = await lg_content(`/contest/edit/${msto.vp_id}`)
                    lg_post(`/fe/api/contest/join/${msto.vp_id}`, `{"code": "${pc.currentData.contest.joinCode}"}`)
                }
                location.href = `https://www.luogu.com.cn/contest/${msto.vp_id}`
            })
        })
}, `
#exlg-vp {
    margin-right: .5em;
    display: inline-block;
    flex: none;
    outline: 0;
    cursor: pointer;
    color: #fff;
    font-weight: inherit;
    line-height: 1.5;
    text-align: center;
    vertical-align: middle;
    background: 0 0;
    border-radius: 3px;
    border: 1px solid;
    border-color: #52c41a;
    background-color: #52c41a;
}
`)
