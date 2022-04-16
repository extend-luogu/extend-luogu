import mod from "../core.js";
import { cs_get2, cs_post, $ } from "../utils.js";

mod.reg_chore("token", "exlg 令牌", "1D", "@/.*", {
    token: { ty: "string", priv: true },
}, async ({ msto }) => {
    if (unsafeWindow._feInjection.currentUser) {
        if (msto.token) { // Note: token exists
            const ttl = JSON.parse((await cs_post({
                url: "https://exlg.piterator.com/token/ttl",
                data: JSON.stringify({
                    uid: unsafeWindow._feInjection.currentUser.uid,
                    token: msto.token,
                }),
                type: "application/json",
            })).responseText);
            if ( // Note: Expires in more than one day
                ttl.status !== 401 && ttl.data >= 60 * 60 * 25
            ) return false;
        }
        const paste_id = await cs_post(
            "https://www.luogu.com.cn/paste/new?_contentOnly",
            {
                data: await cs_get2("https://exlg.piterator.com/token/generate").data,
                public: true,
            },
            {
                "x-csrf-token": $("[name='csrf-token']").attr("content"),
                referer: "https://www.luogu.com.cn/paste",
            },
        ).data.id;
        msto.token = await cs_get2(
            `https://exlg.piterator.com/token/verify/${paste_id}`,
        ).data.data.token;
        await cs_post(
            `https://www.luogu.com.cn/paste/delete/${paste_id}?_contentOnly`,
            {},
            {
                "x-csrf-token": $("[name='csrf-token']").attr("content"),
                referer: "https://www.luogu.com.cn/paste",
            },
        );
    } else return true;
});
