import { cur_time, log, warn, error, $ } from "./utils.js"
import icon_b from "./resources/logo.js"
import category from "./category.js"

export let sto = null
const mod = {
    _: new Map(),

    fake_sto: sto,
    data: {},

    path_alias: [
        [ "",        ".*\\.luogu\\.(com\\.cn|org)" ],
        [ "dash",    "dash.exlg.cc" ],
        [ "cdn",     "cdn.luogu.com.cn" ],
        [ "bili",    "www.bilibili.com" ],
        [ "tcs1",    "service-ig5px5gh-1305163805.sh.apigw.tencentcs.com" ],
        [ "tcs2",    "service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com" ],
        [ "tcs3",    "service-otgstbe5-1305163805.sh.apigw.tencentcs.com" ],
        [ "debug",   "localhost:1634" ],
        [ "ghpage",  "extend-luogu.github.io" ]
    ].map(([ alias, path ]) => [ new RegExp(`^@${alias}/`), path ]),

    path_dash_board: [
        "@dash/((index|bundle)(.html)?)?", "@ghpage/exlg-setting-new/((index|bundle)(.html)?)?", "@debug/exlg-setting-new/((index|bundle).html)?"
    ],

    reg: (name, info, path, data, func, styl, cate) => {
        if (!Array.isArray(path)) path = [ path ]
        path.forEach((p, i) => {
            mod.path_alias.some(([ re, url ]) => {
                if (p.match(re))
                    return path[i] = p.replace(re, url + "/"), true
            })

            if (!p.endsWith("$")) path[i] += "$"
        })
        const rawName = category.alias(cate) + name
        mod.data[rawName] = {
            ty: "object",
            lvs: data ? data : {}
        }
        if (!("on" in mod.data[rawName].lvs))
            mod.data[rawName].lvs.on = { ty: "boolean", dft: true }

        info = info.replaceAll(" ", "_")

        mod._.set(name, { info, path, func, styl, cate })
    },

    reg_pre : (name, info, path, data, pre, func, styl, cate) => {
        mod.reg(name, info, path, data, func, styl, cate)
        mod._.set(name, { pre, ...mod._.get(name) })
    },

    reg_main: (name, info, path, data, func, styl) =>
        mod.reg(name, info, path, data, arg => (func(arg), false), styl, "core"),

    reg_user_tab: (name, info, tab, vars, data, func, styl, cate) =>
        mod.reg(
            name, info, "@/user/.*", data,
            arg => {
                const $tabs = $(".items")
                const work = () => {
                    if ((location.hash || "#main") !== "#" + tab) return
                    log(`Working user tab#${tab} mod: "${name}"`)
                    func({ ...arg, vars })
                }
                $tabs.on("click", work)
                work()
            }, styl, cate
        ),

    reg_chore: (name, info, period, path, data, func, styl) => {
        if (typeof period === "string") {
            const num = +period.slice(0, -1), unit = {
                s: 1000,
                m: 1000 * 60,
                h: 1000 * 60 * 60,
                D: 1000 * 60 * 60 * 24
            }[ period.slice(-1) ]
            if (!isNaN(num) && unit) period = num * unit
            else error(`Parsing period failed: "${period}"`)
        }

        data = {
            ...data,
            last_chore: { ty: "number", dft: -1, priv: true }
        }

        mod.reg(
            name, info, path, data,
            async arg =>  {
                const last = sto[name].last_chore, now = cur_time(1)

                let nostyl = true
                if (arg.named || !last || now - last > period) {
                    if (nostyl) {
                        GM_addStyle(styl)
                        nostyl = false
                    }
                    if (await func(arg))
                        warn(`Chore failed: "${name}"`)
                    else
                        sto[name].last_chore = cur_time(1)
                }
                else log(`Pending chore: "${name}"`)
            }, `
            `, "chore"
        )
    },

    reg_board: (name, info, data, func, styl, cate) => mod.reg(
        name, info, "@/", data,
        arg => {
            let $board = $("#exlg-board")
            if (!$board.length)
                $board = $(`
                    <div class="lg-article" id="exlg-board" exlg="exlg"><h2>${icon_b} &nbsp;&nbsp;${GM_info.script.version}</h2></div>
                `)
                    .prependTo(".lg-right.am-u-md-4"),
                $board[0].firstChild.style["font-size"]="1em"
            func({ ...arg, $board: $(`<div></div>`).appendTo($board) })
        }, styl, cate
    ),

    /**
     * @deprecated 请使用 reg_hook_new 来注册钩子
     */
    reg_hook: (name, info, path, data, func, hook, styl, cate) => mod.reg(
        name, info, path, data,
        arg => {
            func(arg)
            $("body").bind("DOMNodeInserted", e => hook(e) && func(arg))
        }, styl, cate
    ),

    reg_hook_new: (name, info, path, data, func, hook, darg, styl, cate) => mod.reg(
        name, info, path, data,
        arg => {
            func({...arg, ...{ result: false, args: darg() }})
            $("body").bind("DOMNodeInserted", (e) => {
                if (!e.target.tagName)
                    return false
                const res = hook(e)
                return res.result && func({...arg, ...res})
            })
        }, styl, cate
    ),

    find: name => mod._.get(name),
    has: name => mod._.has(name),

    disable: name => {
        let x = mod.find(name)
        x.on = false
        mod._.set(name, x)
    },
    enable: name => {
        let x = mod.find(name)
        x.on = true
        mod._.set(name, x)
    },

    preload: name => {
        if (sto === null)
            sto = mod.fake_sto // Hack: 替代方案，变量还是没法 export 后修改
        const exe = (m, named) => {
            if (!m) error(`Preloading named mod but not found: "${name}"`)
            log(`Preloading ${ named ? "named " : "" }mod: "${m.name}"`)
            try {
                return { pred: m.pre({ msto: sto[category.alias(m.cate) + m.name], named }), ...m}
            }
            catch (err) {
                warn(err)
                return m
            }
        }

        const pn = location.href
        for (const [ name, m ] of mod._.entries()) {
            console.log(m.cate, name)
            if (sto[category.alias(m.cate) + name].on && m.path.some(re => new RegExp(re, "g").test(pn))) {
                m.willrun = true
                if ("pre" in m)
                    mod._.set(name, exe({name, ...m}))
            }
        }
    },

    execute: name => {
        const exe = (m, named) => {
            if (!m) error(`Executing named mod but not found: "${name}"`)
            if (m.styl) GM_addStyle(m.styl)
            log(`Executing ${ named ? "named " : "" }mod: "${m.name}"`)
            try {
                if ("pred" in m)
                    return m.func({ msto: sto[category.alias(m.cate) + m.name], named, pred: m.pred })
                return m.func({ msto: sto[category.alias(m.cate) + m.name], named })
            }
            catch (err) {
                warn(err)
            }
        }
        if (name) {
            const m = mod.find(name)
            return exe({name, ...m}, true)
        }

        for (const [ name, m ] of mod._.entries()) {
            m.on = sto[category.alias(m.cate) + name].on
            if (m.willrun) {
                if (exe({name, ...m}) === false) break
            }
        }
    }
}

export { mod as default }