import '@exlg/core/types/module-entry'

utils.mustMatch([/^\/user\/\d+$/])

const func = (args: JQuery<HTMLElement>) => {
    const isMainPage: boolean = ['', 'main'].includes(window.location.hash)
    if (isMainPage) {
        args.prev().remove()
        args.show()
    }
}

utils.addHookSelector('.introduction.marked', ({ hookedNodes }) => {
    hookedNodes.forEach((node) => {
        if (node.nodeType === node.ELEMENT_NODE) {
            func($(node as HTMLElement))
        }
    })
})
