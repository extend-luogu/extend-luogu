import '@exlg/core/types/module-entry'
import { SchemaToStorage } from '@exlg/core/types'
import type Schema from './schema'

utils.mustMatch([/^\/discuss\/\d+(\?page=\d+)*$/])

const sto = runtime.storage as SchemaToStorage<typeof Schema>
const api = 'https://xn--fx-ex2c330n.ml'

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
            .csGet(`${api}/save.php?url=${window.location.href}`)
            .then((res: any) => {
                if (res.status === 200) {
                    if (res.response === 'success') {
                        log('Discuss saved')
                        $saveBtn.text('保存成功')
                        setTimeout(() => {
                            $saveBtn.text('保存讨论').removeAttr('disabled')
                        }, 1000)
                    } else {
                        log('Failed to save, return data: %o', res.response)
                        $saveBtn
                            .text('保存失败')
                            .toggleClass('am-btn-success')
                            .toggleClass('am-btn-warning')

                        setTimeout(() => {
                            $saveBtn
                                .text('保存讨论')
                                .removeAttr('disabled')
                                .toggleClass('am-btn-success')
                                .toggleClass('am-btn-warning')
                        }, 1000)
                    }
                } else {
                    log(`Fail to save discuss: ${res}`)
                    $saveBtn
                        .toggleClass('am-btn-success')
                        .toggleClass('am-btn-danger')
                    setTimeout(() => {
                        $saveBtn
                            .text('保存讨论')
                            .removeAttr('disabled')
                            .toggleClass('am-btn-success')
                            .toggleClass('am-btn-danger')
                    }, 1000)
                }
            })
            .catch((err: any) => {
                log('Error: %o', err)
                $saveBtn.removeAttr('disabled')
            })
    })
    .css('margin-top', '5px')
const $showBtn = $(`
    <a
        class="am-btn am-btn-warning am-btn-sm"
        name="save-discuss"
        href="${api}/show.php?url=${window.location.href}"
        target="_blank"
    >查看备份</a>
`).css('margin-top', '5px')

$('section.lg-summary')
    .find('p')
    .append($('<br />'))
    .append($saveBtn)
    .append('&nbsp;')
    .append($showBtn)

if (sto.get('autoSaveDiscussion')) $saveBtn.trigger('click')
