const uindow = unsafeWindow

const log = (f, ...s) => uindow.console.log(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
const warn = (f, ...s) => uindow.console.warn(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
const error = (f, ...s) => {
    uindow.console.error(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
    throw Error(s.join(" "))
}

let lg_dat = null, lg_usr = null
if (location.host === "www.luogu.com.cn" && !/blog/g.test(location.href)) {
    if (/(\?|&)_contentOnly($|=)/g.test(location.search))
        error("Content-Only pages.")
    if (uindow._feInjection.code !== 200)
        error("Luogu failed to load. Exlg stops loading.")
    lg_dat = uindow._feInjection.currentData
    lg_usr = uindow._feInjection.currentUser
}

// ==Utilities==Libraries==

// [Ctrl][Shift][Alt] + Key
const toKeyCode = e => [
    e.ctrlKey ? "Ctrl" : "",
    e.shiftKey ? "Shift" : "",
    e.altKey ? "Alt" : "",
    e.key.toInitialCase()
].join("")

const $ = jQuery.extend({
    double: (func, first, second) => [func(first), func(second)]
})
jQuery.fn.extend({
    whenKey: function(a, b) {
        if (typeof a === "object") {
            this.on("keydown", e => {
                let y = a[toKeyCode(e)]
                y && y(e)
            })
        }
        else {
            this.on("keydown", e => {
                if (toKeyCode(e) === a)
                    b(e)
            })
        }
    }
})

const xss = new filterXSS.FilterXSS({
    onTagAttr: (_, k, v) => {
        if (k === "style") return `${k}="${v}"`
    }
})
// const mdp = uindow.markdownPalettes

// ==Utilities==Extensions==

Date.prototype.format = function (f, UTC) {
    UTC = UTC ? "UTC" : ""
    const re = {
        "y+": this[`get${UTC}FullYear`](),
        "m+": this[`get${UTC}Month`]() + 1,
        "d+": this[`get${UTC}Date`](),
        "H+": this[`get${UTC}Hours`](),
        "M+": this[`get${UTC}Minutes`](),
        "S+": this[`get${UTC}Seconds`](),
        "s+": this[`get${UTC}Milliseconds`]()
    }
    for (const r in re) if (RegExp(`(${r})`).test(f))
        f = f.replace(RegExp.$1,
            ("000" + re[r]).substr(re[r].toString().length + 3 - RegExp.$1.length)
        )
    return f
}

String.prototype.toInitialCase = function () {
    return this[0].toUpperCase() + this.slice(1)
}

Array.prototype.lastElem = function () {
    return this[this.length-1]
}

// ==Utilities==Functions==

const version_cmp = (v1, v2) => {
    if (! v1) return "<<"

    const op = (x1, x2) => x1 === x2 ? "==" : x1 < x2 ? "<<" : ">>"
    const exs = [ "pre", "alpha", "beta" ]

    const [ [ n1, e1 ], [ n2, e2 ] ] = [ v1, v2 ].map(v => v.split(" "))
    if (n1 === n2) return op(...[ e1, e2 ].map(e => e ? exs.findIndex(ex => ex === e) : Infinity))

    const [ m1, m2 ] = [ n1, n2 ].map(n => n.split("."))
    for (const [ k2, m ] of m1.entries())
        if (m !== m2[k2]) return op(+ m || 0, + m2[k2] || 0)
}

const springboard = (param, styl) => {
    const q = new URLSearchParams(); for (let k in param) q.set(k, param[k])
    const $sb = $(`
        <iframe id="exlg-${param.type}" src=" https://www.bilibili.com/robots.txt?${q}" style="${styl}" exlg="exlg"></iframe>
    `)
    log("Building springboard: %o", $sb[0])
    return $sb
}

const cs_get = ({url, onload, onerror = err => error(err)}) => GM_xmlhttpRequest({
    url: url,
    method: "GET",
    onload: onload,
    onerror: onerror
})

const cs_post = ({url, data, onload, onerror = err => error(err)}) => GM_xmlhttpRequest({
    url: url,
    method: "POST",
    data: data,
    onload: onload,
    onerror: onerror
})

const get_latest = callbackfn => {
    cs_get({
        url: "https://api.github.com/repos/extend-luogu/extend-luogu/tags?per_page=1",
        onload: resp => {
            const
                latest = JSON.parse(resp.responseText)[0].name,
                version = GM_info.script.version,
                op = version_cmp(version, latest)

            const l = `Comparing version: ${version} ${op} ${latest}`
            log(l)

            callbackfn && callbackfn(latest, op)
        }
    })
}

const cur_time = (ratio = 1) => {
    let d = new Date()
    return ~~(d.getTime() / ratio)
}

const lg_content = url => new Promise((res, rej) =>
    $.get(url + (url.includes("?") ? "&" : "?") + "_contentOnly=1", data => {
        if (data.code !== 200) rej(`Requesting failure code: ${ res.code }.`)
        res(data)
    })
)
/*
const exlg_alert_onaction = uindow.show_alert ? () => true : () => {
    if (! ` ${document.body.className.split(' ')} `.includes("lg-alert-built")) {
        $(document.head).append($(`<link rel="stylesheet" href="https://cdn.luogu.com.cn/css/amazeui.min.css">`))
        $(`<div class="am-modal am-modal-alert am-modal-out" tabindex="-1" id="exlg-alert" style="display: none; margin-top: -40px;">
            <div class="am-modal-dialog">
                <div class="am-modal-hd" id="exlg-alert-title"></div>
                <div class="am-modal-bd" id="exlg-alert-message"></div>
                <div class="am-modal-footer">
                    <span class="am-modal-btn">确定</span>
                </div>
            </div></div>`).appendTo($(document.body))
        $(document.body).addClass("lg-alert-built")
        return false
        // Note: 阅读 Amaze UI 源码得出搞法
    }
    return true
}
*/
const lg_alert = uindow.show_alert
    ? (msg, title = "exlg 提醒您") => uindow.show_alert(title, msg)
    : (msg, title = "exlg 提醒您") => uindow.alert(title + "\n" + msg)

let csrf_token = null
const lg_post = (url, data) => $.ajax({
    url: url,
    data: data,
    headers: {
        "x-csrf-token": (csrf_token === null)?
            (csrf_token = $("meta[name=csrf-token]").attr("content")) : csrf_token,
        "content-type":"application/json"
    },
    method: "post",
})

const judge_problem = text => [
    /^AT[1-9][0-9]{0,}$/i,
    /^CF[1-9][0-9]{0,}[A-Z][0-9]?$/i,
    /^SP[1-9][0-9]{0,}$/i,
    /^P[1-9][0-9]{3,}$/i,
    /^UVA[1-9][0-9]{2,}$/i,
    /^U[1-9][0-9]{0,}$/i,
    /^T[1-9][0-9]{0,}$/i,
    /^B[2-9][0-9]{3,}$/i
].some(re => re.test(text))

const exlg_dialog_board = {
    _ac_func: null,
    wrapper: null,
    container: null,
    wait_time: null,
    header: null,
    content: null,
    autoquit: true,
    show_dialog() {
        this.wrapper.css("display", "flex")
        setTimeout(() => {
            this.container.removeClass("container-hide")
            this.container.addClass("container-show")
        }, 50)
    },
    hide_dialog() {
        this.container.addClass("container-hide")
        this.container.removeClass("container-show")
        setTimeout(() => this.wrapper.hide(), this.wait_time)
        // header.innerHTML = "&nbsp;"
        // content.innerHTML = ""
    },
    accept_dialog() {
        this._ac_func(this.hide_dialog)
        if (this.autoquit) {
            this.hide_dialog()
        }
    },
    show_exlg_alert(text = "", title = "exlg 提醒您", onaccepted = () => {}, autoquit = true) {
        this.autoquit = autoquit
        this._ac_func = onaccepted
        this.header.text(title)
        this.content.html(text)
        this.show_dialog()
    },
}
const exlg_alert = (...arg) => exlg_dialog_board.show_exlg_alert(...arg)

// Note: 它坏了
const register_badge = async () => {
    const parse_badge = (href, func_quit) => cs_get({
        url: href,
        onload: res => {
            let fres = -1
            const e = res.response
            const _operations = [
                {
                    errorcode: 0,
                    message: `"Succeed in creating a new badge!"`,
                    ontitle: "[exlg] 成功创建 badge",
                    onlog: "Successfully created a badge!"
                },
                {
                    errorcode: 1,
                    message: `"Wrong active code!"`,
                    ontitle: "无效激活码",
                    onlog: "Illegal Active Code"
                },
                {
                    errorcode: 2,
                    message: `"Sorry, but the active code has been used!"`,
                    ontitle: "激活码已被使用",
                    onlog: "Expired Active Code"
                },
                {
                    errorcode: 3,
                    message: `"Something went wrong!"`,
                    ontitle: "非法的 badge 内容",
                    onlog: "Illegal Badge Text"
                },
                {
                    errorcode: -1,
                    message: `Fuck CCF up`,
                    ontitle: "未知错误",
                    onlog: "注册 exlg-badge 时出现未知错误, 请联系开发人员"
                },
            ]
            _operations.forEach(f => {
                if(fres !== -1) return
                console.log(e === f.message, f.errorcode === -1, f)
                if (e === f.message || f.errorcode === -1) {
                    fres = f.errorcode
                    $("#exlg-dialog-title").html(f.errorcode ? `[Error] ${f.ontitle}` : f.ontitle)
                    log(f.errorcode ? `Illegal Operation in registering badge: ${f.onlog}(#${f.errorcode})` : f.onlog)
                    if(fres === -1 || ! fres) {
                        func_quit()
                        setTimeout(() => exlg_alert("badge 注册成功!", "exlg 提醒您"), 400)
                        return
                    }
                }
            })
        }
    })
    const title_text = "exlg badge 注册器 ver.5.0"
    exlg_alert(`<div class="exlg-update-log-text exlg-unselectable exlg-badge-page" style="font-family: Consolas;">
    <div style="text-align: center">
        <div style="display:inline-block;text-align: left;padding-top: 10px;">
            <div style="margin: 5px;"><span style="height: 1.5em;float: left;padding: .1em;width: 5em;">用户uid</span><input exlg-badge-register type="text" style="padding: .1em;" class="am-form-field exlg-badge-input" placeholder="填写用户名或uid" name="username"></div>
            <div style="margin: 5px;"><span style="height: 1.5em;float: left;padding: .1em;width: 5em;">激活码</span><input exlg-badge-register type="text" style="padding: .1em;" class="am-form-field exlg-badge-input" placeholder="您获取的激活码" name="username"></div>
            <div style="margin: 5px;margin-bottom: 20px;"><span style="height: 1.5em;float: left;padding: .1em;width: 5em;">badge</span><input exlg-badge-register type="text" style="margin-bottom: 10px;padding: .1em;" class="am-form-field exlg-badge-input" placeholder="您想要的badge" name="username"></div>
        </div>
        <br>
        <small>Powered by <s>Amaze UI</s> 自行研发，去他妈的 Amaze UI</small>
    </div>
</div>
    `, title_text, (func_quit) => {
        const $board = $("#exlg-container"), $input =$board.find("input"), $title = $board.find("#exlg-dialog-title")
        if (lg_usr?.uid && ! $input[0].value)
            $input[0].value = lg_usr.uid
        if (! ($input[0].value && $input[1].value && $input[2].value)) {
            $title.html("[Err] 请检查信息是否填写完整")
            setTimeout(() => $title.html(title_text), 1500)
            return
        }
        $.get("/api/user/search?keyword=" + $input[0].value, res => {
            if (! res.users[0]) {
                $title.html("[Err] 无法找到指定用户")
                setTimeout(() => $title.html(title_text), 1500)
            }
            else {
                $input[0].value = res.users[0].uid
                const badge_href = `https://service-cmrlfv7t-1305163805.sh.apigw.tencentcs.com/release/${$input[1].value}/${$input[0].value}/${$input[2].value}/`
                parse_badge(badge_href, func_quit)
            }
        })
    }, false)/*
    const $board = $("#exlg-alert, #lg-alert")
    const $btn = $board.find(".am-modal-btn")
    // Note: 重构一次，Date = 20211127 Time = 21:10
    const $cancel = $btn.clone().text("取消")
    const $submit = $btn.clone().text("确定").off("click")
    const $title = $("#exlg-alert-title, #lg-alert-title").on("click", () => $title.html(title_text)).addClass("exlg-unselectable")
    const $dimmer = $(".am-dimmer")
    console.log($board, $cancel, $submit, $dimmer, $title, $btn)
    const clear_foot = () => setTimeout(() => {
        console.log("tried to clear foot!")
        $cancel.remove()
        $submit.remove()
        $title.off("click").removeClass("exlg-unselectable")
        $dimmer.off("click")
        $btn.show()
    }, 200)
    if (uindow.show_alert)
        $(".am-dimmer").on("click", () => {
            clear_foot()
        })
    else
        $(".am-dimmer").off("click").on("click", () => {
            console.log("get dimmered.", $btn)
            $btn.click()
            clear_foot()
        })
    $btn.css("cssText", "display: none!important;")
    $cancel.on("click", () => {
        $btn.click()
        clear_foot()
    })
        .appendTo($btn.parent())
    $submit.on("click", ).appendTo($btn.parent())*/
}

export {
    uindow as default, log, warn, error, xss, version_cmp, cur_time,
    lg_dat, lg_usr, lg_content, lg_alert, lg_post, cs_get, cs_post, springboard, $,
    judge_problem, register_badge, get_latest, exlg_dialog_board, exlg_alert
}