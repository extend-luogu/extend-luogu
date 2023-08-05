import '@exlg/core/types/module-entry'

utils.mustMatch([/^\/discuss\/.*/, /^\/image/])

let img: JQuery<HTMLImageElement> = $('img[data-v-3e1b4641], #verify_img')

const autofill = async () => {
    if (!img.length) return

    const canvas = document.createElement('canvas')
    canvas.width = img.width()!
    canvas.height = img.height()!
    canvas.getContext('2d')?.drawImage(img[0], 0, 0)

    const input = $("input[placeholder$='验证码']")

    const res = (
        await utils.csPost(
            'https://luogu-captcha-bypass.piterator.com/predict/',
            canvas.toDataURL('image/jpeg'),
        )
    ).responseText
    log(res)
    input.val(res)
    input.trigger('input')
}

if (img) {
    // Note: 登陆和讨论
    img.trigger('click')
    img.on('load', autofill)
}
else {
    // Note: 图床
    $(document).on('focus', "input[placeholder$='验证码']", () => {
        img = $<HTMLImageElement>('#--swal-image-hosting-upload-captcha').on(
            'load',
            autofill,
        )
    })
}
