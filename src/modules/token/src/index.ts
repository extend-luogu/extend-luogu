import '@exlg/core/types/module-entry'

const sto = runtime.storage!

const genToken = async () => {
    const csrf_token = $("[name='csrf-token']").attr('content')

    const paste_id = (
        await utils.csPost(
            'https://www.luogu.com.cn/paste/new?_contentOnly',
            {
                data: (
                    await utils.csGet(
                        'https://exlg.piterator.com/token/generate'
                    )
                ).data.data,
                public: true
            },
            {
                'x-csrf-token': csrf_token,
                referer: 'https://www.luogu.com.cn/paste'
            }
        )
    ).data.id
    sto.set(
        'token',
        (
            await utils.csGet(
                `https://exlg.piterator.com/token/verify/${paste_id}`
            )
        ).data.data.token
    )
    await utils.csPost(
        `https://www.luogu.com.cn/paste/delete/${paste_id}?_contentOnly`,
        {},
        {
            'x-csrf-token': csrf_token,
            referer: 'https://www.luogu.com.cn/paste'
        }
    )
}

;(async () => {
    const d = sto.get('lastUpdate')
    if (d === undefined || new Date().valueOf() - d > 300) {
        if (_feInjection.currentUser) {
            if (sto.get('token')) {
                // Note: token exists
                const ttl = (
                    await utils.csPost('https://exlg.piterator.com/token/ttl', {
                        uid: _feInjection.currentUser.uid,
                        token: sto.get('token')
                    })
                ).data
                if (ttl.status === 401 || ttl.data <= 60 * 15) await genToken()
            } else await genToken()
        }
        sto.set('lastUpdate', new Date().valueOf())
    }
})()
