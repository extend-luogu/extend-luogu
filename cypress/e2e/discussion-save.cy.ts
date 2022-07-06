describe('discussion-save', () => {
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

    before(beforeFunc('discussion-save'))
    beforeEach(
        beforeEachFunc('discussion-save', '/discuss/241461', {
            autoSaveDiscussion: false
        })
    )

    it('显示界面', () => {
        cy.contains('保存讨论').should('have.length', 1)
        cy.contains('查看备份').should('have.length', 1)
    })

    it('查看备份', () => {
        $('a.am-btn.am-btn-warning.am-btn-sm').attr('target', '')
        cy.contains('查看备份').click()
        cy.location().should((loc) => {
            expect(loc.host).to.eq('xn--fx-ex2c330n.ml')
            expect(loc.pathname).to.eq('/show.php')
            expect(loc.search).to.eq(
                '?url=https://www.luogu.com.cn/discuss/241461'
            )
        })
    })

    describe('自动保存', () => {
        beforeEach(
            beforeEachFunc('discussion-save', '/discuss/241461', {
                autoSaveDiscussion: true
            })
        )

        it('自动保存', () => {
            cy.contains('保存中...').should('have.length', 1)
        })
    })

    describe('保存讨论', () => {
        it('保存中...', () => {
            cy.contains('保存讨论').click()
            cy.contains('保存中...').should('have.length', 1)
        })

        it('保存成功', () => {
            cy.intercept(
                '/save.php?url=https://www.luogu.com.cn/discuss/241461',
                { fixture: 'discussion-save/success.json' }
            )
            cy.contains('保存讨论').click()
            cy.wait(100)
            cy.contains('保存成功').should('have.length', 1)
        })

        it('保存失败', () => {
            cy.intercept(
                '/save.php?url=https://www.luogu.com.cn/discuss/241461',
                { fixture: 'discussion-save/fail.json' }
            )
            cy.contains('保存讨论').click()
            cy.wait(100)
            cy.contains('保存失败').should('have.length', 1)
        })
    })
})
