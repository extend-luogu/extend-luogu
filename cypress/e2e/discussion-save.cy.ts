describe('discussion-save', () => {
    const $ = Cypress.$
    const define = ({ entry, style }) => {
        if (style) {
            $('body').append($(`<style>${style}</style>`))
            cy.log('style inserted')
        }
        if (entry) {
            cy.readFile('cypress/e2e/mock.js').then((mock) => {
                $('body').append($(`<script>{
                    ${mock}
                    ;(${entry.toString()})()
                }</script>`))
            })
            cy.log('script inserted')
        }
    }


    before(() => {
        cy.exec('cd src/modules/discussion-save && pnpm exlg-mod build -c')
        cy.log('module built')
    })

    beforeEach(() => {
        cy.visit('https://www.luogu.com.cn/discuss/241461')
        cy.window().then((win) => {
            win.$ = $
            win.auto_save_discussion = false
        })
        cy.readFile('src/modules/discussion-save/dist/module.define.js').then((text) => {
            eval(text)
        })
    })

    it('显示界面', () => {
        cy.contains('保存讨论').should('have.length', 1)
        cy.contains('查看备份').should('have.length', 1)
    })

    it('保存讨论', () => {
        cy.contains('保存讨论').click()
        cy.contains('保存中...').should('have.length', 1)
    })

    it('查看备份', () => {
        cy.contains('查看备份').click()
        cy.location().should((loc) => {
            expect(loc.host).to.eq('xn--fx-ex2c330n.ml')
            expect(loc.pathname).to.eq('/show.php')
            expect(loc.search).to.eq('?url=https://www.luogu.com.cn/discuss/241461')
        })
    })
})
