import '@exlg/core/types/module-entry'
import { SchemaToStorage } from '@exlg/core/types'
import type Schema from './schema'

utils.mustMatch([/^\/discuss\/\d+(\?page=\d+)*$/])

const sto = runtime.storage as SchemaToStorage<typeof Schema>
const id = window.location.pathname.split('/')[2]

const $saveBtn = $(`
    <button
        class="am-btn am-btn-success am-btn-sm"
        name="save-discuss"
    >保存讨论</button>
`)
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
                        $saveBtn.removeAttr('disabled')
                    }, 1000)
                }
                else {
                    log('Fail to save discuss: ', res)
                    $saveBtn.text('保存失败')
                    $saveBtn.toggleClass('am-btn-success').toggleClass('am-btn-danger')
                    setTimeout(() => {
                        $saveBtn.text('保存讨论')
                        $saveBtn.removeAttr('disabled')
                        $saveBtn.toggleClass('am-btn-success').toggleClass('am-btn-danger')
                    }, 1000)
                }
            })
            .catch((err) => {
                log('Error: %o', err)
                $saveBtn.removeAttr('disabled')
            })
    })
    .css('margin-top', '5px')
const $showBtn = $(`
    <a
        class="am-btn am-btn-warning am-btn-sm"
        name="save-discuss"
        href="https://lglg.top/${id}"
        target="_blank"
    >查看备份</a>
`).css('margin-top', '5px')

$('section.lg-summary')
    .find('p')
    .append($('<br>'))
    .append($saveBtn)
    .append('<span>&nbsp;</span>')
    .append($showBtn)

if (sto.get('autoSaveDiscussion')) $saveBtn.trigger('click')
