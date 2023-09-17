import '@exlg/core/types/module-entry'
import type { SchemaToStorage } from '@exlg/core/types'
import type Scm from './schema'

const sto = runtime.storage as SchemaToStorage<typeof Scm>

const isRecord = utils.match(/\/record\/.*/)

const langs: Record<string, string> = {
    c: 'C',
    cpp: 'C++',
    pascal: 'Pascal',
    python: 'Python',
    java: 'Java',
    javascript: 'JavaScript',
    php: 'PHP',
    latex: 'LaTeX',
    undefined: 'undefined',
}

const func = (args: JQuery<Node>) => {
    const getLang = ($code: JQuery<Node>): string => {
        let lang = 'undefined'
        if (isRecord) return $($('.value.lfe-caption')[0]).text()

        const tmp = $code.attr('data-rendered-lang')

        if (tmp) {
            lang = tmp
        }
        else {
            $code.attr('class')?.split(' ').forEach((cls) => {
                if (cls.startsWith('language-')) {
                    lang = cls.slice(9)
                }
            })
        }
        return langs[lang]
    }

    args.attr('exlg-copy-code-block', '')
    args.each((_, e, $pre = $(e)) => {
        if (e.parentNode) {
            const $e = $(e.parentNode)
            if ($e.hasClass('mp-preview-content') || $e.hasClass('mp-preview-area')) {
                return
            }
        }

        const $btn = isRecord
            ? ($pre.children('.copy-btn'))
            : $('<div class="exlg-copy">复制</div>')
                .on('click', () => {
                    if ($btn.text() !== '复制') return // Note: Debounce
                    try {
                        utils.setClipboard($pre.text())
                        // throw new TypeError("Test");
                    }
                    catch (err) {
                        $btn.text('复制失败').toggleClass('exlg-copied').toggleClass('exlg-copied-fail')
                        setTimeout(() => $btn.text('复制').toggleClass('exlg-copied').toggleClass('exlg-copied-fail'), 800)
                        error('复制到剪贴板失败，错误信息: ', err)
                        return
                    }
                    $btn.text('复制成功').toggleClass('exlg-copied')
                    setTimeout(() => $btn.text('复制').toggleClass('exlg-copied'), 800)
                })

        const $code = $pre.children('code')

        const font = sto.get('copy_code_font')
        if (font) {
            $code.css('font-family', font)
        }

        if (!$code.hasClass('hljs')) {
            $code.addClass('hljs').css('background', sto.get('cb_background_color'))
        }
        $btn.addClass(`exlg-copy-${sto.get('copy_code_position')}`)

        const lang = getLang($code)

        // const title_text = msto.code_block_title.replace("${lang}", (lang ? lang : "Text"))
        const title_text = lang ? sto.get('code_block_title').replace('{lang}', lang) : sto.get('code_block_title_nolang')
        const $title = isRecord ? $('.lfe-h3').text(title_text) : $(`<h3 class="exlg-code-title" style="/*width: 100%;*/">${title_text}</h3>`)
        if (sto.get('beautify_code_block')) $title.addClass('exlg-beautified-cbex')
        if (!isRecord) $pre.before($title.append($btn))
    })
}

utils.addHook((insertedNodes) => {
    insertedNodes.forEach((e) => {
        func($(e).find('pre:has(> code:not(.cm-s-default)):not([exlg-copy-code-block])'))
    })
})
