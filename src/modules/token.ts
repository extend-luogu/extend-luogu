import mod from "../core.js";
import { cs_get2, cs_post, $ } from "../utils.js";

mod.reg_chore("token", "exlg 令牌", "10m", "@/.*", {
    token: { ty: "string", priv: true },
}, async ({ msto }) => {
    if (unsafeWindow._feInjection.currentUser) {
        if (msto.token) { // Note: token exists
            const ttl = (await cs_post(
                "https://exlg.piterator.com/token/ttl",
                {
                    uid: unsafeWindow._feInjection.currentUser.uid,
                    token: msto.token,
                },
            )).data;
            if ( // Note: Expires in more than 15 minutes
                ttl.status !== 401 && ttl.data >= 60 * 15
            ) return false;
        }
        const paste_id = (await cs_post(
            "https://www.luogu.com.cn/paste/new?_contentOnly",
            {
                data: (await cs_get2("https://exlg.piterator.com/token/generate")).data.data,
                public: true,
            },
            {
                "x-csrf-token": $("[name='csrf-token']").attr("content"),
                referer: "https://www.luogu.com.cn/paste",
            },
        )).data.id;
        msto.token = (await cs_get2(
            `https://exlg.piterator.com/token/verify/${paste_id}`,
        )).data.data.token;
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
