import mod from "../core.js"
import { $, cs_post } from "../utils.js"

mod.reg("captcha", "验证码自动填充", [ "@/auth/login", "@/discuss/.+", "@/image" ], null, () => {
    let img = $("img[data-v-3e1b4641],#verify_img")
    const autofill = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img[0].width
        canvas.height = img[0].height
        canvas.getContext("2d").drawImage(img[0], 0, 0)
        cs_post({
            url: "https://luogu-captcha-bypass.piterator.com/predict/",
            data: canvas.toDataURL("image/jpeg"),
            onload: (res) => {
                const input = $("input[placeholder$='验证码']")[0]
                input.value = res.responseText
                input.dispatchEvent(new Event("input"))
            }
        })
    }
    if (img.length) {  // /auth/login and /discuss/*
        img.click()
        img[0].onload = autofill
    }
    else {  // /image
        $(document).on("focus", "input[placeholder$='验证码']", () => {
            img = $("#--swal-image-hosting-upload-captcha")
            img[0].onload = autofill
        })
    }
})
