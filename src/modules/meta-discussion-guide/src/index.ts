import '@exlg/core/types/module-entry'

utils.mustMatch(/^\/discuss\/lists\?forumname=/, { withSearch: true })

const metaDiscussionId = '432028'
const metaWordRegex = [/exlg/i, /ex(tend)?[- ]luogu/i, /badge/i]

const $newpostSection = $('#newpost')
const $newpostTitle = $('.lg-input-title')
const $newpostSubmit: JQuery<HTMLInputElement> = $('#submitpost')
const $newpostSubmitWrapper = $newpostSubmit.wrap('<div></div>').parent()

// Note: 添加专贴说明和链接
const discussLink = `<a href="/discuss/${metaDiscussionId}"><b>专贴</b></a>`
$newpostSection.after(`<p>exlg 相关问题请在 ${discussLink} 讨论</p>`)

// Note: 识别 "exlg" 关键字，引导用户去专贴讨论
$newpostSubmitWrapper[0].addEventListener(
    'click',
    (evt) => {
        const postContent = markdownPalettes!.content!.toLowerCase()
        const postTitle = $newpostTitle.val() as string
        const existMetaWords = metaWordRegex
            .map((re) => [postContent.match(re)?.[0], postTitle.match(re)?.[0]])
            .flat()
            .filter((s, i, a) => s && s !== a[i + 1])

        if (existMetaWords.length) {
            evt.stopPropagation()
            let $confirmInput: JQuery<HTMLInputElement>
            utils.simpleAlert(
                '检测到您将要发送的讨论内容包含与 exlg 有关的关键词：<br />' +
                    `${existMetaWords.map((s) => `“${s}”`).join(', ')}<br />` +
                    `建议前往 ${discussLink} 讨论。<br />` +
                    '这是为了防止占用讨论资源，营造一个更高质量的社区。 <br />' +
                    '我们很担心 exlg 相关讨论霸占版面，造成负面影响。<br />' +
                    '<span style="color: orange">' +
                    '<b>洛谷管理员提醒您：发布无意义讨论可能导致禁言。</b> <br />' +
                    '<small>* 无意义讨论包括但不限于“大家看得到我的 badge 吗” 等等</small>' +
                    '</span> <br />' +
                    '如果您确定要发送，请在下方输入框键入 “放心” 后确定。<br />' +
                    '<small class="comment">（输入框过一会才会出现）</small>',
                {
                    onAccept: () => {
                        if (!$confirmInput) return false
                        if ($confirmInput.val() !== '放心') return false
                        setTimeout(() => $newpostSubmit.trigger('click'), 500)
                        return true
                    },
                    onOpen: async ($content) => {
                        // Note: 3 秒后显示输入框
                        await utils.sleep(3000)
                        $($content).find('small.comment').remove()
                        $confirmInput = $('<input type="text" />').appendTo(
                            $content
                        ) as JQuery<HTMLInputElement>
                    }
                }
            )
        }
    },
    true
) // Note: 使用事件捕获

export const a = 1
export const b = 2
