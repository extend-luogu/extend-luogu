import mod from "../core.js"
import { $, cs_post } from "../utils.js"

mod.reg("captcha", "验证码自动填充", ["@/auth/login", "@/discuss/.+"], null, () => {
    const img = $("img[data-v-3e1b4641],#verify_img")
    img.click()
    img[0].onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img[0].width
        canvas.height = img[0].height
        canvas.getContext("2d").drawImage(img[0], 0, 0)
        cs_post({
            url: "https://luogu-captcha-bypass.piterator.com/predict/",
            data: canvas.toDataURL("image/jpeg"),
            onload: (res) => {
                const input = $("input[placeholder='右侧图形验证码'],#editor")[0]
                input.value = res.responseText
                input.dispatchEvent(new Event("input"))
            }
        })
    }
})
