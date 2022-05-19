import { ProxyData, TamperMonkeyAccess } from "proxy-dat";
import uindow, {
    $, log, error, xss, springboard, version_cmp, lg_alert, lg_content, lg_post,
} from "./utils.js";
import register_badge from "./components/register-badge.js";
import exlg_alert from "./components/exlg-dialog-board.js";
import mod from "./core.js";
import compo from "./compo-core.js";
import queues from "./run-queue.js";
import { scm } from "./schema.js";

log("Exposing");

const pd = new ProxyData();
const sto = pd.loadData(scm, {
    access: TamperMonkeyAccess(),
    map: (s) => {
        s.root = !s.rec;
        s.itmRoot = s.rec === 2;
    },
});
mod.fake_sto = compo.sto = sto;

Object.assign(uindow, {
    exlg: {
        mod, compo, scm,
        log, error, queues,
        springboard, version_cmp,
        lg_alert, lg_content, register_badge, lg_post, exlg_alert,
        xss,
        pd, sto,
    },
    GM: {
        GM_info, GM_addStyle, GM_setClipboard, GM_xmlhttpRequest,
        GM_getValue, GM_setValue, GM_deleteValue, GM_listValues,
    },
    $$: $,
});

// catch (err) {
//     warn(err);
//     const dftsto = (rt) => {
//         switch (rt.ty) {
//         case "number":
//         case "string":
//         case "boolean":
//             return rt.dft;
//
//         case "object":
//             return dftsto(rt.lvs);
//
//         case "enum":
//             return rt.get === "id" ? rt.vals[rt.dft] : rt.dft;
//
//         case "array":
//             return [];
//
//         case "tuple":
//             return rt.lvs.map(dftsto);
//         }
//         return Object.fromEntries(
//             Object.entries(rt)
//                 .map(([a, b]) => ([a, dftsto(b)])),
//         );
//     };
//     mod.fake_sto = compo.sto = dftsto(scm);
// }

// Note: Migrate settings: hide-solution.hidesolu -> hide-solution.on
// uindow.exlg.TM_dat.sto["hide-solution"].on &= uindow.exlg.TM_dat.sto["hide-solution"].hidesolu
