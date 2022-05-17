---
title: 构建
---
## 开发、自行构建

### 前置要求

- `yarn`
- `Node.js`

### 步骤

1. 把这个仓库 clone 到本地。
2. 运行如下命令：

该指令安装项目依赖。

```bash
yarn
```

该指令生成一个 minify 后的 build/extend-luogu.user.js。

```bash
yarn build
```

该指令运行 eslint。

```bash
yarn lint
```

该指令生成一个 bundle 后的 build/extend-luogu.user.js，便于调试。

```bash
yarn run test
```
