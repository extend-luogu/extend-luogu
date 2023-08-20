import '@exlg/core/types/module-entry'
import type { SchemaToStorage } from '@exlg/core/types'
import type Scm from './schema'
import { Benben, benben } from './assets'

utils.mustMatch('/')

const sto = runtime.storage as SchemaToStorage<typeof Scm>

declare global {
    interface Window {
        loadFeed: () => void,
        scrollToId: (id: string) => void,
        feedPage: number,
        feedMode: string
    }
}

const oriLoadFeed = window.loadFeed
window.loadFeed = async () => {
    if (window.feedMode === 'all-exlg') {
        const res = await utils.csGet(
            'https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121',
        )
        if (window.feedMode !== 'all-exlg') return
        const e = JSON.parse(res.response)
        e.forEach((m: Benben) => {
            m.content = utils.renderText(m.content)
            $(benben(m))
                .appendTo($('ul#feed'))
                .find('a[name=feed-reply]').on('click', () => {
                    window.scrollToId('feed-content')
                    setTimeout(
                        () => $('textarea')
                            .trigger('focus').val(` || @${m.user.name} : ${sto.get('replyMarkdown') ? m.content : $(m.content).text()}`)
                            .trigger('input'),
                        50,
                    )
                })
        })
    }
    else {
        oriLoadFeed()
    }
}

const $sel = $('.feed-selector')
$('<li class="feed-selector" id="exlg-benben-selector" data-mode="all-exlg" exlg="exlg"><a style="cursor: pointer">全网动态</a></li>')
    .appendTo($sel.parent())
    .on('click', (e: JQuery.ClickEvent) => {
        const $this = $(e.currentTarget)
        $sel.removeClass('am-active')
        $this.addClass('am-active')
        $('#feed-more').hide()
        window.feedPage = 1
        window.feedMode = 'all-exlg'
        $('li.am-comment').remove()

        window.loadFeed()
    })

if (sto.get('quikpost')) {
    $('textarea').on('keydown', (e: JQuery.KeyboardEventBase) => {
        if (utils.toKeyCode(e) === 'CtrlEnter') {
            $('#feed-submit').trigger('click')
        }
    })
}
