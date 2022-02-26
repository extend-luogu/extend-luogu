import uindow, { $, log, error, xss, springboard, version_cmp, lg_alert, lg_content, register_badge } from "./utils.js"
import mod from "./core.js"

log("Exposing")

Object.assign(uindow, {
    exlg: {
        mod,
        log, error,
        springboard, version_cmp,
        lg_alert, lg_content, register_badge,
        TM_dat: {
            reload_dat: () => {
                raw_dat = null
                return load_dat(mod.data, {
                    map: s => {
                        s.root = ! s.rec
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
        mod.fake_sto = uindow.exlg.TM_dat.sto = uindow.exlg.TM_dat.reload_dat()
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
init_sto(1)