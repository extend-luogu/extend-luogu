import '@exlg/core/types/module-entry'
import { SchemaToStorage } from '@exlg/core/types'
import type Scm from './schema'

interface SubscribedUserInfo {
    uid: number
    name: string
    passedProblemCount: number
}

interface JuanDelta {
    uid: string
    name: string
    delta: number
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
                },
            },
        )
    }
    updateProgress(0)

    const {
        result: firstResult,
        count,
        perPage,
    } = (await utils.csGet(api)).json.users
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

                currentFetched += result.json.users.result.length
                updateProgress(currentFetched / count)
                return result
            })(),
        )
    }

    const results = [
        firstResult,
        ...(await Promise.all(pendingResults)).map(
            ({ json: data }) => data.users.result,
        ),
    ].flat()

    const juanInfo: JuanInfo = Object.fromEntries(
        results.map(({ uid, name, passedProblemCount }: SubscribedUserInfo) => [
            uid,
            { name, count: passedProblemCount },
        ]),
    )

    const lastJuanInfo = sto.get('_lastFetched')
    sto.set('_lastFetched', juanInfo)

    if (isHalted) return

    const juans: JuanDelta[] = []
    for (const uid in juanInfo) {
        if (lastJuanInfo[uid]) {
            juans.push({
                uid,
                name: juanInfo[uid].name,
                delta: juanInfo[uid].count - lastJuanInfo[uid]!.count,
            })
        }
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
            `,
        )
        .join('')

    utils.simpleAlert(
        `
            <p>从上一次打卡到现在，关注用户中卷题量前三为：</p>
            ${juans.length < 3 ? '<p>卷题人数不足三位，明天再看看吧</p>' : ''}
            <ol style="margin: 0 25% 0 20%;">${juanList}</ol>
            <input id="ji-input" placeholder="输入 uid 或用户名查询用户卷题数" style="
                width: 60%;
                padding: 3px;
                margin: 10px 20% 0px 20%;
            ">
        `,
        {
            title: '卷王监视器',
            noCancel: true,
        },
    )
    let searchResultNode: null | JQuery<HTMLElement> = null
    $('#ji-input').on('keydown', (e) => {
        if (e.key === 'Enter') {
            if (searchResultNode === null) {
                searchResultNode = $('<p>').insertAfter(e.currentTarget)
            }
            const inputUid = (e.currentTarget as HTMLInputElement).value
            const target = juans.find(
                ({ uid, name }) => uid === inputUid
                    || name.toLocaleUpperCase() === inputUid.toLocaleUpperCase(),
            )
            if (target === undefined) {
                searchResultNode.text('该用户不在你的关注列表中')
            }
            else {
                searchResultNode.text(
                    `${target.name} 卷了 ${target.delta} 道题`,
                )
            }
        }
    })
}

$('[name=punch]').on('click', inspect)

runtime.interfaces = {
    inspect: {
        description: '手动监视',
        fn: inspect,
    },
}
