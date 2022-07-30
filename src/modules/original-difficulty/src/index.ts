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

const fetchProcess = (async () => {
    await utils.loadChore(
        sto.get('_CFLastFetched'),
        '10D',
        (now) => sto.set('_CFLastFetched', now),
        async () => {
            const resp = (
                await utils.csGet(
                    'https://codeforces.com/api/problemset.problems?lang=en'
                )
            ).data as CFResponse<{
                problems: CFProblem[]
                problemStatistics: unknown[]
            }>
            if (resp.status !== 'OK') {
                warn('Codeforces API unavailable.')
                return
            }
            resp.result.problems.forEach((problem: CFProblem) => {
                if (problem.rating)
                    difficulty['CF' + problem.contestId + problem.index] =
                        problem.rating
            })
            sto.set('_difficulty', difficulty)
        }
    )

    await utils.loadChore(
        sto.get('_ATLastFetched'),
        '10D',
        (now) => sto.set('_ATLastFetched', now),
        async () => {
            const resp = (
                await utils.csGet(
                    'https://kenkoooo.com/atcoder/resources/problem-models.json'
                )
            ).data as Record<string, ATProblemStatistics>
            for (const key in resp) {
                const tmpDiff = resp[key].difficulty
                if (tmpDiff) difficulty[key] = makeDifficulty(tmpDiff)
            }

            sto.set('_difficulty', difficulty)
        }
    )
})()

let lastHookedUrl = ''
utils.addHookSelector('div.stat > div.field', (hookedNodes) => {
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

    fetchProcess.then(() =>
        $status.text(
            difficulty[
                window.location.pathname.includes('CF')
                    ? _feInstance.currentData.problem.pid
                    : _feInstance.currentData.problem.description
                          .match(/^.{22}[-./A-Za-z0-9_]*/)[0]
                          .match(/[^/]*$/)[0]
            ] ?? '不可用'
        )
    )
})
