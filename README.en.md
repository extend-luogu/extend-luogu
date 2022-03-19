# extend-luogu

Makes [Luogu](https://www.luogu.com.cn/) more powerful.

[简体中文](./README.md) | English

## Installation

1. Install [TamperMonkey](https://www.tampermonkey.net/) or any other userscript manager.
2. Visit one of the following links. If it doesn't install automatically, copy the __whole__ text into your userscript manager.
    - Latest: [GitHub Raw](https://github.com/extend-luogu/extend-luogu/raw/latest/dist/extend-luogu.min.user.js)
    - Stable: [jsDelivr](https://cdn.jsdelivr.net/gh/extend-luogu/extend-luogu/dist/extend-luogu.min.user.js)
3. You will be automatically notified when there's an update. _[WIP]_

## Development / Build

### Prerequisites
- `yarn`
- `Node.js`

### Steps

1. Clone this repository.
2. Run the following command:

```
yarn

# By default, this command generates a minified file dist/extend-luogu.user.js
yarn run build

# Use -o <fn> to override file name, -d <dir> to override output directory
# The following command generates path/to-exlg.user.js
yarn run build -o to-exlg.user.js -d path

# Use -b to stop minifying
yarn run build -b
# Use -m to override -b
yarn run test -m

# These flags can be combined
yarn run build -d build -b
# Tip: `yarn run test` is an alias of the above command
```

## Contribution

Welcome!

- Commits should obey our [Commit Rule](https://github.com/extend-luogu/ExtendLuoguGitCommitMsgStd). _[Need updating]_
- This repository uses [eslint](https://eslint.org/), so please make sure your code passed under `.eslintrc.js`.
- See more [Rules on Code](https://github.com/orgs/extend-luogu/projects/1).

## Discussion

- [Issues](https://github.com/extend-luogu/extend-luogu/issues).
  **Format requirement:**
  - **ONE** suggestion / report in **ONE** issue
  - No tags like `[bug]` or `【report】` in your title, admins will tag issues :D
  - Give a clear title instead of `Why the script doesn't work`, `10 SUGGESTIONS`, and stuff.
- QQ Group: 817265691
- [Discord Server](https://discord.gg/mHsx9crXjv) (low online rate)

## Support us

[aifadian](https://afdian.net/@extend-luogu)
