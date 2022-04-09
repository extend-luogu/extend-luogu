import mod from "../core.js"
import { cs_get2, cs_post, $ } from "../utils.js"

mod.reg_chore("token", "EXLG 令牌", "1D", "@/.*", {
    token: { ty: "string", priv: true }
}, async ({ msto }) => {
    if (unsafeWindow._feInjection.currentUser) {
        if (msto.token) { // Note: token exists
            const ttl = await cs_post({
                url: "https://exlg.piterator.com/token/ttl/",
                data: JSON.stringify({
                    uid: unsafeWindow._feInjection.currentUser.uid,
                    token: msto.token,
                }),
                type: "application/json",
            })
            if ( // Note: Expires in more than one day
                ttl.status !== 401 && JSON.parse(ttl.responseText) >= 60 * 60 * 25
            )
                return false
        }
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
