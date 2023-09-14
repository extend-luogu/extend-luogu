import '@exlg/core/types/module-entry'

utils.mustMatch([/^\/discuss\/.*/, /^\/image/])

const autofill = async (e: JQuery.TriggeredEvent) => {
    const img = $(e.target)
    console.log(e.target)
    if (!img.length) return

    const canvas = document.createElement('canvas')
    canvas.width = img.width()!
    canvas.height = img.height()!
    canvas.getContext('2d')?.drawImage(img[0], 0, 0)

    const input = $("input[placeholder$='右侧图形验证码']")

    const res = (
        await utils.csPost(
            'https://luogu-captcha-bypass.piterator.com/predict/',
            canvas.toDataURL('image/jpeg'),
        )
    ).responseText
    log(res)
    input.val(res)
    input[0].dispatchEvent(new UIEvent('input'))
}

utils.addHookAndCallback((insertedNodes) => {
    let hookedNodes: Node[] = []
    insertedNodes.forEach((e) => {
        const $div = $(e).find('div[placeholder=右侧图形验证码]')
        const img = $div[0]?.nextElementSibling?.firstChild
        if (img) hookedNodes.push(img)
    })
    hookedNodes = Array.from(new Set(hookedNodes))
    return { hookedNodes }
}, async ({ hookedNodes, info }) => {
    hookedNodes.forEach((e) => {
        const $img = $(e as HTMLImageElement)
        $img.trigger('click')
        $img.on('load', autofill)
    })
})
