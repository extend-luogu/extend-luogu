// ==UserScript==
// @name         extend-luogu
// @namespace    http://tampermonkey.net/
// @version      2.1.6
// @description  make the Luogu more powerful.
// @author       optimize_2 ForkKILLET
// @match        https://www.luogu.com.cn/*
// @match        https://*.luogu.com.cn
// @match        https://*.luogu.org
// @match        https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121
// @grant        GM_addStyle
// @grant        unsafeWindow
// @require      https://cdn.luogu.com.cn/js/jquery-2.1.1.min.js
// ==/UserScript==

const version = "2.1.6"

function checkUpdate() {
    setTimeout(function() {
        if(window.location.href.substring(0,25) === "https://www.luogu.com.cn/")
        $.get("https://www.luogu.com.cn/paste/ijxozv3z",function(data,status) {
            const response = data.match(/\%5C%2F%5C%2F%5C%2F(.+?)\%5C%2F%5C%2F%5C%2F/g)[0]
            const LATEST = response.substring(18).substring(0,response.length-36)
            console.dir("[INFO] extend-luogu LATEST version : "  + LATEST)
            if(LATEST != version.trim()) {
                var wrap=document.createElement("div");
                var first=document.body.firstChild;
                var wraphtml=document.body.insertBefore(wrap,first);
                wrap.innerHTML = `
                <button type="button" class="am-btn am-btn-warning am-btn-block" onclick="window.open('/paste/fnln7ze9')">您的 extend-luogu 不是最新版本. 点我更新</button>`
            }
        });
    }, 1000)
}

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
    "Blue": "bluelight",
    "Green": "green",
    "Orange": "orange lg-bold",
    "Red": "red lg-bold",
    "Purple": "purple lg-bold",
}

function formatDate(value) {
    const date = new Date(value*1000);
    const y = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2,'0');
    const d = date.getDate().toString().padStart(2,'0');
    const h = date.getHours().toString().padStart(2,'0');
    const m = date.getMinutes().toString().padStart(2,'0');
    const s = date.getSeconds().toString().padStart(2,'0');
    return y + '-' + mm + '-' + d + ' ' + h + ':' + m + ':' + s;
}

function parseDom(arg) {
　　 const objE = document.createElement("div");
　　 objE.innerHTML = arg;
　　 return objE.childNodes;
};
function customInfoCard() {
    const a = document.querySelectorAll("p,h1,h2,h3,h4,h5,h6,a");
    for (var i = 0; i < a.length; i++) {
        if (a[i].innerText[0]== "<") {
            const inserta= parseDom(a[i].innerText)[0];
            a[i].parentNode.replaceChild(inserta,a[i]);
        }
    }
}

function customStyle() {
    add_style(`
        .exlg-button {
            border-top-color: currentcolor;
            color: white;
            border-radius: 3px;
            border-bottom-width: 1px;
            border-top-width: 1px;
            border-top-color: currentcolor;
            cursor: pointer;
            line-height: 1.5;
            border-bottom-style: solid;
        }
    `)

    const card = $("div.card.padding-default")[0]
    //console.dir(card)
    const inputCSS = document.createElement("div")
    inputCSS.innerHTML = `<h2>自定义 css 主题</h2><textarea id="exlg-cssinput" class="exlg-customstyle" style="width:100%;height:300px"></textarea>`
    card.appendChild(inputCSS)
    $("#exlg-cssinput")[0].value = window.localStorage['exlg-CSS']
    const applyCSS = document.createElement("div")
    applyCSS.innerHTML = `<button type="button" class="exlg-button" style="border-color: rgb(231, 76, 60);background-color: rgb(231, 76, 60);" id="applyCSS">修改</button>`
    card.appendChild(applyCSS)
    $("button#applyCSS")
        .on("click", () => {
            window.localStorage['exlg-CSS'] = $("#exlg-cssinput")[0].value
            alert("修改成功")
        })
    //$(`<input id="exlg-cssinput" class="exlg-customstyle"></input>`).appentTo($card)
}

function markdown(str) {
    if (typeof str !== "string") return null
    const rules = [
        /* image */ [ /!\[(.+?)\]\((.*?)\)/g, (_, info, url) => `<img src="${url}" alt="${info}" />` ],
        /* link  */ [ /(?<!!)\[(.+?)\]\((.*?)\)/g, (_, info, url) => `<a href="${url}">${info}</a>` ],
    ]
    rules.forEach(r => str = str.replace(...r))
    return str
}

const colors = ['rgb(191, 191, 191)', 'rgb(254, 76, 97)', 'rgb(243, 156, 17)', 'rgb(255, 193, 22)', 'rgb(82, 196, 26)', 'rgb(52, 152, 219)', 'rgb(157, 61, 207)', 'rgb(14, 29, 105)'];
function rendColors() {
    var problems = [];
    for(var passed of unsafeWindow._feInjection.currentData.passedProblems) problems.push({pid: passed.pid, dif: passed.difficulty, rendered: false});
    for(var tryed of unsafeWindow._feInjection.currentData.submittedProblems) problems.push({pid: tryed.pid, dif: tryed.difficulty, rendered: false});

    setInterval(function() {
        const url = window.location.href
        if(url.substring(url.length-9,url.length) === '#practice') {
            for(let i in problems) {
                if(!problems[i].rendered) {
                    var elements = document.querySelectorAll('a');
                    for(let j in elements)
                        if(elements[j].textContent == problems[i].pid) {
                        if (elements[j].classList) elements[j].classList.remove("color-default")
                        else elements[j].className = elements[j].className.replace('color-default', ' ')
                        problems[i].rendered = true
                        elements[j].style.color = colors[problems[i].dif]
                        break
                    }
                }
            }
        } else for(let i in problems) problems[i].rendered = false;
    }, 500);
}

