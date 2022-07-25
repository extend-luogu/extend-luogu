describe('user-problem-ex', () => {
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
                </script>`)
                )
            })
            cy.log('script inserted')
        }
    }

    const beforeFunc = (module: string) => {
        return () => {
            cy.exec(`cd src/modules/${module} && pnpm exlg-mod build -c`)
            cy.log('module built')
        }
    }

    const beforeEachFunc = (
        module: string,
        url: string,
        toAssign: any = {}
    ) => {
        return () => {
            cy.visit(`https://www.luogu.com.cn${url}`)
            cy.window().then((win) => {
                Object.assign(win, { $ })
                Object.assign(win, toAssign)
            })
            cy.readFile(`src/modules/${module}/dist/module.define.js`).then(
                (text) => {
                    // eslint-disable-next-line no-eval
                    eval(text)
                }
            )
        }
    }

    before(beforeFunc('user-problem-ex'))
    beforeEach(beforeEachFunc('user-problem-ex', '/user/108135'))

    it('题目难度可视化', () => {
        cy.visit('/user/108135#practice').then(() => {
            cy.wait(1000).then(() => {
                cy.expect($("a[href='/problem/B2001']").attr('style')).to.eq(
                    'color: rgb(254, 76, 97);'
                )
                cy.expect($("a[href='/problem/CF4C']").attr('style')).to.eq(
                    'color: rgb(243, 156, 17);'
                )
                cy.expect($("a[href='/problem/P1019']").attr('style')).to.eq(
                    'color: rgb(255, 193, 22);'
                )
                cy.expect($("a[href='/problem/P1351']").attr('style')).to.eq(
                    'color: rgb(82, 196, 26);'
                )
                cy.expect($("a[href='/problem/P5022']").attr('style')).to.eq(
                    'color: rgb(52, 152, 219);'
                )
                cy.expect($("a[href='/problem/P3523']").attr('style')).to.eq(
                    'color: rgb(157, 61, 207);'
                )
            })
        })
    })
})
