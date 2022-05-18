## 键盘操作与命令行 / Keyboard and Cli

### 分类

普通模块

### 功能

讨论区 ← → 键翻页。

按下 `/` 打开命令行（使用时斜杠可省略）。部分命令用法见 `/help`。

记号：

- `<essential-argument: type>`：表示一个必须输入的参数，`type` 为其类型。
- `[optional-argument: type]`：表示该参数可选。

#### help

使用方法：`help [cmd: string]`。

获取 `cmd` 的帮助。空则列出所有。

#### cd

使用方法：`cd <path: string>`。

跳转至 `path`，支持相对路径。

#### cdd

使用方法：`cdd <forum: string>`。

跳转至名为 `forum` 的讨论板块。支持的名字有：

|      域名       | 拼音首字母 1 | 拼音首字母 2 | 功能 |        官方名        | 域名首字母 | 奇怪的缩写 |
| :-------------: | :----------: | :----------: | :--: | :------------------: | :--------: | :--------: |
| relevantaffairs |      gs      |     gsq      | 灌水 |        灌水区        |     r      |     ra     |
|    academics    |      xs      |     xsb      | 学术 |        学术版        |     a      |     ac     |
|   siteaffairs   |      zw      |     zwb      | 站务 |        站务版        |     s      |     sa     |
|     problem     |      tm      |     tmzb     | 题目 |       题目总版       |     p      |
|     service     |      fk      |    fksqgd    | 反馈 | 反馈、申请、工单专版 |     se     |

#### cc

使用方法：`cc [name: char]`。

跳转至 `name`，空则跳转主页。`name` 对应关系如下：

|  h   |  p   |  c   |    r     |  d   |    i     |  m   |  n   |
| :--: | :--: | :--: | :------: | :--: | :------: | :--: | :--: |
| 主页 | 题目 | 比赛 | 评测记录 | 讨论 | 个人中心 | 私信 | 通知 |

#### mod

使用方法：`mod <action: string> [name: string]`。

当 `action` 为 enable/disable/toggle，对名为 `name` 的模块执行对应操作：启用/禁用/切换。

#### lang

使用方法：`lang <lang: string>`。

当 `lang` 为 en/zh 时，切换当前语言。

#### go

使用方法：`go <type: string> [extinfo: string]`。

跳转到洛谷的任何一个角落。

`type` 的值及其对应意义与 `cc` 类似。

- 当 `extinfo` 为空时，行为与 `cc` 类似。
- 否则，对于不同的页面，需要填充不同的 `extinfo`：
  - 讨论：可以输入类似 `cdd` 的版块名，或者输入帖子 ID。
  - 题目，比赛，提交记录，用户：输入 ID。

#### uid

使用方法：`uid <uid: integer>`。

跳转至 UID 为 `uid` 的用户主页。

#### un

使用方法：`un <name: string>`。

跳转至用户名与 `name` 类似的用户主页。
