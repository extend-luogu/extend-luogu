// ==Utilities==

const uindow = unsafeWindow

const log = (f, ...s) => uindow.console.log(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
const warn = (f, ...s) => uindow.console.warn(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
const error = (f, ...s) => {
    uindow.console.error(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
    throw Error(s.join(" "))
}

// ==Utilities==Libraries==

const $ = jQuery
const xss = new filterXSS.FilterXSS({
    onTagAttr: (_, k, v) => {
        if (k === "style") return `${k}="${v}"`
    }
})
const mdp = uindow.markdownPalettes
$.double = (func, first, second) => [func(first), func(second)]

// ==Utilities==Extensions==

Date.prototype.format = function (f, UTC) {
    UTC = UTC ? "UTC" : ""
    const re = {
        "y+": this[`get${UTC}FullYear`](),
        "m+": this[`get${UTC}Month`]() + 1,
        "d+": this[`get${UTC}Date`](),
        "H+": this[`get${UTC}Hours`](),
        "M+": this[`get${UTC}Minutes`](),
        "S+": this[`get${UTC}Seconds`](),
        "s+": this[`get${UTC}Milliseconds`]()
    }
    for (const r in re) if (RegExp(`(${r})`).test(f))
        f = f.replace(RegExp.$1,
            ("000" + re[r]).substr(re[r].toString().length + 3 - RegExp.$1.length)
        )
    return f
}

String.prototype.toInitialCase = function () {
    return this[0].toUpperCase() + this.slice(1)
}

// ==Utilities==Functions==

let sto = null

const version_cmp = (v1, v2) => {
    if (! v1) return "<<"

    const op = (x1, x2) => x1 === x2 ? "==" : x1 < x2 ? "<<" : ">>"
    const exs = [ "pre", "alpha", "beta" ]

    const [ [ n1, e1 ], [ n2, e2 ] ] = [ v1, v2 ].map(v => v.split(" "))
    if (n1 === n2) return op(...[ e1, e2 ].map(e => e ? exs.findIndex(ex => ex === e) : Infinity))

    const [ m1, m2 ] = [ n1, n2 ].map(n => n.split("."))
    for (const [ k2, m ] of m1.entries())
        if (m !== m2[k2]) return op(+ m || 0, + m2[k2] || 0)
}

const lg_content = url => new Promise((res, rej) =>
    $.get(url + (url.includes("?") ? "&" : "?") + "_contentOnly=1", data => {
        if (data.code !== 200) rej(`Requesting failure code: ${ res.code }.`)
        res(data)
    })
)

const lg_alert = uindow.show_alert
    ? msg => uindow.show_alert("exlg 提醒您", msg.replaceAll("\n", "<br />"))
    : msg => uindow.alert("exlg 提醒您\n" + msg)

const springboard = (param, styl) => {
    const q = new URLSearchParams(); for (let k in param) q.set(k, param[k])
    const $sb = $(`
        <iframe id="exlg-${param.type}" src=" https://www.bilibili.com/robots.txt?${q}" style="${styl}" exlg="exlg"></iframe>
    `)
    log("Building springboard: %o", $sb[0])
    return $sb
}

const judge_problem = text => [
    /^AT[1-9][0-9]{0,}$/i,
    /^CF[1-9][0-9]{0,}[A-Z][0-9]?$/i,
    /^SP[1-9][0-9]{0,}$/i,
    /^P[1-9][0-9]{3,}$/i,
    /^UVA[1-9][0-9]{2,}$/i,
    /^U[1-9][0-9]{0,}$/i,
    /^T[[1-9][0-9]{0,}$/i
].some(re => re.test(text))

// ==/Utilities==

export {
    uindow,
    log,
    warn,
    error,
    $,
    xss,
    mdp,
    sto,
    version_cmp,
    lg_content,
    lg_alert,
    springboard,
    judge_problem,
}