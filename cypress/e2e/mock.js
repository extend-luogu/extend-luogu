const utils = {
    mustMatch: (_urls) => {},
    csGet: (url) => {
        return fetch(url).then((resp) => resp.json())
    }
}

const runtime = {
    storage: () => {
        return {
            // eslint-disable-next-line no-eval
            get: (x) => eval(`${x}`),
            set: (x, y) => {
                // eslint-disable-next-line no-eval
                x === undefined ? eval(`var ${x} = ${y}`) : eval(`${x} = ${y}`)
            }
        }
    }
}

const Schema = {
    boolean: () => {},
    object: () => {}
}

const { log } = console
