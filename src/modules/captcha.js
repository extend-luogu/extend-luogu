import mod from "../core.js"
import { $, cs_post } from "../utils.js"

mod.reg("captcha", "验证码自动填充", ["@/auth/login", "@/discuss/.+"], {
    enable: { ty: "boolean", dft: true, info: ["Enable captcha auto fill", "启用验证码自动填充"] }
}, ({ msto }) => {
    if (msto.enable) {
        const img = $("img[data-v-3e1b4641],#verify_img")
        img.click()
        img[0].onload = () => {
            $("input[placeholder$='验证码']").attr("placeholder", "将自动填写").attr("disabled", "")
            const canvas = document.createElement("canvas")
            canvas.width = img[0].width
            canvas.height = img[0].height
            canvas.getContext("2d").drawImage(img[0], 0, 0)
            let filled = false
            $(".CodeMirror-wrap").on("input", () => {
                if (filled) return
                $("input[placeholder$='将自动填写']").removeAttr("disabled")
                cs_post({
                    url: "https://luogu-captcha-bypass.piterator.com/predict/",
                    data: canvas.toDataURL("image/jpeg"),
                    onload: (res) => {
                        const input = $("input[placeholder$='将自动填写']")[0]
                        input.value = res.responseText
                        input.dispatchEvent(new Event("input"))
                    }
                })
                filled = true
            })
        }
    }
})
