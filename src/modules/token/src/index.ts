import '@exlg/core/types/module-entry'
import { SchemaToStorage } from '@exlg/core/types'
import type Scm from './schema'

const sto = runtime.storage as SchemaToStorage<typeof Scm>

const genToken = async () => {
    const csrf_token = $("[name='csrf-token']").attr('content')

    const paste_id = (
        await utils.csPost(
            'https://www.luogu.com.cn/paste/new?_contentOnly',
            {
                data: (
                    await utils.csGet(
                        'https://exlg.piterator.com/token/generate',
                    )
                ).json.data,
                public: true,
            },
            {
                'x-csrf-token': csrf_token,
                referer: 'https://www.luogu.com.cn/paste',
            },
        )
    ).json.id
    const { token } = (
        await utils.csGet(
            `https://exlg.piterator.com/token/verify/${paste_id}`,
        )
    ).json.data
    sto.set('_token', token)
    await utils.csPost(
        `https://www.luogu.com.cn/paste/delete/${paste_id}?_contentOnly`,
        {},
        {
            'x-csrf-token': csrf_token,
            referer: 'https://www.luogu.com.cn/paste',
        },
    )
    return token
}

export interface TokenExportType {
    token?: string
}

declare module '@exlg/core' {
    interface ModuleInjection {
        token: TokenExportType
    }
}

const getToken = async () => {
    const d = sto.get('_lastUpdate')
    if (d === undefined || new Date().valueOf() - d > 300) {
        if (_feInjection.currentUser) {
            if (sto.get('_token')) {
                // Note: token exists
                const ttl = (
                    await utils.csPost('https://exlg.piterator.com/token/ttl', {
                        uid: _feInjection.currentUser.uid,
                        token: sto.get('_token'),
                    })
                ).json
                if (ttl.status === 401 || ttl.data <= 60 * 15) return genToken()
            }
            else return genToken()
        }
        sto.set('_lastUpdate', new Date().valueOf())
    }
    return sto.get('_token')
}

runtime.exports = (async () => ({ token: await getToken() }))()
