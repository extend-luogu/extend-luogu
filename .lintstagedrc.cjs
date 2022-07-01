const eslint = 'eslint --fix'
const prettier = 'prettier --write'
const prettierCheck = 'prettier --check'

module.exports = {
    '*.{vue,js,jsx,cjs,mjs,ts,tsx,cts,mts}': [eslint, prettierCheck],
    '*.{md,css,scss,json,yml,yaml,graphql}': [prettier]
}
