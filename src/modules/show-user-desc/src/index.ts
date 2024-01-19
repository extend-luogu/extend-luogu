import '@exlg/core/types/module-entry'

utils.mustMatch([/^\/user\/\d+$/])

const func = (args: JQuery<HTMLElement>) => {
    const isMainPage = ['', 'main'].includes(window.location.hash)
    const isHidden = !args.prev().is('h3')
    if (isMainPage && isHidden) {
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
