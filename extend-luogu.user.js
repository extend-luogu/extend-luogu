// ==UserScript==
// @name         extend-luogu
// @namespace    http://tampermonkey.net/
// @version      1.02
// @description  make the Luogu more powerful.
// @author       optimize_2 ForkKILLET
// @match        https://www.luogu.com.cn/*
// @match        https://*.luogu.com.cn
// @match        https://*.luogu.org
// @match        https://ben-ben-spider.williamsongshy.repl.co/api/list/all
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
    [ "62226", [ "kl", "kel" ] ],
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
/*
function customInfoCard() {
	var a = document.querySelectorAll(".introduction p,h1,h2,h3,h4,h5,h6");
	var s, plc, fml;
	for (var i = 0; i < a.length; i++) {
		if (a[i].innerText.substr(0, 7) == "%align%") {
			a[i].innerText = a[i].innerText.substring(7, a[i].innerText.length);
			s = a[i].getAttribute("style");
			if (s == null) s = "";
			a[i].setAttribute("style", s + "text-align:center;");
		}
		if (a[i].innerText.substr(0, 6) == "%color") {
			var col = a[i].innerText.substr(6, 8);
			a[i].innerText = a[i].innerText.substring(15, a[i].innerText.length);
			s = a[i].getAttribute("style");
			if (s == null) s = "";
			a[i].setAttribute("style", s + "color" + col + ";");
		}
		if (a[i].innerText.substr(0, 12) == "%font-family") {
			plc = a[i].innerText.indexOf('%', 1);
			fml = a[i].innerText.substr(12, plc - 12);
			a[i].innerText = a[i].innerText.substring(plc + 1, a[i].innerText.length);
			s = a[i].getAttribute("style");
			if (s == null) s = "";
			a[i].setAttribute("style", s + "font-family" + fml + ";");
		}
		if (a[i].innerText.substr(0, 10) == "%font-size") {
			plc = a[i].innerText.indexOf('%', 1);
			fml = a[i].innerText.substr(10, plc - 10);
			a[i].innerText = a[i].innerText.substring(plc + 1, a[i].innerText.length);
			s = a[i].getAttribute("style");
			if (s == null) s = "";
			a[i].setAttribute("style", s + "font-size" + fml + ";");
		}
		if (a[i].innerText.substr(0, 6) == "%video") {
			plc = a[i].innerText.indexOf('%', 1);
			fml = a[i].innerText.substr(7, plc - 7);
			a[i].innerText = "";
			var vdo = document.createElement("video");
			vdo.setAttribute("src", fml);
			vdo.setAttribute("controls", "controls");
			vdo.setAttribute("style", "width:100%;height:auto;");
			vdo.innerText = "您的浏览器不支持 video 标签。";
			document.querySelector(".introduction").insertBefore(vdo, a[i].nextSibling);

		}
		if (a[i].innerText.substr(0, 7) == "%iframe") {
			plc = a[i].innerText.indexOf('%', 1);
			fml = a[i].innerText.substr(8, plc - 8);
			a[i].innerText = "";
			var ifr = document.createElement("iframe");
			ifr.setAttribute("src", fml);
			ifr.setAttribute("width", "100%");
			ifr.setAttribute("height", "500px");
			ifr.setAttribute("seamless", "");
			ifr.innerText = "您的浏览器不支持 iframe 标签。";
			document.querySelector(".introduction").insertBefore(ifr, a[i].nextSibling);

		}

	}
}

//下个版本绕过csp 优先绕全网犇犇
//对不住了haraki
*/
const init = () => {
    //var k = window.setInterval(customInfoCard, 500);

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
                    var bb = `
                        <li class="am-comment am-comment-primary feed-li">
                            <div class="lg-left">
                                <a href="/user/`+msg[e][1]+`" class="center">
                                <img src="https://cdn.luogu.com.cn/upload/usericon/`+msg[e][1]+`.png" class="am-comment-avatar">
                                </a>
                            </div>
                            <div class="am-comment-main">
                                <header class="am-comment-hd">
                                    <div class="am-comment-meta">
                                        <span class="feed-username">
                                            <a class="lg-fg-purple" href="/user/`+msg[e][1]+`" target="_blank">`
                                                +msg[e][2]+
                                            `</a>
                                        </span>`
                                        +msg[e][4]+
                                        `<a name="feed-reply" href="javascript: scrollToId('feed-content')" data-username="`+msg[e][2]+`">
                                            回复
                                        </a>
                                    </div>
                                </header>
                                <div class="am-comment-bd">
                                    <span class="feed-comment">
                                        <p>`+msg[e][3]+`</p>
                                    </span>
                                </div>
                            </div>
                        </li>
                    `
                    $(bb).appendTo($("ul#feed"))
                }

            }).appendTo($("ul#home-center-nav.am-nav.am-nav-pills.am-nav-justify"))

    }

    if (window.location.href === "https://prpr.blog.luogu.org/") {
        var uid
        window.addEventListener('message', function (e) {

            if (e.data == "update") {
                document.write(`<iframe src="https://ben-ben-spider.williamsongshy.repl.co/api/checkbenben?uid=`+uid+`" style="adisplay : none;"></iframe>`)
            } else {
                uid = e.data
                document.write(`<iframe src="https://ben-ben-spider.williamsongshy.repl.co/api/checkbenben?uid=`+uid+`" style="adisplay : none;"></iframe>`)
            }

        })
    }

    if (window.location.href === "https://www.luogu.com.cn/blog/311930/") {
        setTimeout(function() {
            document.write(`<iframe src="https://ben-ben-spider.williamsongshy.repl.co/api/list/all"></iframe>`)
            window.addEventListener('message', function (e) {
                window.parent.postMessage(e.data,'*')
            })
        },200)
    }

    if (window.location.href === "https://ben-ben-spider.williamsongshy.repl.co/api/list/all") {
        document.write(unescape(document.body.innerHTML.replace(/\\u/g, '%u')))
        const message = JSON.parse(document.body.innerText)
        window.parent.postMessage(message,'*')
    }
}

$(init)
