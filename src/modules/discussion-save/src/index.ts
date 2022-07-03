import '@exlg/core/types/module-entry'

utils.mustMatch([/^\/discuss\/\d+(\?page=\d+)*$/])

const sto = runtime.storage!

;(async () => {
    const $btn = $(
        '<button class="am-btn am-btn-success am-btn-sm" name="save-discuss">保存讨论</button>'
    )
    $btn.on('click', () => {
        $btn.prop('disabled', true)
        $btn.text('保存中...')
        utils
            .csGet(
                `https://xn--fx-ex2c330n.ml/save.php?url=${window.location.href}`
            )
            .then((res: any) => {
                if (res.status === 200) {
                    if (res.response === 'success') {
                        log('Discuss saved')
                        $btn.text('保存成功')
                        setTimeout(() => {
                            $btn.text('保存讨论')
                            $btn.removeAttr('disabled')
                        }, 1000)
                    } else {
                        log(
                            `Discuss unsuccessfully saved, return data: ${res.response}`
                        )
                        $btn.text('保存失败')
                        $btn.toggleClass('am-btn-success').toggleClass(
                            'am-btn-warning'
                        )
                        setTimeout(() => {
                            $btn.text('保存讨论')
                            $btn.removeAttr('disabled')
                            $btn.toggleClass('am-btn-success').toggleClass(
                                'am-btn-warning'
                            )
                        }, 1000)
                    }
                } else {
                    log(`Fail to save discuss: ${res}`)
                    $btn.toggleClass('am-btn-success').toggleClass(
                        'am-btn-danger'
                    )
                    setTimeout(() => {
                        $btn.text('保存讨论')
                        $btn.removeAttr('disabled')
                        $btn.toggleClass('am-btn-success').toggleClass(
                            'am-btn-danger'
                        )
                    }, 1000)
                }
            })
            .catch((err: any) => {
                log(`Error:${err}`)
                $btn.removeAttr('disabled')
            })
    }).css('margin-top', '5px')
    const $btn2 = $(
        // eslint-disable-next-line no-restricted-globals
        `<a class="am-btn am-btn-warning am-btn-sm" name="save-discuss" href="https://luogulo.gq/show.php?url=${location.href}">查看备份</a>`
    ).css('margin-top', '5px')
    $('section.lg-summary')
        .find('p')
        .append($('<br>'))
        .append($btn)
        .append($('<span>&nbsp;</span>'))
        .append($btn2)
    if (sto.get('auto_save_discussion')) $btn.click()
})()
