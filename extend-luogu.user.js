// ==UserScript==
// @name           extend-luogu
// @namespace      http://tampermonkey.net/
// @version        5.2.0
//
// @match          https://*.luogu.com.cn/*
// @match          https://*.luogu.org/*
// @match          https://www.bilibili.com/robots.txt?*
// @match          https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121
// @match          https://service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com/release/exlg-nextgen
// @match          https://extend-luogu.github.io/exlg-setting-new/*
// @match          https://dash.exlg.cc/*
// @include        http://localhost:1634/*
//
// @connect        tencentcs.com
// @connect        luogulo.gq
// @connect        bens.rotriw.com
// @connect        codeforces.com
// @connect        codeforces.ml
// @connect        kenkoooo.com
// @connect        api.github.com
//
// @require        https://cdn.luogu.com.cn/js/jquery-2.1.1.min.js
// @require        https://cdn.jsdelivr.net/gh/leizongmin/js-xss@1.0.10/dist/xss.min.js
// @require        https://cdn.jsdelivr.net/gh/markedjs/marked@2.0.1/marked.min.js
// @require        https://cdn.jsdelivr.net/gh/ForkKILLET/TM-dat@0.8.3/TM-dat.user.js
//
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_listValues
// @grant          GM_setClipboard
// @grant          GM_xmlhttpRequest
// @grant          unsafeWindow
// ==/UserScript==
;
(()=>{var h=unsafeWindow,$=(e,...t)=>h.console.log(`%c[exlg] ${e}`,"color: #0e90d2;",...t),I=(e,...t)=>h.console.warn(`%c[exlg] ${e}`,"color: #0e90d2;",...t),E=(e,...t)=>{throw h.console.error(`%c[exlg] ${e}`,"color: #0e90d2;",...t),Error(t.join(" "))},b=null,N=null;location.host==="www.luogu.com.cn"&&!/blog/g.test(location.href)&&(/(\?|&)_contentOnly($|=)/g.test(location.search)&&E("Content-Only pages."),h._feInjection.code!==200&&E("Luogu failed to load. Exlg stops loading."),b=h._feInjection.currentData,N=h._feInjection.currentUser);var o=jQuery,q=new filterXSS.FilterXSS({onTagAttr:(e,t,r)=>{if(t==="style")return`${t}="${r}"`}});o.double=(e,t,r)=>[e(t),e(r)];Date.prototype.format=function(e,t){t=t?"UTC":"";let r={"y+":this[`get${t}FullYear`](),"m+":this[`get${t}Month`]()+1,"d+":this[`get${t}Date`](),"H+":this[`get${t}Hours`](),"M+":this[`get${t}Minutes`](),"S+":this[`get${t}Seconds`](),"s+":this[`get${t}Milliseconds`]()};for(let n in r)RegExp(`(${n})`).test(e)&&(e=e.replace(RegExp.$1,("000"+r[n]).substr(r[n].toString().length+3-RegExp.$1.length)));return e};String.prototype.toInitialCase=function(){return this[0].toUpperCase()+this.slice(1)};Array.prototype.lastElem=function(){return this[this.length-1]};var D=(e,t)=>{if(!e)return"<<";let r=(p,_)=>p===_?"==":p<_?"<<":">>",n=["pre","alpha","beta"],[[i,l],[a,s]]=[e,t].map(p=>p.split(" "));if(i===a)return r(...[l,s].map(p=>p?n.findIndex(_=>_===p):1/0));let[d,g]=[i,a].map(p=>p.split("."));for(let[p,_]of d.entries())if(_!==g[p])return r(+_||0,+g[p]||0)},K=(e=1)=>~~(new Date().getTime()/e),P=e=>new Promise((t,r)=>o.get(e+(e.includes("?")?"&":"?")+"_contentOnly=1",n=>{n.code!==200&&r(`Requesting failure code: ${t.code}.`),t(n)})),B=h.show_alert?(e,t="exlg 提醒您")=>h.show_alert(t,e):(e,t="exlg 提醒您")=>h.alert(t+`
`+e),X=null,U=(e,t)=>o.ajax({url:e,data:t,headers:{"x-csrf-token":X===null?X=o("meta[name=csrf-token]").attr("content"):X,"content-type":"application/json"},method:"post"}),M=({url:e,onload:t,onerror:r=n=>E(n)})=>GM_xmlhttpRequest({url:e,method:"GET",onload:t,onerror:r}),R=(e,t)=>{let r=new URLSearchParams;for(let i in e)r.set(i,e[i]);let n=o(`
        <iframe id="exlg-${e.type}" src=" https://www.bilibili.com/robots.txt?${r}" style="${t}" exlg="exlg"></iframe>
    `);return $("Building springboard: %o",n[0]),n},J=e=>[/^AT[1-9][0-9]{0,}$/i,/^CF[1-9][0-9]{0,}[A-Z][0-9]?$/i,/^SP[1-9][0-9]{0,}$/i,/^P[1-9][0-9]{3,}$/i,/^UVA[1-9][0-9]{2,}$/i,/^U[1-9][0-9]{0,}$/i,/^T[[1-9][0-9]{0,}$/i].some(t=>t.test(e)),G={_ac_func:null,wrapper:null,container:null,wait_time:null,header:null,content:null,autoquit:!0,show_dialog(){this.wrapper.css("display","flex"),setTimeout(()=>{this.container.removeClass("container-hide"),this.container.addClass("container-show")},50)},hide_dialog(){this.container.addClass("container-hide"),this.container.removeClass("container-show"),setTimeout(()=>this.wrapper.hide(),this.wait_time)},accept_dialog(){this._ac_func(this.hide_dialog),this.autoquit&&this.hide_dialog()},show_exlg_alert(e="",t="exlg 提醒您",r=()=>{},n=!0){this.autoquit=n,this._ac_func=r,this.header.text(t),this.content.html(e),this.show_dialog()}},T=(...e)=>G.show_exlg_alert(...e),Z=async()=>{let e=(r,n)=>M({url:r,onload:i=>{let l=-1,a=i.response;[{errorcode:0,message:'"Succeed in creating a new badge!"',ontitle:"[exlg] 成功创建 badge",onlog:"Successfully created a badge!"},{errorcode:1,message:'"Wrong active code!"',ontitle:"无效激活码",onlog:"Illegal Active Code"},{errorcode:2,message:'"Sorry, but the active code has been used!"',ontitle:"激活码已被使用",onlog:"Expired Active Code"},{errorcode:3,message:'"Something went wrong!"',ontitle:"非法的 badge 内容",onlog:"Illegal Badge Text"},{errorcode:-1,message:"Fuck CCF up",ontitle:"未知错误",onlog:"注册 exlg-badge 时出现未知错误, 请联系开发人员"}].forEach(d=>{if(l===-1&&(console.log(a===d.message,d.errorcode===-1,d),(a===d.message||d.errorcode===-1)&&(l=d.errorcode,o("#exlg-dialog-title").html(d.errorcode?`[Error] ${d.ontitle}`:d.ontitle),$(d.errorcode?`Illegal Operation in registering badge: ${d.onlog}(#${d.errorcode})`:d.onlog),l===-1||!l))){n(),setTimeout(()=>T("badge 注册成功!","exlg 提醒您"),400);return}})}}),t="exlg badge 注册器 ver.5.0";T(`<div class="exlg-update-log-text exlg-unselectable exlg-badge-page" style="font-family: Consolas;">
    <div style="text-align: center">
        <div style="display:inline-block;text-align: left;padding-top: 10px;">
            <div style="margin: 5px;"><span style="height: 1.5em;float: left;padding: .1em;width: 5em;">用户uid</span><input exlg-badge-register type="text" style="padding: .1em;" class="am-form-field exlg-badge-input" placeholder="填写用户名或uid" name="username"></div>
            <div style="margin: 5px;"><span style="height: 1.5em;float: left;padding: .1em;width: 5em;">激活码</span><input exlg-badge-register type="text" style="padding: .1em;" class="am-form-field exlg-badge-input" placeholder="您获取的激活码" name="username"></div>
            <div style="margin: 5px;margin-bottom: 20px;"><span style="height: 1.5em;float: left;padding: .1em;width: 5em;">badge</span><input exlg-badge-register type="text" style="margin-bottom: 10px;padding: .1em;" class="am-form-field exlg-badge-input" placeholder="您想要的badge" name="username"></div>
        </div>
        <br>
        <small>Powered by <s>Amaze UI</s> 自行研发，去他妈的 Amaze UI</small>
    </div>
</div>
    `,t,r=>{let n=o("#exlg-container"),i=n.find("input"),l=n.find("#exlg-dialog-title");if(h._feInjection&&N&&N.uid&&!i[0].value&&(i[0].value=N.uid),!(i[0].value&&i[1].value&&i[2].value)){l.html("[Err] 请检查信息是否填写完整"),setTimeout(()=>l.html(t),1500);return}o.get("/api/user/search?keyword="+i[0].value,a=>{if(!a.users[0])l.html("[Err] 无法找到指定用户"),setTimeout(()=>l.html(t),1500);else{i[0].value=a.users[0].uid;let s=`https://service-cmrlfv7t-1305163805.sh.apigw.tencentcs.com/release/${i[1].value}/${i[0].value}/${i[2].value}/`;e(s,r)}})},!1)};var L=null,c={_:new Map,fake_sto:L,data:{},path_alias:[["",".*\\.luogu\\.(com\\.cn|org)"],["dash","dash.exlg.cc"],["cdn","cdn.luogu.com.cn"],["bili","www.bilibili.com"],["tcs1","service-ig5px5gh-1305163805.sh.apigw.tencentcs.com"],["tcs2","service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com"],["tcs3","service-otgstbe5-1305163805.sh.apigw.tencentcs.com"],["debug","localhost:1634"],["ghpage","extend-luogu.github.io"]].map(([e,t])=>[new RegExp(`^@${e}/`),t]),path_dash_board:["@dash/((index|bundle)(.html)?)?","@ghpage/exlg-setting-new/((index|bundle)(.html)?)?","@debug/exlg-setting/((index|bundle).html)?"],reg:(e,t,r,n,i,l)=>{Array.isArray(r)||(r=[r]),r.forEach((a,s)=>{c.path_alias.some(([d,g])=>{if(a.match(d))return r[s]=a.replace(d,g+"/"),!0}),a.endsWith("$")||(r[s]+="$")}),c.data[e]={ty:"object",lvs:{...n,on:{ty:"boolean",dft:!0}}},c._.set(e,{info:t,path:r,func:i,styl:l})},reg_pre:(e,t,r,n,i,l,a)=>{c.reg(e,t,r,n,l,a),c._.set(e,{pre:i,...c._.get(e)})},reg_main:(e,t,r,n,i,l)=>c.reg("@"+e,t,r,n,a=>(i(a),!1),l),reg_user_tab:(e,t,r,n,i,l,a)=>c.reg(e,t,"@/user/.*",i,s=>{let d=o(".items"),g=()=>{(location.hash||"#main")==="#"+r&&($(`Working user tab#${r} mod: "${e}"`),l({...s,vars:n}))};d.on("click",g),g()},a),reg_chore:(e,t,r,n,i,l,a)=>{if(typeof r=="string"){let s=+r.slice(0,-1),d={s:1e3,m:1e3*60,h:1e3*60*60,D:1e3*60*60*24}[r.slice(-1)];!isNaN(s)&&d?r=s*d:E(`Parsing period failed: "${r}"`)}e="^"+e,i={...i,last_chore:{ty:"number",dft:-1,priv:!0}},c.reg(e,t,n,i,s=>{let d=L[e].last_chore,g=Date.now(),p=!0;s.named||!d||g-d>r?(p&&(GM_addStyle(a),p=!1),l(s),L[e].last_chore=Date.now()):$(`Pending chore: "${e}"`)})},reg_board:(e,t,r,n,i)=>c.reg(e,t,"@/",r,l=>{let a=`
                <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 0 136.14 30.56">
                    <g transform="translate(1.755, 0)" fill="#00a0d8">
                        <g>
                            <path d="M5.02-33.80L34.56-33.80L34.07-28.62L16.96-28.62L15.93-21.92L31.97-21.92L31.48-16.74L14.85-16.74L13.82-8.42L31.97-8.42L31.48-3.24L2.43-3.24L6.59-31.75L5.02-33.80Z" transform="translate(-4.14, 33.9)"></path>
                            <path d="M7.34-32.29L5.78-33.80L16.63-33.80L21.33-25.00L27.54-32.78L26.51-33.80L38.93-33.80L25.49-18.79L34.78-3.24L24.41-3.24L19.76-12.58L11.99-3.24L1.62-3.24L15.12-18.79L7.34-32.29Z" transform="translate(27.23, 33.9)"></path>
                            <path d="M4.00-33.80L16.42-33.80L12.80-8.42L32.99-8.42L32.51-3.24L5.56-3.24Q4.00-3.24 3.21-4.27Q2.43-5.29 2.43-6.86L2.43-6.86L5.56-31.75L4.00-33.80Z" transform="translate(63.8, 33.9)"></path>
                            <path d="M38.83-33.80L37.80-25.00L27.43-25.00L27.92-28.62L15.50-28.62L12.91-8.42L25.33-8.42L25.87-14.63L22.73-19.82L36.72-19.82L34.67-3.24L5.62-3.24Q4.86-3.24 4.21-3.51Q3.56-3.78 3.10-4.27Q2.65-4.75 2.48-5.43Q2.32-6.10 2.54-6.86L2.54-6.86L6.16-33.80L38.83-33.80Z" transform="translate(95.6, 33.9)"></path>
                        </g>
                    </g>
            </svg>
            `,s=o("#exlg-board");s.length||(s=o(`
                    <div class="lg-article" id="exlg-board" exlg="exlg"><h2>${a} &nbsp;&nbsp;${GM_info.script.version}</h2></div>
                `).prependTo(".lg-right.am-u-md-4"),s[0].firstChild.style["font-size"]="1em"),n({...l,$board:o("<div></div>").appendTo(s)})},i),reg_hook:(e,t,r,n,i,l,a)=>c.reg(e,t,r,n,s=>{i(s),o("body").bind("DOMNodeInserted",d=>l(d)&&i(s))},a),reg_hook_new:(e,t,r,n,i,l,a,s)=>c.reg(e,t,r,n,d=>{i({...d,result:!1,args:a()}),o("body").bind("DOMNodeInserted",g=>{let p=l(g);return p.result&&i({...d,...p})})},s),find:e=>c._.get(e),has:e=>c._.has(e),disable:e=>{let t=c.find(e);t.on=!1,c._.set(e,t)},enable:e=>{let t=c.find(e);t.on=!0,c._.set(e,t)},preload:e=>{L===null&&(L=c.fake_sto);let t=(n,i)=>{n||E(`Preloading named mod but not found: "${e}"`),$(`Preloading ${i?"named ":""}mod: "${n.name}"`);try{return{pred:n.pre({msto:L[n.name],named:i}),...n}}catch(l){return I(l),n}},r=location.href;for(let[n,i]of c._.entries())L[n].on&&i.path.some(l=>new RegExp(l,"g").test(r))&&(i.willrun=!0,"pre"in i&&c._.set(n,t({name:n,...i})))},execute:e=>{let t=(r,n)=>{r||E(`Executing named mod but not found: "${e}"`),r.styl&&GM_addStyle(r.styl),$(`Executing ${n?"named ":""}mod: "${r.name}"`);try{return"pred"in r?r.func({msto:L[r.name],named:n,pred:r.pred}):r.func({msto:L[r.name],named:n})}catch(i){I(i)}};if(e){let r=c.find(e);return t(r,!0)}for(let[r,n]of c._.entries())if(n.on=L[r].on,n.willrun&&t({name:r,...n})===!1)break}};c.reg("benben","全网犇犇","@/",{source:{ty:"enum",dft:"o2",vals:["o2","shy"],info:["Switch the way of fetching benben","切换全网犇犇获取方式"]}},({msto:e})=>{let t={Gray:"gray",Blue:"bluelight",Green:"green",Orange:"orange lg-bold",Red:"red lg-bold",Purple:"purple lg-bold",Brown:"brown lg-bold"},r=`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="%" style="margin-bottom: -3px;" exlg="exlg">
            <path d="M16 8C16 6.84375 15.25 5.84375 14.1875 5.4375C14.6562 4.4375 14.4688 3.1875 13.6562 2.34375C12.8125 1.53125 11.5625 1.34375 10.5625 1.8125C10.1562 0.75 9.15625 0 8 0C6.8125 0 5.8125 0.75 5.40625 1.8125C4.40625 1.34375 3.15625 1.53125 2.34375 2.34375C1.5 3.1875 1.3125 4.4375 1.78125 5.4375C0.71875 5.84375 0 6.84375 0 8C0 9.1875 0.71875 10.1875 1.78125 10.5938C1.3125 11.5938 1.5 12.8438 2.34375 13.6562C3.15625 14.5 4.40625 14.6875 5.40625 14.2188C5.8125 15.2812 6.8125 16 8 16C9.15625 16 10.1562 15.2812 10.5625 14.2188C11.5938 14.6875 12.8125 14.5 13.6562 13.6562C14.4688 12.8438 14.6562 11.5938 14.1875 10.5938C15.25 10.1875 16 9.1875 16 8ZM11.4688 6.625L7.375 10.6875C7.21875 10.8438 7 10.8125 6.875 10.6875L4.5 8.3125C4.375 8.1875 4.375 7.96875 4.5 7.8125L5.3125 7C5.46875 6.875 5.6875 6.875 5.8125 7.03125L7.125 8.34375L10.1562 5.34375C10.3125 5.1875 10.5312 5.1875 10.6562 5.34375L11.4688 6.15625C11.5938 6.28125 11.5938 6.5 11.4688 6.625Z"></path>
        </svg>
    `,n=a=>a<=3?"":r.replace("%",a<=5?"#5eb95e":a<=7?"#3498db":"#f1c40f"),i=h.loadFeed;h.loadFeed=function(){h.feedMode==="all-exlg"?(M({url:e.source==="o2"?"https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121":`https://bens.rotriw.com/api/list/proxy?page=${h.feedPage}`,onload:a=>{JSON.parse(a.response).forEach(d=>o(`
                <li class="am-comment am-comment-primary feed-li" exlg="exlg">
                    <div class="lg-left">
                        <a href="/user/${d.user.uid}" class="center">
                            <img src="https://cdn.luogu.com.cn/upload/usericon/${d.user.uid}.png" class="am-comment-avatar">
                        </a>
                    </div>
                    <div class="am-comment-main">
                        <header class="am-comment-hd">
                            <div class="am-comment-meta">
                                <span class="feed-username">
                                    <a class="lg-fg-${t[d.user.color]}" href="/user/${d.user.uid}" target="_blank">
                                        ${d.user.name}
                                    </a>
                                    <a class="sb_amazeui" target="_blank" href="/discuss/show/142324">
                                        ${n(d.user.ccfLevel)}
                                    </a>
                                    ${d.user.badge?`<span class="am-badge am-radius lg-bg-${t[d.user.color]}">${d.user.badge}</span>`:""}
                                </span>
                                ${new Date(d.time*1e3).format("yyyy-mm-dd HH:MM")}
                                <a name="feed-reply">回复</a>
                            </div>
                        </header>
                        <div class="am-comment-bd">
                            <span class="feed-comment">
                                ${marked(q.process(d.content))}
                            </span>
                        </div>
                    </div>
                </li>
            `).appendTo(o("ul#feed")).find("a[name=feed-reply]").on("click",()=>{scrollToId("feed-content"),setTimeout(()=>o("textarea").trigger("focus").val(` || @${d.user.name} : ${d.content}`).trigger("input"),50)}))}}),e.source==="shy"&&(h.feedPage++,o("#feed-more").children("a").text("点击查看更多..."))):i()};let l=o(".feed-selector");o('<li class="feed-selector" id="exlg-benben-selector" data-mode="all-exlg" exlg="exlg"><a style="cursor: pointer">全网动态</a></li>').appendTo(l.parent()).on("click",a=>{let s=o(a.currentTarget);l.removeClass("am-active"),s.addClass("am-active"),e.source==="o2"&&o("#feed-more").hide(),h.feedPage=1,h.feedMode="all-exlg",o("li.am-comment").remove(),h.loadFeed()})});c.reg_board("search-user","查找用户名",null,({$board:e})=>{e.html(`
        <h3>查找用户</h3>
        <div class="am-input-group am-input-group-primary am-input-group-sm">
            <input type="text" class="am-form-field" placeholder="例：kkksc03，可跳转站长主页" name="username" id="search-user-input">
        </div>
        <p>
            <button class="am-btn am-btn-danger am-btn-sm" id="search-user">跳转</button>
        </p>
    `);let t=()=>{r.prop("disabled",!0),o.get("/api/user/search?keyword="+o("[name=username]").val().trim(),n=>{n.users[0]?location.href="/user/"+n.users[0].uid:(r.prop("disabled",!1),B("无法找到指定用户"))})},r=o("#search-user").on("click",t);o("#search-user-input").keydown(n=>{n.key==="Enter"&&t()})});c.reg_board("benben-ranklist","犇犇龙王排行榜",{show:{ty:"boolean",dft:!0,info:["Show in default","是否默认展开"]}},({msto:e,$board:t})=>{t.html(`<h3 id="bb-rnklst-h2">犇犇排行榜 <span id="bb-rnklst-btn" class="bb-rnklst-span"> [<a>${e.show?"收起":"展开"}</a>]</span><span style="float: right;" class="bb-rnklst-span"> [<a id="refresh-bbrnk">刷新</a>]</span></h3><div style="display: ${e.show?"block":"none"}" id="bb-rnklst-div"></div>`);let r=t.find("#bb-rnklst-div"),n=t.find("#bb-rnklst-btn > a").on("click",()=>{e.show=!e.show,n.text(e.show?"收起":"展开"),r.toggle()}),i=()=>M({url:"https://bens.rotriw.com/ranklist?_contentOnly=1",onload:function(l){o(JSON.parse(l.response)).each((a,s)=>{o(`<div class="bb-rnklst-${a+1}">
                    <span class="bb-rnklst-ind${a<9?" bb-top-ten":""}">${a+1}.</span>
                    <a href="https://bens.rotriw.com/user/${s[2]}">${s[1]}</a>
                    <span style="float: right;">共 ${s[0]} 条</span>
                </div>`).appendTo(r)})}});t.find("#refresh-bbrnk").on("click",()=>{r.html(""),i()}),i()},`
.bb-rnklst-1 > .bb-rnklst-ind {
    color: var(--lg-red);
    font-weight: 900;
}
.bb-rnklst-2 > .bb-rnklst-ind {
    color: var(--lg-orange);
    font-weight: 900;
}
.bb-rnklst-3 > .bb-rnklst-ind {
    color: var(--lg-yellow);
    font-weight: 900;
}
.bb-rnklst-ind.bb-top-ten {
    margin-right: 9px;
}
.bb-rnklst-span {
    font-size: 1em;font-weight: normal;
}
`);c.reg_hook_new("code-block-ex","代码块优化","@/.*",{copy_code_position:{ty:"enum",vals:["left","right"],dft:"left",info:["Copy Button Position","复制按钮对齐方式"]},code_block_title:{ty:"string",dft:"源代码 - ${lang}",info:["Custom Code Title","自定义代码块标题"]},copy_code_font:{ty:"string",dft:"'Fira Code', Consolas, monospace",info:["Code Block Font","代码块字体"],strict:!0},max_show_lines:{ty:"number",dft:-1,min:-1,max:100,info:["Max Lines On Show","代码块最大显示行数"],strict:!0}},({msto:e,args:t})=>{let r=/\/record\/.*/.test(location.href),n={c:"C",cpp:"C++",pascal:"Pascal",python:"Python",java:"Java",javascript:"JavaScript",php:"PHP",latex:"LaTeX"},i=l=>{let a="undefined";return r?o(o(".value.lfe-caption")[0]).text():(l.attr("data-rendered-lang")?a=l.attr("data-rendered-lang"):l.attr("class")&&l.attr("class").split(" ").forEach(s=>{s.startsWith("language-")&&(a=s.slice(9))}),n[a])};t.attr("exlg-copy-code-block",""),t.each((l,a,s=o(a))=>{if(a.parentNode.className==="mp-preview-content"||a.parentNode.parentNode.className==="mp-preview-area")return;let d=r?s.children(".copy-btn"):o('<div class="exlg-copy">复制</div>').on("click",()=>{d.text()==="复制"&&(d.text("复制成功").toggleClass("exlg-copied"),setTimeout(()=>d.text("复制").toggleClass("exlg-copied"),800),GM_setClipboard(s.text(),{type:"text",mimetype:"text/plain"}))}),g=s.children("code");g.css("font-family",e.copy_code_font||void 0),g.hasClass("hljs")||g.addClass("hljs").css("background","white"),d.addClass(`exlg-copy-${e.copy_code_position}`);let p=i(g),_=e.code_block_title.replace("${lang}",p||"Text"),y=r?o(".lfe-h3").text(_):o(`<h3 class="exlg-code-title" style="width: 100%;">${_}</h3>`);r||s.before(y.append(d))})},e=>{let t=o(e.target).find("pre:has(> code:not(.cm-s-default)):not([exlg-copy-code-block])");return{result:t.length,args:t}},()=>o("pre:has(> code:not(.cm-s-default)):not([exlg-copy-code-block])"),`
.exlg-copy {
    position: relative;
    display: inline-block;
    border: 1px solid #3498db;
    border-radius: 3px;
    background-color: rgba(52, 152, 219, 0);
    color: #3498db;
    font-family: -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", "Noto Sans", "Noto Sans CJK SC", "Noto Sans CJK", "Source Han Sans", "PingFang SC", "Segoe UI", "Microsoft YaHei", sans-serif;
    flex: none;
    outline: 0;
    cursor: pointer;
    font-weight: normal;
    line-height: 1.5;
    text-align: center;
    vertical-align: middle;
    background: 0 0;
    font-size: 12px;
    padding: 0 5px;
    margin-left: 1px;
}
.exlg-copy.exlg-copy-right {
    float: right;
}
.exlg-copy:hover {
    background-color: rgba(52, 152, 219, 0.1);
}
div.exlg-copied {
    background-color: rgba(52, 152, 219, 0.9)!important;
    color: white!important;
}
.copy-btn {
    font-size: .8em;
    padding: 0 5px;
}
.lfe-form-sz-middle {
    font-size: 0.875em;
    padding: 0.313em 1em;
}
.exlg-code-title {
    margin: 0;
    font-family: inherit;
    font-size: 1.125em;
    color: inherit;
}
`);c.reg_main("dash-board","控制面板",c.path_dash_board,{msg:{ty:"object",priv:!0,lvs:{queue:{ty:"array",itm:{ty:"object",lvs:{text:{ty:"string"},id:{ty:"number"}}}},last_id:{ty:"number",dft:0}}},lang:{ty:"enum",dft:"zh",vals:["zh","en"],info:["Language of descriptions in the dashboard","控制面板提示语言"]}},()=>{let e=[["Modules","功能","tunes",!1],["Core","核心","bug_report",!0]].map(([t,r,n,i])=>({name:t,description:r,icon:n,children:(()=>{let l=[];return c._.forEach((a,s)=>{s.startsWith("@")===i&&l.push({rawName:s,name:s.replace(/^[@^]/g,""),description:a.info,settings:Object.entries(c.data[s].lvs).filter(([d,g])=>d!=="on"&&!g.priv).map(([d,g])=>({name:d,displayName:d.split("_").map(p=>p.toInitialCase()).join(" "),description:g.info,type:{number:"SILDER",boolean:"CHECKBOX",string:"TEXTBOX",enum:""}[g.ty],...g.ty==="boolean"&&{type:"CHECKBOX"},...g.ty==="number"&&{type:"SLIDER",minValue:g.min,maxValue:g.max,increment:g.step},...g.ty==="enum"&&{type:"SELECTBOX",acceptableValues:g.vals}}))})}),l})()}));console.log(e),h.guiStart(e)});c.reg_hook_new("dash-bridge","控制桥","@/.*",{source:{ty:"enum",vals:["exlg","gh_index","debug"],dft:"exlg",info:["The website to open when clicking the exlg button","点击 exlg 按钮时打开的网页"]},enable_rclick:{priv:!0,ty:"boolean",dft:!0,info:["Use Right Click to change source","右键点击按钮换源"]},latest_ignore:{ty:"string",dft:"0.0.0"}},({msto:e,args:t})=>{["exlg","gh_index","debug"].indexOf(e.source)===-1&&(e.source="exlg");let r=!t.parent().hasClass("mobile-nav-container"),n=o('<span id="exlg-dash-window" class="exlg-window" style="display: none;width: 300px;"></span>').css("left","-125px"),i=o('<div id="exlg-dash" exlg="exlg">exlg</div>').prependTo(t).css("backgroundColor",{exlg:"cornflowerblue",gh_index:"darkblue",debug:"steelblue"}[e.source]).css("margin-top",t.hasClass("nav-container")?"5px":"0px"),l=()=>h.exlg.dash=h.open({exlg:"https://dash.exlg.cc/index.html",gh_index:"https://extend-luogu.github.io/exlg-setting-new/index.html",debug:"localhost:1634/dashboard"}[e.source]);if(e.enable_rclick?i.bind("contextmenu",()=>!1).on("mousedown",a=>{a.button?a.button===2&&(e.source={exlg:"gh_index",gh_index:"debug",debug:"exlg"}[e.source],i.css("backgroundColor",{exlg:"cornflowerblue",gh_index:"darkblue",debug:"steelblue"}[e.source])):l()}):i.on("click",l),r){n.prependTo(t);let a=!1,s=!1;i.on("mouseenter",()=>{a=!0,n.show()}).on("mouseleave",()=>{a=!1,s||setTimeout(()=>{s||n.hide()},200)}),n.on("mouseenter",()=>{s=!0}).on("mouseleave",()=>{s=!1,a||n.hide()}),o(`<h2 align="center" style="margin-top: 5px;margin-bottom: 10px;"><svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 0 136.14 30.56">
        <g transform="translate(1.755, 0)" fill="#00a0d8">
            <g>
                <path d="M5.02-33.80L34.56-33.80L34.07-28.62L16.96-28.62L15.93-21.92L31.97-21.92L31.48-16.74L14.85-16.74L13.82-8.42L31.97-8.42L31.48-3.24L2.43-3.24L6.59-31.75L5.02-33.80Z" transform="translate(-4.14, 33.9)"></path>
                <path d="M7.34-32.29L5.78-33.80L16.63-33.80L21.33-25.00L27.54-32.78L26.51-33.80L38.93-33.80L25.49-18.79L34.78-3.24L24.41-3.24L19.76-12.58L11.99-3.24L1.62-3.24L15.12-18.79L7.34-32.29Z" transform="translate(27.23, 33.9)"></path>
                <path d="M4.00-33.80L16.42-33.80L12.80-8.42L32.99-8.42L32.51-3.24L5.56-3.24Q4.00-3.24 3.21-4.27Q2.43-5.29 2.43-6.86L2.43-6.86L5.56-31.75L4.00-33.80Z" transform="translate(63.8, 33.9)"></path>
                <path d="M38.83-33.80L37.80-25.00L27.43-25.00L27.92-28.62L15.50-28.62L12.91-8.42L25.33-8.42L25.87-14.63L22.73-19.82L36.72-19.82L34.67-3.24L5.62-3.24Q4.86-3.24 4.21-3.51Q3.56-3.78 3.10-4.27Q2.65-4.75 2.48-5.43Q2.32-6.10 2.54-6.86L2.54-6.86L6.16-33.80L38.83-33.80Z" transform="translate(95.6, 33.9)"></path>
            </g>
        </g>
</svg></h2>`).appendTo(n);let d=o('<div id="exlg-windiv"></div>').appendTo(n);[{tag:"vers",title:"vers",buttons:[]},{tag:"source",title:"Source",buttons:[{col:"#66ccff",html:"JsDelivr",onclick:()=>h.location.href="https://cdn.jsdelivr.net/gh/extend-luogu/extend-luogu/dist/extend-luogu.min.user.js"},{col:"#66ccff",html:"Raw",onclick:()=>h.location.href="https://github.com/extend-luogu/extend-luogu/raw/main/dist/extend-luogu.min.user.js"},{col:"#66ccff",html:"FastGit",onclick:()=>h.location.href="https://hub.fastgit.org/extend-luogu/extend-luogu/raw/main/dist/extend-luogu.min.user.js"}]},{tag:"link",title:"Link",buttons:[{col:"#66ccff",html:"Web",onclick:()=>h.location.href="https://exlg.cc"},{col:"#666",html:`<a style="height: 8px;width: 8px;"><svg aria-hidden="true" height="12" viewBox="0 0 16 16" version="1.1" width="12" data-view-component="true" class="octicon octicon-mark-github">
                <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg></a>Github`,onclick:()=>h.location.href="https://github.com/extend-luogu/extend-luogu"},{col:"#66ccff",html:"aifadian",onclick:()=>h.location.href="https://afdian.net/@extend-luogu"}]},{tag:"help",title:"Help",buttons:[{col:"#66ccff",html:"fx",onclick:()=>h.location.href="https://www.luogu.com.cn/blog/100250/extend-luogu-si-yong-zhi-na"},{col:"#66ccff",html:"int128",onclick:()=>h.location.href="https://www.luogu.com.cn/blog/NaCl7/extend-luogu-usage"},{col:"#66ccff",html:"用户协议",onclick:()=>h.location.href="https://www.luogu.com.cn/paste/3f7anw16"}]},{tag:"lhyakioi",title:"badge",buttons:[]}].forEach(p=>{let _=o(`<div id="${p.tag}-div"><span class="exlg-windiv-left-tag">${p.title}</span></div>`).appendTo(d),y=o("<span></span>").appendTo(_);if(p.buttons.forEach(C=>{o('<span class="exlg-windiv-btnspan"></span>').append(o(`<button class="exlg-windiv-btn" style="background-color: ${C.col};border-color: ${C.col};">${C.html}</button>`).on("click",C.onclick)).appendTo(y)}),p.title==="vers"){y.append(o(`<span id="version-text" style="min-width: 60%;"><span>${GM_info.script.version}</span><span id="vers-comp-operator" style="margin-left: 10px;"></span><span id="latest-version" style="margin-left: 10px;"></span><span id="annoyingthings"></span></span>"`));let C=o('<button class="exlg-windiv-btn" style="background-color: red;border-color: red;float: right;margin: 0 10px 0 0;">刷新</button>'),j=y.find("#vers-comp-operator"),u=y.find("#latest-version"),f=y.find("#annoyingthings"),m=()=>{o("#exlg-update").remove(),R({type:"update"}).appendTo(o("body")).hide(),h.addEventListener("message",w=>{if(w.data[0]!=="update")return;w.data.shift();let x=w.data[0],v=GM_info.script.version,k=D(v,x),S=`Comparing version: ${v} ${k} ${x}`;if($(S),j.html(k).css("color",{"<<":"#fe4c61","==":"#52c41a",">>":"#3498db"}[k]),u.html(x),f.html({"<<":'<i class="exlg-icon exlg-info" name="有新版本"></i>',">>":'<i class="exlg-icon exlg-info" name="内测中！"></i>'}[k]||"").children().css("cssText","position: absolute;display: inline-block;"),k==="<<"&&D(e.latest_ignore,x)==="<<"){let A=o('<span style="color: red;margin-left: 30px;"><svg class="icon" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" width="24" height="24" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5446"><path d="M512 128c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384-172.3-384-384-384z m0 717.4c-183.8 0-333.4-149.6-333.4-333.4S328.2 178.6 512 178.6 845.4 328.2 845.4 512 695.8 845.4 512 845.4zM651.2 372.8c-9.9-9.9-25.9-9.9-35.8 0L512 476.2 408.6 372.8c-9.9-9.9-25.9-9.9-35.8 0-9.9 9.9-9.9 25.9 0 35.8L476.2 512 372.8 615.4c-9.9 9.9-9.9 25.9 0 35.8 4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4L512 547.8l103.4 103.4c4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4c9.9-9.9 9.9-25.9 0-35.8L547.8 512l103.4-103.4c9.9-9.9 9.9-25.9 0-35.8z" p-id="5447"></path></svg></span>').on("click",()=>{e.latest_ignore=x,A.hide()}).appendTo(f)}k==="=="&&(e.latest_ignore=GM_info.script.version),h.novogui&&h.novogui.msg(S)})};C.on("click",m).appendTo(y)}p.title==="badge"&&(o('<input type="text" disabled="disabled" style="width: 60%;" />').appendTo(y),o('<button id="exlg-badge-btn" style="background-color: #ccc;border-color: #666;" class="exlg-windiv-btn" disabled="disabled">提交</button>').appendTo(y))})}},e=>{let t=o(e.target).find(".user-nav, .nav-container");return t.length?{result:t.length,args:t[0].tagName==="DIV"?o(t[0].firstChild):t}:{result:0}},()=>o("nav.user-nav, div.user-nav > nav, .nav-container"),`
    /* dash */
    #exlg-dash {
        margin-right: 5px;
        position: relative;
        display: inline-block;
        padding: 1px 10px 3px;
        color: white;
        border-radius: 6px;
        box-shadow: 0 0 7px dodgerblue;
        cursor: pointer;
    }
    #exlg-dash > .exlg-warn {
        position: absolute;
        top: -.5em;
        right: -.5em;
    }
    /* global */
    .exlg-icon::before {
        display: inline-block;
        width: 1.3em;
        height: 1.3em;
        margin-left: 3px;
        text-align: center;
        border-radius: 50%;
    }
    .exlg-icon:hover::after {
        display: inline-block;
    }
    .exlg-icon::after {
        display: none;
        content: attr(name);
        margin-left: 5px;
        padding: 0 3px;
        background-color: white;
        box-shadow: 0 0 7px deepskyblue;
        border-radius: 7px;
    }
    .exlg-icon.exlg-info::before {
        content: "i";
        color: white;
        background-color: deepskyblue;
        font-style: italic;
    }
    .exlg-icon.exlg-warn::before {
        content: "!";
        color: white;
        background-color: rgb(231, 76, 60);
        font-style: normal;
    }
    .exlg-unselectable {
        -webkit-user-select: none;
        -moz-user-select: none;
        -o-user-select: none;
        user-select: none;
    }
    :root {
        --exlg-azure:           #7bb8eb;
        --exlg-aqua:            #03a2e8;
        --exlg-indigo:          #3f48cb;
        --std-mediumturquoise:  #48d1cc;
        --std-cornflowerblue:   #6495ed;
        --std-dodgerblue:       #1e90ff;
        --std-white:            #fff;
        --std-black:            #000;
        --lg-gray:              #bbb;
        --lg-gray-2:            #7f7f7f;
        --lg-gray-3:            #6c757d;
        --lg-gray-4:            #414345;
        --lg-gray-5:            #333;
        --lg-gray-6:            #000000bf;
        --lg-blue:              #3498db;
        --lg-blue-button:       #0e90d2;
        --lg-blue-dark:         #34495e;
        --lg-blue-2:            #7cb5ecbf;
        --lg-green:             #5eb95e;
        --lg-green-dark:        #054310c9;
        --lg-green-light:       #5eb95e26;
        --lg-green-light-2:     #c9e7c9;
        --lg-yellow:            #f1c40f;
        --lg-orange:            #e67e22;
        --lg-red:               #e74c3c;
        --lg-red-light:         #dd514c26;
        --lg-red-light-2:       #f5cecd;
        --lg-red-button:        #dd514c;
        --lg-purple:            #8e44ad;
        --argon-indigo:         #5e72e4;
        --argon-red:            #f80031;
        --argon-red-button:     #f5365c;
        --argon-green:          #1aae6f;
        --argon-green-button:   #2dce89;
        --argon-cyan:           #03acca;
        --argon-yellow:         #ff9d09;
        --lg-red-problem:       #fe4c61;
        --lg-orange-problem:    #f39c11;
        --lg-yellow-problem:    #ffc116;
        --lg-green-problem:     #52c41a;
        --lg-blue-problem:      #3498db;
        --lg-purple-problem:    #9d3dcf;
        --lg-black-problem:     #0e1d69;
        --lg-gray-problem:      #bfbfbf;
    }
    .exlg-difficulty-color { font-weight: bold; }
    .exlg-difficulty-color.color-0 { color: rgb(191, 191, 191)!important; }
    .exlg-difficulty-color.color-1 { color: rgb(254, 76, 97)!important; }
    .exlg-difficulty-color.color-2 { color: rgb(243, 156, 17)!important; }
    .exlg-difficulty-color.color-3 { color: rgb(255, 193, 22)!important; }
    .exlg-difficulty-color.color-4 { color: rgb(82, 196, 26)!important; }
    .exlg-difficulty-color.color-5 { color: rgb(52, 152, 219)!important; }
    .exlg-difficulty-color.color-6 { color: rgb(157, 61, 207)!important; }
    .exlg-difficulty-color.color-7 { color: rgb(14, 29, 105)!important; }
    .exlg-window {
        position: absolute;
        top: 35px;
        left: 0px;
        z-index: 65536;
        display: none;
        width: 250px;
        height: 300px;
        padding: 5px;
        background: white;
        color: black;
        border-radius: 7px;
        box-shadow: rgb(187 227 255) 0px 0px 7px;
    }
    .exlg-windiv-left-tag {
        border-right: 1px solid #eee;
        height: 2em;
        width: 18%;
        margin-right: 5px;
        display: inline-block;
    }
    .exlg-windiv-btn {

        font-size: 0.9em;
        /*padding: 0.313em 1em;*/
        display: inline-block;
        flex: none;
        outline: 0;
        cursor: pointer;
        color: #fff;
        font-weight: inherit;
        line-height: 1.5;
        text-align: center;
        vertical-align: middle;
        background: 0 0;
        border-radius: 5px;
        border: 1px solid;
        margin: 5px 5px;

    }
`);c.reg("exlg-dialog-board","exlg_公告板","@/.*",{animation_speed:{ty:"enum",dft:".4s",vals:["0s",".2s",".25s",".4s"],info:["Speed of Board Animation","启动消失动画速度"]},confirm_position:{ty:"enum",dft:"right",vals:["left","right"],info:["Position of Confirm Button","确定按钮相对位置"]}},({msto:e})=>{let t,r,n,i,l=!1;t=o('<div class="exlg-dialog-wrapper" id="exlg-wrapper" style="display: none;">').append(r=o(`<div class="exlg-dialog-container container-hide" id="exlg-container" style="${e.animation_speed==="0s"?"":`transition: all ${e.animation_speed};`}"></div>`).append(o('<div class="exlg-dialog-header">').append(n=o('<strong id="exlg-dialog-title">我做东方鬼畜音mad，好吗</strong>')).append(o('<div id="header-right" onclick="" style="opacity: 0.5;"><svg class="icon" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5446"><path d="M512 128c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384-172.3-384-384-384z m0 717.4c-183.8 0-333.4-149.6-333.4-333.4S328.2 178.6 512 178.6 845.4 328.2 845.4 512 695.8 845.4 512 845.4zM651.2 372.8c-9.9-9.9-25.9-9.9-35.8 0L512 476.2 408.6 372.8c-9.9-9.9-25.9-9.9-35.8 0-9.9 9.9-9.9 25.9 0 35.8L476.2 512 372.8 615.4c-9.9 9.9-9.9 25.9 0 35.8 4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4L512 547.8l103.4 103.4c4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4c9.9-9.9 9.9-25.9 0-35.8L547.8 512l103.4-103.4c9.9-9.9 9.9-25.9 0-35.8z" p-id="5447"></path></svg></div>').on("click",()=>G.hide_dialog()))).append(o('<div class="exlg-dialog-body">').append(i=o('<div id="exlg-dialog-content">'))).append(o('<div class="exlg-dialog-footer">').append(o('<button class="exlg-dialog-btn">确定</button>').on("click",()=>G.accept_dialog()))[e.confirm_position==="left"?"prepend":"append"](o('<button class="exlg-dialog-btn">取消</button>').on("click",()=>G.hide_dialog()))).on("click",p=>p.stopPropagation()).on("mousedown",p=>p.stopPropagation())).on("mousedown",()=>l=!0).on("mouseup",()=>{l&&G.hide_dialog(),l=!1}).appendTo(o(document.body));let[a,s,d,g]=[t,r,n,i];Object.assign(G,{wrapper:a,container:s,header:d,content:g,wait_time:{"0s":0,".2s":100,".25s":250,".4s":400}[e.animation_speed]})},`
/* input for our badge register */
input[exlg-badge-register] {
    outline: none;
    display: inline-block;
    width: auto;
    padding: 0.5em;
    /* font-size: 1.6rem; */
    line-height: 1.2;
    color: #555;
    vertical-align: middle;
    background-color: #fff;
    background-image: none;
    border: 1px solid #ccc;
    border-radius: 0;
    -webkit-appearance: none;
    -webkit-transition: border-color .15s ease-in-out,-webkit-box-shadow .15s ease-in-out;
    transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}
input[exlg-badge-register]:focus {
    border: 1px solid #3bb4f2;
}
body {
    margin: 0px;
}
.exlg-dialog-footer {
    bottom: 0px;
    position: absolute;
    right: 0px;
    padding: 10px 6px;
}
/*
.exlg-dialog-container.container-show:hover > .exlg-dialog-btn.exlg-dialog-btn-confirm {
    background: rgba(30, 140, 200, 0.80);
}
.exlg-dialog-btn.exlg-dialog-btn-confirm {
    background: rgba(30, 140, 200, 0.20);
}
*/
.exlg-dialog-container.container-show:hover > .exlg-dialog-btn {
    background: rgba(255, 255, 255, 0.80);
}
.exlg-dialog-btn {
    margin: 0px 4px;
    display: inline-block;
    float: right;
    color: #666;
    min-width: 75px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.20);
    padding: 7px 10px;
    border: 1px solid #ddd;
    border-radius: 3px;
}
.exlg-dialog-container.container-hide {
    opacity: 0;
}
.exlg-dialog-container.container-show:hover {
    background: rgba(250, 250, 250, 0.80);
    box-shadow: 0 2px 8px rgb(0 0 0 / 40%);
    opacity: 1;
}
.exlg-dialog-container {
    filter: blur(0);
    position: relative;
    opacity: 0.75;
    background: rgba(204, 204, 204, 0.20);
    width: 500px;
    min-height: 300px;
    border-radius: 5px;
    margin: 0 auto;
    box-shadow: 0 2px 8px rgb(0 0 0 / 25%);
    font-size: 16px;
    line-height: 1.5;
    /* transition: all .4s; */
    backdrop-filter: blur(20px);
}
.exlg-dialog-wrapper {
    position: fixed;
    left: 0px;
    top: 0px;
    background: rgba(0, 0, 0, 0);
    width: 100%;
    height: 100%;
    /* opacity: 0.2;*/
    /* vertical-align: middle; */
    align-items: center;
    display: table-cell;
    z-index: 10;
}
.exlg-dialog-header {
    height: auto;
    border-bottom: 1px solid #eee;
    padding: 11px 20px;
}
.exlg-dialog-body {
    text-align: center;
    margin-bottom: 50px;
    padding: 20px 30px;
    padding-bottom: 10px;
    line-height: 2;
}
#header-right {
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 5px;
    background: rgba(0, 0, 0, 0);
    color: red;
    right: 10px;
    top: 10px;
    text-align: center;
}
`);c.reg("discussion-save","讨论保存",["@/discuss/\\d+(\\?page\\=\\d+)*$"],{auto_save_discussion:{ty:"boolean",dft:!1,strict:!0,info:["Discussion Auto Save","自动保存讨论"]}},({msto:e})=>{let t=o('<button class="am-btn am-btn-success am-btn-sm" name="save-discuss">保存讨论</button>');t.on("click",()=>{t.prop("disabled",!0),t.text("保存中..."),M({url:`https://luogulo.gq/save.php?url=${window.location.href}`,onload:n=>{n.status===200?n.response==="success"?($("Discuss saved"),t.text("保存成功"),setTimeout(()=>{t.text("保存讨论"),t.removeAttr("disabled")},1e3)):($(`Discuss unsuccessfully saved, return data: ${n.response}`),t.text("保存失败"),t.toggleClass("am-btn-success").toggleClass("am-btn-warning"),setTimeout(()=>{t.text("保存讨论"),t.removeAttr("disabled"),t.toggleClass("am-btn-success").toggleClass("am-btn-warning")},1e3)):($(`Fail to save discuss: ${n}`),t.toggleClass("am-btn-success").toggleClass("am-btn-danger"),setTimeout(()=>{t.text("保存讨论"),t.removeAttr("disabled"),t.toggleClass("am-btn-success").toggleClass("am-btn-danger")},1e3))},onerror:n=>{$(`Error:${n}`),t.removeAttr("disabled")}})}).css("margin-top","5px");let r=o(`<a class="am-btn am-btn-warning am-btn-sm" name="save-discuss" href="https://luogulo.gq/show.php?url=${location.href}">查看备份</a>`).css("margin-top","5px");o("section.lg-summary").find("p").append(o("<br>")).append(t).append(o("<span>&nbsp;</span>")).append(r),e.auto_save_discussion&&t.click()},`
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
`);var H={EMO:1,TXT:2};c.reg("emoticon","表情输入",["@/paste","@/discuss/.*","@/"],{benben:{ty:"boolean",dft:!0,info:["Show in benben","犇犇表情"]},show:{ty:"boolean",dft:!0,info:["Show in default","是否默认显示表情栏"]},src:{ty:"enum",vals:["图.tk","github","妙.tk","啧.tk"],dft:"图.tk",info:["Emoticon Source","表情源"]},height_limit:{ty:"boolean",dft:!0,info:["Expand in default","是否默认展开表情"]}},({msto:e})=>{let t=["kk","jk","se","qq","xyx","xia","cy","ll","xk","qiao","qiang","ruo","mg","dx","youl","baojin","shq","lb","lh","qd","fad","dao","cd","kun","px","ts","kl","yiw","dk",{name:["sto"],slug:"gg",name_display:"sto",width:40},{name:["orz"],slug:"gh",name_display:"orz",width:40},{name:["qwq"],slug:"g5",name_display:"qwq",width:40},{name:["hqlm"],slug:"l0",name_display:"火前留名"},{name:["sqlm"],slug:"l1",name_display:"山前留名"},{name:["xbt"],slug:"g1",name_display:"屑标题"},{name:["iee","wee"],slug:"g2",name_display:"我谔谔"},{name:["kg"],slug:"g3",name_display:"烤咕"},{name:["gl"],slug:"g4",name_display:"盖楼"},{name:["wyy"],slug:"g6",name_display:"无意义"},{name:["wgzs"],slug:"g7",name_display:"违规紫衫"},{name:["tt"],slug:"g8",name_display:"贴贴"},{name:["jbl"],slug:"g9",name_display:"举报了"},{name:["%%%","mmm"],slug:"ga",name_display:"%%%"},{name:["ngrb"],slug:"gb",name_display:"你谷日爆"},{name:["qpzc","qp","zc"],slug:"gc",name_display:"前排资瓷"},{name:["cmzz"],slug:"gd",name_display:"臭名昭著"},{name:["zyx"],slug:"ge",name_display:"致远星"},{name:["zh"],slug:"gf",name_display:"祝好"}].filter(g=>e.src!=="啧.tk"||typeof g!="object").map((g,p)=>typeof g=="string"?{type:H.EMO,name:[g],slug:p>=10?String.fromCharCode(97+(p-10)):String.fromCharCode(48+p)}:{type:H.TXT,...g}),r=e.src==="github"?({slug:g})=>`//cdn.jsdelivr.net/gh/extend-luogu/extend-luogu/img/emoji/${g}`:e.src==="啧.tk"?({name:g})=>`//${e.src}/${g[0]}`:({slug:g})=>`//${e.src}/${g}`;if(e.benben&&location.pathname==="/"){let g=o("#feed-content"),p=g[0];o("#feed-content").before("<div id='emo-lst'></div>"),t.forEach(_=>{let y=o(_.type===H.EMO?`<button class="exlg-emo-btn" exlg="exlg"><img src="${r(_)}" /></button>`:`<button class="exlg-emo-btn" exlg="exlg">${_.name_display}</button>`).on("click",()=>{let C=p.value,j=p.selectionStart,u=C.slice(0,j)+`![](${r(_)})`;p.value=u+C.slice(p.selectionEnd),p.focus(),p.setSelectionRange(u.length,u.length)}).appendTo("#emo-lst");_.width?y.css("width",_.width+"px"):_.type===H.EMO?y.css("width","40px"):y.css("width","83px")}),o("#feed-content").before("<br>")}let n=o(".mp-editor-menu"),i=o(".CodeMirror-wrap textarea");if(!n.length)return;let l=n.clone().addClass("exlg-emo");n.after(l),l[0].innerHTML="",o("<br />").appendTo(n),o(".mp-editor-ground").addClass("exlg-ext");let a=o(".mp-editor-ground"),s=n.children().first().clone(!0).addClass("exlg-unselectable"),d=n.children().first().clone(!0).addClass("exlg-unselectable");n.children().last().before(s),n.children().last().before(d),s.children()[0].innerHTML=e.show?"隐藏":"显示",e.show&&(l.addClass("exlg-show-emo"),a.addClass("exlg-show-emo")),s.on("click",()=>{s.children()[0].innerHTML=["显示","隐藏"][["隐藏","显示"].indexOf(s.children()[0].innerHTML)],l.toggleClass("exlg-show-emo"),a.toggleClass("exlg-show-emo"),e.show=!e.show}),d.children()[0].innerHTML=e.height_limit?"展开":"收起",e.height_limit?(l.addClass("exlg-show-emo-short"),a.addClass("exlg-show-emo-short")):(l.addClass("exlg-show-emo-long"),a.addClass("exlg-show-emo-long")),d.on("click",()=>{d.children()[0].innerHTML=["收起","展开"][["展开","收起"].indexOf(d.children()[0].innerHTML)],l.toggleClass("exlg-show-emo-short").toggleClass("exlg-show-emo-long"),a.toggleClass("exlg-show-emo-short").toggleClass("exlg-show-emo-long"),e.height_limit=!e.height_limit}),t.forEach(g=>{let p=o(g.type===H.EMO?`<button class="exlg-emo-btn" exlg="exlg"><img src="${r(g)}" /></button>`:`<button class="exlg-emo-btn" exlg="exlg">${g.name_display}</button>`).on("click",()=>i.trigger("focus").val(`![](${r(g)})`).trigger("input")).appendTo(l);g.width?p.css("width",g.width+"px"):g.type===H.EMO?p.css("width","40px"):p.css("width","83px")}),l.append("<div style='height: .35em'></div>")},`
    .mp-editor-ground.exlg-ext.exlg-show-emo.exlg-show-emo-long {
        top: 8.25em !important;
    }
    .mp-editor-ground.exlg-ext.exlg-show-emo.exlg-show-emo-short {
        top: 4.75em !important;
    }
    .mp-editor-menu > br ~ li {
        position: relative;
        display: inline-block;
        margin: 0;
        padding: 5px 1px;
    }
    .mp-editor-menu.exlg-show-emo.exlg-show-emo-long {
        height: 6em !important;
        overflow: auto;
        background-color: #fff;
    }
    .mp-editor-menu.exlg-show-emo.exlg-show-emo-short {
        height: 2.5em !important;
        overflow: auto;
        background-color: #fff;
    }
    .exlg-emo-btn {
        position: relative;
        top: 0px;
        border: none;
        background-color: #eee;
        border-radius: .7em;
        margin: .1em;
        transition: all .4s;
        height: 2em;
    }
    .exlg-emo-btn:hover {
        background-color: #f3f3f3;
        top: -3px;
    }
    .exlg-emo, .exlg-ext {
        transition: all .15s;
    }
`);c.reg("keyboard-and-cli","键盘操作与命令行","@/.*",{lang:{ty:"enum",dft:"en",vals:["en","zh"]}},({msto:e})=>{let t=o('<div id="exlg-cli" exlg="exlg"></div>').appendTo(o("body")),r=o('<input id="exlg-cli-input" />').appendTo(t),n=!1,i=(u,...f)=>{n=!0;let m=u.map((w,x)=>w.split(/\b/).map(v=>p[v]?.[_-1]??v).join("")+(f[x]||"")).join("");return r.val(m)},l=(u,...f)=>I(i(u,...f).addClass("error").val()),a=()=>(n=!1,r.val("").removeClass("error")),s=[],d=0,g=["en","zh"],p={".":["。"],",":["，"],"!":["！"],"?":["？"],cli:["命令行"],current:["当前"],language:["语言"],available:["可用"],command:["命令"],commands:["命令"],unknown:["未知"],forum:["板块"],target:["目标"],mod:["模块"],action:["操作"],illegal:["错误"],param:["参数"],expected:["期望"],type:["类型"],lost:["缺失"],essential:["必要"],user:["用户"]},_=g.indexOf(e.lang)||0,y=(u,f,m,w)=>(f=f.replace(/ /g,"").split(",").map(x=>{let v={};return x[0]==="["?(v.essential=!1,x=x.slice(1,-1)):v.essential=!0,[v.name,v.type]=x.split(":"),v}),{name:u,arg:f,help:m,fn:w}),C=[y("help","[cmd: string]",["get the help of <cmd>. or list all cmds.","获取 <cmd> 的帮助。空则列出所有"],u=>{if(!u)i`exlg cli. current language: ${_}, available commands: ${Object.keys(C).join(", ")}`;else{let f=C[u];if(!f)return l`help: unknown command "${u}"`;let m=f.arg.map(w=>{let x=w.name+": "+w.type;return w.essential?`<${x}>`:`[${x}]`}).join(" ");i`${u} ${m} ${f.help[_]}`}}),y("cd","path: string",["jump to <path>, relative path is OK.","跳转至 <path>，支持相对路径。"],u=>{let f;if(u[0]==="/")f=u;else{let m=location.pathname.replace(/^\/+/,"").split("/");u.split("/").forEach(x=>{x!=="."&&(x===".."?m.pop():m.push(x))}),f=m.join("/")}location.href=location.origin+"/"+f.replace(/^\/+/,"")}),y("cdd","forum: string",["jump to the forum named <forum> of discussion. use all the names you can think of.","跳转至名为 <forum> 的讨论板块，你能想到的名字基本都有用。"],u=>{let f=[["relevantaffairs","gs","gsq","灌水","灌水区","r","ra"],["academics","xs","xsb","学术","学术版","a","ac"],["siteaffairs","zw","zwb","站务","站务版","s","sa"],["problem","tm","tmzb","题目","题目总版","p"],["service","fk","fksqgd","反馈","反馈、申请、工单专版","se"]];if(u=f.find(m=>m.includes(u))?.[0],!f)return l`cdd: unknown forum "${u}"`;C.cd.fn(`/discuss/lists?forumname=${u}`)}),y("cc","[name: char]",['jump to <name>, "h|p|c|r|d|i|m|n" stands for home|problem|contest|record|discuss|I myself|message|notification. or jump home.','跳转至 [name]，"h|p|c|r|d|i|m|n" 代表：主页|题目|比赛|评测记录|讨论|个人中心|私信|通知。空则跳转主页。'],u=>{u=u||"h";let f={h:"/",p:"/problem/list",c:"/contest/list",r:"/record/list",d:"/discuss/lists",i:"/user/"+N.uid,m:"/chat",n:"/user/notification"}[u];f?C.cd.fn(f):l`cc: unknown target "${u}"`}),y("mod","action: string, [name: string]",['for <action> "enable|disable|toggle", opearte the mod named <name>.','当 <action> 为 "enable|disable|toggle"，对名为 <name> 的模块执行对应操作：启用|禁用|切换。'],(u,f)=>{switch(u){case"enable":case"disable":case"toggle":if(!c.has(f))return l`mod: unknown mod "${f}"`;L[f].on={enable:()=>!0,disable:()=>!1,toggle:m=>!m}[u](L[f].on);break;default:return l`mod: unknown action "${u}"`}}),y("dash","action: string",['for <action> "show|hide|toggle", opearte the exlg dashboard.','当 <action> 为 "show|hide|toggle", 显示|隐藏|切换 exlg 管理面板。'],u=>{if(!["show","hide","toggle"].includes(u))return l`dash: unknown action "${u}"`;o("#exlg-dash-window")[u]()}),y("lang","lang: string",['for <lang> "en|zh" switch current cli language.','当 <lang> 为 "en|zh"，切换当前语言。'],u=>{try{e.lang=u,_=g.indexOf(u)}catch{return l`lang: unknown language ${u}`}}),y("uid","uid: integer",["jumps to homepage of user whose uid is <uid>.","跳转至 uid 为 <uid> 的用户主页。"],u=>location.href=`/user/${u}`),y("un","name: string",["jumps to homepage of user whose username is like <name>.","跳转至用户名与 <name> 类似的用户主页。"],u=>{o.get("/api/user/search?keyword="+u,f=>{f.users[0]?location.href="/user/"+f.users[0].uid:l`un: unknown user "${u}".`})})].reduce((u,f)=>(u[f.name]=f,u),{}),j=u=>{$(`Parsing command: "${u}"`);let f=u.trim().replace(/^\//,"").split(" "),m=f.shift();if(!m)return;let w=C[m];if(!w)return l`exlg: unknown command "${m}"`;let x=-1,v;for([x,v]of f.entries()){let k=w.arg[x].type;if((k==="number"||k==="integer")&&(f[x]=+v),!(k==="char"&&v.length===1||k==="number"&&!isNaN(f[x])||k==="integer"&&!isNaN(f[x])&&!(f[x]%1)||k==="string"))return l`${m}: illegal param "${v}", expected type ${k}.`}if(w.arg[x+1]?.essential)return l`${m}: lost essential param "${w.arg[x+1].name}"`;w.fn(...f)};r.on("keydown",u=>{switch(u.key){case"Enter":if(n)return a();let f=r.val();if(s.push(f),d=s.length,j(f),!n)return a();break;case"/":n&&a();break;case"Escape":t.hide();break;case"ArrowUp":case"ArrowDown":let m=d+{ArrowUp:-1,ArrowDown:1}[u.key];if(m<0||m>=s.length)return;d=m,r.val(s[m]);break}}),o(h).on("keydown",u=>{let f=o(document.activeElement);if(f.is("body")){let m={ArrowLeft:"prev",ArrowRight:"next"}[u.key];if(m)return o(`a[rel=${m}]`)[0].click();if(u.shiftKey){let w={ArrowUp:0,ArrowDown:1e6}[u.key];w!==void 0&&h.scrollTo(0,w)}u.key==="/"&&(t.show(),a().trigger("focus"))}else f.is("[name=captcha]")&&u.key==="Enter"&&o("#submitpost, #submit-reply")[0].click()})},`
    #exlg-cli {
        position: fixed;
        top: 0;
        z-index: 65536;
        display: none;
        width: 100%;
        height: 40px;
        background-color: white;
        box-shadow: 0 0 7px dodgerblue;
    }
    #exlg-cli-input {
        display: block;
        height: 100%;
        width: 100%;
        border: none;
        outline: none;
        font-family: "Fira Code", "consolas", "Courier New", monospace;
    }
    #exlg-cli-input.error {
        background-color: indianred;
    }
`);c.reg("malicious-code-identifier","有害代码检查器",["@/discuss/\\d+(\\?page\\=\\d+)*$"],{strength:{ty:"number",dft:3,min:1,max:5,step:1,info:["Strength","强度"],strict:!0}},({msto:e})=>{let t=o("code").text().toLowerCase(),r=e.strength,n=[],i=!1;if(r>=1&&(t.match("net user")&&n.push("高危 操作用户"),t.match("shutdown")&&n.push("高危 关机"),t.match("socksorkstation")&&n.push("高危 锁定桌面")),r>=2&&t.match("taskkill")&&n.push("危险 关闭进程"),r>=3&&(t.match("windows.h")&&n.push("可疑 引用 windows.h"),t.match("system")&&(n.push("可疑 调用系统函数"),i=!0),t.match("encode")&&i&&n.push("高危 存在加密字符串")),n.length!==0){debugger;T(n.join("</br>").replace("高危",'<a class = "exlg-high-risk">[高危]</a>').replace("危险",'<a class = "exlg-med-risk">[危险]</a>').replace("可疑",'<a class = "exlg-low-risk">[可疑]</a>'),"发现有害代码")}},`
.exlg-high-risk {
    color: #dd514c;
}
.exlg-med-risk {
    color: #ff5722;
}
.exlg-low-risk {
    color: #8c8c8c;
}
`);var z={NOT_AT_PRACTICE_PAGE:-1,NONE:-2,COMMENT_TAG:-3,NOT_A_PROBLEM_ELEMENT:-4,ADD_COMPARE:1};c.reg("dbc-jump","双击题号跳题","@/.*",null,()=>{o(document).on("dblclick",e=>{let t=window.getSelection().toString().trim().toUpperCase(),r=e.ctrlkey?o(".ops > a[href*=blog]").attr("href")+"solution-":"https://www.luogu.com.cn/problem/";J(t)&&window.open(r+t)})});c.reg_pre("hide-solution","隐藏题解","@/problem/solution/.*",{hidesolu:{ty:"boolean",dft:!1,info:["Hide Solution","隐藏题解"]}},async({msto:e})=>e.hidesolu?GM_addStyle(".item-row { display: none; }"):"memset0珂爱",null);c.reg_hook_new("back-to-contest","返回比赛题单",["@/problem/[A-Z0-9]+\\?contestId=[1-9][0-9]{0,}"],null,({args:e})=>{let t=e.$info_rows,r=o('<a class="exlg-back-to-contest"></a>'),n=e.cid;!e.pid||!n||r.attr("href",`/contest/${n}#problems`).html(`<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="door-open" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="svg-inline--fa fa-door-open fa-w-20">
            <path data-v-450d4937="" data-v-303bbf52="" fill="currentColor" d="M624 448h-80V113.45C544 86.19 522.47 64 496 64H384v64h96v384h144c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16zM312.24 1.01l-192 49.74C105.99 54.44 96 67.7 96 82.92V448H16c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h336V33.18c0-21.58-19.56-37.41-39.76-32.17zM264 288c-13.25 0-24-14.33-24-32s10.75-32 24-32 24 14.33 24 32-10.75 32-24 32z"></path>
            </svg>返回列表`).appendTo(t)},e=>{let t=e.target,r=b.contest.id,n=b.problem.pid;return{args:{cid:r,pid:n,$info_rows:o(t.parentNode)},result:t.tagName.toLowerCase()==="a"&&(t.href||"").includes("/record/list")&&t.href.slice(t.href.indexOf("/record/list"))===`/record/list?pid=${n}&contestId=${r}`}},()=>({cid:b.contest.id,pid:b.problem.pid,$info_rows:o(".info-rows").parent()}),`
.exlg-back-to-contest {
    text-decoration: none;
    float: right;
    color: rgb(231, 76, 60);
}
.exlg-back-to-contest:hover {
    color: rgb(231, 76, 60);
}
`);c.reg_hook_new("submission-color","记录难度可视化","@/record/list.*",null,async({args:e})=>{if(e&&e.type==="show"){if(o("div.problem > div > a > span.pid").length&&!o(".exlg-difficulty-color").length){let i=(await P(location.href)).currentData.records.result.map(l=>l.problem.difficulty);o("div.problem > div > a > span.pid").each((l,a,s=o(a))=>{s.addClass("exlg-difficulty-color").addClass(`color-${i[l]}`)})}return}if(o(".exlg-difficulty-color").length)return;let r=(await P(location.href)).currentData.records.result.map(n=>n.problem.difficulty);o(e.target).find("div.problem > div > a > span.pid").each((n,i,l=o(i))=>{l.addClass("exlg-difficulty-color").addClass(`color-${r[n]}`)})},e=>{let t=e.target;return!t||!t.tagName?{args:z.COMMENT_TAG,result:!1}:t.tagName.toLowerCase()==="a"&&(t.href||"").includes("/problem/")&&` ${t.parentNode.parentNode.className} `.includes(" problem ")?t.parentNode.parentNode.parentNode.nextSibling?{args:{type:"modified - not the last one.",target:null},result:!1}:{args:{type:"modified - update",target:t.parentNode.parentNode.parentNode.parentNode},result:!0}:{args:{type:"modified - not that one.",target:null},result:!1}},()=>({type:"show"}),"");c.reg("mainpage-discuss-limit","主页讨论个数限制",["@/"],{max_discuss:{ty:"number",dft:12,min:4,max:16,step:1,info:["Max Discussions On Show","主页讨论显示上限"],strict:!0}},({msto:e})=>{let t;location.href.includes("blog")||(o(".lg-article").each((r,n,i=o(n))=>{let l=n.childNodes[1];l&&l.tagName.toLowerCase()==="h2"&&l.innerText.includes("讨论")&&(t=i.children(".am-panel"))}),t.each((r,n,i=o(n))=>{r>=e.max_discuss&&i.hide()}))});c.reg("user-css","自定义样式表",".*",{css:{ty:"string"}},({msto:e})=>GM_addStyle(e.css));c.reg_chore("atdiff-fetch","获取_AtCoder_难度","10D","@/problem/AT.*",{atdiff:{ty:"string",priv:!0}},({msto:e})=>{let t={};M({url:"https://kenkoooo.com/atcoder/resources/problem-models.json",onload:r=>{let n=JSON.parse(r.responseText);for(let i in n)t[i]=n[i].difficulty;e.atdiff=JSON.stringify(t)}})});c.reg_pre("original-difficulty","显示原始难度",["@/problem/CF.*","@/problem/AT.*"],{cf_src:{ty:"enum",dft:"codeforces.com",vals:["codeforces.com","codeforces.ml"],info:["Codeforces problem source","CF 题目源"]}},async({msto:e})=>new Promise((t,r)=>{let n=location.pathname.match(/(CF|AT)([0-9]|[A-Z])*$/g)[0].substring(2);if(location.pathname.includes("CF")){let i=n.match(/^[0-9]*/g)[0],l=n.substring(i.length);M({url:`https://${e.cf_src}/problemset/problem/${i}/${l}`,onload:a=>{let s=o(a.responseText).find("span[title=Difficulty]").text().trim();t(s?s.substring(1):void 0)},onerror:a=>{E(a),r(a)}})}else{let i=JSON.parse(L["^atdiff-fetch"].atdiff),l=b.problem.description.match(RegExp("^.{22}[-./A-Za-z0-9_]*"))[0].match(RegExp("[^/]*$"));l in i?t(Math.round(i[l]>=400?i[l]:400/Math.exp(1-i[l]/400))):t(void 0)}}),({pred:e})=>{let t=document.querySelectorAll("div.field"),r=t[3].cloneNode(!0);t[3].after(r);let n=r.querySelectorAll("span");n[0].innerText="原始难度",n[1].innerText="获取中",e.then(i=>{i===void 0&&(i="不可用"),n[1].innerText=i})});c.reg("rand-problem-ex","随机跳题_ex","@/",{exrand_difficulty:{ty:"tuple",lvs:[{ty:"boolean",dft:!1,strict:!0,repeat:8}],priv:!0},exrand_source:{ty:"tuple",lvs:[{ty:"boolean",dft:!1,strict:!0,repeat:5}],priv:!0}},({msto:e})=>{let t=[["入门","red"],["普及-","orange"],["普及/提高-","yellow"],["普及+/提高","green"],["提高+/省选-","blue"],["省选/NOI-","purple"],["NOI/NOI+/CTSC","black"],["暂无评定","gray"]].map((m,w,x)=>({text:m[0],color:m[1],id:(w+1)%x.length})),r=[{text:"洛谷题库",color:"red",id:"P"},{text:"Codeforces",color:"orange",id:"CF"},{text:"SPOJ",color:"yellow",id:"SP"},{text:"AtCoder",color:"green",id:"AT"},{text:"UVA",color:"blue",id:"UVA"}],n=m=>{J(m)&&(m=m.toUpperCase()),m===""||typeof m>"u"?h.show_alert("提示","请输入题号"):location.href="https://www.luogu.com.cn/problemnew/show/"+m},i=!1,l=!1,a=o("input[name='toproblem']");a.after(a.clone()).remove(),a=o("input[name='toproblem']");let s=o(".am-btn[name='goto']");s.after(s.clone()).remove(),s=o(".am-btn[name='goto']");let d=s.parent();o(".am-btn[name='gotorandom']").text("随机");let g=o('<button class="am-btn am-btn-success am-btn-sm" name="gotorandomex">随机ex</button>').appendTo(d);s.on("click",()=>{/^[0-9]+.?[0-9]*$/.test(a.val())&&a.val("P"+a.val()),n(a.val())}),a.on("keydown",m=>{m.keyCode===13&&s.click()});let p=o(`<span id="exlg-exrand-window" class="exlg-window" style="display: block;">
    <br>
    <ul></ul>
    </span>`).appendTo(d).hide().on("mouseenter",()=>{i=!0}).on("mouseleave",()=>{i=!1,l||p.hide()});o(".lg-index-stat>h2").text("问题跳转 ").append(o('<div id="exlg-dash-0" class="exlg-rand-settings">ex设置</div>'));let _=p.children("ul").css("list-style-type","none"),y=o('<div id="exlg-exrand-menu"></div>').appendTo(_);o("<br>").appendTo(_);let C=o('<div id="exlg-exrand-diff" class="smallbtn-list"></div>').appendTo(_),j=o('<div id="exlg-exrand-srce" class="smallbtn-list"></div>').appendTo(_).hide(),u=o.double(m=>o(`<div class="exlg-rand-settings exlg-unselectable exrand-entry">${m}</div>`).appendTo(y),"题目难度","题目来源");u[0].after(o('<span class="exlg-unselectable">&nbsp;&nbsp;</span>')),u[0].addClass("selected").css("margin-right","38px"),o.double(([m,w])=>{m.on("click",()=>{o(".exrand-entry").removeClass("selected"),m.addClass("selected"),o(".smallbtn-list").hide(),w.show()})},[u[0],C],[u[1],j]),o.double(([m,w,x])=>{let v=o.double(([k,S])=>o(`<span class="${k}">
        <span class="lg-small lg-inline-up exlg-unselectable">${S}</span>
        <br>
        </span>`).appendTo(m),["exrand-enabled","已选择"],["exrand-disabled","未选择"]);w.forEach((k,S)=>{let A=o.double(O=>o(`<div class="exlg-smallbtn exlg-unselectable">${k.text}</div>`).css("background-color",`var(--lg-${k.color}-problem)`).appendTo(O),v[0],v[1]);o.double(O=>{A[O].on("click",()=>{A[O].hide(),A[1-O].show(),x[S]=!!O}),x[S]===!!O&&A[O].hide()},0,1)})},[C,t,e.exrand_difficulty],[j,r,e.exrand_source]),o("#exlg-dash-0").on("mouseenter",()=>{l=!0,o.double(([m,w])=>{o.double(([x,v])=>{m.children(x).children(".exlg-smallbtn").each((k,S,A=o(S))=>w[k]===v?A.show():A.hide())},[".exrand-enabled",!0],[".exrand-disabled",!1])},[C,e.exrand_difficulty],[j,e.exrand_source]),p.show()}).on("mouseleave",()=>{l=!1,i||setTimeout(()=>{i||p.hide()},200)});let f=async()=>{let m=o.double(([le,ie,ae])=>{let F=[];return le.forEach((se,de)=>{ie[de]&&F.push(se.id)}),F.length||(F=ae),F[Math.floor(Math.random()*F.length)]},[t,e.exrand_difficulty,[0,1,2,3,4,5,6,7]],[r,e.exrand_source,["P"]]),w=await P(`/problem/list?difficulty=${m[0]}&type=${m[1]}&page=1`),x=w.currentData.problems.count,v=Math.ceil(x/50),k=Math.floor(Math.random()*v)+1;w=await P(`/problem/list?difficulty=${m[0]}&type=${m[1]}&page=${k}`);let S=w.currentData.problems.result,A=Math.floor(Math.random()*S.length),O=S[A].pid;location.href=`/problem/${O}`};g.on("click",f)},`
.exlg-rand-settings {
    position: relative;
    display: inline-block;
    padding: 1px 5px 1px 5px;
    background-color: white;
    border: 1px solid #6495ED;
    color: cornflowerblue;
    border-radius: 6px;
    font-size: 12px;
    position: relative;
    top: -2px;
}
.exlg-rand-settings.selected {
    background-color: cornflowerblue;
    border: 1px solid #6495ED;
    color: white;
}
.exlg-rand-settings:hover {
    box-shadow: 0 0 7px dodgerblue;
}
.exlg-smallbtn {
    position: relative;
    display: inline-block;
    padding: 1px 5px 1px;
    color: white;
    border-radius: 6px;
    font-size: 12px;
    margin-left: 1px;
    margin-right: 1px;
}
.exrand-enabled{
    width: 49%;
    float: left;
}
.exrand-disabled{
    width: 49%;
    float: right;
}
`);c.reg_hook_new("rand-training-problem","题单内随机跳题","@/training/[0-9]+(#.*)?",{mode:{ty:"enum",vals:["unac only","unac and new","new only"],dft:"unac and new",info:["Preferences about problem choosing","随机跳题的题目种类"]}},({msto:e,args:t})=>{let r=e.mode.startsWith("unac")+e.mode.endsWith("only")*-1+2;!t.length||o(t[0].firstChild).clone(!0).appendTo(t).text("随机跳题").addClass("exlg-rand-training-problem-btn").on("click",()=>{let n=b.training,i=[];if(n.problems.some(a=>{n.userScore.score[a.problem.pid]===null?r&1&&i.push(a.problem.pid):n.userScore.score[a.problem.pid]<a.problem.fullScore&&r&2&&i.push(a.problem.pid)}),n.problemCount){if(!i.length)return r===1?T("您已经做完所有新题啦！"):r===2?T("您已经订完所有错题啦！"):T("您已经切完所有题啦！")}else return T("题单不能为空");let l=~~(Math.random()*1e6)%i.length;location.href="https://www.luogu.com.cn/problem/"+i[l]})},e=>{let t=o(e.target).find("div.operation");return{result:t.length>0,args:t}},()=>o("div.operation"),`
.exlg-rand-training-problem-btn {
    border-color: rgb(52, 52, 52);
    background-color: rgb(52, 52, 52);
}
`);c.reg_chore("sponsor-list","获取标签列表","1D","@/.*",{tag_list:{ty:"string",priv:!0}},({msto:e})=>{M({url:"https://service-cmrlfv7t-1305163805.sh.apigw.tencentcs.com/release/get/0/0/",onload:t=>{e.tag_list=decodeURIComponent(t.responseText)}})});c.reg_hook_new("sponsor-tag","标签显示",["@/","@/paste","@/discuss/.*","@/problem/.*","@/ranking.*"],{tag_list:{ty:"string",priv:!0}},({args:e})=>{let t=JSON.parse(L["^sponsor-list"].tag_list),r=n=>{if(!n||n.hasClass("exlg-badge-username")||!/\/user\/[1-9][0-9]{0,}/.test(n.attr("href")))return;n.addClass("exlg-badge-username");let i=n.attr("href").slice(6),l=t[i];if(!l)return;let a=o(i==="100250"?`<span class="am-badge am-radius lg-bg-red" style="margin-left: 4px;">${l}</span>`:`<span class="exlg-badge">${l}</span>`).off("contextmenu").on("contextmenu",()=>!1).on("mousedown",d=>{d.button===2?location.href="https://www.luogu.com.cn/paste/asz40850":d.button===0&&Z()}),s=n;s.next().length&&s.next().hasClass("sb_amazeui")&&(s=s.next()),s.next().length&&s.next().hasClass("am-badge")&&(s=s.next()),s.after(a)};e.each((n,i)=>r(o(i)))},e=>{let t=o(e.target).find("a[target='_blank'][href]");return{result:t.length,args:t}},()=>o("a[target='_blank'][href]"),`
.exlg-badge {
    border-radius: 50px;
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 4px;
    padding-bottom: 4px;
    transition: all .15s;
    display: inline-block;
    min-width: 10px;
    font-size: 1em;
    font-weight: 700;
    background-color: mediumturquoise;
    color: #fff;
    line-height: 1;
    vertical-align: baseline;
    white-space: nowrap;
    cursor: pointer;
    margin-left: 2px;
    margin-right: 2px;
}
`);c.reg_main("springboard","跨域跳板",["@bili/robots.txt?.*","@/robots.txt?.*"],null,()=>{let e=new URLSearchParams(location.search);switch(e.get("type")){case"update":M({url:"https://api.github.com/repos/extend-luogu/extend-luogu/tags?per_page=1",onload:r=>h.parent.postMessage(["update",JSON.parse(r.responseText)[0].name],"*")}),h.addEventListener("message",r=>{r.data.unshift("update"),h.parent.postMessage(r.data,"*")});break;case"page":let t=e.get("url");(!e.get("confirm")||confirm(`是否加载来自 ${t} 的页面？`))&&(document.body.innerHTML=`<iframe src="${t}" exlg="exlg"></iframe>`);break;case"dash":break}},`
    iframe {
        border: none;
        display: block;
        width: 100%;
        height: 100%;
    }
    iframe::-webkit-scrollbar {
        display: none;
    }
`);c.reg("tasklist-ex","任务计划_ex","@/",{auto_clear:{ty:"boolean",dft:!0,info:["Hide accepted problems","隐藏已经 AC 的题目"]},rand_problem_in_tasklist:{ty:"boolean",dft:!0,info:["Random problem in tasklist","任务计划随机跳题"]}},({msto:e})=>{let t=[];o.each(o("div.tasklist-item"),(l,a,s=o(a))=>{let d=s.attr("data-pid");a.innerHTML.search(/check/g)===-1&&e.rand_problem_in_tasklist&&t.push(d),s.find("i").hasClass("am-icon-check")&&s.addClass("tasklist-ac-problem")});let r=o('<div>[<a id="toggle-button">隐藏已AC</a>]</div>');o("button[name=task-edit]").parent().after(r);let n=o(".tasklist-ac-problem"),i=o("#toggle-button").on("click",()=>{n.toggle(),i.text(["隐藏","显示"][+(e.auto_clear=!e.auto_clear)]+"已 AC")});if(e.auto_clear&&i.click(),e.rand_problem_in_tasklist){let l=o('<button name="task-rand" class="am-btn am-btn-sm am-btn-success lg-right">随机</button>');o("button[name='task-edit']").before(l),l.addClass("exlg-rand-tasklist-problem-btn").click(()=>{let a=~~(Math.random()*1e6)%t.length;location.href+=`problem/${t[a]}`})}},`
.exlg-rand-tasklist-problem-btn {
    margin-left: 0.5em;
}
`);var ee="";c.reg_chore("update","检查更新","1D",".*",null,()=>{o("#exlg-update").remove(),R({type:"update"}).appendTo(o("body")).hide(),h.addEventListener("message",e=>{if(e.data[0]!=="update")return;e.data.shift();let t=e.data[0],r=GM_info.script.version,n=D(r,t),i=`Comparing version: ${r} ${n} ${t}`;$(i)})});var ce=["$","#<@"].map(e=>e.split("")),te={Ty:{"-":"添加",x:"删减","!":"重大","*":"修改","^":"修复",$:"重构"},Op:{"-":"特性","?":"文档","#":"依赖","<":"代码风格",">":"命令",M:"模块",H:"钩子","@":"GitHub Action"}};c.reg("update-log","更新日志显示","@/.*",{last_version:{ty:"string",priv:!0},style:{ty:"enum",vals:["Commit Message","自然语言"],get:"id",info:["The way to display log","显示 Log 的方式"]},keep_dev:{ty:"boolean",dft:!0,info:["Keep developer messages","保留开发者更新信息"]}},({msto:e})=>{if(location.href.includes("blog"))return;let t=GM_info.script.version,r=!1,n=i=>{let l=`<div class="exlg-update-log-text" style="font-family: ${L["code-block-ex"].copy_code_font};">`;return i.split(`
`).forEach(a=>{let s=a.trimStart();if(e.keep_dev)r=!1;else if(s[0]===":"){if(!r)return}else if(ce.some((d,g)=>d.some(p=>s[g]===p))){r=!1;return}else r=!0;e.style===1&&s[0]!==":"&&(a=" ".repeat(a.length-s.length)+te.Ty[s[0]]+te.Op[s[1]]+s.substring(2)),l+=`<div>${a.replace(/ /g,"&nbsp;")}</div>`}),l+"</div>"};switch(D(e.last_version,t)){case"==":break;case"<<":T(n(ee),`extend-luogu ver. ${t} 更新日志`);case">>":e.last_version=t}},`
.exlg-update-log-text {
    overflow-x: auto;
    white-space: nowrap;
    text-align: left;
    /* border: 1px solid #dedede; */
}
`);c.reg_user_tab("user-intro-ins","用户首页_HTML_显示","main",null,null,()=>{o(".introduction > *").each((e,t,r=o(t))=>{let n=r.text(),[,,i,l]=n.match(/^(exlg.|%)([a-z]+):([^]+)$/)??[];if(!i)return;l=l.split(/(?<!!)%/g).map(s=>s.replace(/!%/g,"%"));let a=o(o(".user-action").children()[0]);switch(i){case"html":r.replaceWith(o(`<p exlg="exlg">${q.process(l[0])}</p>`));break;case"frame":r.replaceWith(R({type:"page",url:encodeURI(l[0]),confirm:!0},`width: ${l[1]}; height: ${l[2]};`));break;case"blog":if(a.text().trim()!=="个人博客")return;a.attr("href",l),r.remove();break}})},`
    iframe {
        border: none;
        display: block;
    }
    iframe::-webkit-scrollbar {
        display: none;
    }
`);var Y={SUBMITTED_PROBLEMS:0,PASSED_PROBLEMS:1},oe=-1,ne=Y.SUBMITTED_PROBLEMS,Q=-1,V=null,W=null;c.reg_hook_new("user-problem-color","题目颜色数量和比较","@/user/[0-9]{0,}.*",{problem_compare:{ty:"boolean",strict:!0,dft:!0,info:["AC compare","AC题目比较"]}},({msto:e,args:t})=>{let r=[[191,191,191],[254,76,97],[243,156,17],[255,193,22],[82,196,26],[52,152,219],[157,61,207],[14,29,105]],n=async(l,a)=>{if(V===null){let d=await P(`/user/${N.uid}`);V=b.passedProblems,W=new Set,d.currentData.passedProblems.forEach((g,p)=>W.add(g.pid))}let s=0;a&&l[1].querySelectorAll("a").forEach((g,p)=>{p<V.length&&W.has(V[p].pid)&&(s++,g.style.backgroundColor="rgba(82, 196, 26, 0.3)")}),o("#exlg-problem-count-1").html(`<span class="exlg-counter" exlg="exlg">${V.length} <> ${W.size} : ${s}<i class="exlg-icon exlg-info" name="ta 的 &lt;&gt; 我的 : 相同"></i></span>`)},i=l=>`rgb(${r[l][0]}, ${r[l][1]}, ${r[l][2]})`;if(typeof t=="object"&&t.message===z.ADD_COMPARE){if(!e.problem_compare||b.user.uid===N.uid)return;n([114514,1919810],!1);return}t.forEach(l=>{if(l.target.href!=="javascript:void 0"&&(l.target.style.color=i([(l.board_id?b.passedProblems:b.submittedProblems)[l.position].difficulty]),l.board_id===Y.PASSED_PROBLEMS&&l.position===b.passedProblems.length-1||b.passedProblems.length===0&&l.board_id===Y.SUBMITTED_PROBLEMS&&l.position===b.submittedProblems.length-1)){o(".exlg-counter").remove();let a=l.target.parentNode.parentNode.parentNode.parentNode,s=[a.firstChild.childNodes[2],a.lastChild.childNodes[2]];for(let d=0;d<2;++d){let g=s[d],p=b[["submittedProblems","passedProblems"][d]];g.before(o(`<span id="exlg-problem-count-${d}" class="exlg-counter" exlg="exlg">${p.length}</span>`)[0])}if(!e.problem_compare||b.user.uid===N.uid)return;n(s,!0)}})},e=>{if(location.hash!=="#practice")return{result:!1,args:{message:z.NOT_AT_PRACTICE_PAGE}};if(!b.submittedProblems.length&&!b.passedProblems.length){if(e.target.className==="card padding-default")if(o(e.target).children(".problems").length){let l=b[["submittedProblems","passedProblems"][Q]];if(o(e.target.firstChild).after(`<span id="exlg-problem-count-${Q}" class="exlg-counter" exlg="exlg" style="margin-left: 5px">${l.length}</span>`),++Q>1)return{result:!0,args:{message:z.ADD_COMPARE}}}else o(e.target).children(".difficulty-tags").length&&(Q=0);return{result:!1,args:{message:z.NONE}}}if(!e.target.tagName)return{result:!1,args:{message:z.COMMENT_TAG}};if(e.target.tagName.toLowerCase()!=="a"||e.target.className!=="color-default"||e.target.href.indexOf("/problem/")===-1)return{result:!1,args:{message:z.NOT_A_PROBLEM_ELEMENT}};let t=l=>l?l.pid:void 0,r=e.target,n=[t(b.submittedProblems[0]),t(b.passedProblems[0])].indexOf(r.href.slice(33)),i=n!==-1;return{result:!0,args:[{onchange:i,board_id:i?ne=n:ne,position:i?oe=0:++oe,target:r}]}},()=>{if(!b.submittedProblems.length&&!b.passedProblems.length){o(".exlg-counter").remove();let e=o(".card.padding-default > .problems");for(let t=0;t<2;++t){let r=o(e[t]),n=b[["submittedProblems","passedProblems"][t]];r.before(`<span id="exlg-problem-count-${t}" class="exlg-counter" exlg="exlg">${n.length}</span>`)}return{message:z.ADD_COMPARE}}return[]},`
    .main > .card > h3 {
        display: inline-block;
    }
`);c.reg("virtual-participation","创建重现赛","@/contest/[0-9]*(#.*)?",{},()=>{if(b.contest.name.match("Virtual Participation")){debugger;let e=o(".items"),t=()=>{(location.hash||"#main")==="#problems"&&o(".pid").length!==0&&b.contest.startTime>K(1e3)&&(o("a.title.color-default").on("click",()=>{T("比赛尚未开始, 请开始后再查看题目")}),o("a.title.color-default").removeAttr("href"))};e.on("click",t),t();return}if(b.contest.endTime>K(1e3)){I("Contest has not started or ended.");return}debugger;o("<button id='exlg-vp' class='lfe-form-sz-middle'>重现比赛</button>").appendTo(o("div.operation")).click(async()=>{T(`<div>
                <p>设置「${b.contest.name}」的重现赛</p>
                <p>开始时间：<input type="date" id="vpTmDt"/> <input type="time" id="vpTmClk"/></p>
            </div><br>`,"创建重现赛",async()=>{let e=o("#vpTmDt")[0].value.split("-"),t=o("#vpTmClk")[0].value.split(":"),r=new Date(e[0],e[1]-1,e[2],t[0],t[1],0,0);r=r.getTime()/1e3;let n="",i="";o.each(b.contestProblems,(g,p)=>{g&&(n+=",",i+=","),n+='"'+p.problem.pid+'"',i+=`"${p.problem.pid}": ${p.problem.fullScore}`});let l=null,a=`{
                    "settings":{
                        "name": "Virtual Participation for ${b.contest.name}",
                        "description": ${JSON.stringify(b.contest.description)},
                        "visibilityType":5,
                        "invitationCodeType":1,
                        "ruleType":${b.contest.ruleType},
                        "startTime":${r},
                        "endTime":${r+b.contest.endTime-b.contest.startTime},
                        "rated":false,
                        "ratingGroup":null
                    },
                    "hostID":${N.uid}
                }`;l=await U("/fe/api/contest/new",a);let s=l.id.toString();switch(l.status??200){case 200:s=l.id.toString();break;default:E(`Failed to modify contest ${s} with status code ${l.status}.`)}l=null;try{l=await U(`/fe/api/contest/editProblem/${s}`,`{
                            "pids":[${n}],
                            "scores":{${i}}
                        }`)}catch{T("<p>本场比赛的题目不公开</p>","重现赛创建失败");return}let d=await P(`/contest/edit/${s}`);await U(`/fe/api/contest/join/${s}`,`{"code": "${d.currentData.contest.joinCode}"}`),T(`<p>邀请码: ${d.currentData.contest.joinCode}</p>
                    <p>点确定自动跳转</p>`,"重现赛创建成功",()=>{location.href=`https://www.luogu.com.cn/contest/${s}`})},!1)})},`
#exlg-vp {
    margin-right: .5em;
    display: inline-block;
    flex: none;
    outline: 0;
    cursor: pointer;
    color: #fff;
    font-weight: inherit;
    line-height: 1.5;
    text-align: center;
    vertical-align: middle;
    background: 0 0;
    border-radius: 3px;
    border: 1px solid;
    border-color: #52c41a;
    background-color: #52c41a;
}
`);$("Exposing");Object.assign(h,{exlg:{mod:c,log:$,error:E,springboard:R,version_cmp:D,lg_alert:B,lg_content:P,register_badge:Z,TM_dat:{reload_dat:()=>(raw_dat=null,load_dat(c.data,{map:e=>{e.root=!e.rec,e.itmRoot=e.rec===2}})),type_dat,proxy_dat,load_dat,save_dat,clear_dat,raw_dat}},GM:{GM_info,GM_addStyle,GM_setClipboard,GM_xmlhttpRequest,GM_getValue,GM_setValue,GM_deleteValue,GM_listValues},$$:o,xss:q,marked});var re=e=>{try{c.fake_sto=h.exlg.TM_dat.sto=h.exlg.TM_dat.reload_dat()}catch(t){if(e)B("存储代理加载失败，清存重试中……"),clear_dat(),re(e-1);else throw B("失败次数过多，自闭中。这里建议联系开发人员呢。"),t}};re(1);c.preload();o(()=>{$("Launching"),c.execute()});})();
