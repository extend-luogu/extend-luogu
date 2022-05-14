## exlg 公告板 / Exlg Dialog Board

### 功能

显示 exlg 信息框。

### 设置

- 启动消失动画速度 / Speed of Board Animation
- 确定按钮相对位置 / Position of Confirm Button

### API 使用方法

函数原型：`function (exlg.)exlg_alert(text = "", title = "exlg 提醒您", action = {}, { width, min_height } = {});`

函数接受的参数：

- `text`: exlg 公告板显示的内容 (html)。默认为空。
- `title`: exlg 公告板显示的标题 (html)。默认为 `exlg 提醒您`。
- `action`: 应该传入一个 object，内含
>
>1. `(async) function onopen(hrd)`: 希望在创建公告板时执行的函数。默认为 `() => {}`。
>2. `(async) function onconfirm(hrd)`: 希望在点击确定时执行的函数，应当返回一个 `Boolean`。若返回 `true`，则关闭公告板。
>3. `(async) function oncancel(hrd)`: 希望在点击取消时执行的函数，应当返回一个 `Boolean`。若返回 `true`，则关闭公告板。
>4. `(async) function onclose(hrd)`: 希望在点击右上角红叉关闭时执行的函数，应当返回一个 `Boolean`。若返回 `true`，则关闭公告板。
>
- `width`: 弹出公告板窗口的宽度。默认为 `500px`。
- `min_height`: 弹出公告板窗口的最小高度。默认为 `300px`。

函数返回值为一个 object。该 object 也是所有 action 的参数。
该 object 包含：

- `dom`: 一系列的 jQuery 元素，下面列出了它们分别对应的选择器。  
>
>0. `$wrap`: `#exlg-wrapper`, `.exlg-dialog-wrapper`
>1. `$cont`: `#exlg-container`, `.exlg-dialog-container`
>2. `$head`: `.exlg-dialog-header > #exlg-dialog-title`
>3. `$main`: `.exlg-dialog-body > #exlg-dialog-content`
>4. `$close`: `#header-right`
>
- `wait_time`: 原则上，窗口切换显示状态所需要的时间 (以毫秒为单位)。
- `hide_dialog`/`show_dialog`: 用于关闭/打开窗口的方法。**原则上不应被直接调用。**
- `resolve_result`: 用于 resolve 的方法。
- `then`: 无需解释。
