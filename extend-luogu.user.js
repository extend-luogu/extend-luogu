// ==UserScript==
// @name         extend-luogu
// @namespace    http://tampermonkey.net/
// @version      2.2.2
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

const version = "2.2.2"

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
                wrap.innerHTML = `<button type="button" class="am-btn am-btn-warning am-btn-block" onclick="window.open('/paste/fnln7ze9')">您的 extend-luogu 不是最新版本. 点我更新</button>`

                //show_alert("extend-luogu", "您的 extend-luogu 不是最新版本. 请尽快更新")
                //o2 都受不了这个提示了
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

const gougou = [
             `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="#5eb95e" style="margin-bottom: -3px;"><path d="M16 8C16 6.84375 15.25 5.84375 14.1875 5.4375C14.6562 4.4375 14.4688 3.1875 13.6562 2.34375C12.8125 1.53125 11.5625 1.34375 10.5625 1.8125C10.1562 0.75 9.15625 0 8 0C6.8125 0 5.8125 0.75 5.40625 1.8125C4.40625 1.34375 3.15625 1.53125 2.34375 2.34375C1.5 3.1875 1.3125 4.4375 1.78125 5.4375C0.71875 5.84375 0 6.84375 0 8C0 9.1875 0.71875 10.1875 1.78125 10.5938C1.3125 11.5938 1.5 12.8438 2.34375 13.6562C3.15625 14.5 4.40625 14.6875 5.40625 14.2188C5.8125 15.2812 6.8125 16 8 16C9.15625 16 10.1562 15.2812 10.5625 14.2188C11.5938 14.6875 12.8125 14.5 13.6562 13.6562C14.4688 12.8438 14.6562 11.5938 14.1875 10.5938C15.25 10.1875 16 9.1875 16 8ZM11.4688 6.625L7.375 10.6875C7.21875 10.8438 7 10.8125 6.875 10.6875L4.5 8.3125C4.375 8.1875 4.375 7.96875 4.5 7.8125L5.3125 7C5.46875 6.875 5.6875 6.875 5.8125 7.03125L7.125 8.34375L10.1562 5.34375C10.3125 5.1875 10.5312 5.1875 10.6562 5.34375L11.4688 6.15625C11.5938 6.28125 11.5938 6.5 11.4688 6.625Z"></path></svg>`,
             `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="#3498db" style="margin-bottom: -3px;"><path d="M16 8C16 6.84375 15.25 5.84375 14.1875 5.4375C14.6562 4.4375 14.4688 3.1875 13.6562 2.34375C12.8125 1.53125 11.5625 1.34375 10.5625 1.8125C10.1562 0.75 9.15625 0 8 0C6.8125 0 5.8125 0.75 5.40625 1.8125C4.40625 1.34375 3.15625 1.53125 2.34375 2.34375C1.5 3.1875 1.3125 4.4375 1.78125 5.4375C0.71875 5.84375 0 6.84375 0 8C0 9.1875 0.71875 10.1875 1.78125 10.5938C1.3125 11.5938 1.5 12.8438 2.34375 13.6562C3.15625 14.5 4.40625 14.6875 5.40625 14.2188C5.8125 15.2812 6.8125 16 8 16C9.15625 16 10.1562 15.2812 10.5625 14.2188C11.5938 14.6875 12.8125 14.5 13.6562 13.6562C14.4688 12.8438 14.6562 11.5938 14.1875 10.5938C15.25 10.1875 16 9.1875 16 8ZM11.4688 6.625L7.375 10.6875C7.21875 10.8438 7 10.8125 6.875 10.6875L4.5 8.3125C4.375 8.1875 4.375 7.96875 4.5 7.8125L5.3125 7C5.46875 6.875 5.6875 6.875 5.8125 7.03125L7.125 8.34375L10.1562 5.34375C10.3125 5.1875 10.5312 5.1875 10.6562 5.34375L11.4688 6.15625C11.5938 6.28125 11.5938 6.5 11.4688 6.625Z"></path></svg>`,
             `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="#f1c40f" style="margin-bottom: -3px;"><path d="M16 8C16 6.84375 15.25 5.84375 14.1875 5.4375C14.6562 4.4375 14.4688 3.1875 13.6562 2.34375C12.8125 1.53125 11.5625 1.34375 10.5625 1.8125C10.1562 0.75 9.15625 0 8 0C6.8125 0 5.8125 0.75 5.40625 1.8125C4.40625 1.34375 3.15625 1.53125 2.34375 2.34375C1.5 3.1875 1.3125 4.4375 1.78125 5.4375C0.71875 5.84375 0 6.84375 0 8C0 9.1875 0.71875 10.1875 1.78125 10.5938C1.3125 11.5938 1.5 12.8438 2.34375 13.6562C3.15625 14.5 4.40625 14.6875 5.40625 14.2188C5.8125 15.2812 6.8125 16 8 16C9.15625 16 10.1562 15.2812 10.5625 14.2188C11.5938 14.6875 12.8125 14.5 13.6562 13.6562C14.4688 12.8438 14.6562 11.5938 14.1875 10.5938C15.25 10.1875 16 9.1875 16 8ZM11.4688 6.625L7.375 10.6875C7.21875 10.8438 7 10.8125 6.875 10.6875L4.5 8.3125C4.375 8.1875 4.375 7.96875 4.5 7.8125L5.3125 7C5.46875 6.875 5.6875 6.875 5.8125 7.03125L7.125 8.34375L10.1562 5.34375C10.3125 5.1875 10.5312 5.1875 10.6562 5.34375L11.4688 6.15625C11.5938 6.28125 11.5938 6.5 11.4688 6.625Z"></path></svg>`]

