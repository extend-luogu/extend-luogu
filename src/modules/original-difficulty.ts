import mod from "../core.js";
import {
    $, error, lg_dat, cs_get,
} from "../utils.js";

mod.reg_v2("module/original-difficulty", "原始难度", "@/problem/[A-Z0-9]+(#.*)?", {
    cf_src: {
        ty: "enum", dft: "codeforces.com", vals: ["codeforces.com", "codeforces.ml", "codeforc.es"], info: [
            "Codeforces problem source", "CF 题目源",
        ], migration: true,
    },
    atdiff: { ty: "string", priv: true },
}, (handler) => {
    handler.chore({
        name: "atdiff-fetch",
        info: "获取 AtCoder 难度",
        period: "10D",
    }, null, ({ gsto }) => {
        const dif = {};
        cs_get({
            url: "https://kenkoooo.com/atcoder/resources/problem-models.json",
            onload: (res) => {
                const rdif = JSON.parse(res.responseText);
                for (const ky in rdif) { dif[ky] = rdif[ky].difficulty; }
                gsto.atdiff = JSON.stringify(dif);
            },
        });
    });

    let dif = null;
    handler.preload({
        name: "load-difficulty",
        info: "加载原始难度",
    }, null, ({ gsto }) => dif = new Promise((resolve, reject) => {
        const pn = location.pathname.match(/(CF|AT)([0-9]|[A-Z])*$/g)[0].substring(2);
        if (location.pathname.includes("CF")) {
            const pid = pn.match(/^[0-9]*/g)[0],
                ops = pn.substring(pid.length);
            cs_get({
                url: `https://${gsto.cf_src}/problemset/problem/${pid}/${ops}`,
                onload: (res) => {
                    const rv = $(res.responseText).find("span[title=Difficulty]").text().trim();
                    resolve(rv ? rv.substring(1) : null);
                },
                onerror: (err) => {
                    error(err);
                    reject(err);
                },
            });
        } else {
            const atdif = JSON.parse(gsto.atdiff);
            const pid = lg_dat.problem.description.match(/^.{22}[-./A-Za-z0-9_]*/g)[0].match(/[^/]*$/g)[0];
            if (pid in atdif) {
                resolve(Math.round(atdif[pid] >= 400 ? atdif[pid] : 400 / Math.exp(1.0 - atdif[pid] / 400)));
            } else {
                resolve(null);
            }
        }
    }));

    let lastHookedUrl = ""; // Note: 写成 url 避免傻逼洛谷切页面不刷新
    handler.hook({
        name: "difficulty-display",
        info: "显示原始难度",
    }, null, ({ result, target }) => {
        if (!result) return;
        const $tar = $(target[3]),
            $y = $tar.clone(true);
        $tar.after($y);
        const [$title, $status] = $y.find("span").get().map((e) => $(e));
        $title.text("原始难度");
        $status.text("获取中");
        dif.then((d) => $status.text(d ?? "不可用"));
    }, (e) => {
        if (lastHookedUrl === location.href) {
            return false;
        }
        const tmp = e.target.querySelectorAll && e.target.querySelectorAll("div.stat > div.field");
        if (tmp?.length > 0) {
            lastHookedUrl = location.href;
            return {
                result: true,
                target: tmp,
            };
        }
        return { result: false };
    });
});
