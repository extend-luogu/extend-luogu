import '@exlg/core/types/module-entry'

const judge_problem = (text: string) =>
    [
        /^AT[1-9][0-9]{0,}$/i,
        /^CF[1-9][0-9]{0,}[A-Z][0-9]?$/i,
        /^SP[1-9][0-9]{0,}$/i,
        /^P[1-9][0-9]{3,}$/i,
        /^UVA[1-9][0-9]{2,}$/i,
        /^U[1-9][0-9]{0,}$/i,
        /^T[1-9][0-9]{0,}$/i,
        /^B[2-9][0-9]{3,}$/i
    ].some((re) => re.test(text))

$(window).on('dblclick', () => {
    const str = window.getSelection()?.toString().trim().toUpperCase()
    if (str && judge_problem(str))
        window.open('https://www.luogu.com.cn/problem/' + str)
})
