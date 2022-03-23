## 用户首页 HTML 显示 / User Intro Ins

### 分类
普通模块

### 功能
解析用户主页的 HTML 代码。
有 XSS 保护。

用法：在个人主页写下 `exlg.html: <HTML 代码>` 即可解析。

示例：
```
exlg.html: <div style="width:670px;padding:20px 0;box-shadow:0 5px 7px #aaa;margin:25px auto;background-image: linear-gradient(-45deg, RGBA(63,72,204,0.04), RGBA(63,72,204,0.001));" > <font style="z-index:2 !important;color:RGB(63,72,204); font-weight:bold;font-size:35px;margin-left:240px;text-shadow:0 2px 4px #ccc;z-index:20;">> Hello <</font><br/><font style="z-index:2 !important;color:#525ad1; font-weight:bold;font-size:25px;margin-left:260px;text-shadow:0 2px 4px #ccc;">I'm Haraki.</font> <ul style="backdrop-filter:blur(12px);z-index:2;list-style:none;"> <li style="margin-bottom:10px;"><font style="color:#fff; font-weight:bold;font-size:20px;line-height:40px;text-align:center !important;margin-left:120px;display:inline-block;height:40px;width:60px;background:RGB(63,72,204);border-radius:10px;box-shadow:0 3px 5px #aaa;">Me</font><a style="color:RGB(63,72,204);font-size:17px;line-height:40px;margin-left:20px;" href="https://www.luogu.com.cn/user/399993">www.luogu.com.cn/user/399993</a></li>
<li style="margin-bottom:10px;"><font style="color:#fff; font-weight:bold;font-size:20px;line-height:40px;text-align:center !important;margin-left:120px;display:inline-block;height:40px;width:60px;background:RGB(0,162,232);border-radius:10px;box-shadow:0 3px 5px #aaa;">Exlg</font><a style="color:RGB(0,162,232);font-size:17px;line-height:40px;margin-left:20px;" href="https://exlg.cc/">exlg.cc</a></li>
<li style="margin-bottom:10px;"><font style="color:#fff; font-weight:bold;font-size:20px;line-height:40px;text-align:center !important;margin-left:120px;display:inline-block;height:40px;width:60px;background:RGB(123,185,236);border-radius:10px;box-shadow:0 3px 5px #aaa;">Blog</font><a style="color:RGB(123,185,236);font-size:17px;line-height:40px;margin-left:20px;" href="https://www.cnblogs.com/haraki">www.cnblogs.com/haraki</a></li>
</ul><font style="color:rgb(113,113,113);margin-left:20px;display:block;margin-top:20px;font-size:14px;">Powered by Exlg.html.</font><font style="color:rgb(113,113,113);margin-left:20px;font-size:14px;">Made by Haraki.</font></div>
```