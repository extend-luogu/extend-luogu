import mod from "../core.js"
import { $, log, cs_get } from "../utils.js"

mod.reg("discussion-save", "讨论保存", [ "@/discuss/\\d+(\\?page\\=\\d+)*$" ], {
    auto_save_discussion : { ty: "boolean", dft: false, strict: true, info: ["Discussion Auto Save", "自动保存讨论"] }
}, ({ msto }) => {
    const $btn = $(`<button class="am-btn am-btn-success am-btn-sm" name="save-discuss">保存讨论</button>`)
    $btn.on("click", () => {
        $btn.prop("disabled", true)
        $btn.text("保存中...")
        cs_get({
            url: `https://luogulo.gq/save.php?url=${window.location.href}`,
            onload: res => {
                if (res.status === 200) {
                    if (res.response === "success") {
                        log("Discuss saved")
                        $btn.text("保存成功")
                        setTimeout(() => {
                            $btn.text("保存讨论")
                            $btn.removeAttr("disabled")
                        }, 1000)
                    }
                    else {
                        log(`Discuss unsuccessfully saved, return data: ${ res.response }`)
                        $btn.text("保存失败")
                        $btn.toggleClass("am-btn-success").toggleClass("am-btn-warning")
                        setTimeout(() => {
                            $btn.text("保存讨论")
                            $btn.removeAttr("disabled")
                            $btn.toggleClass("am-btn-success").toggleClass("am-btn-warning")
                        }, 1000)
                    }
                }
                else {
                    log(`Fail to save discuss: ${res}`)
                    $btn.toggleClass("am-btn-success").toggleClass("am-btn-danger")
                    setTimeout(() => {
                        $btn.text("保存讨论")
                        $btn.removeAttr("disabled")
                        $btn.toggleClass("am-btn-success").toggleClass("am-btn-danger")
                    }, 1000)
                }
            },
            onerror: err => {
                log(`Error:${err}`)
                $btn.removeAttr("disabled")
            }
        })
    })
        .css("margin-top", "5px")
    const $btn2 = $(`<a class="am-btn am-btn-warning am-btn-sm" name="save-discuss" href="https://luogulo.gq/show.php?url=${location.href}">查看备份</a>`).css("margin-top", "5px")
    $("section.lg-summary").find("p").append($(`<br>`)).append($btn).append($("<span>&nbsp;</span>")).append($btn2)
    if (msto.auto_save_discussion) $btn.click()
},`
.am-btn-warning {
    border-color: rgb(255, 193, 22);
    background-color: rgb(255, 193, 22);
    color: #fff;
}
.am-btn-warning:hover {
    border-color: #f37b1d;
    background-color: #f37b1d;
    color: #fff;
}
.am-btn {
    outline: none;
}
`)