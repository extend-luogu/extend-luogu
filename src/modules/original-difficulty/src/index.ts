import '@exlg/core/types/module-entry'
import type { SchemaToStorage } from '@exlg/core/types'
import type Scm from './schema'

interface CFResponse<T> {
    status: 'OK' | 'FAILED'
    result: T
}

// https://codeforces.com/apiHelp/objects#Problem
interface CFProblem {
    contestId?: number
    problemsetName?: string
    index: string
    name: string
    type: 'PROGRAMMING' | 'QUESTION'
    points: number
    rating?: number
    tags: string[]
}

interface ATProblemStatistics {
    difficulty?: number
}

utils.mustMatch(/^\/problem\/[0-9A-Z]+/)
const sto = runtime.storage as SchemaToStorage<typeof Scm>

const difficulty = sto.get('_difficulty')

function makeDifficulty(rawDiff: number) {
    if (rawDiff >= 400) return rawDiff
    return Math.round(400 / Math.exp(1.0 - rawDiff / 400))
}

const fetchATDifficulty = utils.loadChore(
    sto.get('_ATLastFetched'),
    '1D',
    (now) => sto.set('_ATLastFetched', now),
    async () => {
        const resp = (
            await utils.csGet(
                'https://kenkoooo.com/atcoder/resources/problem-models.json',
            )
        ).json as Record<string, ATProblemStatistics>
        for (const key in resp) {
            const tmpDiff = resp[key].difficulty
            if (tmpDiff) difficulty[key] = makeDifficulty(tmpDiff)
        }

        sto.set('_difficulty', difficulty)
    },
)

let lastHookedUrl = ''
utils.addHookSelector('div.stat > div.field', async ({ hookedNodes }) => {
    if (window.location.href === lastHookedUrl) return
    if (!/CF|AT/.test(window.location.pathname)) return
    lastHookedUrl = window.location.href

    const $tar = $(hookedNodes[3])
    const $y = $tar.clone(true)
    $tar.after($y as JQuery<HTMLElement>)
    const [$title, $status] = $y
        .find('span')
        .get()
        .map((e) => $(e))
    $title.text('原始难度')
    $status.text('获取中')

    let currentDifficulty
    if (window.location.pathname.includes('CF')) {
        // better api: https://codeforces.com/apiHelp/methods#contest.standings
        const problemId = _feInstance.currentData.problem.pid.substring(2)
        const contestId = +problemId.match(/\d+/g)[0]
        const inContestIndex = problemId.match(/[A-Z]\d*$/g)[0]
        const resp = (
            await utils.csGet(
                `https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`,
            )
        ).json as CFResponse<{
            problems: CFProblem[]
        }>
        if (resp.status !== 'OK') {
            warn('Codeforces API unavailable.')
        }
        else {
            for (const problem of resp.result.problems) {
                if (problem.index === inContestIndex) {
                    currentDifficulty = problem.rating
                }
            }
        }
    }
    else {
        await fetchATDifficulty
        currentDifficulty = difficulty[_feInstance.currentData.problem.description
            .match(/^.{22}[-./A-Za-z0-9_]*/)[0]
            .match(/[^/]*$/)[0]
        ]
    }
    $status.text(currentDifficulty ?? '不可用')
})
