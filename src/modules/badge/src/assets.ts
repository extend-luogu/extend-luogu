export interface BadgeType {
    bg: string
    fg: string
    text: string
    ft: string
    fw: string
    bd: string
    fs: string
    ts: number
    lg4: boolean
}

export type LuoguVersion =
    | 'luogu3'
    | 'luogu4'

export type BadgeInjectTargetElementType =
    | 'solution'
    | 'problem'
    | 'user-feed'
    | 'user-follow'
    | 'luogu3'

export interface BadgeInjectTargetInterfaceType {
    displayType: LuoguVersion,
    elementType: BadgeInjectTargetElementType,
    anceLevel: number,
}

export interface BadgeInjectTargetType {
    pathTest: (location: Location) => boolean,
    domSelector: string,
    type: BadgeInjectTargetInterfaceType,
}

export const allTargets: Array<BadgeInjectTargetType> = [
    { // 题解
        pathTest: ({ pathname }) => /^\/problem\/solution.*$/.test(pathname),
        domSelector: ".card>.info-rows a[target='_blank']",
        type: { displayType: 'luogu4', elementType: 'solution', anceLevel: 3 },
    },
    { // 出题人
        pathTest: ({ pathname }) => /^\/problem\/.*$/.test(pathname),
        domSelector: ".full-container .user a[target='_blank']",
        type: { displayType: 'luogu4', elementType: 'problem', anceLevel: 0 },
    },
    { // 个人主页 - 动态
        pathTest: ({ pathname, hash }) => (/^\/user\/[0-9]{0,}.*$/.test(pathname) && hash === '#activity'),
        domSelector: ".feed a[target='_blank']",
        type: { displayType: 'luogu4', elementType: 'user-feed', anceLevel: 3 },
    },
    { // 个人主页 - 关注
        pathTest: ({ pathname, hash }) => (/^\/user\/[0-9]{0,}.*$/.test(pathname) && /^#following/.test(hash)),
        domSelector: ".follow-container a[target='_blank']",
        type: { displayType: 'luogu4', elementType: 'user-follow', anceLevel: 1 },
    },
    { // 默认(谷三代前端)
        pathTest: () => true,
        domSelector: "a[target='_blank'][href^='/user/']",
        type: { displayType: 'luogu3', elementType: 'luogu3', anceLevel: 0 },
    },
]

export const ccfLevelTagFilter = (tar: Element) => !(tar.querySelectorAll('svg').length)

export const getColor = (e: Element): string => {
    const classes = e.className.split(' ')
    for (const i in classes) {
        if (classes[i].startsWith('lg-fg-')) return classes[i].slice('lg-fg-'.length)
    }
    if (e.childNodes.length) return (e.childNodes[0] as Element).computedStyleMap().get('color')?.toString() ?? ''
    return ''
}
