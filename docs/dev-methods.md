---
title: Dev Guides
tags:
  - 开发
  - 贡献
  - Contribute
---

众所周知，源代码是最好的文档，所以请自行阅读源代码获取具体用法，简介可从函数名里读出。

## Utility Functions

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
