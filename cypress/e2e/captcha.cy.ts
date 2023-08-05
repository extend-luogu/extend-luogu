describe('captcha', () => {
    const { $ } = Cypress

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const define = ({ entry, style }) => {
        if (style) {
            $('body').append($(`<style>${style}</style>`))
            cy.log('style inserted')
        }
        if (entry) {
            cy.readFile('cypress/e2e/mock.js').then((mock) => {
                $('body').append(
                    $(`<script>
                    ${mock}
                    ;(${entry.toString()})()
                </script>`),
                )
            })
            cy.log('script inserted')
        }
    }

    const beforeFunc = (module: string) => () => {
        cy.exec(`cd src/modules/${module} && pnpm exlg-mod build -c`)
        cy.log('module built')
    }

    const beforeEachFunc = (
        module: string,
        url: string,
        toAssign = {},
    ) => () => {
        cy.visit(`https://www.luogu.com.cn${url}`)
        cy.window().then((win) => {
            Object.assign(win, { $ })
            Object.assign(win, toAssign)
        })
        cy.readFile(`src/modules/${module}/dist/module.define.js`).then(
            (text) => {
                // eslint-disable-next-line no-eval
                eval(text)
            },
        )
    }

    before(beforeFunc('captcha'))
    beforeEach(beforeEachFunc('captcha', '/'))

    it('发帖自动填充', () => {})
})
