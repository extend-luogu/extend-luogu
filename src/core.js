import { log, warn, error, $ } from "./utils.js"

export let sto = null
const mod = {
    _: new Map(),

    fake_sto: sto,
    data: {},

    path_alias: [
        [ "",        ".*\\.luogu\\.(com\\.cn|org)" ],
        [ "dash",    "dash.exlg.cc"],
        [ "cdn",     "cdn.luogu.com.cn" ],
        [ "bili",    "www.bilibili.com" ],
        [ "tcs1",    "service-ig5px5gh-1305163805.sh.apigw.tencentcs.com" ],
        [ "tcs2",    "service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com" ],
        [ "tcs3",    "service-otgstbe5-1305163805.sh.apigw.tencentcs.com" ],
        [ "debug",   "localhost:1634" ],
        [ "ghpage",  "extend-luogu.github.io" ]
    ].map(([ alias, path ]) => [ new RegExp(`^@${alias}/`), path ]),

    path_dash_board: [
        "@dash/((index|bundle)(.html)?)?", "@ghpage/exlg-setting-new/((index|bundle)(.html)?)?", "@debug/exlg-setting/((index|bundle).html)?"
    ],

    reg: (name, info, path, data, func, styl) => {
        if (! Array.isArray(path)) path = [ path ]
        path.forEach((p, i) => {
            mod.path_alias.some(([ re, url ]) => {
                if (p.match(re))
                    return path[i] = p.replace(re, url + "/"), true
            })

            if (! p.endsWith("$")) path[i] += "$"
        })

        mod.data[name] = {
            ty: "object",
            lvs: {
                ...data,
                on: { ty: "boolean", dft: true }
            }
        }

        mod._.set(name, { info, path, func, styl })
    },

    reg_pre : (name, info, path, data, pre, func, styl) => {
        mod.reg(name, info, path, data, func, styl)
        mod._.set(name, { pre, ...mod._.get(name) })
    },

    reg_main: (name, info, path, data, func, styl) =>
        mod.reg("@" + name, info, path, data, arg => (func(arg), false), styl),

    reg_user_tab: (name, info, tab, vars, data, func, styl) =>
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
            }, styl
        ),

    reg_chore: (name, info, period, path, data, func, styl) => {
        if (typeof period === "string") {
            const num = + period.slice(0, -1), unit = {
                s: 1000,
                m: 1000 * 60,
                h: 1000 * 60 * 60,
                D: 1000 * 60 * 60 * 24
            }[ period.slice(-1) ]
            if (! isNaN(num) && unit) period = num * unit
            else error(`Parsing period failed: "${period}"`)
        }

        name = "^" + name
        data = {
            ...data,
            last_chore: { ty: "number", dft: -1, priv: true }
        }

        mod.reg(
            name, info, path, data,
            arg => {
                const last = sto[name].last_chore, now = Date.now()

                let nostyl = true
                if (arg.named || ! last || now - last > period) {
                    if (nostyl) {
                        GM_addStyle(styl)
                        nostyl = false
                    }
                    func(arg)
                    sto[name].last_chore = Date.now()
                }
                else log(`Pending chore: "${name}"`)
            }
        )
    },

    reg_board: (name, info, data, func, styl) => mod.reg(
        name, info, "@/", data,
        arg => {
            const icon_b = `
                <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 0 136.14 30.56">
                    <g transform="translate(1.755, 0)" fill="#00a0d8">
                        <g>
                            <path d="M5.02-33.80L34.56-33.80L34.07-28.62L16.96-28.62L15.93-21.92L31.97-21.92L31.48-16.74L14.85-16.74L13.82-8.42L31.97-8.42L31.48-3.24L2.43-3.24L6.59-31.75L5.02-33.80Z" transform="translate(-4.14, 33.9)"></path>
                            <path d="M7.34-32.29L5.78-33.80L16.63-33.80L21.33-25.00L27.54-32.78L26.51-33.80L38.93-33.80L25.49-18.79L34.78-3.24L24.41-3.24L19.76-12.58L11.99-3.24L1.62-3.24L15.12-18.79L7.34-32.29Z" transform="translate(27.23, 33.9)"></path>
                            <path d="M4.00-33.80L16.42-33.80L12.80-8.42L32.99-8.42L32.51-3.24L5.56-3.24Q4.00-3.24 3.21-4.27Q2.43-5.29 2.43-6.86L2.43-6.86L5.56-31.75L4.00-33.80Z" transform="translate(63.8, 33.9)"></path>
                            <path d="M38.83-33.80L37.80-25.00L27.43-25.00L27.92-28.62L15.50-28.62L12.91-8.42L25.33-8.42L25.87-14.63L22.73-19.82L36.72-19.82L34.67-3.24L5.62-3.24Q4.86-3.24 4.21-3.51Q3.56-3.78 3.10-4.27Q2.65-4.75 2.48-5.43Q2.32-6.10 2.54-6.86L2.54-6.86L6.16-33.80L38.83-33.80Z" transform="translate(95.6, 33.9)"></path>
                        </g>
                    </g>
            </svg>
            `
            let $board = $("#exlg-board")
            if (! $board.length)
                $board = $(`
                    <div class="lg-article" id="exlg-board" exlg="exlg"><h2>${icon_b} &nbsp;&nbsp;${GM_info.script.version}</h2></div>
                `)
                    .prependTo(".lg-right.am-u-md-4"),
                $board[0].firstChild.style["font-size"]="1em"
            func({ ...arg, $board: $(`<div></div>`).appendTo($board) })
        }, styl
    ),

    /**
     * @deprecated 请使用 reg_hook_new 来注册钩子
     */
    reg_hook: (name, info, path, data, func, hook, styl) => mod.reg(
        name, info, path, data,
        arg => {
            func(arg)
            $("body").bind("DOMNodeInserted", e => hook(e) && func(arg))
        }, styl
    ),

    reg_hook_new: (name, info, path, data, func, hook, darg, styl) => mod.reg(
        name, info, path, data,
        arg => {
            func({...arg, ...{ result: false, args: darg() }})
            $("body").bind("DOMNodeInserted", (e) => {
                const res = hook(e)
                return res.result && func({...arg, ...res})
            })
        }, styl
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
            if (! m) error(`Preloading named mod but not found: "${name}"`)
            log(`Preloading ${ named ? "named " : "" }mod: "${m.name}"`)
            try {
                return { pred: m.pre({ msto: sto[m.name], named }), ...m}
            }
            catch (err) {
                warn(err)
                return m
            }
        }

        const pn = location.href
        for (const [name, m] of mod._.entries()) {
            if (sto[name].on && m.path.some(re => new RegExp(re, "g").test(pn))) {
                m.willrun = true
                if ("pre" in m)
                    mod._.set(name, exe({name, ...m}))
            }
        }
    },

    execute: name => {
        const exe = (m, named) => {
            if (! m) error(`Executing named mod but not found: "${name}"`)
            if (m.styl) GM_addStyle(m.styl)
            log(`Executing ${ named ? "named " : "" }mod: "${m.name}"`)
            try {
                if ("pred" in m)
                    return m.func({ msto: sto[m.name], named, pred: m.pred })
                return m.func({ msto: sto[m.name], named })
            }
            catch (err) {
                warn(err)
            }
        }
        if (name) {
            const m = mod.find(name)
            return exe(m, true)
        }

        for (const [name, m] of mod._.entries()) {
            m.on = sto[name].on
            if (m.willrun) {
                if (exe({name, ...m}) === false) break
            }
        }
    }
}

export { mod as default }