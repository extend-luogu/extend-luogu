import '@exlg/core/types/module-entry'

utils.mustMatch(/^\/user\/[0-9]+/)

const color = [
    [191, 191, 191],
    [254, 76, 97],
    [243, 156, 17],
    [255, 193, 22],
    [82, 196, 26],
    [52, 152, 219],
    [157, 61, 207],
    [14, 29, 105]
].map(([r, g, b]) => `rgb(${r},${g},${b})`)

interface ProblemSummary {
    pid: string
    title: string
    difficulty: number
    fullScore: number
    type: string
}

let makeMapProcess: null | Promise<void> = null
const pid2diff = new Map<string, number>()
async function makeMap() {
    const feInfo = (entry: string) =>
        _feInstance.currentData[entry] ?? _feInjection.currentData[entry]
    function insertProblems(proList: ProblemSummary[]) {
        proList.forEach((pro) => pid2diff.set(pro.pid, pro.difficulty))
    }
    try {
        insertProblems(feInfo('passedProblems'))
        insertProblems(feInfo('submittedProblems'))
    } catch (err) {
        throw Error(err + '\nNo _feInstance or _feInjection spotted')
    }
}

utils.addHookSelector('span.problem-id > a', async (hookedNodes) => {
    if (makeMapProcess === null) makeMapProcess = makeMap()
    await makeMapProcess
    ;(hookedNodes as HTMLElement[]).forEach((node) => {
        node.style.color = color[pid2diff.get(node.innerText)!]
    })
})
