// ==UserScript==
// @name         extend-luogu
// @namespace    http://tampermonkey.net/
// @version      1.22
// @description  make the Luogu more powerful.
// @author       optimize_2 ForkKILLET
// @match        https://www.luogu.com.cn/*
// @match        https://*.luogu.com.cn
// @match        https://*.luogu.org
// @match        https://extend-luogu-benben-service.optimize2.repl.co/api/list/
// @grant        GM_addStyle
// @grant        unsafeWindow
// @require      https://cdn.luogu.com.cn/js/jquery-2.1.1.min.js
// ==/UserScript==
const $ = unsafeWindow.$ || jQuery, // Note: Use jQuery from LFE.
      mdp = unsafeWindow.markdownPalettes,
      error = s => console.error("[exlg]" + s), log = s => console.log("[exlg]" + s),
      add_style = window.GM_addStyle || window.PRO_addStyle || window.addStyle || error("`add_style` failed.")

const emo = [
    [ "62224", [ "qq" ] ],
    [ "62225", [ "cy" ] ],
    [ "62226", [ "kel", "kl" ] ],
    [ "62227", [ "kk" ] ],
    [ "62228", [ "dk" ] ],
    [ "62230", [ "xyx", "hj" ] ],
    [ "62234", [ "jk" ] ],
    [ "62236", [ "qiang", "up", "+", "zan" ] ],
    [ "62238", [ "ruo", "dn", "-", "cai" ] ],
    [ "62239", [ "ts" ] ],
    [ "62240", [ "yun" ] ],
    [ "62243", [ "yiw", "yw", "?" ] ],
    [ "62244", [ "se", "*" ] ],
    [ "62246", [ "px" ] ],
    [ "62248", [ "wq" ] ],
    [ "62250", [ "fad", "fd" ] ],
    [ "69020", [ "youl", "yl" ] ]
]
var emo_url = id => `https://cdn.luogu.com.cn/upload/pic/${ id }.png`

const colorMap = {
    "Gray": "gray",
    "Blue": "blue",
    "Green": "green",
    "Orange": "orange lg-bold",
    "Red": "red lg-bold",
    "Purple": "purple lg-bold",
}

function formatDate(value) {
    value = value*1000
    const date = new Date(value);
    const y = date.getFullYear();
    const MM = (date.getMonth() + 1).toString().padStart(2,'0');
    const d = date.getDate().toString().padStart(2,'0');
    const h = date.getHours().toString().padStart(2,'0');
    const m = date.getMinutes().toString().padStart(2,'0');
    const s = date.getSeconds().toString().padStart(2,'0');
    return y + '-' + MM + '-' + d + ' ' + h + ':' + m + ':' + s;
}

function parseDom(arg) {
　　 var objE = document.createElement("div");
　　 objE.innerHTML = arg;
　　 return objE.childNodes;
};
function customInfoCard() {
    var a = document.querySelectorAll("p,h1,h2,h3,h4,h5,h6,a");
    for (var i = 0; i < a.length; i++) {
        if (a[i].innerText[0]== "<") {
            var inserta= parseDom(a[i].innerText)[0];
            a[i].parentNode.replaceChild(inserta,a[i]);
        }
    }
}

function customStyle() {
    //gugugu
}

