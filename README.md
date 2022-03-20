# extend-luogu

~~大型网络游戏👀服务器加强插件，增添各种✨炫酷魔法✨。~~

使[洛谷](https://luogu.com.cn)拥有更多功能。_【征求新文案】_

简体中文 | [English](./README.en.md)

## 安装

1. 安装 [TamperMonkey](https://www.tampermonkey.net) 或任何其它的脚本管理器；
2. 访问这两个链接中的一个。如果没有自动安装，请复制 __全部__ 内容到您的脚本管理器中；
    - 最新版: [GitHub Raw](https://github.com/extend-luogu/extend-luogu/raw/latest/dist/extend-luogu.min.user.js)
    - 稳定版: [jsDelivr](https://cdn.jsdelivr.net/gh/extend-luogu/extend-luogu/dist/extend-luogu.min.user.js)
3. 脚本会在有更新时提醒。

## 开发、自行搭建
### 前置要求
- `yarn`
- `Node.js`

### 步骤
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

## 贡献

欢迎！

- 提交代码时应该遵守我们的 [提交信息规则](https://github.com/extend-luogu/ExtendLuoguGitCommitMsgStd)。
- 这个项目使用 [eslint](https://eslint.org/)，所以请保证你的代码在 `.eslintrc.js` 下通过了检查。
- [更多的代码细则](https://github.com/orgs/extend-luogu/projects/1)。

## 讨论

- [Issues](https://github.com/extend-luogu/extend-luogu/issues)。
  **格式要求**
  - **一个** 建议 / 反馈，**一个** issue，不要扎堆
  - 不必在标题中打标签，如 `[bug]` 和 `【反馈】`，管理会给 issue 打标签的 :D
  - 标题写清晰，不要整成 `脚本崩了怎么办` 或是 `十个建议` 之类的。
- QQ群：817265691
- [Discord 服务器](https://discord.gg/mHsx9crXjv)（基本上没人在线了）

## 支持我们

[爱发电](https://afdian.net/@extend-luogu)
