import mod from "../core.js"
import { cs_get2, cs_post, $ } from "../utils.js"

mod.reg_chore("token", "EXLG 令牌", "1D", "@/.*", {
    token: { ty: "string", priv: true }
}, async ({ msto }) => {
// mod.reg("token", "EXLG 令牌", "@/", null, async () => {
    console.log(unsafeWindow)
    if (unsafeWindow._feInjection.currentUser) {
        const paste_id = JSON.parse((await cs_post({
            url: "https://www.luogu.com.cn/paste/new?_contentOnly",
            data: JSON.stringify({
                data: JSON.parse((await cs_get2(
                    "https://exlg.piterator.com/token/generate/"
                )).responseText),
                public: true
            }),
            type: "application/json",
            header: {
                "x-csrf-token": $("[name='csrf-token']").attr("content"),
                "referer": "https://www.luogu.com.cn/paste"
            }
        })).responseText).id
        msto.token = JSON.parse((await cs_post({
            url: "https://exlg.piterator.com/token/verify/",
            data: JSON.stringify(paste_id),
            type: "application/json"
        })).responseText).token
        await cs_post({
            url: `https://www.luogu.com.cn/paste/delete/${paste_id}?_contentOnly`,
            header: {
                "x-csrf-token": $("[name='csrf-token']").attr("content"),
                "referer": "https://www.luogu.com.cn/paste"
            }
        })
    }
    else return true
})
