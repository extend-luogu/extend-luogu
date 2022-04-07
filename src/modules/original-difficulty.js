import { $, cs_get, error, lg_dat } from "../utils.js"
import mod, { sto } from "../core.js"

mod.reg_chore("atdiff-fetch", "获取 AtCoder 难度", "10D", "@/problem/AT.*", {
    atdiff: { ty: "string", priv: true },
}, ({ msto }) => {
    let dif = {}
    cs_get({
        url: "https://kenkoooo.com/atcoder/resources/problem-models.json",
        onload: res => {
            let rdif = JSON.parse(res.responseText)
            for (let ky in rdif)
                dif[ky] = rdif[ky].difficulty
            msto.atdiff = JSON.stringify(dif)
        }
    })
})

mod.reg_pre("original-difficulty", "显示原始难度", [ "@/problem/CF.*", "@/problem/AT.*" ], {
    cf_src: { ty: "enum", dft: "codeforces.com", vals: [ "codeforces.com", "codeforces.ml" ], info: [
        "Codeforces problem source", "CF 题目源"
    ]},
}, async ({ msto }) => new Promise((resolve, reject) => {
    let pn = location.pathname.match(/(CF|AT)([0-9]|[A-Z])*$/g)[0].substring(2)
    if (location.pathname.includes("CF")) {
        let pid = pn.match(/^[0-9]*/g)[0], ops = pn.substring(pid.length)
        cs_get({
            url: `https://${msto.cf_src}/problemset/problem/${pid}/${ops}`,
            onload: res => {
                const rv = $(res.responseText).find("span[title=Difficulty]").text().trim()
                resolve(rv ? rv.substring(1) : undefined)
            },
            onerror: err => {
                error(err)
                reject(err)
            }
        })
    }
    else {
        let dif = JSON.parse(sto["^atdiff-fetch"].atdiff)
        let pid = lg_dat.problem.description.match(RegExp("^.{22}[-./A-Za-z0-9_]*"))[0].match(RegExp("[^/]*$"))
        if (!(pid in dif))
            resolve(undefined)
        else
            resolve(Math.round(dif[pid] >= 400 ? dif[pid] : 400 / Math.exp(1.0 - dif[pid] / 400)))
    }
}), ({ pred }) => {
    let x = document.querySelectorAll("div.field"), y = x[3].cloneNode(true)
    x[3].after(y)
    let t = y.querySelectorAll("span")
    t[0].innerText = "原始难度"
    t[1].innerText = "获取中"
    pred.then(d => {
        if (d === undefined)
            d = "不可用"
        t[1].innerText = d
    })
})
