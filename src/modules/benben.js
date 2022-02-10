import uindow, { cs_get, $ } from "../utils.js"
import mod from "../core.js"

mod.reg("benben", "全网犇犇", "@/", {
    source: {
        ty: "enum", dft: "o2", vals: [ "o2", "shy" ],
        info: [ "Switch the way of fetching benben", "切换全网犇犇获取方式" ]
    }
}, ({msto}) => {
    const color = {
        Gray: "gray",
        Blue: "bluelight",
        Green: "green",
        Orange: "orange lg-bold",
        Red: "red lg-bold",
        Purple: "purple lg-bold",
        Brown: "brown lg-bold",
    }
    const check_svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="%" style="margin-bottom: -3px;" exlg="exlg">
            <path d="M16 8C16 6.84375 15.25 5.84375 14.1875 5.4375C14.6562 4.4375 14.4688 3.1875 13.6562 2.34375C12.8125 1.53125 11.5625 1.34375 10.5625 1.8125C10.1562 0.75 9.15625 0 8 0C6.8125 0 5.8125 0.75 5.40625 1.8125C4.40625 1.34375 3.15625 1.53125 2.34375 2.34375C1.5 3.1875 1.3125 4.4375 1.78125 5.4375C0.71875 5.84375 0 6.84375 0 8C0 9.1875 0.71875 10.1875 1.78125 10.5938C1.3125 11.5938 1.5 12.8438 2.34375 13.6562C3.15625 14.5 4.40625 14.6875 5.40625 14.2188C5.8125 15.2812 6.8125 16 8 16C9.15625 16 10.1562 15.2812 10.5625 14.2188C11.5938 14.6875 12.8125 14.5 13.6562 13.6562C14.4688 12.8438 14.6562 11.5938 14.1875 10.5938C15.25 10.1875 16 9.1875 16 8ZM11.4688 6.625L7.375 10.6875C7.21875 10.8438 7 10.8125 6.875 10.6875L4.5 8.3125C4.375 8.1875 4.375 7.96875 4.5 7.8125L5.3125 7C5.46875 6.875 5.6875 6.875 5.8125 7.03125L7.125 8.34375L10.1562 5.34375C10.3125 5.1875 10.5312 5.1875 10.6562 5.34375L11.4688 6.15625C11.5938 6.28125 11.5938 6.5 11.4688 6.625Z"></path>
        </svg>
    `
    const check = lv => lv <= 3 ? "" : check_svg.replace("%", lv <= 5 ? "#5eb95e" : lv <= 7 ? "#3498db" : "#f1c40f")

    const oriloadfeed = uindow.loadFeed

    uindow.loadFeed = function () {
        if (uindow.feedMode==="all-exlg") {
            cs_get({
                url: (msto.source === "o2") ? (`https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121`) : (`https://bens.rotriw.com/api/list/proxy?page=${uindow.feedPage}`),
                onload: (res) => {
                    const e = JSON.parse(res.response)
                    e.forEach(m => $(`
                <li class="am-comment am-comment-primary feed-li" exlg="exlg">
                    <div class="lg-left">
                        <a href="/user/${ m.user.uid }" class="center">
                            <img src="https://cdn.luogu.com.cn/upload/usericon/${ m.user.uid }.png" class="am-comment-avatar">
                        </a>
                    </div>
                    <div class="am-comment-main">
                        <header class="am-comment-hd">
                            <div class="am-comment-meta">
                                <span class="feed-username">
                                    <a class="lg-fg-${ color[m.user.color] }" href="/user/${ m.user.uid }" target="_blank">
                                        ${ m.user.name }
                                    </a>
                                    <a class="sb_amazeui" target="_blank" href="/discuss/show/142324">
                                        ${ check(m.user.ccfLevel) }
                                    </a>
                                    ${ m.user.badge ? `<span class="am-badge am-radius lg-bg-${ color[m.user.color] }">${ m.user.badge }</span>` : "" }
                                </span>
                                ${ new Date(m.time * 1000).format("yyyy-mm-dd HH:MM") }
                                <a name="feed-reply">回复</a>
                            </div>
                        </header>
                        <div class="am-comment-bd">
                            <span class="feed-comment">
                                ${ marked(m.content) }
                            </span>
                        </div>
                    </div>
                </li>
            `)
                        .appendTo($("ul#feed"))
                        .find("a[name=feed-reply]").on("click", () => {
                            scrollToId("feed-content")
                            setTimeout(
                                () => $("textarea")
                                    .trigger("focus").val(` || @${ m.user.name } : ${ m.content }`)
                                    .trigger("input"),
                                50
                            )
                        })
                    )
                }
            })
            if (msto.source === "shy"){
                uindow.feedPage++
                $("#feed-more").children("a").text("点击查看更多...")
            }
        }
        else{
            oriloadfeed()
        }
    }

    const $sel = $(".feed-selector")
    $(`<li class="feed-selector" id="exlg-benben-selector" data-mode="all-exlg" exlg="exlg"><a style="cursor: pointer">全网动态</a></li>`)
        .appendTo($sel.parent())
        .on("click", e => {
            const $this = $(e.currentTarget)
            $sel.removeClass("am-active")
            $this.addClass("am-active")
            if (msto.source === "o2") {
                $("#feed-more").hide()
            }
            uindow.feedPage=1
            uindow.feedMode="all-exlg"
            $("li.am-comment").remove()

            uindow.loadFeed()
        })
})