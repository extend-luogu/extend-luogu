import '@exlg/core/types/module-entry'
import { SchemaToStorage } from '@exlg/core/types'
import type Scm from './schema'

interface SubscribedUserInfo {
    uid: number
    name: string
    passedProblemCount: number
}

type JuanInfo = Record<
    number,
    {
        name: string
        count: number
    }
>

utils.mustMatch('/')

const sto = runtime.storage as SchemaToStorage<typeof Scm>

const inspect = async () => {
    const api = `/api/user/followings?user=${_feInjection.currentUser.uid}`

    const pendingResults = []
    let isHalted = false

    const updateProgress = (ratio: number) => {
        if (isHalted) return
        utils.simpleAlert(
            `
                <span>
                    <span>加载用户中</span>
                    <br />
                    <div class="exlg-bar" style="background: lightgray">
                        <div
                            class="exlg-bar"
                            style="background: blue; width: ${ratio * 100}%"
                        ></div>
                    </div>
                </span>
            `,
            {
                title: '正在监视卷王',
                noAccept: true,
                onCancel() {
                    isHalted = true
                }
            }
        )
    }
    updateProgress(0)

    const {
        result: firstResult,
        count,
        perPage
    } = (await utils.csGet(api)).data.users
    updateProgress(perPage / count)

    let currentFetched = perPage
    for (
        let countNow = perPage, pid = 2;
        countNow < count;
        pid++, countNow += perPage
    ) {
        pendingResults.push(
            // eslint-disable-next-line @typescript-eslint/no-loop-func
            (async () => {
                const result = await utils.csGet(api + '&page=' + pid)
                log('pid=%d', pid)

                currentFetched += result.data.users.result.length
                updateProgress(currentFetched / count)
                return result
            })()
        )
    }

    const results = [
        firstResult,
        ...(await Promise.all(pendingResults)).map(
            ({ data }) => data.users.result
        )
    ].flat()

    const juanInfo: JuanInfo = Object.fromEntries(
        results.map(({ uid, name, passedProblemCount }: SubscribedUserInfo) => [
            uid,
            { name, count: passedProblemCount }
        ])
    )

    const lastJuanInfo = sto.get('_lastFetched')
    sto.set('_lastFetched', juanInfo)

    if (isHalted) return

    const juans = []
    for (const uid in juanInfo) {
        if (lastJuanInfo[uid])
            juans.push({
                uid,
                name: juanInfo[uid].name,
                delta: juanInfo[uid].count - lastJuanInfo[uid]!.count
            })
    }

    const juanList = juans
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 3)
        .filter((x) => x)
        .map(
            ({ uid, name, delta }) => `
                <li class="juan-rnkitm">
                    <span>
                        <a href="/user/${uid}">${name}</a> <span>${delta} 道</span>
                    </span>
                </li>
            `
        )
        .join('')

    utils.simpleAlert(
        `
            <p>从上一次打卡到现在，关注用户中卷题量前三为：</p>
            ${juans.length < 3 ? '<p>卷题人数不足三位，明天再看看吧</p>' : ''}
            <ol style="margin: 0 25% 0 20%;">${juanList}</ol>
        `,
        {
            title: '卷王监视器',
            noCancel: true
        }
    )
}

$('[name=punch]').on('click', inspect)

runtime.interfaces = {
    inspect: {
        description: '手动监视',
        fn: inspect
    }
}
