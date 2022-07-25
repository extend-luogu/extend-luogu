/* eslint-disable no-eval */
/* eslint-disable no-unused-vars */

const runtime = {
    storage: {
        get: (x) => eval(x),
        set: (x, y) => {
            // eslint-disable-next-line no-unused-expressions
            eval(x) === undefined
                ? eval(`var ${x} = ${y}`)
                : eval(`${x} = ${y}`)
        }
    }
}

const Schema = {
    boolean: () => {},
    object: () => {}
}

const { log } = console

const hookList = []
const hooker = new MutationObserver((records) => {
    const tmpNodeList = []
    records.forEach((record) => {
        record.addedNodes.forEach((addedNode) => tmpNodeList.push(addedNode))
    })
    hookList.forEach((hook) => hook(tmpNodeList))
})

const addHook = (hook) => {
    hookList.push(hook)
}

const addHookAndCallback = (hook, callback) => {
    addHook((insertedNodes) => {
        const hookedNodes = hook(insertedNodes)
        if (hookedNodes.length) callback(hookedNodes)
    })
}

const addHookSelector = (selector, callback) => {
    addHookAndCallback((insertedNodes) => {
        const hookedNodes = []
        insertedNodes.forEach((node) => {
            if ($(node).is(selector)) hookedNodes.push(node)
            hookedNodes.push(...$(node).find(selector).get())
        })
        return hookedNodes
    }, callback)
}

const utils = {
    mustMatch: (_urls) => {},
    csGet: (url) => {
        return fetch(
            url
                .replace('xn--fx-ex2c330n.ml', 'www.luogu.com.cn')
                .replace('fx白丝.ml', 'www.luogu.com.cn')
        ).then((resp) => resp.json())
    },
    addHookSelector
}

hooker.observe(document.body, { childList: true, subtree: true })
