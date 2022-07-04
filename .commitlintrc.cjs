module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'body-max-line-length': [2, 'always', 76],
        'type-enum': [
            2,
            'always',
            [
                'feat',
                'fix',
                'docs',
                'style',
                'refactor',
                'test',
                'revert',
                'chore',
                'build',
                'release'
            ]
        ]
    }
}
