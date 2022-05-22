---
title: Dev Guides
tags:
  - 开发
  - 贡献
  - Contribute
---

## 开发环境

extend-luogu 使用如下工具，请确保你已经安装：

- yarn
- esbuild
- eslint
- husky
- lint-staged
- markdownlint
- prettier

VSCode 用户可以使用 /docs/.vscode 下的配置。

## Utility Functions

众所周知，源代码是最好的文档，所以请自行阅读源代码获取具体用法，简介可从函数名里读出。

### Logs

- `log(f, ...s)`
- `warn(f, ...s)`
- `error(f, ...s)`

### Extensions

- `Date.prototype.format(f, UTC)`
- `String.prototype.toInitialCase()`
- `cur_time(ratio = 1)`
- `jQuery.fn.whenKey(keyCode, callback)` or `jQuery.fn.whenKey({ ...keyCode: callback })`

### Network

- `lg_content(url)`
- `lg_post(url, data)`
- `cs_get({ url, onload })` and `cs_get2(url) -> Promise`
- `cs_post(url, data, header, type)`

### Notifications

- `lg_alert(msg, title)`
- `exlg_alert(text = "", title = "exlg 提醒您", onaccepted = () => {}, autoquit = true)`

### Misc

- `judge_problem(text)`
