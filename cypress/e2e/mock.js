const utils = {
    mustMatch: (_urls) => {},
    csGet: (url) => {
        return fetch(
            url
                .replace('xn--fx-ex2c330n.ml', 'www.luogu.com.cn')
                .replace('fx白丝.ml', 'www.luogu.com.cn')
        ).then((resp) => resp.json())
    }
}

const runtime = {
    storage: {
        // eslint-disable-next-line no-eval
        get: (x) => eval(x),
        set: (x, y) => {
            // eslint-disable-next-line no-eval,no-unused-expressions
            eval(x) === undefined ? eval(`var ${x} = ${y}`) : eval(`${x} = ${y}`)
        }
    }
}

const Schema = {
    boolean: () => {},
    object: () => {}
}

const { log } = console
