import { $ } from "../utils.js";
import mod from "../core.js";
import exlg_alert from "../components/exlg-dialog-board.js";

mod.reg_hook_new("import-problem-to-cph", "添加到 cph", ["@/problem/[A-Z]+[0-9]+(#.*)?", "@/record/.*"], null, ({ args }) => {
    if (!args.length || window.location.href.search('/record/') != -1) return;
    
    function regi_exlg_cph() {
        $('button.exlg-cph').click(() => {
            $.get(window.location.href, function(elem) {
                function htmlToElement(html) {
                    return new DOMParser().parseFromString(html, 'text/html').documentElement;
                }

                elem = htmlToElement(elem)
                console.log(elem);
                for (const scriptElem of elem.querySelectorAll('script')) {
                    const script = scriptElem.textContent
                    if (script.startsWith("window._feInjection")) {
                        const startQuoteIndex = script.indexOf('"')
                        const endQuoteIndex = script.substr(startQuoteIndex + 1).indexOf('"')
                        const encodedData = script.substr(startQuoteIndex + 1, endQuoteIndex)

                        p = JSON.parse(decodeURIComponent(encodedData)).currentData.problem
                    }
                }
                if (p == null) {
                    throw new Error('Failed to find problem data')
                }
                var dt = []
                for (const x of p.samples) {
                    dt.push({'input': x[0], 'output': x[1]});
                }

                GM_xmlhttpRequest({
                    url: 'http://localhost:27121/',
                    method: 'POST',
                    data: JSON.stringify({
                        'batch': {'id': 'exlgnb', 'size': 1},
                        'name': p.pid,
                        'group': 'Luogu',
                        'url': window.location.href,
                        'interactive': 'false',
                        'memoryLimit': Math.floor(Math.max(...p.limits.memory)/1024),
                        'timeLimit': Math.max(...p.limits.time),
                        'tests': dt,
                        'input': {'type': 'stdin'},
                        'output': {'type': 'stdout'},
                        'language': {'java': {'mainClass': 'Main', 'taskClass': p.pid}},
                        'testType': 'single'
                    }),
                    onload: function(res) {
                        if (res.status == 502){
                            exlg_alert('未启动 cph，传输失败！');
                        }
                    },
                    onerror : function(err){
                        exlg_alert('未启动 cph，传输失败！');
                    }
                })
            });
        })
    }
    
    if (window.location.href.search('#submit') == -1) {
        $('button.lfe-form-sz-middle').addClass('lg-btm');
        args.append('<button data-v-7ade990c="" data-v-43063e73="" type="button" class="exlg-cph lfe-form-sz-middle" data-v-2dfcfd35="" style="border-color: rgb(52, 152, 219); background-color: rgb(52, 152, 219);"> 传送至 cph </button>')
        regi_exlg_cph();
    }
    $('button.lg-btm').click(() => {
        if (window.location.href.search('#submit') == -1) {
            args.append('<button data-v-7ade990c="" data-v-43063e73="" type="button" class="exlg-cph lfe-form-sz-middle" data-v-2dfcfd35="" style="border-color: rgb(52, 152, 219); background-color: rgb(52, 152, 219);"> 传送至 cph </button>')
            regi_exlg_cph();
        } else {
            $('button.exlg-cph').remove();
        }
    })
}, (e) => {
    const $tmp = $(e.target).find("div.operation");
    return { result: $tmp.length > 0, args: $tmp };
}, () => $("div.operation"), "module");