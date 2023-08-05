import '@exlg/core/types/module-entry'
import type { SchemaToStorage } from '@exlg/core/types'
import type Scm from './schema'

utils.mustMatch('/')

function doublize<S, T>(func: (arg: S) => T, arg1: S, arg2: S): T[] {
    return [func(arg1), func(arg2)]
}

interface cardProp {
    text: string
    color: string
    id: number | string
}

// https://github.com/0f-0b/luogu-api-docs/blob/main/luogu-api.d.ts
interface LuoguResponse<T> {
    code: number
    currentData: T
}

interface PagedList<T> {
    result: T[]
    count: number
    perPage: number | null
}

interface ProblemSummary {
    pid: string
    title: string
    difficulty: number
    fullScore: number
    type: string
}

function judgeProblem(text: string) {
    return [
        /^AT[1-9][0-9]{0,}$/i,
        /^CF[1-9][0-9]{0,}[A-Z][0-9]?$/i,
        /^SP[1-9][0-9]{0,}$/i,
        /^P[1-9][0-9]{3,}$/i,
        /^UVA[1-9][0-9]{2,}$/i,
        /^U[1-9][0-9]{0,}$/i,
        /^T[1-9][0-9]{0,}$/i,
        /^B[2-9][0-9]{3,}$/i,
    ].some((re) => re.test(text))
}

function jumpProblem(str: string) {
    // Note: 跳转题目
    if (judgeProblem(str)) str = str.toUpperCase()
    if (str === '' || typeof str === 'undefined') {
        utils.simpleAlert('请输入题号', {
            title: '提示',
        })
    }
    else window.location.href = `https://www.luogu.com.cn/problemnew/show/${str}`
}

function lg_content(url: string) {
    return new Promise((res, rej) => {
        $.get(
            `${url + (url.includes('?') ? '&' : '?')}_contentOnly=1`,
            (data) => {
                if (data.code !== 200) rej(new Error(`Requesting failure code: ${data.code}.`))
                res(data)
            },
        )
    })
}

const sto = runtime.storage as SchemaToStorage<typeof Scm>

const dif_list = [
    ['入门', 'red'],
    ['普及-', 'orange'],
    ['普及/提高-', 'yellow'],
    ['普及 +/提高', 'green'],
    ['提高 +/省选-', 'blue'],
    ['省选/NOI-', 'purple'],
    ['NOI/NOI+/CTSC', 'black'],
    ['暂无评定', 'gray'],
].map(
    (e, i, arr) => ({
        text: e[0],
        color: e[1],
        id: (i + 1) % arr.length,
    } as cardProp),
)
const src_list: cardProp[] = [
    {
        text: '洛谷题库',
        color: 'red',
        id: 'P',
    },
    {
        text: 'Codeforces',
        color: 'orange',
        id: 'CF',
    },
    {
        text: 'SPOJ',
        color: 'yellow',
        id: 'SP',
    },
    {
        text: 'AtCoder',
        color: 'green',
        id: 'AT',
    },
    {
        text: 'UVA',
        color: 'blue',
        id: 'UVA',
    },
]

// Note: 重新构建界面
let $input = $("input[name='toproblem']")
$input.after($input.clone()).remove()
$input = $("input[name='toproblem']")

let $jump = $(".am-btn[name='goto']")
$jump.after($jump.clone()).remove()
$jump = $(".am-btn[name='goto']")

const $btn_list = $jump.parent()
const $settings_dash = $(
    '<div id="exlg-dash-0" class="exlg-rand-settings">ex 设置</div>',
)

$(".am-btn[name='gotorandom']").text('随机')
const $jump_exrand = $(
    '<button class="am-btn am-btn-success am-btn-sm" name="gotorandomex">随机 ex</button>',
).appendTo($btn_list)

$jump.on('click', () => {
    const inputVal = String($input.val())
    if (/^[0-9]+.?[0-9]*$/.test(inputVal)) $input.val(`P${$input.val()}`)
    jumpProblem(inputVal)
})
$input.on('keydown', (e) => {
    if (e.keyCode === 13) $jump.click()
})
// Note: board
const $board = $(`<span id="exlg-exrand-window" class="exlg-window" style="display: block;">
<br>
<ul></ul>
</span>`)
    .appendTo($settings_dash)
    .css({
        position: 'absolute',
        left: '-100px',
        top: '20px',
        'z-index': 9,
        'font-weight': 'initial',
    })
/*
    .hide()
    .on("mouseenter", () => { mouse_on_board = true; })
    .on("mouseleave", () => {
        mouse_on_board = false;
        if (!mouse_on_dash) {
            $board.hide();
        } // Hack: 维护 onboard
    }); */
$('.lg-index-stat>h2').text('问题跳转 ').append($settings_dash)
const $ul = $board.children('ul').css('list-style-type', 'none')