const init = () => {
    checkUpdate()
    //customInfoCard
    if(window.location.href.substring(0,30) === "https://www.luogu.com.cn/user/") {
        window.setInterval(customInfoCard, 500);
        rendColors()
    }
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

    add_style(window.localStorage['exlg-CSS'])

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

    if(window.location.href === "https://www.luogu.com.cn/") {
        var msg
        addEventListener('message', e => {
            console.dir(e.data)
            msg = e.data
            if (!toggled) {
                toggled=true
                $("div#feed-more").toggle()
            }
            $("li.am-comment").remove()
            for (let e in msg) {
                var utc8 = formatDate(msg[e]['time'])//date_time//.getFullYear() + '-' + (date_time.getMonth() + 1).toString().padStart(2,'0') + '-' + date_time.getDate().toString().padStart(2,'0') + ' ' + date_time.getHours().toString().padStart(2,'0') + ':' + date_time.getMinutes().toString().padStart(2,'0') + ':' + date_time.getSeconds().toString().padStart(2,'0')
                var tag = ""
                if(msg[e]['user']['uid'] == "224978") {
                    msg[e]['user']['color'] = 'Purple'
                    tag = `</span>&nbsp;<span class="am-badge am-radius lg-bg-purple">exlg-DEV`
                }
                var bb = `
                    <li class="am-comment am-comment-primary feed-li">
                        <div class="lg-left">
                            <a href="/user/` + msg[e]['user']['uid'] + `" class="center">
                            <img src="https://cdn.luogu.com.cn/upload/usericon/` + msg[e]['user']['uid'] + `.png" class="am-comment-avatar">
                            </a>
                        </div>
                        <div class="am-comment-main">
                            <header class="am-comment-hd">
                                <div class="am-comment-meta">
                                    <span class="feed-username">
                                        <a class="lg-fg-`+colorMap[msg[e]['user']['color']]+`" href="/user/` + msg[e]['user']['uid'] + `" target="_blank">`
                                            + msg[e]['user']['name'] +
                                        `</a>`
                                         + tag +
                                    `</span>&nbsp;`
                                    + utc8 +
                                    `<a name="feed-reply" onclick="$('textarea').trigger('focus').val(' || @` + msg[e]['user']['name'] + ` : ` + msg[e]['content'].replace('\n',' ') + `').trigger('input');">回复</a>
                                </div>
                            </header>
                            <div class="am-comment-bd">
                                <span class="feed-comment">
                                    <p>` + markdown(msg[e]['content']) + `</p>
                                </span>
                            </div>
                        </div>
                    </li>
                `
                $(bb).appendTo($("ul#feed"))
            }
        })
        var benbenLoaded = false
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
                if(benbenLoaded) $("iframe.exlg-benben").attr('src', $("iframe.exlg-benben").attr('src'))
                else {
                    const benben = document.createElement('iframe')
                    benben.style = "display:none"
                    benben.src = "https://www.luogu.com.cn/blog/311930/"
                    benben.className = "exlg-benben"
                    document.body.appendChild(benben)
                    benbenLoaded = true
                }

            })
        .appendTo($("ul#home-center-nav.am-nav.am-nav-pills.am-nav-justify"))
    }

    if (window.location.href === "https://www.luogu.com.cn/blog/311930/") {
        setTimeout(function() {
            //document.write(`<iframe src="https://service-oxhmrkw1-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615377433"></iframe>`)
            document.write(`<iframe src="https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121"></iframe>`)

            window.addEventListener('message', function (e) {
                window.parent.postMessage(e.data,'*')
            })
        }, 100) //这个不加洛谷会转圈圈
    }

    if (window.location.href === "https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121") {
        //console.dir(document.body.innerText)
        window.parent.postMessage(JSON.parse(document.body.innerText),'*')
    }

    //style
    if(window.location.href === "https://www.luogu.com.cn/paste/kg5kcuy9") {
        //var k2 = window.setInterval(customStyle, 500);
        setTimeout(customStyle,500)
    }

    if(window.location.href === "https://www.luogu.com.cn/theme/list") {
            const link = document.createElement("div")
            link.className = "card padding-default"
            link.setAttribute("data-v-796309f8",0)
            link.innerHTML = `extend-luogu 支持以 CSS 代码的形式更改主题. <a href="https://www.luogu.com.cn/paste/kg5kcuy9">点我跳转</a>`
            var first=$("div.full-container")[0].firstChild;
            var wraphtml=$("div.full-container")[0].insertBefore(link,first);
    }
}

$(init)
