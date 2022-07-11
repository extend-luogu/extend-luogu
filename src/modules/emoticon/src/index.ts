import '@exlg/core/types/module-entry'
import type { SchemaToStorage } from '@exlg/core/types'
import type Scm from './schema'
import { emos, size, Emo } from './assets'

const sto = runtime.storage as SchemaToStorage<typeof Scm>

const emoUrl = (emo: Emo) => {
    const file = emo.file + (emo.type === 'txt' ? size : '')
    return `${sto.get('emoSource')}/${file}`
}

const $menu = $('.mp-editor-menu')
const $txt = $('.CodeMirror-wrap textarea')

// Note: 插入标签面板

const $emoMenu = $menu.clone().addClass('exlg-emo-menu').html('')
$menu.after($emoMenu)

// Note: 插入分割线

$menu.children('.mp-divider:eq(0)').clone().appendTo($menu)

// Note: 插入切换表情按钮

const $emoSwitch = $menu.children(':first-child').clone()

$emoSwitch
    .children('a')
    .attr('title', '表情')
    .children('i')
    .removeClass('fa-bold')
    .addClass('fa-smile')
$emoSwitch
    .on('click', () => {
        $emoMenu.toggle()
        sto.set('emoMenuOpen', $emoMenu.is(':visible'))
    })
    .appendTo($menu)

if (!sto.get('emoMenuOpen')) $emoMenu.hide()

const insertText = (txt: string) =>
    $txt.trigger('focus').val(txt).trigger('input')

// Note: 点击按钮插入标签
emos.forEach((emo) => {
    $('<button></button>')
        .addClass('exlg-emo-btn')
        .addClass(emo.type)
        .html(emo.type === 'qq' ? `<img src="${emoUrl(emo)}" />` : emo.display)
        .on('click', () => insertText(`![](${emoUrl(emo)})`))
        .appendTo($emoMenu)
})

$txt[0].addEventListener('input', (evt) => {
    if ((evt as InputEvent).data === '/') {
        // Note: 向左扩大选区，检查 '/xxx/' 的格式（最多 5 个字符）
        let selection = ''
        let i = 0
        while (i++ < 5) {
            $txt[0].dispatchEvent(
                new KeyboardEvent('keydown', { keyCode: 37, shiftKey: true }) // Note: Shift + LeftArrow
            )
            selection = document.getSelection()!.toString()

            if (selection.length < i) break // Note: 选区长度和移动次数不一致，说明碰到了文本边界
            if (selection.length >= 2 && selection[0] === '/') break // Note: 匹配到另一个 '/'
        }

        if (selection.length >= Math.max(i, 2) && selection[0] === '/') {
            const name = selection.slice(1, -1)
            const targetEmo = emos.find((emo) => emo.names.includes(name))

            if (targetEmo) {
                // Note: 匹配到表情，删除选区后插入
                $txt[0].dispatchEvent(
                    new KeyboardEvent('keydown', { keyCode: 8 }) // Note: Backspace
                )
                insertText(`![](${emoUrl(targetEmo)})`)
            }
        }

        // Note: 恢复选区
        while (i--) {
            $txt[0].dispatchEvent(
                new KeyboardEvent('keydown', {
                    keyCode: 39,
                    shiftKey: true
                }) // Note: Shift + RightArrow
            )
        }
    }
})
