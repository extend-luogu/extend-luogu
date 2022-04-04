import { log } from "./utils.js"

const compo = {
    _: new Map(),
    data: {},
    sto: null,

    reg: (name, info, data, func, styl) => {
        if (data)
            compo.data[name] = {
                ty: "object",
                lvs: data,
            }
        compo._.set(name, { info, func, styl })
        return (...args) => func(...((data ? [ compo.sto[name] ] : []).concat(args)))
    },

    ready: () => {
        for (const [ nm, co ] of compo._.entries()) {
            if (co.styl)
                GM_addStyle(co.styl)
            log(`Preparing component: ${nm}`)
        }
    }
}

export { compo as default }