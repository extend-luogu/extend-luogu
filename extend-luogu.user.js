// ==UserScript==
// @name         extend-luogu
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  make the Luogu more powerful.
// @author       optimize_2 ForkKILLET
// @match        https://www.luogu.com.cn/*
// @grant        GM_addStyle
// @grant        unsafeWindow
// @require      https://cdn.luogu.com.cn/js/jquery-2.1.1.min.js
// ==/UserScript==

const $ = unsafeWindow.$ || jQuery, // Note: Use jQuery from LFE.
      mdp = unsafeWindow.markdownPalettes,
      error = s => console.error("[exlg]" + s), log = s => console.log("[exlg]" + s),
      add_style = window.GM_addStyle || window.PRO_addStyle || window.addStyle || error("`add_style` failed.")

const emo = [
    [ 62224, [ "qq" ] ],
    [ 62225, [ "cy" ] ],
    [ 62226, [ "kl", "kel" ] ],
    [ 62227, [ "kk" ] ],
    [ 62228, [ "dk" ] ],
    [ 62230, [ "xyx", "hj" ] ],
    [ 62234, [ "jk" ] ],
    [ 62236, [ "up", "+", "zan" ] ],
    [ 62238, [ "dn", "-", "cai" ] ],
    [ 62239, [ "ts" ] ],
    [ 62240, [ "yun" ] ],
    [ 62243, [ "yw", "?", "yiw" ] ],
    [ 62244, [ "se", "*" ] ],
    [ 62246, [ "px" ] ],
    [ 62248, [ "wq" ] ],
    [ 62250, [ "fd", "fad" ] ],
    [ 69020, [ "yl", "youl" ] ]
],
      emo_url = id => `https://cdn.luogu.com.cn/upload/pic/${ id }.png`

const init = () => {
    add_style(`
.mp-editor-ground.exlg-ext {
    top: 80px !important;
}
.mp-editor-menu > br ~ li {
    position: relative;
    display: inline-block;
    margin: 0;
    padding: 5px 1px;
}
`)

    const $menu = $(".mp-editor-menu"),
          $txt = $(".CodeMirror-wrap textarea"),
          $nl = $(`<br />`).appendTo($menu),
          $grd = $(".mp-editor-ground").addClass("exlg-ext")

    emo.forEach(m => {
        const url = emo_url(m[0])
        $(`<li class="exlg-emo"><img src="${url}" /></li>`)
            .on("click", () => $txt
                .trigger("focus")
                .val(`![${ m[1][0] }](${url})`)
                .trigger("input")
            )
            .appendTo($menu)
    })
    const $emo = $(".exlg-emo")

    const $fold = $(`<li><i class="fa fa-chevron-left"></li>`)
        .on("click", () => {
            $nl.toggle()
            $emo.toggle()
            $fold.children().toggleClass("fa-chevron-left fa-chevron-right")
            $grd.toggleClass("exlg-ext")
        })
    $nl.after($fold)

    $txt.on("input", e => {
        if (e.originalEvent.data === "/")
            mdp.content = mdp.content.replace(/\/(.{1,5})\//g, (_, emo_txt) =>
                `![${emo_txt}](` + emo_url(emo.find(m => m[1].includes(emo_txt))[0]) + `)`
            )
    })
}

$(init)

