import mod from "../core.js";
import {
    $, lg_usr, hookSelector,
} from "../utils.js";
import exlgAlert from "../components/exlg-dialog-board.js";
import css from "../resources/css/juan-inspector.css";

mod.reg_v2({
    name: "juan-inspector",
    info: "卷王监视器",
    path: "@/",
    cate: "module",
}, {
    lastFetched: { ty: "string", dft: "[]", priv: true },
}, (handler) => {
    handler.hook({
        name: "login-hooker",
        info: "签到 Hook",
    }, {}, ({ gsto, args }) => {
        $(args).on("click", async () => {
            const { users } = await $.get(`/api/user/followings?user=${lg_usr.uid}`),
                { result, perPage } = users,
                pmList = [];
            let count = users.count - perPage;
            for (let pid = 2; count > 0; pid++, count -= perPage) {
                pmList.push((async () => result.push(...(await $.get(`/api/user/followings?user=${lg_usr.uid}&page=${pid}`)).users.result))());
            }
            await Promise.all(pmList);

            const uidMap = new Map();
            result.forEach(({ uid, name, passedProblemCount }, i, x) => {
                x[i] = [uid, passedProblemCount];
                uidMap.set(uid, name);
            });
            result.sort((a, b) => a[0] - b[0]);
            const origCnt = JSON.parse(gsto.lastFetched),
                juans = [];
            gsto.lastFetched = JSON.stringify(result);

            let i = 0,
                j = 0;
            while (i < result.length && j < origCnt.length) {
                if (result[i][0] === origCnt[j][0]) {
                    juans.push([result[i][0], result[i][1] - origCnt[j][1]]);
                    i++; j++;
                } else if (result[i][0] > origCnt[j][0]) {
                    j++;
                } else {
                    i++;
                }
            }
            juans.sort((a, b) => b[1] - a[1]);

            if (juans.length) {
                exlgAlert(`<p>从上一次打卡到现在，关注用户中卷题量前三为：</p>
                <ol style="margin: 0 25% 0 15%;">
                    ${juans.slice(0, 3).map(([uid, cnt]) => `<li class="juan-rnkitm"><span><a href="/user/${uid}">${uidMap.get(uid)}</a><span>${cnt} 道</span></span></li>`).join("")}
                </ol>`);
            }
        });
    }, hookSelector("a[title=hello]"));
}, css);