const init = () => {
    //customInfoCard
    var k = window.setInterval(customInfoCard, 500);

    //emoji
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

    //benben
    if(window.location.href === "https://www.luogu.com.cn/") {
        var msg
        addEventListener('message', e => {
            console.dir(e.data)
            msg = e.data
        })
        const loader = document.createElement('iframe')
        loader.style = "display:none"
        loader.src = "https://prpr.blog.luogu.org/"
        loader.className = "exlg-bbuploader"
        loader.id = "bbuploader"
        document.body.appendChild(loader)

        const uid = $("a.lg-fg-green")[0].href.slice(30)
        setTimeout(function() { $("iframe#bbuploader")[0].contentWindow.postMessage(uid,"*") },1000)

        console.dir(uid)

        var html = '<button class="am-btn am-btn-danger am-btn-sm" id="check_benben">快速同步</button>'
        var node = document.createElement('div')
        node.className = 'lg-article'
        node.id = 'benben-status'
        node.innerHTML = html
        document.querySelector('div.lg-index-benben > div:nth-child(3)').insertAdjacentElement('afterend', node)

        $("#feed-submit").click(function() {
            if ((feedMode=="my" || feedMode == "watching" || feedMode == "all")&&$('#feed-content').val()) {
                $("iframe#bbuploader").attr('src', $("iframe#bbuploader").attr('src'))
                setTimeout(function() { $("iframe#bbuploader")[0].contentWindow.postMessage(uid,"*") },1000)
            }
        });


        $("#check_benben").click(function() {
            if ((feedMode=="my" || feedMode == "watching" || feedMode == "all")&&$('#feed-content').val()) {
                $("iframe#bbuploader").attr('src', $("iframe#bbuploader").attr('src'))
                setTimeout(function() { $("iframe#bbuploader")[0].contentWindow.postMessage(uid,"*") },1000)
            }
        });


        const benben = document.createElement('iframe')
        benben.style = "display:none"
        benben.src = "https://www.luogu.com.cn/blog/311930/"
        benben.className = "exlg-benben"
        document.body.appendChild(benben)

        var toggled =false;

        $("li.feed-selector")
            .on("click", () => {
                if (toggled) {
                    toggled = false
                }
        })



        $(`<li class="feed-selector" id="exlg-selector" data-mode="all"><a style="cursor: pointer">全网动态</a></li>`)
            .on("click", () => {
                const ths=$("li#exlg-selector")
                if (ths[0].className == "feed-selector") {
                    $("li.feed-selector.am-active")[0].className = "feed-selector"
                    ths[0].className = "feed-selector am-active"
                }

                if (!toggled) {
                    toggled=true
                    $("div#feed-more").toggle()
                }
                $("li.am-comment").remove()
                $("iframe.exlg-benben").attr('src', $("iframe.exlg-benben").attr('src'))
                for (let e in msg) {
                    var utc8 = formatDate(msg[e]['time'])//date_time//.getFullYear() + '-' + (date_time.getMonth() + 1).toString().padStart(2,'0') + '-' + date_time.getDate().toString().padStart(2,'0') + ' ' + date_time.getHours().toString().padStart(2,'0') + ':' + date_time.getMinutes().toString().padStart(2,'0') + ':' + date_time.getSeconds().toString().padStart(2,'0')
                    var bb = `
                        <li class="am-comment am-comment-primary feed-li">
                            <div class="lg-left">
                                <a href="/user/`+msg[e]['user']['uid']+`" class="center">
                                <img src="https://cdn.luogu.com.cn/upload/usericon/`+msg[e]['user']['uid']+`.png" class="am-comment-avatar">
                                </a>
                            </div>
                            <div class="am-comment-main">
                                <header class="am-comment-hd">
                                    <div class="am-comment-meta">
                                        <span class="feed-username">
                                            <a class="lg-fg-`+colorMap[msg[e]['user']['color']]+`" href="/user/`+msg[e]['user']['uid']+`" target="_blank">`
                                                +msg[e]['user']['name']+
                                            `</a>
                                        </span>`
                                        +utc8+
                                        `<a name="feed-reply" onclick="$('textarea').trigger('focus').val(' || @`+msg[e]['user']['name']+` : `+msg[e]['content'].replace(/<.*?>/g,'')+`').trigger('input');">回复</a>
                                    </div>
                                </header>
                                <div class="am-comment-bd">
                                    <span class="feed-comment">
                                        <p>`+msg[e]['content']+`</p>
                                    </span>
                                </div>
                            </div>
                        </li>
                    `
                    $(bb).appendTo($("ul#feed"))
                    /*
                    $(`a#exlg-bb`+e)
                        .on("click", () => { $("textarea")
                            .trigger("focus")
                            .val(msg[e][2])
                            .trigger("input")
                    })
                    */
                }
            })
        .appendTo($("ul#home-center-nav.am-nav.am-nav-pills.am-nav-justify"))



    }

    if (window.location.href === "https://prpr.blog.luogu.org/") {
        var uid
        window.addEventListener('message', function (e) {

            if (e.data == "update") {
                document.write(`<iframe src="https://extend-luogu-benben-service.optimize2.repl.co/api/check/?uid=`+uid+`" style="adisplay : none;"></iframe>`)
            } else {
                uid = e.data
                document.write(`<iframe src="https://extend-luogu-benben-service.optimize2.repl.co/api/check/?uid=`+uid+`" style="adisplay : none;"></iframe>`)
            }

        })
    }

    if (window.location.href === "https://www.luogu.com.cn/blog/311930/") {
        setTimeout(function() {
            document.write(`<iframe src="https://extend-luogu-benben-service.optimize2.repl.co/api/list/"></iframe>`)
            window.addEventListener('message', function (e) {
                window.parent.postMessage(e.data,'*')
            })
        },200)
    }

    if (window.location.href === "https://extend-luogu-benben-service.optimize2.repl.co/api/list/") {
            window.parent.postMessage(JSON.parse(document.body.innerText),'*')
    }

    //style
    if(window.location.href === "https://www.luogu.com.cn/paste/kg5kcuy9") {
        var k2 = window.setInterval(customStyle, 500);
    }
}

$(init)
