const eslint = 'pnpm lint:all:fix'

module.exports = {
    '*.{vue,js,jsx,cjs,mjs,ts,tsx,cts,mts}': [eslint],
}