function gou(level) {
  console.dir(level);
  if (level == 0) return ``;
  if (level >= 3 && level <= 5) return gougou[0];
  if (level >= 6 && level <= 7) return gougou[1];
  return gougou[2];
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
                var tag = ``
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
                                        `</a>&nbsp;` + `<a class="sb_amazeui" target="_blank" href="/discuss/show/142324">` + gou(msg[e]['user']['ccfLevel']) + `</a>` + tag +
                                    `</span>&nbsp;`
                                    + utc8 +
                                    `<a name="feed-reply" onclick="$('textarea').trigger('focus').val(\` || @` + msg[e]['user']['name'] + ` : ` + msg[e]['content'].replace(/\`/g, "\\\`").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,`\\\"`) + `\`).trigger('input');">回复</a>
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

        //random jump
        //https://greasyfork.org/zh-CN/scripts/390181-%E6%B4%9B%E8%B0%B7%E6%8C%89%E9%9A%BE%E5%BA%A6%E9%9A%8F%E6%9C%BA%E8%B7%B3%E9%A2%98/code
        $('document').ready(function(){setTimeout(function () {
            const $sidebar = $('#app-old .lg-index-content .lg-right.am-u-lg-3'),
                  $firstele = $($sidebar.children()[0]),
                  $finder = $(`
                <div class="lg-article" id="rand-problem-form">
                    <h2>按难度随机跳题</h2>
                    <select class="am-form-field" style="background-color:#DDD;" name="rand-problem-rating" autocomplete="off" placeholder="选择难度">
                        <option value="0">暂无评定</option>
                        <option value="1">入门</option>
                        <option value="2">普及-</option>
                        <option value="3">普及/提高-</option>
                        <option value="4">普及+/提高</option>
                        <option selected value="5">提高+/省选-</option>
                        <option value="6">省选/NOI-</option>
                        <option value="7">NOI/NOI+/CTSC</option>
                    </select>
                    <select class="am-form-field" style="background-color:#DDD;margin-top:16px;" name="rand-problem-source" autocomplete="off" placeholder="选择来源">
                        <option selected value="P">洛谷题库</option>
                        <option value="CF">CodeForces</option>
                        <option value="SP">SPOJ</option>
                        <option value="AT">AtCoder</option>
                        <option value="UVA">UVa</option>
                    </select>
                    <button class="am-btn am-btn-sm am-btn-primary" style="margin-top:16px;visibility:hidden">跳转</button>
                    <button class="am-btn am-btn-sm am-btn-primary lg-right" id="rand-problem-button" style="margin-top:16px;">跳转</button>
                </div>
            `);
            $finder.insertAfter($firstele);
            $('#rand-problem-button').click(function() {
                $('#rand-problem-button').addClass('am-disabled');
                $.get("https://www.luogu.com.cn/problem/list?difficulty=" + $('[name=rand-problem-rating]')[0].value + "&type=" + $('[name=rand-problem-source]')[0].value + "&page=1&_contentOnly=1",
                    function (data) {
                        var arr = data;
                        if (arr['code'] != 200) {
                            $('#rand-problem-button').removeClass('am-disabled');
                            show_alert("好像哪里有点问题", arr["message"]);
                        } else {
                            var problem_count = arr['currentData']['problems']['count'];
                            var page_count = Math.ceil(problem_count / 50);
                            var rand_page = Math.floor(Math.random()*page_count) + 1;
                            $.get("https://www.luogu.com.cn/problem/list?difficulty=" + $('[name=rand-problem-rating]')[0].value + "&type=" + $('[name=rand-problem-source]')[0].value + "&page=" + rand_page + "&_contentOnly=1",
                                function(data) {
                                    var list = data['currentData']['problems']['result'];
                                    var rand_idx = Math.floor(Math.random()*list.length);
                                    var pid = list[rand_idx]['pid'];
                                    location.href = "https://www.luogu.com.cn/problem/" + pid;
                                }
                            );
                        }
                    }
                );
            });
          },500)});
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
        setTimeout(function() {
            const link = document.createElement("div")
            link.className = "card padding-default"
            link.setAttribute("data-v-796309f8",0)
            link.innerHTML = `extend-luogu 支持以 CSS 代码的形式更改主题. <a href="https://www.luogu.com.cn/paste/kg5kcuy9">点我跳转</a>`
            var first=$("div.full-container")[0].firstChild;
            var wraphtml=$("div.full-container")[0].insertBefore(link,first);
        }, 300)
    }
}

$(init)