const $exrand_menu = $('<div id="exlg-exrand-menu"></div>').appendTo($ul)
$('<br>').appendTo($ul)
const $exrand_diff = $(
    '<div id="exlg-exrand-diff" class="smallbtn-list"></div>',
).appendTo($ul)
const $exrand_srce = $(
    '<div id="exlg-exrand-srce" class="smallbtn-list"></div>',
)
    .appendTo($ul)
    .hide()

const $entries = doublize(
    (text) => $(
        `<div class="exlg-rand-settings exlg-unselectable exrand-entry">${text}</div>`,
    ).appendTo($exrand_menu),
    '题目难度',
    '题目来源',
)
$entries[0].after($('<span class="exlg-unselectable">&nbsp;&nbsp;</span>'))
$entries[0].addClass('selected').css('margin-right', '38px')

doublize(
    ([$entry, $div]) => {
        $entry.on('click', () => {
            $('.exrand-entry').removeClass('selected')
            $entry.addClass('selected')
            $('.smallbtn-list').hide()
            $div.show()
        })
    },
    [$entries[0], $exrand_diff],
    [$entries[1], $exrand_srce],
)

doublize(
    ([$parent, obj_list, stoKey]: [
        JQuery<HTMLElement>,
        cardProp[],
        string,
    ]) => {
        const $lists = doublize(
            ([classname, desctext]) => $(`<span class="${classname}">
    <span class="lg-small lg-inline-up exlg-unselectable">${desctext}</span>
    <br>
    </span>`).appendTo($parent),
            ['exrand-enabled', '已选择'],
            ['exrand-disabled', '未选择'],
        )
        obj_list.forEach((obj, index) => {
            const $btn = doublize(
                ($p) => $(
                    `<div class="exlg-smallbtn exlg-unselectable">${obj.text}</div>`,
                )
                    .css(
                        'background-color',
                        `var(--lg-${obj.color}-problem)`,
                    )
                    .appendTo($p),
                $lists[0],
                $lists[1],
            )
            doublize(
                (b) => {
                    $btn[b].on('click', () => {
                        $btn[b].hide()
                        $btn[1 - b].css('display', 'inline-block')

                        sto.do(stoKey, (arr) => {
                            arr[index] = !!b
                            return arr
                        })
                    })
                    if (sto.get(stoKey)[index] === !!b) $btn[b].hide()
                },
                0,
                1,
            )
        })
    },
    [$exrand_diff, dif_list, '_exrandDifficulty'],
    [$exrand_srce, src_list, '_exrandSource'],
)

$('#exlg-dash-0').on('mouseenter', () => {
    doublize(
        ([$p, stoKey]: [JQuery<HTMLElement>, string]) => {
            doublize(
                ([jqstr, bln]: [string, boolean]) => {
                    $p.children(jqstr)
                        .children('.exlg-smallbtn')
                        .each((i, e, $e = $(e)) => {
                            if (sto.get(stoKey)[i] === bln) $e.css('display', 'inline-block')
                            else $e.hide()
                        })
                },
                ['.exrand-enabled', true],
                ['.exrand-disabled', false],
            )
        },
        [$exrand_diff, '_exrandDifficulty'],
        [$exrand_srce, '_exrandSource'],
    ) // Hack: 防止开两个页面瞎玩的情况
})

const exrand_poi = async () => {
    // Note: 异步写法（用到了 lg_content）
    const result = doublize(
        ([l, stoKey, _empty]: [cardProp[], string, (string | number)[]]) => {
            let g: (string | number)[] = []
            l.forEach((e, i) => {
                if (sto.get(stoKey)[i]) g.push(e.id)
            })
            if (!g.length) {
                // exlg_alert("您没有设置"); // Note: 没有设置但是有默认选项，写这行的是不是没看懂我在干嘛
                g = _empty
                l.forEach((e, i) => sto.do(stoKey, (arr) => {
                    arr[i] = _empty.includes(e.id)
                    return arr
                }))
            }
            return g[Math.floor(Math.random() * g.length)]
        },
        [dif_list, '_exrandDifficulty', [0, 1, 2, 3, 4, 5, 6, 7]],
        [src_list, '_exrandSource', ['P']],
    )
    let res = (await lg_content(
        `/problem/list?difficulty=${result[0]}&type=${result[1]}&page=1`,
    )) as LuoguResponse<{ problems: PagedList<ProblemSummary>; page: number }>

    const problem_count = res.currentData.problems.count
    const page_count = Math.ceil(problem_count / 50)
    const rand_page = Math.floor(Math.random() * page_count) + 1

    res = (await lg_content(
        `/problem/list?difficulty=${result[0]}&type=${result[1]}&page=${rand_page}`,
    )) as LuoguResponse<{ problems: PagedList<ProblemSummary>; page: number }>
    const PagedList = res.currentData.problems.result
    const rand_idx = Math.floor(Math.random() * PagedList.length)
    const { pid } = PagedList[rand_idx]
    window.location.href = `/problem/${pid}`
}

$jump_exrand.on('click', exrand_poi)
