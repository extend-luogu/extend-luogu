import '@exlg/core/types/module-entry'
import type { SchemaToStorage } from '@exlg/core/types'
import { type LuoguFgColorClassName } from '@exlg/core/utils'
import type { TokenExportType } from '@exlg/mod-token'
import type Scm from './schema'
import {
    BadgeInjectTargetInterfaceType, BadgeType, allTargets, ccfLevelTagFilter, getColor,
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

    const getBadge = (
        uid: number,
        namecol: string,
        bdty: string,
        badge: BadgeType,
        onClickActive = true,
    ) => {
        const $badge = (!badge.text) ? $('')
            : $(`<span class="exlg-badge" badge-uid="${uid}" badge-type="${bdty}">${utils.xss.process(badge.text)}</span>`)
                .css({
                    background: (badge.bg || 'mediumturquoise').replaceAll(
                        '${luogu-default}', // eslint-disable-line no-template-curly-in-string
                        utils.luoguFgColorClassNameHex[namecol as LuoguFgColorClassName] ?? namecol,
                    ),
                    color: badge.fg || '#fff',
                    'font-family': badge.ft || '',
                    'font-weight': badge.fw || '700',
                    'font-size': badge.fs || '',
                    border: badge.bd || '',
                /* "background-size": "contain", */
                /* "background-repeat": "no-repeat", */
                })
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
        for (const uid in response) {
            response[uid].ts = utils.getCurTime()
        }
        Object.assign(badges, response)
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

    // const getStyleList = (badgeType: LuoguVersion, badgeData: BadgeType) => {
    //     if (badgeType === "luogu3" || !Object.keys(badgeData).includes("lg4")) return badgeData;
    //     const badgeClone = { ...badgeData };
    //     delete badgeClone.lg4;
    //     return Object.assign(Object.clone(badgeData.lg4));
    // };

    const loaded: Set<string> = new Set<string>()
    let badges: Record<string, BadgeType> = {}
    const promises: Promise<void>[] = []

    Object.assign(badges, JSON.parse(sto.get('badges')))

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

        const pending = Array.from(hookedNodes).map((e) => {
            const uid = (e as Element).attributes.getNamedItem('href')?.value.slice('/user/'.length)
            if (!uid) return null
            if (!loaded.has(uid) && !(uid in badges && utils.getCurTime() - badges[uid].ts <= sto.get('cache'))) {
                loaded.add(uid)
                return uid
            }
            return null
        })
        if (pending.length) {
            promises.push(updateStorage(pending as string[]))
        }
        await Promise.all(promises)
        sto.set('badges', JSON.stringify(badges))

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
            if (!badge?.text) return
            let [tar, tarNext] = [e, e.nextElementSibling]
            if (tarNext && ((tarNext.classList ? Array.from(tarNext.classList) : tarNext.className.split(' ')).includes('sb_amazeui'))) {
                tar = tarNext
                tarNext = tar.nextElementSibling
            }

            const badgeDom = getBadge(+uid, getColor(e), typeList[i].displayType, badge)

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

    }
})
