# extend-luogu

~~大型网络游戏👀服务器加强插件，增添各种✨炫酷魔法✨。~~

使[洛谷](https://luogu.com.cn)拥有更多功能。

[简体中文](./README.zh-Hans.md) | [English](./README.md)

## 安装

1. （更推荐）请直接访问 [jsdelivr 下载链接](https://cdn.jsdelivr.net/gh/extend-luogu/extend-luogu/dist/extend-luogu.min.user.js) 来使用 [TamperMonkey](https://www.tampermonkey.net) 安装脚本。
2. 将 `/dist/extend-luogu.min.user.js` 的完整代码复制到 TamperMonkey 的 `Create a new script` 页面，然后 `Ctrl + S` （或者 macOS 用户 `⌘ + S`）保存。如果控制台报错 `SyntaxError` 那多半是没复制全。
3. 脚本会在有更新时提醒。_[它坏了]_

### 开发、自行搭建
#### 前置要求
- `yarn`
- `Node.js`

#### 步骤
1. Clone this repository.
2. Run the following command:
```
yarn
# Build minified version
yarn run build
# Or build for debug(not minified)
yarn run debug
```
3. See `dist/extend-luogu.xxx.user.js` according to your command.

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
- [Discord 服务器](https://discord.gg/mHsx9crXjv)

## 支持我们

[爱发电](https://afdian.net/@extend-luogu)
