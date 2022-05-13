interface GMWindow extends Window {
    console: Console;
    _feInjection: any;
    show_alert: (title: string, message: string) => void;
}

const uindow: GMWindow = unsafeWindow as any;
export default uindow;

export function chain<T>(res: Promise<T>): Promise<T> & T {
    return new Proxy<any>(res, {
        get(target, prop) {
            if (prop === "then") {
                return (cb) => {
                    target.then(cb);
                    return chain(target);
                };
            }
            return chain(target.then((r) => r[prop]));
        },
    });
}

export const log = (f: string, ...s) => uindow.console.log(`%c[exlg] ${f}`, "color: #0e90d2;", ...s);
export const warn = (f: string, ...s) => uindow.console.warn(`%c[exlg] ${f}`, "color: #0e90d2;", ...s);
export const error = (f: string, ...s) => {
    uindow.console.error(`%c[exlg] ${f}`, "color: #0e90d2;", ...s);
    throw Error(s.join(" "));
};

export let lg_dat; // eslint-disable-line import/no-mutable-exports
export let lg_usr; // eslint-disable-line import/no-mutable-exports
if (location.host === "www.luogu.com.cn" && !/blog/g.test(location.href)) {
    if (/(\?|&)_contentOnly($|=)/g.test(location.search)) error("Content-Only pages.");
    if (uindow._feInjection.code !== 200) error("Luogu failed to load. Exlg stops loading.");
    lg_dat = uindow._feInjection.currentData;
    lg_usr = uindow._feInjection.currentUser;
}

// ==Utilities==Libraries==

// [Ctrl][Shift][Alt] + Key
export const toKeyCode = (e: KeyboardEvent) => [
    e.ctrlKey ? "Ctrl" : "",
    e.shiftKey ? "Shift" : "",
    e.altKey ? "Alt" : "",
    e.key.toInitialCase(),
].join("");

export const $ = jQuery.extend({
    double: (func, first, second) => [func(first), func(second)],
});
jQuery.fn.extend({
    whenKey(a, b) {
        if (typeof a === "object") {
            this.on("keydown", (e) => {
                const y = a[toKeyCode(e)];
                if (y) y(e);
            });
        } else {
            this.on("keydown", (e) => {
                if (toKeyCode(e) === a) b(e);
            });
        }
    },
});

export const xss = new filterXSS.FilterXSS({
    onTagAttr: (_, k, v) => {
        if (k === "style") return `${k}="${v}"`;
    },
});
// const mdp = uindow.markdownPalettes

// ==Utilities==Extensions==

declare global {
    interface Date {
        format: (f: string, UTC: boolean) => string;
    }
    interface String {
        toInitialCase: () => string;
    }
}

Date.prototype.format = function (f: string, isUTC: boolean): string {
    const UTC = isUTC ? "UTC" : "";
    const re = {
        "y+": this[`get${UTC}FullYear`](),
        "m+": this[`get${UTC}Month`]() + 1,
        "d+": this[`get${UTC}Date`](),
        "H+": this[`get${UTC}Hours`](),
        "M+": this[`get${UTC}Minutes`](),
        "S+": this[`get${UTC}Seconds`](),
        "s+": this[`get${UTC}Milliseconds`](),
    };
    for (const r in re) {
        if (RegExp(`(${r})`).test(f)) {
            f = f.replace(
                RegExp.$1,
                (`000${re[r]}`).substr(re[r].toString().length + 3 - RegExp.$1.length),
            );
        }
    }
    return f;
};

String.prototype.toInitialCase = function (): string {
    return this[0].toUpperCase() + this.slice(1);
};

// Hack: 下面几行留着污染 prototype chain 会导致无法修改博客背景，原因不明。
/*
Array.prototype.lastElem = function () {
    return this[this.length - 1];
};
*/
// Hack: 5ab 我操你妈。

// ==Utilities==Functions==

export const sleep = (t: number): Promise<void> => new Promise(res => setTimeout(res, t));

