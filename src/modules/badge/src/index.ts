import '@exlg/core/types/module-entry'
import type { SchemaToStorage } from '@exlg/core/types'
import type { TokenExportType } from '@exlg/mod-token'
import { LuoguColorType } from '@exlg/core/utils'
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

    utils.addHookAndCallback((insertedNodes) => {
        let hookedNodes: Node[] = []
        let info: Array<BadgeInjectTargetInterfaceType> = []
        insertedNodes.forEach((e) => {
            allTargets.forEach(({ pathTest, domSelector, type }) => {
                if (pathTest(window.location)) {
                    if (((e as Element).querySelectorAll)) {
                        const domList = Array.from(
                            (e as Element).querySelectorAll(domSelector),
                        ).filter(ccfLevelTagFilter)
                        if (domList.length !== 0) {
                            hookedNodes = hookedNodes.concat(domList)
                            info = info.concat(Array(domList.length).fill(type))
                        }
                    }
                }
            })
        })
        return { hookedNodes, info }
    }, async ({ hookedNodes, info }) => {
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
                const _nbsp = document.createElement('span')
                _nbsp.innerHTML = '&nbsp;'
                tmp = utils.kthParentNode(tar, typeList[i].anceLevel)
                if (!tmp) return
                $(tmp).after(badgeDom.$badge)
                if (typeList[i].anceLevel === 0) tmp.after(_nbsp)
            }
        })
    })

    const register_badge = () => {
        log(token ?? '')
        utils.simpleAlert(badgeRegisterHTML, {
            title: '注册 badge',
            onAccept: async ({ $content }) => {
                const $active = $($content.querySelector('input[key=\'badgeActive\']') as HTMLElement)
                const $text = $($content.querySelector('input[key=\'badgeText\']') as HTMLElement)
                const $ft = $($content.querySelector('input[key=\'badgeFt\']') as HTMLElement)
                const $fg = $($content.querySelector('input[key=\'badgeFg\']') as HTMLElement)
                const $fs = $($content.querySelector('input[key=\'badgeFs\']') as HTMLElement)
                const $fw = $($content.querySelector('input[key=\'badgeFw\']') as HTMLElement)
                const $bd = $($content.querySelector('input[key=\'badgeBd\']') as HTMLElement)
                const $bg = $($content.querySelector('input[key=\'badgeBg\']') as HTMLElement)
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
                    activation: $active.text(),
                    data,
                    token,
                })
                let content = ''
                if (response.status === 200) {
                    content = '注册成功'
                    Object.assign(badges, sto.get('badge'))
                    badges[utils.luoguUser.uid] = {
                        ts: utils.getCurTime(),
                        badge: response.json.data,
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
                const $active = $($content.querySelector('input[key=\'badgeActive\']') as HTMLElement)
                const $text = $($content.querySelector('input[key=\'badgeText\']') as HTMLElement)
                const $ft = $($content.querySelector('input[key=\'badgeFt\']') as HTMLElement)
                const $fg = $($content.querySelector('input[key=\'badgeFg\']') as HTMLElement)
                const $fs = $($content.querySelector('input[key=\'badgeFs\']') as HTMLElement)
                const $fw = $($content.querySelector('input[key=\'badgeFw\']') as HTMLElement)
                const $bd = $($content.querySelector('input[key=\'badgeBd\']') as HTMLElement)
                const $bg = $($content.querySelector('input[key=\'badgeBg\']') as HTMLElement)
                const $preview = $($content.querySelector('#exlg-badge-preview') as HTMLElement)
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
                $.extend($ft, $fg, $fs, $fw, $bd, $bg)
                    .on('input', () => {
                        setBadgeStyle(userNameColor, getBadgeStyle(), $badge)
                    })
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
