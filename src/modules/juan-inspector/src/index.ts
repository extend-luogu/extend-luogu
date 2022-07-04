import '@exlg/core/types/module-entry'

interface SubscribedUserInfo {
    uid: number
    name: string
    passedProblemCount: number
}

utils.mustMatch(/\/$/)
const sto = runtime.storage!
const lastFetched = sto.get('lastFetched') ?? '[]'

$('[name=punch]').on('click', async () => {
    const { users } = await $.get(
        `/api/user/followings?user=${_feInjection.currentUser.uid}`
    )
    const { result, perPage } = users
    const pmList = []
    const userInfo: number[][] = []
    let count = users.count - perPage
    for (let pid = 2; count > 0; pid++, count -= perPage) {
        pmList.push(
            // eslint-disable-next-line @typescript-eslint/no-loop-func
            new Promise<void>((resolve, reject) => {
                $.get(
                    `/api/user/followings?user=${_feInjection.currentUser.uid}&page=${pid}`
                )
                    .then((res) => {
                        result.push(res.users.result)
                        resolve()
                    })
                    .catch((err) => {
                        reject(err)
                    })
            })
        )
    }
    await Promise.all(pmList)

    const uidMap = new Map()
    result.forEach(
        ({ uid, name, passedProblemCount }: SubscribedUserInfo, i: number) => {
            userInfo[i] = [uid, passedProblemCount]
            uidMap.set(uid, name)
        }
    )
    userInfo.sort((a: number[], b: number[]) => a[0] - b[0])
    const origCnt = JSON.parse(lastFetched)
    const juans = []
    sto.set('lastFetched', JSON.stringify(userInfo))

    let i = 0
    let j = 0
    while (i < userInfo.length && j < origCnt.length) {
        if (userInfo[i][0] === origCnt[j][0]) {
            juans.push([userInfo[i][0], userInfo[i][1] - origCnt[j][1]])
            i++
            j++
        } else if (userInfo[i][0] > origCnt[j][0]) {
            j++
        } else {
            i++
        }
    }
    juans.sort((a, b) => b[1] - a[1])

    if (juans.length) {
        utils.simpleAlert(`<p>从上一次打卡到现在，关注用户中卷题量前三为：</p>
        <ol style="margin: 0 25% 0 20%;">
            ${juans
                .slice(0, 3)
                .map(
                    ([uid, cnt]) =>
                        `<li class="juan-rnkitm"><span><a href="/user/${uid}">${uidMap.get(
                            uid
                        )}</a><span>${cnt} 道</span></span></li>`
                )
                .join('')}
        </ol>`)
    }
})