export const version_cmp = (v1: string, v2: string) => {
    if (!v1) return "<<";

    const op = (x1, x2) => (x1 === x2 ? "==" : x1 < x2 ? "<<" : ">>");
    const exs = ["pre", "alpha", "beta"];

    const [[n1, e1], [n2, e2]] = [v1, v2].map((v) => v.split("-"));

    const [m1, m2] = (n1 === n2)
        ? [e1, e2].map((e) => [e ? exs.findIndex((ex) => e.startsWith(ex)) : Infinity, e?.match(/[0-9]+$/g)?.[0] ?? Infinity])
        : [n1, n2].map((n) => n.split("."));

    for (const [k2, m] of m1.entries()) if (m !== m2[k2]) return op(+m || 0, +m2[k2] || 0);
    return "==";
};

export const springboard = (param: Record<string, string>, styl: string) => {
    const q = new URLSearchParams(); for (const k in param) q.set(k, param[k]);
    const $sb = $(`
        <iframe id="exlg-${param.type}" src=" https://www.bilibili.com/robots.txt?${q}" style="${styl}" exlg="exlg"></iframe>
    `);
    log("Building springboard: %o", $sb[0]);
    return $sb;
};

export const cs_get = ({ url, onload, onerror = (err) => error(err) }: Partial<Parameters<typeof GM_xmlhttpRequest>[0]>) => GM_xmlhttpRequest({
    url,
    method: "GET",
    onload,
    onerror,
});

// Note: cs_get 的 Promise 版本
export const cs_get2 = (url: string, headers = {}): any => {
    const res = new Promise((resolve, onerror) => {
        GM_xmlhttpRequest({
            url,
            method: "GET",
            headers,
            onload: (r: any) => {
                try {
                    r.data = JSON.parse(r.responseText);
                } catch (e) { } // eslint-disable-line no-empty
                resolve(r);
            },
            onerror,
        });
    });
    return chain(res);
};

export const cs_post = (url: string, data: any, header = {}, type = "application/json"): any => {
    const res = new Promise((resolve, onerror) => {
        GM_xmlhttpRequest({
            url,
            method: "POST",
            data: typeof data !== "string" ? JSON.stringify(data) : data,
            headers: { "Content-Type": typeof data === "string" ? type : "application/json", ...header },
            onload: (r: any) => {
                try {
                    r.data = JSON.parse(r.responseText);
                } catch (e) { } // eslint-disable-line no-empty
                resolve(r);
            },
            onerror,
        });
    });
    return chain(res);
};

export const cur_time = (ratio = 1000) => Math.floor(Date.now() / ratio);

export const lg_content = (url: string): any => new Promise((res, rej) => {
    $.get(`${url + (url.includes("?") ? "&" : "?")}_contentOnly=1`, (data) => {
        if (data.code !== 200) rej(new Error(`Requesting failure code: ${data.code}.`));
        res(data);
    });
});

export const lg_alert = (msg: string, title = "exlg 提醒您"): void => (uindow.show_alert
    ? uindow.show_alert(title, msg)
    : uindow.alert(`${title}\n${msg}`));

let csrf_token = null;
export const lg_post = (url: string, data: any) => $.ajax({
    url,
    data,
    headers: {
        "x-csrf-token": (csrf_token === null) ?
            (csrf_token = $("meta[name=csrf-token]").attr("content")) : csrf_token,
        "content-type": "application/json",
    },
    method: "post",
});

export const judge_problem = (text: string) => [
    /^AT[1-9][0-9]{0,}$/i,
    /^CF[1-9][0-9]{0,}[A-Z][0-9]?$/i,
    /^SP[1-9][0-9]{0,}$/i,
    /^P[1-9][0-9]{3,}$/i,
    /^UVA[1-9][0-9]{2,}$/i,
    /^U[1-9][0-9]{0,}$/i,
    /^T[1-9][0-9]{0,}$/i,
    /^B[2-9][0-9]{3,}$/i,
].some((re) => re.test(text));

export const tupledft_gen = (arr: any[], op: any) => arr.map((e) => ({ dft: e, ...op }));

/** 生成一个 hook 函数，钩取满足特定 selector 的元素。 */
export const hookSelector = (selector: string): Function => (e) => {
    const tmp = e.target.querySelectorAll(selector);
    return {
        result: Boolean(tmp?.length),
        args: tmp,
    };
};
