module.exports = {
    singleQuote: true,
    semi: false,
    tabWidth: 4,
    trailingComma: 'none',
    overrides: [
        {
            files: '*.{yml,yaml}',
            options: {
                tabWidth: 2
            }
        }
    ]
}
