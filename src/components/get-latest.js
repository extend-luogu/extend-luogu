import {
    cs_get, version_cmp, log, error,
} from "../utils.js";
import compo from "../compo-core.js";

// Note: 移过来的时候顺便重构，共同抵制回调地狱。
const get_latest = compo.reg("get-latest", "获取最新版本", {
    fetch_preview: { ty: "boolean", dft: false, info: ["Update preview versions", "预览版更新"] },
}, null, ({ msto }) => new Promise((res, rej) => {
    cs_get({
        url: `https://api.github.com/repos/extend-luogu/extend-luogu/releases${msto.fetch_preview ? "?per_page=1" : "/latest"}`,
        onload: (resp) => {
            const
                tempVal = JSON.parse(resp.responseText),
                latest = (Array.isArray(tempVal) ? tempVal[0] : tempVal).tag_name,
                { version } = GM_info.script,
                op = version_cmp(version, latest);

            const l = `Comparing version: ${version} ${op} ${latest}`;
            log(l);
            res([latest, op]);
        },
        onerror: (err) => {
            error(err);
            rej(err);
        },
    });
}));

export default get_latest;
