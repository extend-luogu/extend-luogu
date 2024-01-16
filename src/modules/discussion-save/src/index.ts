import '@exlg/core/types/module-entry'
import { SchemaToStorage } from '@exlg/core/types'
import type Schema from './schema'

utils.mustMatch([/^\/discuss\/\d+(\?page=\d+)*$/])

const sto = runtime.storage as SchemaToStorage<typeof Schema>
const id = window.location.pathname.split('/')[2]

const func = (args: JQuery<HTMLElement>) => {
    const btnTemplateHTML = args.children('button')[0].outerHTML
    const $saveBtn = $(btnTemplateHTML)
    $saveBtn
        .on('click', () => {
            $saveBtn.prop('disabled', true)
            $saveBtn.text('保存中...')
            utils
                .csGet(`https://lda.piterator.com/${id}`)
                .then((res) => {
                    if (res.status <= 400) {
                        log('Discuss saved')
                        $saveBtn.text('保存成功')
                        setTimeout(() => {
                            $saveBtn.text('保存讨论')
                                .removeAttr('disabled')
                        }, 1000)
                    }
                    else {
                        log('Fail to save discuss: ', res)
                        $saveBtn.text('保存失败')
                            .css('background-color', '#dd514c')
                        setTimeout(() => {
                            $saveBtn.text('保存讨论')
                                .removeAttr('disabled')
                                .css('background-color', '#5eb95e')
                        }, 1000)
                    }
                })
                .catch((err) => {
                    log('Error: %o', err)
                    $saveBtn.text('发生错误')
                        .css('background-color', '#dd514c')
                    setTimeout(() => {
                        $saveBtn.text('保存讨论')
                            .removeAttr('disabled')
                            .css('background-color', '#5eb95e')
                    }, 1000)
                })
        })
        .css({ 'margin-top': '5px', 'background-color': '#5eb95e' })
        .text('保存讨论')
    const $showBtn = $(btnTemplateHTML).css({ 'margin-top': '5px', 'background-color': '#ffc116' })
        .attr('href', `https://lglg.top/${id}`)
        .text('查看备份')

    args
        .append($('<br>'))
        .append($saveBtn)
        .append('<span>&nbsp;</span>')
        .append($showBtn)

    if (sto.get('autoSaveDiscussion')) $saveBtn.trigger('click')
}

utils.addHookSelector('.btn-actions', ({ hookedNodes }) => {
    hookedNodes.forEach((node) => {
        if (node.nodeType === node.ELEMENT_NODE) {
            func($(node as HTMLElement))
        }
    })
})
