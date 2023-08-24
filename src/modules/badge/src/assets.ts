export interface BadgeType {
    bg: string
    fg: string
    text: string
    ft: string
    fw: string
    bd: string
    fs: string
    lg4?: boolean
}

export interface StorageType {
    ts: number
    badge: BadgeType
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

export const defaultBadge: BadgeType = {
    bg: 'mediumturquoise',
    fg: '#fff',
    ft: '',
    fw: '700',
    fs: '',
    bd: '',
    text: '',
    lg4: false,
}

export const badgeRegisterHTML = `
<span>
    <span class="exlg-regbadge-fronttitle">激活码</span>
    <input key="badgeActive" class="exlg-input" type="text" style="padding: .1em;" />
</span>
<br />
<span>
    <span class="exlg-regbadge-fronttitle">内容</span>
    <input key="badgeText" class="exlg-input" type="text" style="padding: .1em;" />
</span>
<br />
<span>
    <span class="exlg-regbadge-fronttitle">字体</span>
    <input key="badgeFt" class="exlg-input" type="text" style="padding: .1em;" />
</span>
<br />
<span>
    <span class="exlg-regbadge-fronttitle">字色</span>
    <input key="badgeFg" class="exlg-input" type="text" style="padding: .1em;" />
</span>
<br />
<span>
    <span class="exlg-regbadge-fronttitle">字号</span>
    <input key="badgeFs" class="exlg-input" type="text" style="padding: .1em;" />
</span>
<br />
<span>
    <span class="exlg-regbadge-fronttitle">字粗</span>
    <input key="badgeFw" class="exlg-input" type="text" style="padding: .1em;" />
</span>
<br />
<span>
    <span class="exlg-regbadge-fronttitle">边框</span>
    <input key="badgeBd" class="exlg-input" type="text" style="padding: .1em;" />
</span>
<br />
<span>
    <span class="exlg-regbadge-fronttitle">背景</span>
    <input key="badgeBg" class="exlg-input" type="text" style="padding: .1em;" />
</span>
<br />

<span id="exlg-badge-preview"></span>
`
