import uindow, { $, log, warn, error, xss, springboard, version_cmp, lg_alert, lg_content, lg_post } from "./utils.js"
import register_badge from "./components/register-badge.js"
import mod from "./core.js"
import compo from "./compo-core.js"
import { datas } from "./storage.js"

log("Exposing")

Object.assign(uindow, {
    exlg: {
        mod, compo, datas,
        log, error,
        springboard, version_cmp,
        lg_alert, lg_content, register_badge, lg_post,
        TM_dat: {
            reload_dat: sch => {
                raw_dat = null
                return load_dat(sch, {
                    map: s => {
                        s.root = !s.rec
                        s.itmRoot = s.rec === 2
                    }
                })
            },
            type_dat, proxy_dat, load_dat, save_dat, clear_dat, raw_dat
        }
    },
    GM: {
        GM_info, GM_addStyle, GM_setClipboard, GM_xmlhttpRequest,
        GM_getValue, GM_setValue, GM_deleteValue, GM_listValues
    },
    $$: $, xss, marked
})

const init_sto = chance => {
    try {
        uindow.exlg.TM_dat.sto = uindow.exlg.TM_dat.reload_dat(datas)
        mod.fake_sto = compo.sto = uindow.exlg.TM_dat.sto
    }
    catch(err) {
        if (chance) {
            lg_alert("存储代理加载失败，清存重试中……")
            clear_dat()
            init_sto(chance - 1)
        }
        else {
            lg_alert("失败次数过多，自闭中。这里建议联系开发人员呢。")
            throw err
        }
    }
}
try {
    init_sto(1)
}
catch(err) {
    warn(err)
    const dftsto = rt => {
        switch (rt.ty) {
        case "number":
        case "string":
        case "boolean":
            return rt.dft

        case "object":
            return dftsto(rt.lvs)

        case "enum":
            return rt.get === "id" ? rt.vals[rt.dft] : rt.dft

        case "array":
            return []

        case "tuple":
            return rt.lvs.map(dftsto)
        }
        return Object.fromEntries(
            Object.entries(rt)
                .map(([ a, b ]) => ([ a, dftsto(b) ]))
        )
    }
    mod.fake_sto = compo.sto = dftsto(datas)
}

// Note: Migrate settings: hide-solution.hidesolu -> hide-solution.on
// uindow.exlg.TM_dat.sto["hide-solution"].on &= uindow.exlg.TM_dat.sto["hide-solution"].hidesolu