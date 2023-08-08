import '@exlg/core/types/module-entry'

const judgeProblem = (text: string) => [
    /^AT[1-9][0-9]{0,}$/i,
    /^AT_(abc|arc|agc)[0-9]{0,}_[0-9a-z]$/i,
    /^CF[1-9][0-9]{0,}[A-Z][0-9]?$/i,
    /^SP[1-9][0-9]{0,}$/i,
    /^P[1-9][0-9]{3,}$/i,
    /^UVA[1-9][0-9]{2,}$/i,
    /^U[1-9][0-9]{0,}$/i,
    /^T[1-9][0-9]{0,}$/i,
    /^B[2-9][0-9]{3,}$/i,
].some((re) => re.test(text))

const transformPid = (text: string, isOptimistic = false): string => {
    // reserve old AtCoder IDs
    if (judgeProblem(text)) return text.toUpperCase()

    // special check for number-only ids(assume P started)
    // common numbers should be ignored
    if (isOptimistic && /^[1-9][0-9]{3,}$/.test(text)) return 'P' + text

    // if ID is CF-like, then consider CF prefix
    if (/^[1-9][0-9]+[A-Z][1-9]?$/i.test(text)) return 'CF' + text.toUpperCase()

    // three types of atcoder pid representation
    // formal one
    if (/^AT_[a-z0-9_]+$/.test(text)) return text

    // we only check ABC/ARC/AGC to avoid mischecks
    if (/^a(b|r|g)c[0-9]{3}_?[a-z]2?$/i.test(text)) {
        const contestType = text.substring(0, 3).toLowerCase()
        const rawContestId = text.substring(3, 6)
        const contestId = +rawContestId
        const applyOffsetCorrection = !text.includes('_')
        let problemId = text.at(-1)!
        if (!Number.isNaN(+problemId)) {
            problemId = text.at(-2)! + problemId
        }
        // special check for offsets of ARC contest
        if (
            applyOffsetCorrection
            && contestType === 'arc'
            && contestId <= 103
            && contestId >= 58
        ) {
            problemId = String.fromCharCode(problemId.charCodeAt(0) - 2)
                + problemId.substring(1)
        }
        return `AT_${contestType}${rawContestId}_${problemId.toLowerCase()}`
    }

    // other possible atcoder ids are counted as well in optimistic mode
    if (isOptimistic && /^[a-z0-9_]+$/.test(text)) return 'AT_' + text

    // cannot be identified
    return ''
}

const gotoProblem = (pid: string) => window.open(`https://www.luogu.com.cn/problem/${pid}`)
const gotoTransformedProblem = (pid: string) => gotoProblem(transformPid(pid.trim(), true))

$(window).on('dblclick', () => {
    const str = window.getSelection()?.toString().trim()
    if (str) {
        const pid = transformPid(str)
        if (pid !== '') gotoProblem(pid)
    }
})

runtime.interfaces = {
    manualJump: {
        description: '题号跳转',
        fn: () => utils.simpleAlert(
            `<input placeholder="输入 pid" style="
                width: 60%;
                padding: 3px 5px 3px 5px;
                margin: 10px 20% 0px 20%;
                line-height: 1.3;
            "/>`,
            {
                title: '题号跳转',
                onAccept({ $content }) {
                    gotoTransformedProblem(
                        String($($content).find('input').val()),
                    )
                },
                onOpen($content) {
                    $($content)
                        .find('input')
                        .on('keydown', (e) => {
                            if (e.key === 'Enter') {
                                gotoTransformedProblem(
                                    e.currentTarget.value,
                                )
                            }
                        })
                },
            },
        ),
    },
}
