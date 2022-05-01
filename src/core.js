import uindow, {
    cur_time, log, warn, error, $,
} from "./utils.js";
import icon_b from "./resources/image/logo.svg";
import category from "./category.js";
import { datas } from "./storage.js";
import queues from "./run-queue.js";

// eslint-disable-next-line import/no-mutable-exports
export let sto = null;
const mod = {
    _: new Map(),

    fake_sto: sto,
    data: {},

    path_alias: [
        ["", ".*\\.luogu\\.(com\\.cn|org)"],
        ["dash", "dash.exlg.cc"],
        ["cdn", "cdn.luogu.com.cn"],
        ["bili", "www.bilibili.com"],
        ["tcs1", "service-ig5px5gh-1305163805.sh.apigw.tencentcs.com"],
        ["tcs2", "service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com"],
        ["tcs3", "service-otgstbe5-1305163805.sh.apigw.tencentcs.com"],
        ["debug", "localhost:1634"],
        ["ghpage", "extend-luogu.github.io"],
    ].map(([alias, path]) => [new RegExp(`^@${alias}/`), path]),

    pth_modify: (pth) => {
        if (!Array.isArray(pth)) {
            pth = [pth];
        }
        return pth.map((p) => {
            mod.path_alias.some(([re, url]) => {
                if (!p.match(re)) return false;
                p = p.replace(re, `${url}/`);
                return true;
            });

            if (!p.endsWith("$")) p += "$";
            return p;
        });
    },

    path_dash_board: [
        "@dash/((index|bundle)(.html)?)?", "@ghpage/exlg-setting-new/((index|bundle)(.html)?)?", "@debug/exlg-setting-new/((index|bundle).html)?",
    ],

    reg: (name, info, path, data, func, styl, cate) => {
        path = mod.pth_modify(path);
        const rawName = category.alias(cate) + name;
        mod.data[rawName] = {
            ty: "object",
            lvs: data || {},
        };
        if (!("on" in mod.data[rawName].lvs)) mod.data[rawName].lvs.on = { ty: "boolean", dft: true };
        datas[rawName] = mod.data[rawName];

        info = info.replaceAll(" ", "_");

        mod._.set(name, {
            info, path, func, styl, cate,
        });
    },

    _regv2_invoker: (gpth, msto) => {
        const grtpr = (e, x) => {
            if (typeof x === "object" && e in x) {
                return x[e];
            }
        };

        gpth = mod.pth_modify(gpth);
        const qpusher = (nm, pth, qn, fn) => {
            pth = pth ? mod.pth_modify(pth) : [];
            const md = grtpr(nm, msto.private),
                enb = grtpr("on", md);
            if (enb !== false && pth.concat(gpth).some((e) => RegExp(e).test(location.href))) {
                queues[qn].push((...arg) => fn({ msto: md, gsto: msto.public }, ...arg));
            }
        };
        return {
            onload: ({ name, path }, _, fn) => qpusher(name, path, "onload", fn),
            preload: ({ name, path }, _, fn) => qpusher(name, path, "preload", fn),
            chore: ({ name, period }, _, fn) => {
                if (typeof period === "string") {
                    const num = +period.slice(0, -1),
                        unit = {
                            s: 1000,
                            m: 1000 * 60,
                            h: 1000 * 60 * 60,
                            D: 1000 * 60 * 60 * 24,
                        }[period.slice(-1)];
                    if (!isNaN(num) && unit) period = num * unit;
                    else error(`Parsing period failed: "${period}"`);
                }

                qpusher(name, "@/.*", "preload", async (arg) => {
                    const last = arg.msto.last_chore,
                        now = cur_time(1);

                    if (!last || now - last > period) {
                        if (await fn(arg)) { warn(`Chore failed: "${name}"`); } else { arg.msto.last_chore = cur_time(1); }
                    } else log(`Pending chore: "${name}"`);
                });
            },

            // Note: 这东西被枪毙的时间不远了
            hook: ({ name, path }, _, fn, hook) => qpusher(name, path, "preload", (arg) => {
                document.querySelector("body").addEventListener("DOMNodeInserted", (e) => {
                    if (!e.target.tagName) { return false; }
                    const res = hook(e);
                    return res.result && fn({ ...arg, ...res });
                });
            }),
        };
    },

    reg_v2: ({
        name, info, path, cate,
    }, data, reger, styl) => {
        info = info.replaceAll(" ", "_");
        let olds = {};
        const oll = [];
        const gtolds = (dat, ...dir) => olds = Object.fromEntries(Object.entries(olds).concat(Object.entries(dat).map(([k, v]) => {
            const origName = v.migration === true ? k : v.migration;
            oll.push([origName, dir.concat(k)]);
            return [origName, { ...v, priv: true }];
        })));
        const rawName = category.alias(cate) + name;
        const pubdat = Object.entries(data ?? {}).filter(([e]) => e !== "on");
        gtolds(pubdat, "public");
        datas[rawName] = {
            ty: "object",
            lvs: {
                ...(pubdat && {
                    public: {
                        ty: "object",
                        lvs: Object.fromEntries(pubdat),
                    },
                }),
                private: {
                    ty: "object",
                    lvs: {},
                },
                on: { ty: "boolean", dft: data?.on?.dft ?? true },
            },
        };
        const subfuncs = [];
        const _regv2_data_reger = (rtd) => {
            const mdf = (nm, dat) => {
                if (dat) {
                    rtd.private.lvs[nm] = {
                        ty: "object",
                        lvs: dat,
                    };
                    gtolds(dat, "private", nm);
                }
            };
            return new Proxy({
                onload: (e, dat) => mdf(e.name, dat),
                preload: (e, dat) => mdf(e.name, dat),
                chore: (e, dat) => mdf(e.name, {
                    ...dat,
                    last_chore: { ty: "number", dft: -1, priv: true },
                }),
                hook: (e, dat) => mdf(e.name, dat),
            }, {
                get: (e, v) => ((...arg) => {
                    subfuncs.push([v, ...arg]);
                    e[v](...arg);
                }),
            });
        };
        reger(_regv2_data_reger(datas[rawName].lvs));
        datas[rawName].lvs = { ...datas[rawName].lvs, ...olds };
        mod._.set(name, {
            info, path: mod.pth_modify(path), data, func: reger, subfuncs, migrlist: oll, styl, cate,
        });
    },

    reg_main: (name, info, path, data, func, styl) => mod.reg(name, info, path, data, (arg) => { func(arg); return false; }, styl, "core"),

    reg_user_tab: (name, info, tab, vars, data, func, styl, cate) => mod.reg(
        name,
        info,
        "@/user/.*",
        data,
        (arg) => {
            const $tabs = $(".items");
            const work = () => {
                if ((location.hash || "#main") !== `#${tab}`) return;
                log(`Working user tab#${tab} mod: "${name}"`);
                func({ ...arg, vars });
            };
            $tabs.on("click", work);
            work();
        },
        styl,
        cate,
    ),

    reg_chore: (name, info, period, path, data, func, styl) => {
        if (typeof period === "string") {
            const num = +period.slice(0, -1),
                unit = {
                    s: 1000,
                    m: 1000 * 60,
                    h: 1000 * 60 * 60,
                    D: 1000 * 60 * 60 * 24,
                }[period.slice(-1)];
            if (!isNaN(num) && unit) period = num * unit;
            else error(`Parsing period failed: "${period}"`);
        }

        data = {
            ...data,
            last_chore: { ty: "number", dft: -1, priv: true },
        };

        mod.reg(
            name,
            info,
            path,
            data,
            async (arg) => {
                const last = sto[`^${name}`].last_chore,
                    now = cur_time(1);

                let nostyl = true;
                if (arg.named || !last || now - last > period) {
                    if (nostyl) {
                        GM_addStyle(styl);
                        nostyl = false;
                    }
                    if (await func(arg)) warn(`Chore failed: "${name}"`);
                    else sto[`^${name}`].last_chore = cur_time(1);
                } else log(`Pending chore: "${name}"`);
            },
            `
            `,
            "chore",
        );
    },

    reg_board: (name, info, data, func, styl, cate) => mod.reg(
        name,
        info,
        "@/",
        data,
        (arg) => {
            let $board = $("#exlg-board");
            if (!$board.length) {
                $board = $(`
                    <div class="lg-article" id="exlg-board" exlg="exlg"><h2>${icon_b} &nbsp;&nbsp;${GM_info.script.version}</h2></div>
                `).prependTo(".lg-right.am-u-md-4");
                $board[0].firstChild.style["font-size"] = "1em";
            }
            func({ ...arg, $board: $(`<div></div>`).appendTo($board) });
        },
        styl,
        cate,
    ),

    /**
     * @deprecated 请使用 reg_hook_new 来注册钩子
     */
    reg_hook: (name, info, path, data, func, hook, styl, cate) => mod.reg(
        name,
        info,
        path,
        data,
        (arg) => {
            func(arg);
            $("body").bind("DOMNodeInserted", (e) => hook(e) && func(arg));
        },
        styl,
        cate,
    ),

    reg_hook_new: (name, info, path, data, func, hook, darg, styl, cate) => mod.reg(
        name,
        info,
        path,
        data,
        (arg) => {
            func({ ...arg, ...{ result: false, args: darg() } });
            $("body").bind("DOMNodeInserted", (e) => {
                if (!e.target.tagName) return false;
                const res = hook(e);
                return res.result && func({ ...arg, ...res });
            });
        },
        styl,
        cate,
    ),

    reg_lfe: (name, info, path, data, func, styl, cate) => {
        mod.reg(name, info, path, data, func, styl, cate);
        mod._.set(name, { lfe: true, ...mod._.get(name) });
    },

    find: (name) => mod._.get(name),
    has: (name) => mod._.has(name),

    disable: (name) => {
        const x = mod.find(name);
        x.on = false;
        mod._.set(name, x);
    },
    enable: (name) => {
        const x = mod.find(name);
        x.on = true;
        mod._.set(name, x);
    },

    execute_v2: () => {
        /*
        if (name) {
            const m = mod.find(name);
            if (!m) {
                error("233");
            }
            m.func((nm, _, fn) => fn({
                msto: sto[category.alias(m.cate) + nm].private[nm],
                gsto: sto[category.alias(m.cate) + nm].public,
            }));
        }
        */
        for (const [nm, m] of mod._.entries()) {
            const rawName = category.alias(m.cate) + nm;
            if (sto[rawName].on) {
                if (m.styl) GM_addStyle(m.styl);
                if (m.subfuncs) {
                    if (Array.isArray(m.migrlist)) {
                        for (const [snm, dir] of m.migrlist) {
                            if (sto[rawName][snm] !== datas[rawName].lvs[snm].dft) {
                                let curr = sto[rawName];
                                const tmpd = dir.slice(0, -1);
                                for (const et of tmpd) curr = curr[et];
                                curr[dir.lastElem()] = sto[rawName][snm];
                                sto[rawName][snm] = datas[rawName].lvs[snm].dft;
                            }
                        }
                    }
                    const handler = mod._regv2_invoker(m.path, sto[rawName]);
                    for (const e of m.subfuncs) {
                        log(`Executing "${e[1].name}" of "${nm}"`);
                        handler[e[0]](...e.slice(1));
                    }
                }
            }
        }
    },

    preload: () => {
        if (sto === null) sto = mod.fake_sto; // Hack: 替代方案，变量还是没法 export 后修改

        const pn = location.href;
        for (const [modName, m] of mod._.entries()) {
            if (sto[category.alias(m.cate) + modName].on && m.path.some((re) => new RegExp(re, "g").test(pn))) {
                m.willrun = true;
                mod._.set(modName, m);
            }
        }

        const oldConsoleInfo = console.info.bind({}); // Note: 拷贝一个 console.info 防止在 Violentmonkey 中的无限递归
        uindow.console.info = (...content) => {
            const event = oldConsoleInfo(...content);
            log(`info hooked: ${content.join(" ")}`);
            if (content[0] === "[@lfe/loader]") {
                for (const [modName, m] of mod._.entries()) {
                    if (sto[category.alias(m.cate) + modName].on && m.path.some((re) => new RegExp(re, "g").test(pn))) {
                        if ("lfe" in m) {
                            mod.execute(modName);
                            log(`loading lfe module: ${modName}`);
                        }
                    }
                }
            }
            return event;
        };
    },

    execute: (name) => {
        const exe = (m, named) => {
            if (!m) error(`Executing named mod but not found: "${name}"`);
            log(`Executing ${named ? "named " : ""}mod: "${m.name}"`);
            try {
                return m.func({ msto: sto[category.alias(m.cate) + m.name], named });
            } catch (err) {
                warn(err);
            }
        };
        if (name) {
            const m = mod.find(name);
            return exe({ name, ...m }, true);
        }

        for (const [modName, m] of mod._.entries()) {
            m.on = sto[category.alias(m.cate) + modName].on;
            if (m.willrun && !m.subfuncs) {
                if (exe({ name: modName, ...m }) === false) break;
            }
        }
    },
};

queues.onload.push(mod.execute);

export default mod;
