import '@exlg/core/types/module-entry'
import type { SchemaToStorage } from '@exlg/core/types'
import type { TokenExportType } from '@exlg/mod-token'
import { LuoguColorType, HookType, CallbackType } from '@exlg/core/utils'
import type Scm from './schema'
import {
    BadgeInjectTargetInterfaceType,
    BadgeType,
    StorageType,
    allTargets,
    badgeRegisterHTML,
    ccfLevelTagFilter,
    defaultBadge,
    getColor,
    targetLuogu3,
} from './assets'

const dependencies = [inject('token')]

type DependenciesExportType = TokenExportType

Promise.all(dependencies).then((exportArray) => {
    const exp: DependenciesExportType = {}
    exportArray.forEach((e) => {
        Object.assign(exp, e)
    })

    const { token } = exp

    const sto = runtime.storage as SchemaToStorage<typeof Scm>

    const setBadgeStyle = (
        namecol: string,
        badge: BadgeType,
        $badge: JQuery<Element>,
    ) => $badge.css({
        background: (badge.bg || defaultBadge.bg).replaceAll(
            '${luogu-default}', // eslint-disable-line no-template-curly-in-string
            utils.luoguColorToHex(namecol as LuoguColorType) ?? namecol,
        ),
        color: badge.fg || defaultBadge.fg,
        'font-family': badge.ft || defaultBadge.ft,
        'font-weight': badge.fw || defaultBadge.fw,
        'font-size': badge.fs || defaultBadge.fs,
        border: badge.bd || defaultBadge.bd,
        /* "background-size": "contain", */
        /* "background-repeat": "no-repeat", */
    }).text(badge.text)

    const getBadge = (
        uid: number,
        namecol: string,
        bdty: string,
        badge: BadgeType,
        onClickActive = true,
    ) => {
        const $badge = $(`<span class="exlg-badge" badge-uid="${uid}" badge-type="${bdty}">${utils.processXSS(badge.text)}</span>`)
        setBadgeStyle(namecol, badge, $badge)
        if (badge.text && onClickActive) $badge.on('click', () => register_badge())
        return {
            $badge,
        }
    }

    const updateStorage = async (pending: string[]) => {
        const response: Record<string, BadgeType> = (await utils.csPost(
            'https://exlg.piterator.com/badge/mget',
            {
                uid: utils.luoguUser?.uid,
                token,
                data: pending,
            },
        )).json.data
        const processed: Record<string, StorageType> = {}
        for (const uid in response) {
            processed[uid] = {
                badge: response[uid],
                ts: utils.getCurTime(),
            }
        }
        Object.assign(badges, processed)
    }

    const findUidByImg = (target: Element | null, limit: number): string | null | undefined => {
        if (!limit) return null
        if (!target) return null
        const prev = target.previousElementSibling
        if (prev) {
            const imgElem = prev.tagName.toLowerCase() === 'img' ? prev : Array.from(prev.childNodes).filter((e) => (e as Element).tagName.toLowerCase() === 'img')[0] as Element
            if (imgElem) return imgElem.getAttribute('src')?.replace(/[^0-9]/ig, '')
        }
        return findUidByImg(target.parentElement, limit - 1)
    }

    const loaded: Set<string> = new Set<string>()
    let badges: Record<string, StorageType> = {}
    const promises: Promise<void>[] = []
    Object.assign(badges, sto.get('badge'))

    const hook: HookType = (insertedNodes, record) => {
        let hookedNodes: Node[] = []
        let info: Array<BadgeInjectTargetInterfaceType> = []
        if (record?.type === 'attributes') {
            const e = insertedNodes[0] as Element
            if (insertedNodes.length === 1 && record.attributeName === 'href' && e.getAttribute('href')?.startsWith('/user/')) {
                if (e.classList.contains('exlg-badge-username')) {
                    e.classList.remove('exlg-badge-username')
                    const nxt = e.nextElementSibling
                    if (nxt?.matches && nxt?.matches('.exlg-badge')) nxt.remove()
                }
                if (e.matches && e.matches(targetLuogu3.domSelector)) {
                    return { hookedNodes: insertedNodes, info: [targetLuogu3] }
                }
            }
            return { hookedNodes: [] }
        }
        insertedNodes.forEach((e) => {
            allTargets.forEach(({ pathTest, domSelector, type }) => {
                if (pathTest(window.location)) {
                    const eae = e as Element
                    if ((eae.querySelectorAll)) {
                        const domList = Array.from(
                            eae.querySelectorAll(domSelector),
                        ).filter(ccfLevelTagFilter)
                        if (eae.matches && eae.matches(domSelector)) domList.push(eae)
                        if (domList.length !== 0) {
                            hookedNodes = hookedNodes.concat(domList)
                            info = info.concat(Array(domList.length).fill(type))
                        }
                    }
                }
            })
        })
        return { hookedNodes, info }
    }

    const callback: CallbackType = async ({ hookedNodes, info }) => {
        const typeList = (info as Array<BadgeInjectTargetInterfaceType>)
        if (!typeList) return
        Array.from(hookedNodes).forEach((e) => {
            const uid = (e as Element).attributes.getNamedItem('href')?.value.slice('/user/'.length)
            if (!uid) return
            if (!loaded.has(uid) && !(uid in badges && utils.getCurTime() - badges[uid].ts <= sto.get('cache'))) {
                loaded.add(uid)
            }
        })
        const pending: string[] = Array.from(loaded)
        if (pending.length) {
            promises.push(updateStorage(pending))
        }
        await Promise.all(promises)
        sto.set('badge', badges)
        hookedNodes.forEach((n, i) => {
            const e = n as Element
            const $e = $(e)
            if (!$e || $e.hasClass('exlg-badge-username')) return
            $e.addClass('exlg-badge-username')
            let uid = $e.attr('href')?.slice('/user/'.length)
            if (typeList[i].elementType === 'problem') {
                const { provider } = _feInjection.currentData.problem
                if (provider.name === $e.text().trim()) uid = provider.uid.toString()
            }
            if (typeList[i].displayType === 'luogu4' && uid === 'ript:void 0') uid = findUidByImg(e, 5) ?? ' '
            if (!uid) return
            const badge = badges[uid]
            if (!badge.badge || $.isEmptyObject(badge.badge)) return
            let [tar, tarNext] = [e, e.nextElementSibling]
            if (tarNext && ((tarNext.classList ? Array.from(tarNext.classList) : tarNext.className.split(' ')).includes('sb_amazeui'))) {
                tar = tarNext
                tarNext = tar.nextElementSibling
            }

            const badgeDom = getBadge(+uid, getColor(e), typeList[i].displayType, badge?.badge)

            let tmp = utils.kthParentNode(tar, 3)
            if (tmp && ((tmp.classList ? Array.from(tmp.classList) : tmp.className.split(' ')).includes('card'))) {
                $(tar.parentNode as Element).append(badgeDom.$badge)
            }
            else {
                tmp = utils.kthParentNode(tar, typeList[i].anceLevel)
                if (!tmp) return
                $(tmp).after(badgeDom.$badge)
            }
        })
    }

    utils.addHookAndCallback(hook, callback, ['characterData', 'childList', 'attributes'])

    const register_badge = () => {
        utils.simpleAlert(badgeRegisterHTML, {
            title: '注册 badge',
            onAccept: async ({ $content }) => {
                const $active = $($content).find('input[key=\'badgeActive\']')
                const $text = $($content).find('input[key=\'badgeText\']')
                const $ft = $($content).find('input[key=\'badgeFt\']')
                const $fg = $($content).find('input[key=\'badgeFg\']')
                const $fs = $($content).find('input[key=\'badgeFs\']')
                const $fw = $($content).find('input[key=\'badgeFw\']')
                const $bd = $($content).find('input[key=\'badgeBd\']')
                const $bg = $($content).find('input[key=\'badgeBg\']')
                const data = {
                    bg: $bg.val(),
                    fg: $fg.val(),
                    ft: $ft.val(),
                    fw: $fw.val(),
                    fs: $fs.val(),
                    bd: $bd.val(),
                    text: $text.val(),
                }

                const response = await utils.csPost('https://exlg.piterator.com/badge/set', {
                    uid: utils.luoguUser?.uid,
                    activation: $active.val(),
                    data,
                    token,
                })
                let content = ''
                if (response.status === 200) {
                    content = '注册成功'
                    Object.assign(badges, sto.get('badge'))
                    badges[utils.luoguUser.uid] = {
                        ts: utils.getCurTime(),
                        badge: response.json.data[utils.luoguUser?.uid],
                    }
                    sto.set('badge', badges)
                }
                else if (response.status === 402) {
                    if (response.json.error === 'Invalid activation') content = '激活码错误'
                    else content = response.json.error
                }
                else content = '未知错误，请打开控制台截图并联系开发者'
                utils.simpleAlert(content, {
                    noCancel: true,
                })
            },
            onOpen: ($content) => {
                const userNameColor = utils.luoguColorToHex(
                    utils.luoguUser?.color as LuoguColorType,
                )
                const myBadge = badges[utils.luoguUser?.uid ?? 0]?.badge
                const $active = $($content).find('input[key=\'badgeActive\']')
                const $text = $($content).find('input[key=\'badgeText\']')
                const $ft = $($content).find('input[key=\'badgeFt\']')
                const $fg = $($content).find('input[key=\'badgeFg\']')
                const $fs = $($content).find('input[key=\'badgeFs\']')
                const $fw = $($content).find('input[key=\'badgeFw\']')
                const $bd = $($content).find('input[key=\'badgeBd\']')
                const $bg = $($content).find('input[key=\'badgeBg\']')
                const $preview = $($content).find('#exlg-badge-preview')
                const { $badge } = getBadge(
                    utils.luoguUser?.uid ?? 0,
                    userNameColor,
                    'luogu3',
                    myBadge || defaultBadge,
                    false,
                )
                $preview.append($badge)
                if (myBadge && !$.isEmptyObject(myBadge)) {
                    $active
                        .val('已激活')
                        .attr('disabled', 'disabled')
                }
                $text.val(utils.processXSS(myBadge?.text) || defaultBadge.text)
                $ft.val(myBadge?.ft || defaultBadge.ft)
                $fg.val(myBadge?.fg || defaultBadge.fg)
                $fs.val(myBadge?.fs || defaultBadge.fs)
                $fw.val(myBadge?.fw || defaultBadge.fw)
                $bd.val(myBadge?.bd || defaultBadge.bd)
                $bg.val(myBadge?.bg || defaultBadge.bg)
                const getBadgeStyle = () => ({
                    bg: $bg.val(),
                    fg: $fg.val(),
                    ft: $ft.val(),
                    fw: $fw.val(),
                    fs: $fs.val(),
                    bd: $bd.val(),
                    text: $text.val(),
                    ts: 0,
                    lg4: false,
                } as BadgeType)
                $text.on('input', () => {
                    $text.val(utils.processXSS($text.val()?.toString()))
                    setBadgeStyle(userNameColor, getBadgeStyle(), $badge)
                })

                const tmp = [$ft, $fg, $fs, $fw, $bd, $bg]
                tmp.forEach((e) => e.on('input', () => setBadgeStyle(userNameColor, getBadgeStyle(), $badge)))
            },
        })
    }

    runtime.interfaces = {
        inspect: {
            description: '注册 badge',
            fn: register_badge,
        },
    }
})
