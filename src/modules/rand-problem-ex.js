import uindow, { $, judge_problem, lg_content } from "../utils.js"
import mod from "../core.js"
import css from "../resources/css/rand-problem-ex.css"

mod.reg("rand-problem-ex", "随机跳题_ex", "@/", {
    exrand_difficulty: {
        ty: "tuple",
        lvs: [
            { ty: "boolean", dft: false, strict: true, repeat: 8 }
        ],
        priv: true
    },
    exrand_source: {
        ty: "tuple",
        lvs: [
            { ty: "boolean", dft: false, strict: true, repeat: 5 }
        ],
        priv: true
    }
}, ({msto}) => {
    const dif_list = [
        [ "入门", "red" ], [ "普及-", "orange" ], [ "普及/提高-", "yellow" ], [ "普及+/提高", "green" ], [ "提高+/省选-", "blue" ], [ "省选/NOI-", "purple" ], [ "NOI/NOI+/CTSC", "black" ], [ "暂无评定", "gray" ]
    ].map((e, i, arr) => ({
        text: e[0],
        color: e[1],
        id: (i + 1) % arr.length,
    }))
    const src_list = [
        {
            text: "洛谷题库",
            color: "red",
            id: "P"
        },
        {
            text: "Codeforces",
            color: "orange",
            id: "CF"
        },
        {
            text: "SPOJ",
            color: "yellow",
            id: "SP"
        },
        {
            text: "AtCoder",
            color: "green",
            id: "AT"
        },
        {
            text: "UVA",
            color: "blue",
            id: "UVA"
        }
    ]

    const func_jump_problem = (str) => { // Note: 跳转题目
        if (judge_problem(str)) str = str.toUpperCase()
        if (str === "" || typeof (str) === "undefined") uindow.show_alert("提示", "请输入题号")
        else location.href = "https://www.luogu.com.cn/problemnew/show/" + str
    }

    let mouse_on_board = false, mouse_on_dash = false

    // Note: 重新构建界面
    let $input = $("input[name='toproblem']")
    $input.after($input.clone()).remove()
    $input = $("input[name='toproblem']")

    let $jump = $(".am-btn[name='goto']")
    $jump.after($jump.clone()).remove()
    $jump = $(".am-btn[name='goto']")

    const $btn_list = $jump.parent()

    $(".am-btn[name='gotorandom']").text("随机")
    const $jump_exrand = $(`<button class="am-btn am-btn-success am-btn-sm" name="gotorandomex">随机ex</button>`).appendTo($btn_list)

    $jump.on("click", () => {
        if (/^[0-9]+.?[0-9]*$/.test($input.val())) $input.val("P" + $input.val())
        func_jump_problem($input.val())
    })
    $input.on("keydown", e => {
        if (e.keyCode === 13) $jump.click()
    })
    // Note: board
    const $board = $(`<span id="exlg-exrand-window" class="exlg-window" style="display: block;">
    <br>
    <ul></ul>
    </span>`).appendTo($btn_list).hide()
        .on("mouseenter", () => { mouse_on_board = true })
        .on("mouseleave", () => {
            mouse_on_board = false
            if (!mouse_on_dash) {
                $board.hide()
            } // Hack: 维护onboard
        })
    $(".lg-index-stat>h2").text("问题跳转 ").append($(`<div id="exlg-dash-0" class="exlg-rand-settings">ex设置</div>`))
    const $ul = $board.children("ul").css("list-style-type", "none")

    const $exrand_menu = $(`<div id="exlg-exrand-menu"></div>`).appendTo($ul)
    $("<br>").appendTo($ul)
    const $exrand_diff = $(`<div id="exlg-exrand-diff" class="smallbtn-list"></div>`).appendTo($ul)
    const $exrand_srce = $(`<div id="exlg-exrand-srce" class="smallbtn-list"></div>`).appendTo($ul).hide()

    const $entries = $.double((text) => $(`<div class="exlg-rand-settings exlg-unselectable exrand-entry">${text}</div>`).appendTo($exrand_menu), "题目难度", "题目来源")
    $entries[0].after($(`<span class="exlg-unselectable">&nbsp;&nbsp;</span>`))
    $entries[0].addClass("selected").css("margin-right", "38px")

    $.double(([ $entry, $div ]) => {
        $entry.on("click", () => {
            $(".exrand-entry").removeClass("selected")
            $entry.addClass("selected")
            $(".smallbtn-list").hide()
            $div.show()
        })
    }, [ $entries[0], $exrand_diff ], [ $entries[1], $exrand_srce ])

    $.double(([ $parent, obj_list, msto_proxy ]) => {
        const $lists = $.double(([ classname, desctext ]) => $(`<span class="${classname}">
        <span class="lg-small lg-inline-up exlg-unselectable">${desctext}</span>
        <br>
        </span>`).appendTo($parent), [ "exrand-enabled", "已选择" ], [ "exrand-disabled", "未选择" ])
        obj_list.forEach((obj, index) => {
            const $btn = $.double(($p) => $(`<div class="exlg-smallbtn exlg-unselectable">${obj.text}</div>`).css("background-color", `var(--lg-${obj.color}-problem)`).appendTo($p), $lists[0], $lists[1])
            $.double((b) => {
                $btn[b].on("click", () => {
                    $btn[b].hide()
                    $btn[1 - b].show()
                    msto_proxy[index] = !!b
                })
                if (msto_proxy[index] === (!!b)) $btn[b].hide()
            }, 0, 1)
        })
    }, [ $exrand_diff, dif_list, msto.exrand_difficulty ], [ $exrand_srce, src_list, msto.exrand_source ])

    $("#exlg-dash-0").on("mouseenter", () => {
        mouse_on_dash = true

        $.double(([ $p, mproxy ]) => {
            // Kill: const _$smalldash = [$p.children(".exrand-enabled").children(".exlg-smallbtn"), $p.children(".exrand-disabled").children(".exlg-smallbtn")]

            $.double(([ jqstr, bln ]) => {
                $p.children(jqstr).children(".exlg-smallbtn").each((i, e, $e = $(e)) => (mproxy[i] === bln) ? ($e.show()) : ($e.hide()))
            }, [ ".exrand-enabled", true ], [ ".exrand-disabled", false ])
        }, [ $exrand_diff, msto.exrand_difficulty ], [ $exrand_srce, msto.exrand_source ]) // Hack: 防止开两个页面瞎玩的情况
        $board.show() // Hack: 鼠标放在dash上开window
    })
        .on("mouseleave", () => {
            mouse_on_dash = false // Hack: 离开dash和board超过200ms直接关掉
            if (!mouse_on_board) {
                setTimeout(() => {
                    if (!mouse_on_board) $board.hide()
                }, 200)
            }
        })

    const exrand_poi = async () => { // Note: 异步写法（用到了lg_content）
        const result = $.double(([ l, msto_proxy, _empty ]) => {
            let g = []
            l.forEach((e, i) => {
                if (msto_proxy[i]) g.push(e.id)
            })
            if (!g.length) g = _empty
            return g[Math.floor(Math.random() * g.length)]
        }, [ dif_list, msto.exrand_difficulty, [ 0, 1, 2, 3, 4, 5, 6, 7 ]], [ src_list, msto.exrand_source, [ "P" ]])
        let res = await lg_content(`/problem/list?difficulty=${result[0]}&type=${result[1]}&page=1`)

        const
            problem_count = res.currentData.problems.count,
            page_count = Math.ceil(problem_count / 50),
            rand_page = Math.floor(Math.random() * page_count) + 1

        res = await lg_content(`/problem/list?difficulty=${result[0]}&type=${result[1]}&page=${rand_page}`)
        const
            list = res.currentData.problems.result,
            rand_idx = Math.floor(Math.random() * list.length),
            pid = list[rand_idx].pid
        location.href = `/problem/${pid}`
    }

    $jump_exrand.on("click", exrand_poi)
}, css, "module")