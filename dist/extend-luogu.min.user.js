// ==UserScript==
// @name           extend-luogu
// @namespace      http://tampermonkey.net/
// @description    Make luogu more powerful.
// @description:zh 使洛谷拥有更多功能
// @icon           https://raw.fastgit.org/extend-luogu/extend-luogu/main/favicon.ico
// @icon64         https://exlg.cc/img/logo.png
// @homepage       https://exlg.cc
// @version        5.6.6
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
// @connect        luogu-captcha-bypass.piterator.com
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
(()=>{var x=unsafeWindow,$=(e,...t)=>x.console.log(`%c[exlg] ${e}`,"color: #0e90d2;",...t),I=(e,...t)=>x.console.warn(`%c[exlg] ${e}`,"color: #0e90d2;",...t),E=(e,...t)=>{throw x.console.error(`%c[exlg] ${e}`,"color: #0e90d2;",...t),Error(t.join(" "))},b=null,O=null;location.host==="www.luogu.com.cn"&&!/blog/g.test(location.href)&&(/(\?|&)_contentOnly($|=)/g.test(location.search)&&E("Content-Only pages."),x._feInjection.code!==200&&E("Luogu failed to load. Exlg stops loading."),b=x._feInjection.currentData,O=x._feInjection.currentUser);var le=e=>[e.ctrlKey?"Ctrl":"",e.shiftKey?"Shift":"",e.altKey?"Alt":"",e.key.toInitialCase()].join(""),n=jQuery.extend({double:(e,t,o)=>[e(t),e(o)]});jQuery.fn.extend({whenKey:function(e,t){typeof e=="object"?this.on("keydown",o=>{let l=e[le(o)];l&&l(o)}):this.on("keydown",o=>{le(o)===e&&t(o)})}});var B=new filterXSS.FilterXSS({onTagAttr:(e,t,o)=>{if(t==="style")return`${t}="${o}"`}});Date.prototype.format=function(e,t){t=t?"UTC":"";let o={"y+":this[`get${t}FullYear`](),"m+":this[`get${t}Month`]()+1,"d+":this[`get${t}Date`](),"H+":this[`get${t}Hours`](),"M+":this[`get${t}Minutes`](),"S+":this[`get${t}Seconds`](),"s+":this[`get${t}Milliseconds`]()};for(let l in o)RegExp(`(${l})`).test(e)&&(e=e.replace(RegExp.$1,("000"+o[l]).substr(o[l].toString().length+3-RegExp.$1.length)));return e};String.prototype.toInitialCase=function(){return this[0].toUpperCase()+this.slice(1)};Array.prototype.lastElem=function(){return this[this.length-1]};var q=(e,t)=>{if(!e)return"<<";let o=(p,h)=>p===h?"==":p<h?"<<":">>",l=["pre","alpha","beta"],[[r,a],[i,s]]=[e,t].map(p=>p.split(" "));if(r===i)return o(...[a,s].map(p=>p?l.findIndex(h=>h===p):1/0));let[d,g]=[r,i].map(p=>p.split("."));for(let[p,h]of d.entries())if(h!==g[p])return o(+h||0,+g[p]||0)},U=(e,t)=>{let o=new URLSearchParams;for(let r in e)o.set(r,e[r]);let l=n(`
        <iframe id="exlg-${e.type}" src=" https://www.bilibili.com/robots.txt?${o}" style="${t}" exlg="exlg"></iframe>
    `);return $("Building springboard: %o",l[0]),l},S=({url:e,onload:t,onerror:o=l=>E(l)})=>GM_xmlhttpRequest({url:e,method:"GET",onload:t,onerror:o}),re=({url:e,data:t,onload:o,onerror:l=r=>E(r)})=>GM_xmlhttpRequest({url:e,method:"POST",data:t,onload:o,onerror:l}),V=e=>{S({url:"https://api.github.com/repos/extend-luogu/extend-luogu/tags?per_page=1",onload:t=>{let o=JSON.parse(t.responseText)[0].name,l=GM_info.script.version,r=q(l,o),a=`Comparing version: ${l} ${r} ${o}`;$(a),e&&e(o,r)}})},oe=(e=1)=>~~(new Date().getTime()/e),j=e=>new Promise((t,o)=>n.get(e+(e.includes("?")?"&":"?")+"_contentOnly=1",l=>{l.code!==200&&o(`Requesting failure code: ${t.code}.`),t(l)})),J=x.show_alert?(e,t="exlg 提醒您")=>x.show_alert(t,e):(e,t="exlg 提醒您")=>x.alert(t+`
`+e),te=null,W=(e,t)=>n.ajax({url:e,data:t,headers:{"x-csrf-token":te===null?te=n("meta[name=csrf-token]").attr("content"):te,"content-type":"application/json"},method:"post"}),X=e=>[/^AT[1-9][0-9]{0,}$/i,/^CF[1-9][0-9]{0,}[A-Z][0-9]?$/i,/^SP[1-9][0-9]{0,}$/i,/^P[1-9][0-9]{3,}$/i,/^UVA[1-9][0-9]{2,}$/i,/^U[1-9][0-9]{0,}$/i,/^T[1-9][0-9]{0,}$/i,/^B[2-9][0-9]{3,}$/i].some(t=>t.test(e)),G={_ac_func:null,wrapper:null,container:null,wait_time:null,header:null,content:null,autoquit:!0,show_dialog(){this.wrapper.css("display","flex"),setTimeout(()=>{this.container.removeClass("container-hide"),this.container.addClass("container-show")},50)},hide_dialog(){this.container.addClass("container-hide"),this.container.removeClass("container-show"),setTimeout(()=>this.wrapper.hide(),this.wait_time)},accept_dialog(){this._ac_func(this.hide_dialog),this.autoquit&&this.hide_dialog()},show_exlg_alert(e="",t="exlg 提醒您",o=()=>{},l=!0){this.autoquit=l,this._ac_func=o,this.header.text(t),this.content.html(e),this.show_dialog()}},v=(...e)=>G.show_exlg_alert(...e);var Z=`<svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 0 136.14 30.56">
<g transform="translate(1.755, 0)" fill="#00a0d8">
	<g>
		<path d="M5.02-33.80L34.56-33.80L34.07-28.62L16.96-28.62L15.93-21.92L31.97-21.92L31.48-16.74L14.85-16.74L13.82-8.42L31.97-8.42L31.48-3.24L2.43-3.24L6.59-31.75L5.02-33.80Z" transform="translate(-4.14, 33.9)"></path>
		<path d="M7.34-32.29L5.78-33.80L16.63-33.80L21.33-25.00L27.54-32.78L26.51-33.80L38.93-33.80L25.49-18.79L34.78-3.24L24.41-3.24L19.76-12.58L11.99-3.24L1.62-3.24L15.12-18.79L7.34-32.29Z" transform="translate(27.23, 33.9)"></path>
		<path d="M4.00-33.80L16.42-33.80L12.80-8.42L32.99-8.42L32.51-3.24L5.56-3.24Q4.00-3.24 3.21-4.27Q2.43-5.29 2.43-6.86L2.43-6.86L5.56-31.75L4.00-33.80Z" transform="translate(63.8, 33.9)"></path>
		<path d="M38.83-33.80L37.80-25.00L27.43-25.00L27.92-28.62L15.50-28.62L12.91-8.42L25.33-8.42L25.87-14.63L22.73-19.82L36.72-19.82L34.67-3.24L5.62-3.24Q4.86-3.24 4.21-3.51Q3.56-3.78 3.10-4.27Q2.65-4.75 2.48-5.43Q2.32-6.10 2.54-6.86L2.54-6.86L6.16-33.80L38.83-33.80Z" transform="translate(95.6, 33.9)"></path>
	</g>
</g>
</svg>`;var C=null,c={_:new Map,fake_sto:C,data:{},path_alias:[["",".*\\.luogu\\.(com\\.cn|org)"],["dash","dash.exlg.cc"],["cdn","cdn.luogu.com.cn"],["bili","www.bilibili.com"],["tcs1","service-ig5px5gh-1305163805.sh.apigw.tencentcs.com"],["tcs2","service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com"],["tcs3","service-otgstbe5-1305163805.sh.apigw.tencentcs.com"],["debug","localhost:1634"],["ghpage","extend-luogu.github.io"]].map(([e,t])=>[new RegExp(`^@${e}/`),t]),path_dash_board:["@dash/((index|bundle)(.html)?)?","@ghpage/exlg-setting-new/((index|bundle)(.html)?)?","@debug/exlg-setting/((index|bundle).html)?"],reg:(e,t,o,l,r,a)=>{Array.isArray(o)||(o=[o]),o.forEach((i,s)=>{c.path_alias.some(([d,g])=>{if(i.match(d))return o[s]=i.replace(d,g+"/"),!0}),i.endsWith("$")||(o[s]+="$")}),c.data[e]={ty:"object",lvs:{...l,on:{ty:"boolean",dft:!0}}},c._.set(e,{info:t,path:o,func:r,styl:a})},reg_pre:(e,t,o,l,r,a,i)=>{c.reg(e,t,o,l,a,i),c._.set(e,{pre:r,...c._.get(e)})},reg_main:(e,t,o,l,r,a)=>c.reg("@"+e,t,o,l,i=>(r(i),!1),a),reg_user_tab:(e,t,o,l,r,a,i)=>c.reg(e,t,"@/user/.*",r,s=>{let d=n(".items"),g=()=>{(location.hash||"#main")==="#"+o&&($(`Working user tab#${o} mod: "${e}"`),a({...s,vars:l}))};d.on("click",g),g()},i),reg_chore:(e,t,o,l,r,a,i)=>{if(typeof o=="string"){let s=+o.slice(0,-1),d={s:1e3,m:1e3*60,h:1e3*60*60,D:1e3*60*60*24}[o.slice(-1)];!isNaN(s)&&d?o=s*d:E(`Parsing period failed: "${o}"`)}e="^"+e,r={...r,last_chore:{ty:"number",dft:-1,priv:!0}},c.reg(e,t,l,r,s=>{let d=C[e].last_chore,g=Date.now(),p=!0;s.named||!d||g-d>o?(p&&(GM_addStyle(i),p=!1),a(s),C[e].last_chore=Date.now()):$(`Pending chore: "${e}"`)})},reg_board:(e,t,o,l,r)=>c.reg(e,t,"@/",o,a=>{let i=n("#exlg-board");i.length||(i=n(`
                    <div class="lg-article" id="exlg-board" exlg="exlg"><h2>${Z} &nbsp;&nbsp;${GM_info.script.version}</h2></div>
                `).prependTo(".lg-right.am-u-md-4"),i[0].firstChild.style["font-size"]="1em"),l({...a,$board:n("<div></div>").appendTo(i)})},r),reg_hook:(e,t,o,l,r,a,i)=>c.reg(e,t,o,l,s=>{r(s),n("body").bind("DOMNodeInserted",d=>a(d)&&r(s))},i),reg_hook_new:(e,t,o,l,r,a,i,s)=>c.reg(e,t,o,l,d=>{r({...d,result:!1,args:i()}),n("body").bind("DOMNodeInserted",g=>{if(!g.target.tagName)return!1;let p=a(g);return p.result&&r({...d,...p})})},s),find:e=>c._.get(e),has:e=>c._.has(e),disable:e=>{let t=c.find(e);t.on=!1,c._.set(e,t)},enable:e=>{let t=c.find(e);t.on=!0,c._.set(e,t)},preload:e=>{C===null&&(C=c.fake_sto);let t=(l,r)=>{l||E(`Preloading named mod but not found: "${e}"`),$(`Preloading ${r?"named ":""}mod: "${l.name}"`);try{return{pred:l.pre({msto:C[l.name],named:r}),...l}}catch(a){return I(a),l}},o=location.href;for(let[l,r]of c._.entries())C[l].on&&r.path.some(a=>new RegExp(a,"g").test(o))&&(r.willrun=!0,"pre"in r&&c._.set(l,t({name:l,...r})))},execute:e=>{let t=(o,l)=>{o||E(`Executing named mod but not found: "${e}"`),o.styl&&GM_addStyle(o.styl),$(`Executing ${l?"named ":""}mod: "${o.name}"`);try{return"pred"in o?o.func({msto:C[o.name],named:l,pred:o.pred}):o.func({msto:C[o.name],named:l})}catch(r){I(r)}};if(e){let o=c.find(e);return t({name:e,...o},!0)}for(let[o,l]of c._.entries())if(l.on=C[o].on,l.willrun&&t({name:o,...l})===!1)break}};c.reg("benben","全网犇犇","@/",{source:{ty:"enum",dft:"o2",vals:["o2","shy"],info:["Source","切换全网犇犇获取方式"]},reply_with_md:{ty:"boolean",dft:!1,info:["Reply with markdown","回复时附上原 markdown"]}},({msto:e})=>{let t={Gray:"gray",Blue:"bluelight",Green:"green",Orange:"orange lg-bold",Red:"red lg-bold",Purple:"purple lg-bold",Brown:"brown lg-bold"},o=`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="%" style="margin-bottom: -3px;" exlg="exlg">
            <path d="M16 8C16 6.84375 15.25 5.84375 14.1875 5.4375C14.6562 4.4375 14.4688 3.1875 13.6562 2.34375C12.8125 1.53125 11.5625 1.34375 10.5625 1.8125C10.1562 0.75 9.15625 0 8 0C6.8125 0 5.8125 0.75 5.40625 1.8125C4.40625 1.34375 3.15625 1.53125 2.34375 2.34375C1.5 3.1875 1.3125 4.4375 1.78125 5.4375C0.71875 5.84375 0 6.84375 0 8C0 9.1875 0.71875 10.1875 1.78125 10.5938C1.3125 11.5938 1.5 12.8438 2.34375 13.6562C3.15625 14.5 4.40625 14.6875 5.40625 14.2188C5.8125 15.2812 6.8125 16 8 16C9.15625 16 10.1562 15.2812 10.5625 14.2188C11.5938 14.6875 12.8125 14.5 13.6562 13.6562C14.4688 12.8438 14.6562 11.5938 14.1875 10.5938C15.25 10.1875 16 9.1875 16 8ZM11.4688 6.625L7.375 10.6875C7.21875 10.8438 7 10.8125 6.875 10.6875L4.5 8.3125C4.375 8.1875 4.375 7.96875 4.5 7.8125L5.3125 7C5.46875 6.875 5.6875 6.875 5.8125 7.03125L7.125 8.34375L10.1562 5.34375C10.3125 5.1875 10.5312 5.1875 10.6562 5.34375L11.4688 6.15625C11.5938 6.28125 11.5938 6.5 11.4688 6.625Z"></path>
        </svg>
    `,l=i=>i<=3?"":o.replace("%",i<=5?"#5eb95e":i<=7?"#3498db":"#f1c40f"),r=x.loadFeed;x.loadFeed=function(){x.feedMode==="all-exlg"?(S({url:e.source==="o2"?"https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121":`https://bens.rotriw.com/api/list/proxy?page=${x.feedPage}`,onload:i=>{JSON.parse(i.response).forEach(d=>{let g=marked(B.process(d.content));n(`
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
                                        ${l(d.user.ccfLevel)}
                                    </a>
                                    ${d.user.badge?`<span class="am-badge am-radius lg-bg-${t[d.user.color]}">${d.user.badge}</span>`:""}
                                </span>
                                ${new Date(d.time*1e3).format("yyyy-mm-dd HH:MM")}
                                <a name="feed-reply">回复</a>
                            </div>
                        </header>
                        <div class="am-comment-bd">
                            <span class="feed-comment">
                                ${g}
                            </span>
                        </div>
                    </div>
                </li>
            `).appendTo(n("ul#feed")).find("a[name=feed-reply]").on("click",()=>{scrollToId("feed-content"),setTimeout(()=>n("textarea").trigger("focus").val(` || @${d.user.name} : ${e.reply_with_md?d.content:n(g).text()}`).trigger("input"),50)})})}}),e.source==="shy"&&(x.feedPage++,n("#feed-more").children("a").text("点击查看更多..."))):r()};let a=n(".feed-selector");n('<li class="feed-selector" id="exlg-benben-selector" data-mode="all-exlg" exlg="exlg"><a style="cursor: pointer">全网动态</a></li>').appendTo(a.parent()).on("click",i=>{let s=n(i.currentTarget);a.removeClass("am-active"),s.addClass("am-active"),e.source==="o2"&&n("#feed-more").hide(),x.feedPage=1,x.feedMode="all-exlg",n("li.am-comment").remove(),x.loadFeed()})});c.reg("benben-quickpost","CtrlEnter发送犇犇","@/",null,()=>n("textarea").whenKey("CtrlEnter",()=>n("#feed-submit").click()));c.reg("blog","博客Ex","@/blogAdmin/article/edit/.*",{format:{ty:"boolean",dft:!0,info:["Enable format","显示格式化按钮"]},hotkeys:{ty:"boolean",dft:!0,info:["Enable hotkeys","快捷键"]}},({msto:e})=>{let t=n(".mp-editor-menu");e.format&&(t.append('<li data-v-6d5597b1="" class="mp-divider"><span data-v-6d5597b1="">|</span></li>'),t.append(n('<li data-v-6d5597b1=""></li>').append(n('<a data-v-6d5597b1="" title="自动排版" unslectable="on" class="exlg-format-btn"></a>').append('<i data-v-6d5597b1="" unslectable="on" class="fa fa-check"></i>'))),n(".exlg-format-btn").on("click",()=>{let o=unsafeWindow.articleEditor.content;o=o.replaceAll(/([\u4e00-\u9fa5])([a-z])/igu,"$1 $2"),o=o.replaceAll(/([a-z])([\u4e00-\u9fa5])/igu,"$1 $2"),o=o.replaceAll(/([\u4e00-\u9fa5])(\$)/igu,"$1 $2"),o=o.replaceAll(/(\$)([\u4e00-\u9fa5])/igu,"$1 $2"),unsafeWindow.articleEditor.content=o})),e.hotkeys&&n(unsafeWindow).keypress(o=>{o.ctrlKey&&o.which===2?n("a[title='粗体']")[0].click():o.ctrlKey&&o.which===9?n("a[title='斜体']")[0].click():o.ctrlKey&&o.shiftKey&&o.which===24&&n("a[title='删除线']")[0].click()})},`
`);c.reg_board("search-user","用户查找",null,({$board:e})=>{e.html(`
        <h3>查找用户</h3>
        <div class="am-input-group am-input-group-primary am-input-group-sm">
            <input type="text" class="am-form-field" placeholder="例：kkksc03，可跳转站长主页" name="username" id="search-user-input">
        </div>
        <p>
            <button class="am-btn am-btn-danger am-btn-sm" id="search-user">跳转</button>
        </p>
    `);let t=()=>{o.prop("disabled",!0),n.get("/api/user/search?keyword="+n("[name=username]").val().trim(),l=>{l.users[0]?location.href="/user/"+l.users[0].uid:(o.prop("disabled",!1),v("无法找到指定用户"))})},o=n("#search-user").on("click",t);n("#search-user-input").keydown(l=>{l.key==="Enter"&&t()})});c.reg_board("benben-ranklist","犇犇龙王排行榜",{show:{ty:"boolean",dft:!0,info:["Show in default","是否默认展开"]}},({msto:e,$board:t})=>{t.html(`<h3 id="bb-rnklst-h2">犇犇排行榜 <span id="bb-rnklst-btn" class="bb-rnklst-span"> [<a>${e.show?"收起":"展开"}</a>]</span><span style="float: right;" class="bb-rnklst-span"> [<a id="refresh-bbrnk">刷新</a>]</span></h3><div style="display: ${e.show?"block":"none"}" id="bb-rnklst-div"></div>`);let o=t.find("#bb-rnklst-div"),l=t.find("#bb-rnklst-btn > a").on("click",()=>{e.show=!e.show,l.text(e.show?"收起":"展开"),o.toggle()}),r=()=>S({url:"https://bens.rotriw.com/ranklist?_contentOnly=1",onload:function(a){n(JSON.parse(a.response)).each((i,s)=>{n(`<div class="bb-rnklst-${i+1}">
                    <span class="bb-rnklst-ind${i<9?" bb-top-ten":""}">${i+1}.</span>
                    <a href="https://bens.rotriw.com/user/${s[2]}">${s[1]}</a>
                    <span style="float: right;">共 ${s[0]} 条</span>
                </div>`).appendTo(o)})}});t.find("#refresh-bbrnk").on("click",()=>{o.html(""),r()}),r()},`
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
`);c.reg("captcha","验证码自动填充",["@/auth/login","@/discuss/.+","@/image"],null,()=>{let e=n("img[data-v-3e1b4641],#verify_img"),t=()=>{let o=document.createElement("canvas");o.width=e[0].width,o.height=e[0].height,o.getContext("2d").drawImage(e[0],0,0),re({url:"https://luogu-captcha-bypass.piterator.com/predict/",data:o.toDataURL("image/jpeg"),onload:l=>{let r=n("input[placeholder$='验证码']")[0];r.value=l.responseText,r.dispatchEvent(new Event("input"))}})};e.length?(e.click(),e[0].onload=t):n(document).on("focus","input[placeholder$='验证码']",()=>{e=n("#--swal-image-hosting-upload-captcha"),e[0].onload=t})});c.reg_hook_new("code-block-ex","代码块优化","@/.*",{copy_code_position:{ty:"enum",vals:["left","right"],dft:"left",info:["Copy Button Position","复制按钮对齐方式"]},code_block_title:{ty:"string",dft:"源代码 - ${lang}",info:["Custom Code Title(with Language)","自定义代码块标题 - 限定语言"]},code_block_title_nolang:{ty:"string",dft:"源代码",info:["Custom Code Title(without Language)","自定义代码块标题 - 默认"]},copy_code_font:{ty:"string",dft:"'Fira Code', Consolas, monospace",info:["Code Block Font","代码块字体"],strict:!0},max_show_lines:{ty:"number",dft:-1,min:-1,max:100,info:["Max Lines On Show","代码块最大显示行数"],strict:!0}},({msto:e,args:t})=>{let o=/\/record\/.*/.test(location.href),l={c:"C",cpp:"C++",pascal:"Pascal",python:"Python",java:"Java",javascript:"JavaScript",php:"PHP",latex:"LaTeX"},r=a=>{let i="undefined";return o?n(n(".value.lfe-caption")[0]).text():(a.attr("data-rendered-lang")?i=a.attr("data-rendered-lang"):a.attr("class")&&a.attr("class").split(" ").forEach(s=>{s.startsWith("language-")&&(i=s.slice(9))}),l[i])};t.attr("exlg-copy-code-block",""),t.each((a,i,s=n(i))=>{if(i.parentNode.className==="mp-preview-content"||i.parentNode.parentNode.className==="mp-preview-area")return;let d=o?s.children(".copy-btn"):n('<div class="exlg-copy">复制</div>').on("click",()=>{d.text()==="复制"&&(d.text("复制成功").toggleClass("exlg-copied"),setTimeout(()=>d.text("复制").toggleClass("exlg-copied"),800),GM_setClipboard(s.text(),"text/plain"))}),g=s.children("code");g.css("font-family",e.copy_code_font||void 0),g.hasClass("hljs")||g.addClass("hljs").css("background","white"),d.addClass(`exlg-copy-${e.copy_code_position}`);let p=r(g),h=p?e.code_block_title.replace("${lang}",p):e.code_block_title_nolang,_=o?n(".lfe-h3").text(h):n(`<h3 class="exlg-code-title" style="/*width: 100%;*/">${h}</h3>`);o||s.before(_.append(d))})},e=>{let t=n(e.target).find("pre:has(> code:not(.cm-s-default)):not([exlg-copy-code-block])");return{result:t.length,args:t}},()=>n("pre:has(> code:not(.cm-s-default)):not([exlg-copy-code-block])"),`
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
`);c.reg_main("dash-board","控制面板",c.path_dash_board,{msg:{ty:"object",priv:!0,lvs:{queue:{ty:"array",itm:{ty:"object",lvs:{text:{ty:"string"},id:{ty:"number"}}}},last_id:{ty:"number",dft:0}}},lang:{ty:"enum",dft:"zh",vals:["zh","en"],info:["Language of descriptions in the dashboard","控制面板提示语言"]}},()=>{let e=[["Modules","功能","tunes",!1],["Core","核心","bug_report",!0]].map(([t,o,l,r])=>({name:t,description:o,icon:l,children:(()=>{let a=[];return c._.forEach((i,s)=>{s.startsWith("@")===r&&a.push({rawName:s,name:s.replace(/^[@^]/g,""),description:i.info,settings:Object.entries(c.data[s].lvs).filter(([d,g])=>d!=="on"&&!g.priv).map(([d,g])=>({name:d,displayName:d.split("_").map(p=>p.toInitialCase()).join(" "),description:g.info,type:{number:"SILDER",boolean:"CHECKBOX",string:"TEXTBOX",enum:""}[g.ty],...g.ty==="boolean"&&{type:"CHECKBOX"},...g.ty==="number"&&{type:"SLIDER",minValue:g.min,maxValue:g.max,increment:g.step},...g.ty==="enum"&&{type:"SELECTBOX",acceptableValues:g.vals}}))})}),a})()}));console.log(e),x.guiStart(e)});c.reg_hook_new("dash-bridge","控制桥","@/.*",{source:{ty:"enum",vals:["exlg","gh_index","debug"],dft:"exlg",info:["The website to open when clicking the exlg button","点击 exlg 按钮时打开的网页"]},enable_rclick:{priv:!0,ty:"boolean",dft:!0,info:["Use Right Click to change source","右键点击按钮换源"]},latest_ignore:{ty:"string",dft:"0.0.0"}},({msto:e,args:t})=>{["exlg","gh_index","debug"].indexOf(e.source)===-1&&(e.source="exlg");let o=t.$tar,l='<svg class="icon" style="width: 1.2em;height: 1.2em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1697"><path d="M644.266667 494.933333l-192 192-29.866667-29.866666 162.133333-162.133334-162.133333-162.133333 29.866667-29.866667 192 192z" fill="#444444" p-id="1698"></path></svg>',r=(p,h,_=n(h))=>{_.addClass("exlg-dash-options"),h.innerHTML=`<div class="link-title">${h.innerHTML}</div> ${l}`};if(t.type===2){r(114514,o[0],o);return}let a=!o.parent().hasClass("mobile-nav-container"),i=n('<span id="exlg-dash-window" class="exlg-window" style="display: none;"></span>').css("left","-125px"),s=n('<div id="exlg-dash" exlg="exlg">exlg</div>').prependTo(o).css("backgroundColor",{exlg:"cornflowerblue",gh_index:"darkblue",debug:"steelblue"}[e.source]).css("margin-top",o.hasClass("nav-container")?"5px":"0px"),d=()=>x.exlg.dash=x.open({exlg:"https://dash.exlg.cc/index.html",gh_index:"https://extend-luogu.github.io/exlg-setting-new/index.html",debug:"localhost:1634/dashboard"}[e.source]);e.enable_rclick?s.bind("contextmenu",()=>!1).on("mousedown",p=>{p.button?p.button===2&&(e.source={exlg:"gh_index",gh_index:"debug",debug:"exlg"}[e.source],s.css("backgroundColor",{exlg:"cornflowerblue",gh_index:"darkblue",debug:"steelblue"}[e.source])):d()}):s.on("click",d);let g=(p,h)=>{let _=x._feInjection.currentUser;p.children(".header").after(`
        <div>
            <a class="exlg-dropdown field" href="//www.luogu.com.cn/user/${_.uid}#following.follower">
                <span class="value">${_.followingCount}</span>
                <span data-v-3c4577b8="" class="key">关注</span>
            </a>
            <a class="exlg-dropdown field" href="//www.luogu.com.cn/user/${_.uid}#following.following">
                <span class="value">${_.followerCount}</span>
                <span data-v-3c4577b8="" class="key">粉丝</span>
            </a>
            <a class="exlg-dropdown field" href="//www.luogu.com.cn/user/notification">
                <span class="value">${_.unreadNoticeCount+_.unreadMessageCount}</span>
                <span data-v-3c4577b8="" class="key">动态</span>
            </a>
        </div>
        `),p.children(".header").after(`
        <div class="exlg-dropdown field">
            <span data-v-3c4577b8="" class="key-small">CCF 评级: <strong>${_.ccfLevel}</strong></span>
            <span data-v-3c4577b8="" class="key-small">咕值排行: <strong>${_.ranking}</strong></span>
        </div>
        `),h.each(r);let L=n(h[5]).clone().attr("href","javascript:void 0");L.on("click",d),n(h[5]).after(L),L.children("div.link-title").html('<svg data-v-a97ae32a="" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="code" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="svg-inline--fa fa-code fa-w-20"><path data-v-a97ae32a="" fill="currentColor" d="M278.9 511.5l-61-17.7c-6.4-1.8-10-8.5-8.2-14.9L346.2 8.7c1.8-6.4 8.5-10 14.9-8.2l61 17.7c6.4 1.8 10 8.5 8.2 14.9L293.8 503.3c-1.9 6.4-8.5 10.1-14.9 8.2zm-114-112.2l43.5-46.4c4.6-4.9 4.3-12.7-.8-17.2L117 256l90.6-79.7c5.1-4.5 5.5-12.3.8-17.2l-43.5-46.4c-4.5-4.8-12.1-5.1-17-.5L3.8 247.2c-5.1 4.7-5.1 12.8 0 17.5l144.1 135.1c4.9 4.6 12.5 4.4 17-.5zm327.2.6l144.1-135.1c5.1-4.7 5.1-12.8 0-17.5L492.1 112.1c-4.8-4.5-12.4-4.3-17 .5L431.6 159c-4.6 4.9-4.3 12.7.8 17.2L523 256l-90.6 79.7c-5.1 4.5-5.5 12.3-.8 17.2l43.5 46.4c4.5 4.9 12.1 5.1 17 .6z" class=""></path></svg> 插件设置')};if(window.renew_dropdown=()=>g(o.find(".dropdown > .center"),o.find(".ops > a")),(o.hasClass("user-nav")||o.parent().hasClass("user-nav"))&&g(o.find(".dropdown > .center"),o.find(".ops > a")),a){i.prependTo(o);let p=!1,h=!1;s.on("mouseenter",()=>{p=!0,i.show()}).on("mouseleave",()=>{p=!1,h||setTimeout(()=>{h||i.hide()},200)}),i.on("mouseenter",()=>{h=!0}).on("mouseleave",()=>{h=!1,p||i.hide()}),n(`<h2 align="center" style="margin-top: 5px;margin-bottom: 10px;">${Z}</h2>`).appendTo(i);let _=n('<div id="exlg-windiv"></div>').appendTo(i);[{tag:"vers",title:"版本",buttons:[]},{tag:"source",title:"源码",buttons:[{html:"JsDelivr",url:"https://cdn.jsdelivr.net/gh/extend-luogu/extend-luogu/dist/extend-luogu.min.user.js"},{html:"Raw",url:"https://github.com/extend-luogu/extend-luogu/raw/latest/dist/extend-luogu.min.user.js"},{html:"FastGit",url:"https://hub.fastgit.xyz/extend-luogu/extend-luogu/raw/latest/dist/extend-luogu.min.user.js"}]},{tag:"link",title:"链接",buttons:[{html:"官网",url:"https://exlg.cc"},{col:"#666",html:`<a style="height: 8px;width: 8px;"><svg aria-hidden="true" height="12" viewBox="0 0 16 16" version="1.1" width="12" data-view-component="true" class="octicon octicon-mark-github">
                <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg></a>Github`,url:"https://github.com/extend-luogu/extend-luogu"},{html:"爱发电",url:"https://afdian.net/@extend-luogu"}]},{tag:"help",title:"帮助",buttons:[{html:"官方",url:"https://github.com/extend-luogu/extend-luogu/blob/main/README.md"},{html:"镜像",url:"https://hub.fastgit.xyz/extend-luogu/extend-luogu/blob/main/README.md"},{html:"用户协议",url:"https://www.luogu.com.cn/paste/3f7anw16"}]},{tag:"lhyakioi",title:"badge",buttons:[{html:"注册",onclick:()=>v("暂未实现，请加群根据群公告操作。")},{html:"修改",onclick:()=>v("暂未实现，请加群根据群公告操作。")}]}].forEach(z=>{let u=n(`<div id="${z.tag}-div"><span class="exlg-windiv-left-tag">${z.title}</span></div>`).appendTo(_),f=n("<span></span>").appendTo(u);if(z.buttons.forEach(m=>{let w=m.col??"#66ccff";n('<span class="exlg-windiv-btnspan"></span>').append(n(`<button class="exlg-windiv-btn" style="background-color: ${w};border-color: ${w};">${m.html}</button>`).on("click",m.onclick??(()=>location.href=m.url))).appendTo(f)}),z.tag==="vers"){f.append(n(`<span id="version-text" style="min-width: 60%; margin-left: 5px;">
    <span title="当前版本">${GM_info.script.version}</span>
    <span id="vers-comp-operator" style="margin-left: 5px;"></span>
    <span id="latest-version" style="margin-left: 5px;"></span>
    <span id="annoyingthings"></span></span>"`));let m=n('<button class="exlg-windiv-btn" style="background-color: red;border-color: red;float: right;margin: 0 20px 0 0;">刷新</button>'),w=f.find("#vers-comp-operator"),y=f.find("#latest-version"),k=f.find("#annoyingthings"),T=()=>{w.text(""),y.text(""),k.html(""),V((N,M)=>{if(w.html(M).css("color",{"<<":"#fe4c61","==":"#52c41a",">>":"#3498db"}[M]),y.text(N).attr("title","最新版本"),k.html({"<<":'<i class="exlg-icon exlg-info" name="有新版本"></i>',">>":'<i class="exlg-icon exlg-info" name="内测中！"></i>'}[M]||"").children().css("cssText","position: absolute;display: inline-block;"),M==="<<"&&q(e.latest_ignore,N)==="<<"){let P=n('<span style="color: red;margin-left: 30px;"><svg class="icon" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" width="24" height="24" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5446"><path d="M512 128c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384-172.3-384-384-384z m0 717.4c-183.8 0-333.4-149.6-333.4-333.4S328.2 178.6 512 178.6 845.4 328.2 845.4 512 695.8 845.4 512 845.4zM651.2 372.8c-9.9-9.9-25.9-9.9-35.8 0L512 476.2 408.6 372.8c-9.9-9.9-25.9-9.9-35.8 0-9.9 9.9-9.9 25.9 0 35.8L476.2 512 372.8 615.4c-9.9 9.9-9.9 25.9 0 35.8 4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4L512 547.8l103.4 103.4c4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4c9.9-9.9 9.9-25.9 0-35.8L547.8 512l103.4-103.4c9.9-9.9 9.9-25.9 0-35.8z" p-id="5447"></path></svg></span>').on("click",()=>{e.latest_ignore=N,P.hide()}).appendTo(k)}M==="=="&&(e.latest_ignore=GM_info.script.version)})};m.on("click",T).appendTo(f)}})}},e=>{let t=n(e.target);if(e.target.tagName.toLowerCase()==="a"&&t.hasClass("color-none")&&t.parent().hasClass("ops")&&!t.hasClass("exlg-dash-options"))return{result:2,args:{$tar:n(e.target),type:2}};let o=t.find(".user-nav, .nav-container");return o.length?{result:o.length,args:{$tar:o[0].tagName==="DIV"?n(o[0].firstChild):o,type:1}}:{result:0}},()=>({$tar:n("nav.user-nav, div.user-nav > nav, .nav-container"),type:0}),`
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
        width: 300px;
        /* height: 300px; */
        padding: 15px;
        background: white;
        color: black;
        border-radius: 7px;
        box-shadow: rgb(187 227 255) 0px 0px 7px;
    }
    .exlg-windiv-left-tag {
        /* border-right: 1px solid #eee; */
        height: 2em;
        width: 18%;
        margin-right: 10px;
        display: inline-block;
        text-align: center;
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
        margin: 4px;

    }

    .dropdown > .center {
        padding: 0 24px 18px;
    }
    .ops>a>.link-title {
        display: flex;
        align-items: center;
    }
    .ops>a>.link-title>svg {
        margin-right: 8px;
        width: 16px;
    }
    .ops>a[class] {
        width: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2px;
        padding: 6px 14px;
        border-radius: 8px;
        color: var(--text2);
        font-size: 14px;
        cursor: pointer;
        transition: background-color .3s;
        margin-bottom: 0.4em;
        margin-top: 0.4em;
    }
    .ops>a:hover {
        background-color: rgb(227,229,231);
    }

    .exlg-dropdown.field {
        display: inline-block;
        border-left: none;
        padding: 0 .8em;
    }
    .exlg-dropdown.field:hover {
        color: #00aeec!important;
    }
    .exlg-dropdown.field:hover > .value {
        color: #00aeec!important;
    }
    .exlg-dropdown.field:hover > .key {
        color: #00aeec!important;
    }
    .exlg-dropdown.field > .value {
        display: block;
        text-align: center;
        line-height: 1.5;
        font-weight: 700;

        color: #6c757d;
        font-size: 18px;
        transition: color .2s;
    }
    .exlg-dropdown.field > .key {
        display: block;
        text-align: center;
        /* font-size: 0.5em; */

        color: #9499a0;
        font-weight: 400;
        font-size: 12px;
        transition: color .2s;
    }
    .exlg-dropdown.field > .key-small {
        display: block;
        text-align: center;
        /* font-size: 0.5em; */

        color: #9499a0;
        font-weight: 400;
        font-size: 8px;
        transition: color .2s;
    }

`);c.reg("discussion-save","讨论保存",["@/discuss/\\d+(\\?page\\=\\d+)*$"],{auto_save_discussion:{ty:"boolean",dft:!1,strict:!0,info:["Discussion Auto Save","自动保存讨论"]}},({msto:e})=>{let t=n('<button class="am-btn am-btn-success am-btn-sm" name="save-discuss">保存讨论</button>');t.on("click",()=>{t.prop("disabled",!0),t.text("保存中..."),S({url:`https://luogulo.gq/save.php?url=${window.location.href}`,onload:l=>{l.status===200?l.response==="success"?($("Discuss saved"),t.text("保存成功"),setTimeout(()=>{t.text("保存讨论"),t.removeAttr("disabled")},1e3)):($(`Discuss unsuccessfully saved, return data: ${l.response}`),t.text("保存失败"),t.toggleClass("am-btn-success").toggleClass("am-btn-warning"),setTimeout(()=>{t.text("保存讨论"),t.removeAttr("disabled"),t.toggleClass("am-btn-success").toggleClass("am-btn-warning")},1e3)):($(`Fail to save discuss: ${l}`),t.toggleClass("am-btn-success").toggleClass("am-btn-danger"),setTimeout(()=>{t.text("保存讨论"),t.removeAttr("disabled"),t.toggleClass("am-btn-success").toggleClass("am-btn-danger")},1e3))},onerror:l=>{$(`Error:${l}`),t.removeAttr("disabled")}})}).css("margin-top","5px");let o=n(`<a class="am-btn am-btn-warning am-btn-sm" name="save-discuss" href="https://luogulo.gq/show.php?url=${location.href}">查看备份</a>`).css("margin-top","5px");n("section.lg-summary").find("p").append(n("<br>")).append(t).append(n("<span>&nbsp;</span>")).append(o),e.auto_save_discussion&&t.click()},`
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
`);var H={EMO:1,TXT:2};c.reg("emoticon","表情输入",["@/paste","@/discuss/.*","@/"],{benben:{ty:"boolean",dft:!0,info:["Show in benben","犇犇表情"]},show:{ty:"boolean",dft:!0,info:["Show in default","是否默认显示表情栏"]},src:{ty:"enum",vals:["图.tk","github","妙.tk","啧.tk"],dft:"图.tk",info:["Emoticon Source","表情源"]},height_limit:{ty:"boolean",dft:!0,info:["Expand in default","是否默认展开表情"]}},({msto:e})=>{let t=["kk","jk","se","qq","xyx","xia","cy","ll","xk","qiao","qiang","ruo","mg","dx","youl","baojin","shq","lb","lh","qd","fad","dao","cd","kun","px","ts","kl","yiw","dk",{name:["sto"],slug:"gg",name_display:"sto",width:40},{name:["orz"],slug:"gh",name_display:"orz",width:40},{name:["qwq"],slug:"g5",name_display:"qwq",width:40},{name:["hqlm"],slug:"l0",name_display:"火前留名"},{name:["sqlm"],slug:"l1",name_display:"山前留名"},{name:["xbt"],slug:"g1",name_display:"屑标题"},{name:["iee","wee"],slug:"g2",name_display:"我谔谔"},{name:["kg"],slug:"g3",name_display:"烤咕"},{name:["gl"],slug:"g4",name_display:"盖楼"},{name:["wyy"],slug:"g6",name_display:"无意义"},{name:["wgzs"],slug:"g7",name_display:"违规紫衫"},{name:["tt"],slug:"g8",name_display:"贴贴"},{name:["jbl"],slug:"g9",name_display:"举报了"},{name:["%%%","mmm"],slug:"ga",name_display:"%%%"},{name:["ngrb"],slug:"gb",name_display:"你谷日爆"},{name:["qpzc","qp","zc"],slug:"gc",name_display:"前排资瓷"},{name:["cmzz"],slug:"gd",name_display:"臭名昭著"},{name:["zyx"],slug:"ge",name_display:"致远星"},{name:["zh"],slug:"gf",name_display:"祝好"}].filter(g=>e.src!=="啧.tk"||typeof g!="object").map((g,p)=>typeof g=="string"?{type:H.EMO,name:[g],slug:p>=10?String.fromCharCode(97+(p-10)):String.fromCharCode(48+p)}:{type:H.TXT,...g}),o=e.src==="github"?({slug:g})=>`//cdn.jsdelivr.net/gh/extend-luogu/extend-luogu/img/emoji/${g}`:e.src==="啧.tk"?({name:g})=>`//${e.src}/${g[0]}`:({slug:g})=>`//${e.src}/${g}`;if(e.benben&&location.pathname==="/"){let g=n("#feed-content"),p=g[0];n("#feed-content").before("<div id='emo-lst'></div>"),t.forEach(h=>{let _=n(h.type===H.EMO?`<button class="exlg-emo-btn" exlg="exlg"><img src="${o(h)}" /></button>`:`<button class="exlg-emo-btn" exlg="exlg">${h.name_display}</button>`).on("click",()=>{let L=p.value,z=p.selectionStart,u=L.slice(0,z)+`![](${o(h)})`;p.value=u+L.slice(p.selectionEnd),p.focus(),p.setSelectionRange(u.length,u.length)}).appendTo("#emo-lst");h.width?_.css("width",h.width+"px"):h.type===H.EMO?_.css("width","40px"):_.css("width","83px")}),n("#feed-content").before("<br>")}let l=n(".mp-editor-menu"),r=n(".CodeMirror-wrap textarea");if(!l.length)return;let a=l.clone().addClass("exlg-emo").text("");l.after(a).append("<br />");let i=n(".mp-editor-ground").addClass("exlg-ext"),s=l.children().first().clone(!0).addClass("exlg-unselectable"),d=l.children().first().clone(!0).addClass("exlg-unselectable");l.children().last().before(s),l.children().last().before(d),s.children().attr("title","").text(e.show?"隐藏":"显示"),e.show&&(a.addClass("exlg-show-emo"),i.addClass("exlg-show-emo")),s.on("click",()=>{s.children()[0].innerHTML=["显示","隐藏"][["隐藏","显示"].indexOf(s.children()[0].innerHTML)],a.toggleClass("exlg-show-emo"),i.toggleClass("exlg-show-emo"),e.show=!e.show}),d.children().attr("title","").text(e.height_limit?"展开":"收起"),e.height_limit?(a.addClass("exlg-show-emo-short"),i.addClass("exlg-show-emo-short")):(a.addClass("exlg-show-emo-long"),i.addClass("exlg-show-emo-long")),d.on("click",()=>{d.children()[0].innerHTML=["收起","展开"][["展开","收起"].indexOf(d.children()[0].innerHTML)],a.toggleClass("exlg-show-emo-short").toggleClass("exlg-show-emo-long"),i.toggleClass("exlg-show-emo-short").toggleClass("exlg-show-emo-long"),e.height_limit=!e.height_limit}),t.forEach(g=>{let p=n(g.type===H.EMO?`<button class="exlg-emo-btn" exlg="exlg"><img src="${o(g)}" /></button>`:`<button class="exlg-emo-btn" exlg="exlg">${g.name_display}</button>`).on("click",()=>r.trigger("focus").val(`![](${o(g)})`).trigger("input")).appendTo(a);g.width?p.css("width",g.width+"px"):g.type===H.EMO?p.css("width","40px"):p.css("width","83px")}),a.append("<div style='height: .35em'></div>")},`
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
`);c.reg("exlg-dialog-board","exlg_公告板","@/.*",{animation_speed:{ty:"enum",dft:".4s",vals:["0s",".2s",".25s",".4s"],info:["Speed of Board Animation","启动消失动画速度"]},confirm_position:{ty:"enum",dft:"right",vals:["left","right"],info:["Position of Confirm Button","确定按钮相对位置"]}},({msto:e})=>{let t,o,l,r,a=!1;t=n('<div class="exlg-dialog-wrapper" id="exlg-wrapper" style="display: none;">').append(o=n(`<div class="exlg-dialog-container container-hide" id="exlg-container" style="${e.animation_speed==="0s"?"":`transition: all ${e.animation_speed};`}"></div>`).append(n('<div class="exlg-dialog-header">').append(l=n('<strong id="exlg-dialog-title">我做东方鬼畜音mad，好吗</strong>')).append(n('<div id="header-right" onclick="" style="opacity: 0.5;"><svg class="icon" style="vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5446"><path d="M512 128c-211.7 0-384 172.3-384 384s172.3 384 384 384 384-172.3 384-384-172.3-384-384-384z m0 717.4c-183.8 0-333.4-149.6-333.4-333.4S328.2 178.6 512 178.6 845.4 328.2 845.4 512 695.8 845.4 512 845.4zM651.2 372.8c-9.9-9.9-25.9-9.9-35.8 0L512 476.2 408.6 372.8c-9.9-9.9-25.9-9.9-35.8 0-9.9 9.9-9.9 25.9 0 35.8L476.2 512 372.8 615.4c-9.9 9.9-9.9 25.9 0 35.8 4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4L512 547.8l103.4 103.4c4.9 4.9 11.4 7.4 17.9 7.4s13-2.5 17.9-7.4c9.9-9.9 9.9-25.9 0-35.8L547.8 512l103.4-103.4c9.9-9.9 9.9-25.9 0-35.8z" p-id="5447"></path></svg></div>').on("click",()=>G.hide_dialog()))).append(n('<div class="exlg-dialog-body">').append(r=n('<div id="exlg-dialog-content">'))).append(n('<div class="exlg-dialog-footer">').append(n('<button class="exlg-dialog-btn">确定</button>').on("click",()=>G.accept_dialog()))[e.confirm_position==="left"?"prepend":"append"](n('<button class="exlg-dialog-btn">取消</button>').on("click",()=>G.hide_dialog()))).on("click",p=>p.stopPropagation()).on("mousedown",p=>p.stopPropagation())).on("mousedown",()=>a=!0).on("mouseup",()=>{a&&G.hide_dialog(),a=!1}).appendTo(n(document.body));let[i,s,d,g]=[t,o,l,r];Object.assign(G,{wrapper:i,container:s,header:d,content:g,wait_time:{"0s":0,".2s":100,".25s":250,".4s":400}[e.animation_speed]})},`
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
`);c.reg("keyboard-and-cli","键盘操作与命令行","@/.*",{lang:{ty:"enum",dft:"en",vals:["en","zh"]}},({msto:e})=>{let t=n('<div id="exlg-cli" exlg="exlg"></div>').appendTo(n("body")),o=n('<input id="exlg-cli-input" />').appendTo(t),l=!1,r=(u,...f)=>{l=!0;let m=u.map((w,y)=>w.split(/\b/).map(k=>p[k]?.[h-1]??k).join("")+(f[y]||"")).join("");return o.val(m)},a=(u,...f)=>I(r(u,...f).addClass("error").val()),i=()=>(l=!1,o.val("").removeClass("error")),s=[],d=0,g=["en","zh"],p={".":["。"],",":["，"],"!":["！"],"?":["？"],cli:["命令行"],current:["当前"],language:["语言"],available:["可用"],command:["命令"],commands:["命令"],unknown:["未知"],forum:["板块"],target:["目标"],mod:["模块"],action:["操作"],illegal:["错误"],param:["参数"],expected:["期望"],type:["类型"],lost:["缺失"],essential:["必要"],user:["用户"]},h=g.indexOf(e.lang)||0,_=(u,f,m,w)=>(f=f.replace(/ /g,"").split(",").map(y=>{let k={};return y[0]==="["?(k.essential=!1,y=y.slice(1,-1)):k.essential=!0,[k.name,k.type]=y.split(":"),k}),{name:u,arg:f,help:m,fn:w}),L=[_("help","[cmd: string]",["get the help of <cmd>. or list all cmds.","获取 <cmd> 的帮助。空则列出所有"],u=>{if(!u)r`exlg cli. current language: ${h}, available commands: ${Object.keys(L).join(", ")}`;else{let f=L[u];if(!f)return a`help: unknown command "${u}"`;let m=f.arg.map(w=>{let y=w.name+": "+w.type;return w.essential?`<${y}>`:`[${y}]`}).join(" ");r`${u} ${m} ${f.help[h]}`}}),_("cd","path: string",["jump to <path>, relative path is OK.","跳转至 <path>，支持相对路径。"],u=>{let f;if(u[0]==="/")f=u;else{let m=location.pathname.replace(/^\/+/,"").split("/");u.split("/").forEach(y=>{y!=="."&&(y===".."?m.pop():m.push(y))}),f=m.join("/")}location.href=location.origin+"/"+f.replace(/^\/+/,"")}),_("cdd","forum: string",["jump to the forum named <forum> of discussion. use all the names you can think of.","跳转至名为 <forum> 的讨论板块，你能想到的名字基本都有用。"],u=>{let f=[["relevantaffairs","gs","gsq","灌水","灌水区","r","ra"],["academics","xs","xsb","学术","学术版","a","ac"],["siteaffairs","zw","zwb","站务","站务版","s","sa"],["problem","tm","tmzb","题目","题目总版","p"],["service","fk","fksqgd","反馈","反馈、申请、工单专版","se"]];if(u=f.find(m=>m.includes(u))?.[0],!f)return a`cdd: unknown forum "${u}"`;location.href=`https://www.luogu.com.cn/discuss/lists?forumname=${u}`}),_("cc","[name: char]",['jump to <name>, "h|p|c|r|d|i|m|n" stands for home|problem|contest|record|discuss|I myself|message|notification. or jump home.','跳转至 [name]，"h|p|c|r|d|i|m|n" 代表：主页|题目|比赛|评测记录|讨论|个人中心|私信|通知。空则跳转主页。'],u=>{u=u||"h";let f={h:"/",p:"/problem/list",c:"/contest/list",r:"/record/list",d:"/discuss/lists",i:"/user/"+O.uid,m:"/chat",n:"/user/notification"}[u];f?L.cd.fn(f):a`cc: unknown target "${u}"`}),_("mod","action: string, [name: string]",['for <action> "enable|disable|toggle", opearte the mod named <name>.','当 <action> 为 "enable|disable|toggle"，对名为 <name> 的模块执行对应操作：启用|禁用|切换。'],(u,f)=>{switch(u){case"enable":case"disable":case"toggle":if(!c.has(f))return a`mod: unknown mod "${f}"`;C[f].on={enable:()=>!0,disable:()=>!1,toggle:m=>!m}[u](C[f].on);break;default:return a`mod: unknown action "${u}"`}}),_("dash","action: string",['for <action> "show|hide|toggle", opearte the exlg dashboard.','当 <action> 为 "show|hide|toggle", 显示|隐藏|切换 exlg 管理面板。'],u=>{if(!["show","hide","toggle"].includes(u))return a`dash: unknown action "${u}"`;n("#exlg-dash-window")[u]()}),_("lang","lang: string",['for <lang> "en|zh" switch current cli language.','当 <lang> 为 "en|zh"，切换当前语言。'],u=>{try{e.lang=u,h=g.indexOf(u)}catch{return a`lang: unknown language ${u}`}}),_("uid","uid: integer",["jumps to homepage of user whose uid is <uid>.","跳转至 uid 为 <uid> 的用户主页。"],u=>location.href=`/user/${u}`),_("un","name: string",["jumps to homepage of user whose username is like <name>.","跳转至用户名与 <name> 类似的用户主页。"],u=>{n.get("/api/user/search?keyword="+u,f=>{f.users[0]?location.href="/user/"+f.users[0].uid:a`un: unknown user "${u}".`})})].reduce((u,f)=>(u[f.name]=f,u),{}),z=u=>{$(`Parsing command: "${u}"`);let f=u.trim().replace(/^\//,"").split(" "),m=f.shift();if(!m)return;let w=L[m];if(!w)return a`exlg: unknown command "${m}"`;let y=-1,k;for([y,k]of f.entries()){let T=w.arg[y].type;if((T==="number"||T==="integer")&&(f[y]=+k),!(T==="char"&&k.length===1||T==="number"&&!isNaN(f[y])||T==="integer"&&!isNaN(f[y])&&!(f[y]%1)||T==="string"))return a`${m}: illegal param "${k}", expected type ${T}.`}if(w.arg[y+1]?.essential)return a`${m}: lost essential param "${w.arg[y+1].name}"`;w.fn(...f)};o.on("keydown",u=>{switch(u.key){case"Enter":if(l)return i();let f=o.val();if(s.push(f),d=s.length,z(f),!l)return i();break;case"/":l&&i();break;case"Escape":t.hide();break;case"ArrowUp":case"ArrowDown":let m=d+{ArrowUp:-1,ArrowDown:1}[u.key];if(m<0||m>=s.length)return;d=m,o.val(s[m]);break}}),n(x).on("keydown",u=>{let f=n(document.activeElement);if(f.is("body")){let m={ArrowLeft:"prev",ArrowRight:"next"}[u.key];if(m)return n(`a[rel=${m}]`)[0].click();if(u.shiftKey){let w={ArrowUp:0,ArrowDown:1e6}[u.key];w!==void 0&&x.scrollTo(0,w)}u.key==="/"&&(t.show(),i().trigger("focus"))}else f.is("[name=captcha]")&&u.key==="Enter"&&n("#submitpost, #submit-reply")[0].click()})},`
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
        color: #000;
    }
    #exlg-cli-input.error {
        background-color: indianred;
    }
`);c.reg("malicious-code-identifier","有害代码检查器",["@/discuss/\\d+(\\?page\\=\\d+)*$"],{strength:{ty:"number",dft:3,min:1,max:5,step:1,info:["Strength","强度"],strict:!0}},({msto:e})=>{let t=n("code").text().toLowerCase(),o=e.strength,l=[],r=t.match("system")&&!(t.match("System.out")||t.match("import java"));o>=1&&(r&&t.match("net user")&&l.push("高危 操作用户"),r&&t.match("shutdown")&&l.push("高危 关机"),r&&t.match("socksorkstation")&&l.push("高危 锁定桌面"),r&&t.match("reg add")&&l.push("高危 注册进程")),o>=2&&(r&&t.match("taskkill")&&l.push("危险 关闭进程"),r&&t.match("setcursorpos")&&l.push("危险 修改光标")),o>=3&&(t.match("windows.h")&&l.push("可疑 引用 windows.h"),r&&(l.push("可疑 调用系统函数"),r=!0),r&&(t.match("encode")||t.match("decode"))&&l.push("高危 存在加密字符串")),l.length!==0&&v(l.join("</br>").replaceAll("高危",'<a class = "exlg-high-risk">[高危]</a>').replaceAll("危险",'<a class = "exlg-med-risk">[危险]</a>').replaceAll("可疑",'<a class = "exlg-low-risk">[可疑]</a>'),"发现有害代码")},`
.exlg-high-risk {
    color: #dd514c;
}
.exlg-med-risk {
    color: #ff5722;
}
.exlg-low-risk {
    color: #8c8c8c;
}
`);var R={NOT_AT_PRACTICE_PAGE:-1,NONE:-2,COMMENT_TAG:-3,NOT_A_PROBLEM_ELEMENT:-4,ADD_COMPARE:1};c.reg("dbc-jump","双击题号跳题","@/.*",null,()=>{n(document).on("dblclick",e=>{let t=window.getSelection().toString().trim().toUpperCase(),o=e.ctrlkey?n(".ops > a[href*=blog]").attr("href")+"solution-":"https://www.luogu.com.cn/problem/";X(t)&&window.open(o+t)})});c.reg_pre("hide-solution","隐藏题解","@/problem/solution/.*",{hidesolu:{ty:"boolean",dft:!1,info:["Hide Solution","隐藏题解"]}},async({msto:e})=>e.hidesolu?GM_addStyle(".item-row { display: none; }"):"memset0珂爱",null);c.reg_hook_new("back-to-contest","返回比赛列表",["@/problem/[A-Z0-9]+\\?contestId=[1-9][0-9]{0,}"],null,({args:e})=>{let t=e.$info_rows,o=n('<a class="exlg-back-to-contest"></a>'),l=e.cid;!e.pid||!l||t.children(".exlg-back-to-contest").length>0||o.attr("href",`/contest/${l}#problems`).html(`<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="door-open" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="svg-inline--fa fa-door-open fa-w-20">
            <path data-v-450d4937="" data-v-303bbf52="" fill="currentColor" d="M624 448h-80V113.45C544 86.19 522.47 64 496 64H384v64h96v384h144c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16zM312.24 1.01l-192 49.74C105.99 54.44 96 67.7 96 82.92V448H16c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h336V33.18c0-21.58-19.56-37.41-39.76-32.17zM264 288c-13.25 0-24-14.33-24-32s10.75-32 24-32 24 14.33 24 32-10.75 32-24 32z"></path>
            </svg>返回列表`).appendTo(t)},e=>{let t=e.target,o=b.contest.id,l=b.problem.pid;return{args:{cid:o,pid:l,$info_rows:n(t.parentNode)},result:t.tagName.toLowerCase()==="a"&&(t.href||"").includes("/record/list")&&t.href.slice(t.href.indexOf("/record/list"))===`/record/list?pid=${l}&contestId=${o}`}},()=>({cid:b.contest.id,pid:b.problem.pid,$info_rows:n(".info-rows").parent()}),`
.exlg-back-to-contest {
    text-decoration: none;
    float: right;
    color: rgb(231, 76, 60);
}
.exlg-back-to-contest:hover {
    color: rgb(231, 76, 60);
}
`);c.reg_hook_new("submission-color","记录难度可视化","@/record/list.*",null,async({args:e})=>{if(e&&e.type==="show"){if(n("div.problem > div > a > span.pid").length&&!n(".exlg-difficulty-color").length){let r=(await j(location.href)).currentData.records.result.map(a=>a.problem.difficulty);n("div.problem > div > a > span.pid").each((a,i,s=n(i))=>{s.addClass("exlg-difficulty-color").addClass(`color-${r[a]}`)})}return}if(n(".exlg-difficulty-color").length)return;let o=(await j(location.href)).currentData.records.result.map(l=>l.problem.difficulty);n(e.target).find("div.problem > div > a > span.pid").each((l,r,a=n(r))=>{a.addClass("exlg-difficulty-color").addClass(`color-${o[l]}`)})},e=>{let t=e.target;return!t||!t.tagName?{args:R.COMMENT_TAG,result:!1}:t.tagName.toLowerCase()==="a"&&(t.href||"").includes("/problem/")&&` ${t.parentNode.parentNode.className} `.includes(" problem ")?t.parentNode.parentNode.parentNode.nextSibling?{args:{type:"modified - not the last one.",target:null},result:!1}:{args:{type:"modified - update",target:t.parentNode.parentNode.parentNode.parentNode},result:!0}:{args:{type:"modified - not that one.",target:null},result:!1}},()=>({type:"show"}),"");c.reg("mainpage-discuss-limit","主页讨论个数限制",["@/"],{max_discuss:{ty:"number",dft:12,min:4,max:16,step:1,info:["Max Discussions On Show","主页讨论显示上限"],strict:!0}},({msto:e})=>{let t;location.href.includes("blog")||(n(".lg-article").each((o,l,r=n(l))=>{let a=l.childNodes[1];a&&a.tagName.toLowerCase()==="h2"&&a.innerText.includes("讨论")&&(t=r.children(".am-panel"))}),t.each((o,l,r=n(l))=>{o>=e.max_discuss&&r.hide()}))});c.reg("user-css","自定义样式表",".*",{css:{ty:"string"}},({msto:e})=>GM_addStyle(e.css));c.reg_chore("atdiff-fetch","获取_AtCoder_难度","10D","@/problem/AT.*",{atdiff:{ty:"string",priv:!0}},({msto:e})=>{let t={};S({url:"https://kenkoooo.com/atcoder/resources/problem-models.json",onload:o=>{let l=JSON.parse(o.responseText);for(let r in l)t[r]=l[r].difficulty;e.atdiff=JSON.stringify(t)}})});c.reg_pre("original-difficulty","显示原始难度",["@/problem/CF.*","@/problem/AT.*"],{cf_src:{ty:"enum",dft:"codeforces.com",vals:["codeforces.com","codeforces.ml"],info:["Codeforces problem source","CF 题目源"]}},async({msto:e})=>new Promise((t,o)=>{let l=location.pathname.match(/(CF|AT)([0-9]|[A-Z])*$/g)[0].substring(2);if(location.pathname.includes("CF")){let r=l.match(/^[0-9]*/g)[0],a=l.substring(r.length);S({url:`https://${e.cf_src}/problemset/problem/${r}/${a}`,onload:i=>{let s=n(i.responseText).find("span[title=Difficulty]").text().trim();t(s?s.substring(1):void 0)},onerror:i=>{E(i),o(i)}})}else{let r=JSON.parse(C["^atdiff-fetch"].atdiff),a=b.problem.description.match(RegExp("^.{22}[-./A-Za-z0-9_]*"))[0].match(RegExp("[^/]*$"));a in r?t(Math.round(r[a]>=400?r[a]:400/Math.exp(1-r[a]/400))):t(void 0)}}),({pred:e})=>{let t=document.querySelectorAll("div.field"),o=t[3].cloneNode(!0);t[3].after(o);let l=o.querySelectorAll("span");l[0].innerText="原始难度",l[1].innerText="获取中",e.then(r=>{r===void 0&&(r="不可用"),l[1].innerText=r})});c.reg("rand-problem-ex","随机跳题_ex","@/",{exrand_difficulty:{ty:"tuple",lvs:[{ty:"boolean",dft:!1,strict:!0,repeat:8}],priv:!0},exrand_source:{ty:"tuple",lvs:[{ty:"boolean",dft:!1,strict:!0,repeat:5}],priv:!0}},({msto:e})=>{let t=[["入门","red"],["普及-","orange"],["普及/提高-","yellow"],["普及+/提高","green"],["提高+/省选-","blue"],["省选/NOI-","purple"],["NOI/NOI+/CTSC","black"],["暂无评定","gray"]].map((m,w,y)=>({text:m[0],color:m[1],id:(w+1)%y.length})),o=[{text:"洛谷题库",color:"red",id:"P"},{text:"Codeforces",color:"orange",id:"CF"},{text:"SPOJ",color:"yellow",id:"SP"},{text:"AtCoder",color:"green",id:"AT"},{text:"UVA",color:"blue",id:"UVA"}],l=m=>{X(m)&&(m=m.toUpperCase()),m===""||typeof m>"u"?x.show_alert("提示","请输入题号"):location.href="https://www.luogu.com.cn/problemnew/show/"+m},r=!1,a=!1,i=n("input[name='toproblem']");i.after(i.clone()).remove(),i=n("input[name='toproblem']");let s=n(".am-btn[name='goto']");s.after(s.clone()).remove(),s=n(".am-btn[name='goto']");let d=s.parent();n(".am-btn[name='gotorandom']").text("随机");let g=n('<button class="am-btn am-btn-success am-btn-sm" name="gotorandomex">随机ex</button>').appendTo(d);s.on("click",()=>{/^[0-9]+.?[0-9]*$/.test(i.val())&&i.val("P"+i.val()),l(i.val())}),i.on("keydown",m=>{m.keyCode===13&&s.click()});let p=n(`<span id="exlg-exrand-window" class="exlg-window" style="display: block;">
    <br>
    <ul></ul>
    </span>`).appendTo(d).hide().on("mouseenter",()=>{r=!0}).on("mouseleave",()=>{r=!1,a||p.hide()});n(".lg-index-stat>h2").text("问题跳转 ").append(n('<div id="exlg-dash-0" class="exlg-rand-settings">ex设置</div>'));let h=p.children("ul").css("list-style-type","none"),_=n('<div id="exlg-exrand-menu"></div>').appendTo(h);n("<br>").appendTo(h);let L=n('<div id="exlg-exrand-diff" class="smallbtn-list"></div>').appendTo(h),z=n('<div id="exlg-exrand-srce" class="smallbtn-list"></div>').appendTo(h).hide(),u=n.double(m=>n(`<div class="exlg-rand-settings exlg-unselectable exrand-entry">${m}</div>`).appendTo(_),"题目难度","题目来源");u[0].after(n('<span class="exlg-unselectable">&nbsp;&nbsp;</span>')),u[0].addClass("selected").css("margin-right","38px"),n.double(([m,w])=>{m.on("click",()=>{n(".exrand-entry").removeClass("selected"),m.addClass("selected"),n(".smallbtn-list").hide(),w.show()})},[u[0],L],[u[1],z]),n.double(([m,w,y])=>{let k=n.double(([T,N])=>n(`<span class="${T}">
        <span class="lg-small lg-inline-up exlg-unselectable">${N}</span>
        <br>
        </span>`).appendTo(m),["exrand-enabled","已选择"],["exrand-disabled","未选择"]);w.forEach((T,N)=>{let M=n.double(P=>n(`<div class="exlg-smallbtn exlg-unselectable">${T.text}</div>`).css("background-color",`var(--lg-${T.color}-problem)`).appendTo(P),k[0],k[1]);n.double(P=>{M[P].on("click",()=>{M[P].hide(),M[1-P].show(),y[N]=!!P}),y[N]===!!P&&M[P].hide()},0,1)})},[L,t,e.exrand_difficulty],[z,o,e.exrand_source]),n("#exlg-dash-0").on("mouseenter",()=>{a=!0,n.double(([m,w])=>{n.double(([y,k])=>{m.children(y).children(".exlg-smallbtn").each((T,N,M=n(N))=>w[T]===k?M.show():M.hide())},[".exrand-enabled",!0],[".exrand-disabled",!1])},[L,e.exrand_difficulty],[z,e.exrand_source]),p.show()}).on("mouseleave",()=>{a=!1,r||setTimeout(()=>{r||p.hide()},200)});let f=async()=>{let m=n.double(([ge,pe,ue])=>{let F=[];return ge.forEach((me,fe)=>{pe[fe]&&F.push(me.id)}),F.length||(F=ue),F[Math.floor(Math.random()*F.length)]},[t,e.exrand_difficulty,[0,1,2,3,4,5,6,7]],[o,e.exrand_source,["P"]]),w=await j(`/problem/list?difficulty=${m[0]}&type=${m[1]}&page=1`),y=w.currentData.problems.count,k=Math.ceil(y/50),T=Math.floor(Math.random()*k)+1;w=await j(`/problem/list?difficulty=${m[0]}&type=${m[1]}&page=${T}`);let N=w.currentData.problems.result,M=Math.floor(Math.random()*N.length),P=N[M].pid;location.href=`/problem/${P}`};g.on("click",f)},`
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
`);c.reg_hook_new("rand-training-problem","题单内随机跳题","@/training/[0-9]+(#.*)?",{mode:{ty:"enum",vals:["unac only","unac and new","new only"],dft:"unac and new",info:["Preferences about problem choosing","随机跳题的题目种类"]}},({msto:e,args:t})=>{let o=e.mode.startsWith("unac")+e.mode.endsWith("only")*-1+2;!t.length||n(t[0].firstChild).clone(!0).appendTo(t).text("随机跳题").addClass("exlg-rand-training-problem-btn").on("click",()=>{let l=b.training,r=[];if(l.problems.some(i=>{l.userScore.score[i.problem.pid]===null?o&1&&r.push(i.problem.pid):l.userScore.score[i.problem.pid]<i.problem.fullScore&&o&2&&r.push(i.problem.pid)}),l.problemCount){if(!r.length)return o===1?v("您已经做完所有新题啦！"):o===2?v("您已经订完所有错题啦！"):v("您已经切完所有题啦！")}else return v("题单不能为空");let a=~~(Math.random()*1e6)%r.length;location.href="https://www.luogu.com.cn/problem/"+r[a]})},e=>{let t=n(e.target).find("div.operation");return{result:t.length>0,args:t}},()=>n("div.operation"),`
.exlg-rand-training-problem-btn {
    border-color: rgb(52, 52, 52);
    background-color: rgb(52, 52, 52);
}
`);var D={_:new Map,data:{},sto:null,reg:(e,t,o,l,r)=>(o&&(D.data[e]={ty:"object",lvs:o}),D._.set(e,{info:t,func:l,styl:r}),(...a)=>l(...(o?[D.sto[e]]:[]).concat(a))),ready:()=>{for(let[e,t]of D._.entries())t.styl&&GM_addStyle(t.styl),$(`Preparing component: ${e}`)}};var he=D.reg("register-badge","Badge_注册",null,async()=>{let e=(o,l)=>S({url:o,onload:r=>{let a=-1,i=r.response;[{errorcode:0,message:'"Succeed in creating a new badge!"',ontitle:"[exlg] 成功创建 badge",onlog:"Successfully created a badge!"},{errorcode:1,message:'"Wrong active code!"',ontitle:"无效激活码",onlog:"Illegal Active Code"},{errorcode:2,message:'"Sorry, but the active code has been used!"',ontitle:"激活码已被使用",onlog:"Expired Active Code"},{errorcode:3,message:'"Something went wrong!"',ontitle:"非法的 badge 内容",onlog:"Illegal Badge Text"},{errorcode:-1,message:"Fuck CCF up",ontitle:"未知错误",onlog:"注册 exlg-badge 时出现未知错误, 请联系开发人员"}].forEach(d=>{if(a===-1&&(console.log(i===d.message,d.errorcode===-1,d),(i===d.message||d.errorcode===-1)&&(a=d.errorcode,n("#exlg-dialog-title").html(d.errorcode?`[Error] ${d.ontitle}`:d.ontitle),$(d.errorcode?`Illegal Operation in registering badge: ${d.onlog}(#${d.errorcode})`:d.onlog),a===-1||!a))){l(),setTimeout(()=>v("badge 注册成功!","exlg 提醒您"),400);return}})}}),t="exlg badge 注册器 ver.5.0";v(`<div class="exlg-update-log-text exlg-unselectable exlg-badge-page" style="font-family: Consolas;">
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
    `,t,o=>{let l=n("#exlg-container"),r=l.find("input"),a=l.find("#exlg-dialog-title");if(O?.uid&&!r[0].value&&(r[0].value=O.uid),!(r[0].value&&r[1].value&&r[2].value)){a.html("[Err] 请检查信息是否填写完整"),setTimeout(()=>a.html(t),1500);return}n.get("/api/user/search?keyword="+r[0].value,i=>{if(!i.users[0])a.html("[Err] 无法找到指定用户"),setTimeout(()=>a.html(t),1500);else{r[0].value=i.users[0].uid;let s=`https://service-cmrlfv7t-1305163805.sh.apigw.tencentcs.com/release/${r[1].value}/${r[0].value}/${r[2].value}/`;e(s,o)}})},!1)},null),Q=he;c.reg_chore("sponsor-list","获取标签列表","1D","@/.*",{tag_list:{ty:"string",priv:!0}},({msto:e})=>{S({url:"https://service-cmrlfv7t-1305163805.sh.apigw.tencentcs.com/release/get/0/0/",onload:t=>{e.tag_list=decodeURIComponent(t.responseText)}})});c.reg_hook_new("sponsor-tag","标签显示",["@/","@/paste","@/discuss/.*","@/problem/.*","@/ranking.*"],{tag_list:{ty:"string",priv:!0}},({args:e})=>{let t=JSON.parse(C["^sponsor-list"].tag_list),o=l=>{if(!l||l.hasClass("exlg-badge-username")||!/\/user\/[1-9][0-9]{0,}/.test(l.attr("href")))return;l.addClass("exlg-badge-username");let r=l.attr("href").slice(6),a=t[r];if(!a)return;let i=n(r==="100250"?`<span class="am-badge am-radius lg-bg-red" style="margin-left: 4px;">${a}</span>`:`<span class="exlg-badge">${a}</span>`).off("contextmenu").on("contextmenu",()=>!1).on("mousedown",d=>{d.button===2?location.href="https://www.luogu.com.cn/paste/asz40850":d.button===0&&Q()}),s=l;s.next().length&&s.next().hasClass("sb_amazeui")&&(s=s.next()),s.next().length&&s.next().hasClass("am-badge")&&(s=s.next()),s.after(i)};e.each((l,r)=>o(n(r)))},e=>{let t=n(e.target).find("a[target='_blank'][href]");return{result:t.length,args:t}},()=>n("a[target='_blank'][href]"),`
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
`);c.reg_main("springboard","跨域跳板",["@bili/robots.txt?.*","@/robots.txt?.*"],null,()=>{let e=new URLSearchParams(location.search);switch(e.get("type")){case"update":x.addEventListener("message",o=>{o.data.unshift("update"),x.parent.postMessage(o.data,"*")});break;case"page":let t=e.get("url");(!e.get("confirm")||confirm(`是否加载来自 ${t} 的页面？`))&&(document.body.innerHTML=`<iframe src="${t}" exlg="exlg"></iframe>`);break;case"dash":break}},`
    iframe {
        border: none;
        display: block;
        width: 100%;
        height: 100%;
    }
    iframe::-webkit-scrollbar {
        display: none;
    }
`);c.reg("tasklist-ex","任务计划_ex","@/",{auto_clear:{ty:"boolean",dft:!0,info:["Hide accepted problems","隐藏已经 AC 的题目"]},rand_problem_in_tasklist:{ty:"boolean",dft:!0,info:["Random problem in tasklist","任务计划随机跳题"]}},({msto:e})=>{let t=[];n.each(n("div.tasklist-item"),(a,i,s=n(i))=>{let d=s.attr("data-pid");i.innerHTML.search(/check/g)===-1&&e.rand_problem_in_tasklist&&t.push(d),s.find("i").hasClass("am-icon-check")&&s.addClass("tasklist-ac-problem")});let o=n('<div>[<a id="toggle-button">隐藏已AC</a>]</div>');n("button[name=task-edit]").parent().after(o);let l=n(".tasklist-ac-problem"),r=n("#toggle-button").on("click",()=>{l.toggle(),r.text(["隐藏","显示"][+(e.auto_clear=!e.auto_clear)]+"已 AC")});if(e.auto_clear&&r.click(),e.rand_problem_in_tasklist){let a=n('<button name="task-rand" class="am-btn am-btn-sm am-btn-success lg-right">随机</button>');n("button[name='task-edit']").before(a),a.addClass("exlg-rand-tasklist-problem-btn").click(()=>{let i=~~(Math.random()*1e6)%t.length;location.href+=`problem/${t[i]}`})}},`
.exlg-rand-tasklist-problem-btn {
    margin-left: 0.5em;
}
`);var ae=`-H \`.husky/pre-commit\`
 : 检查没有文档的模块和没有模块的文档
 : 自动生成 \`src/all-modules.js\`，import 了所有的模块

*M user-comment
 : 新增设置，选择是否直接替换用户名（resolve #154）
   *? 加上了对应文档

*# *monkey
 : 修改了 Headers
 : setClipboard 对 Violentmonkey 适配

*< 删除了调试用的 \`console.log\`，包括注释`;c.reg_chore("update","检查更新","1D",".*",null,()=>{V((e,t)=>t==="<<"&&v(`<p>检测到新版本 ${e}，点击确定将安装。</p>`,"检测到新版本",()=>location.href=`https://hub.fastgit.xyz/extend-luogu/extend-luogu/raw/${e}/dist/extend-luogu.min.user.js`))});var be=["$","#<@"].map(e=>e.split("")),ie={Ty:{"-":"添加",x:"删减","!":"重大","*":"修改","^":"修复",$:"重构"},Op:{"-":"特性","?":"文档","#":"依赖","<":"代码风格",">":"命令",M:"模块",H:"钩子","@":"GitHub Action"}};c.reg("update-log","更新日志显示","@/.*",{last_version:{ty:"string",priv:!0},style:{ty:"enum",vals:["Commit Message","自然语言"],get:"id",info:["The way to display log","显示 Log 的方式"]},keep_dev:{ty:"boolean",dft:!0,info:["Keep developer messages","保留开发者更新信息"]}},({msto:e})=>{if(location.href.includes("blog"))return;let t=GM_info.script.version,o=!1,l=r=>{let a=`<div class="exlg-update-log-text" style="font-family: ${C["code-block-ex"].copy_code_font};">`;return r.split(`
`).forEach(i=>{let s=i.trimStart();if(s.length){if(e.keep_dev)o=!1;else if(s[0]===":"){if(!o)return}else if(be.some((d,g)=>d.includes(s[g]))){o=!1;return}else o=!0;e.style===1&&s[0]!==":"&&(i=" ".repeat(i.length-s.length)+ie.Ty[s[0]]+ie.Op[s[1]]+s.substring(2))}a+=`<div>${i.replace(/ /g,"&nbsp;")}</div>`}),a+"</div>"};switch(q(e.last_version,t)){case"==":break;case"<<":v(l(ae),`extend-luogu ver. ${t} 更新日志`);case">>":e.last_version=t}},`
.exlg-update-log-text {
    overflow-x: auto;
    white-space: nowrap;
    text-align: left;
    /* border: 1px solid #dedede; */
}
`);var A=null;c.reg_hook_new("user-comment","用户备注",".*",{comments:{ty:"string",dft:"{}",priv:!0},direct_display:{ty:"boolean",dft:!0,info:["Directly replace username","直接替换用户名"]}},({msto:e,result:t,args:o})=>{let l=(r,a)=>{if(!(!a||!r)&&!!r.length){if(r.length!==1){r.each((i,s)=>l(n(s),a));return}r.children("span[style]").length&&(r=r.children("span[style]")),r.css("white-space","pre"),e.direct_display?r.text(a):r.append(`<span class="exlg-usercmt exlg-usercom-tag">(${a})</span>`)}};if(!t){A=JSON.parse(e.comments);for(let[r,a]of Object.entries(A))(a===null||a==="")&&delete A[r];if(/^\/user\/[1-9][0-9]{0,}$/.test(location.pathname)){let r=n(".user-info > div.user-name"),a=r.text(),i=parseInt(location.pathname.slice(6));r.html("");let s=n('<span id="exlg-name-text"></span>').appendTo(r);s.text(i in A?A[i]:a);let d=n('<svg class="icon exlg-usercom-edit" style="width: 1.2em;height: 1.2em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="942"><path d="M295.384615 708.923077h433.23077a19.692308 19.692308 0 1 1 0 39.384615h-433.23077a19.692308 19.692308 0 1 1 0-39.384615zM590.769231 303.576615L618.653538 275.692308l72.979693 73.019077-27.844923 27.844923L590.769231 303.576615z m-236.307693 196.923077L382.345846 472.615385l89.284923 89.324307-27.844923 27.844923L354.461538 500.499692zM401.329231 616.841846l308.342154-308.342154-55.689847-55.689846-308.381538 308.342154-8.152615 63.881846 63.881846-8.192z m-93.065846-74.043077l317.833846-317.833846a39.384615 39.384615 0 0 1 55.729231 0l55.689846 55.689846a39.384615 39.384615 0 0 1 0 55.689846l-317.833846 317.833847-127.763693 16.344615 16.344616-127.724308z" p-id="943"></path></svg>');r.append(d),d.on("click",()=>{v(`<div>请设置用户 <span style="font-family: Consolas, monospace;">${a} (uid: ${i})</span> 的备注名<br>留空则清除备注。</div><input exlg-badge-register type="text" style="font-family: Consolas, monospace;line-height: 1.5;padding: .1em;" class="am-form-field exlg-badge-input" placeholder="填写用户名或uid" name="username" id="exlg-user-com-input">`,"exlg 用户备注",()=>{let g=n("#exlg-user-com-input").val();g.trim()===""?(delete A[i],g=a):A[i]=g,l(n(`a[href="/user/${i}"][target=_blank]`)),e.comments=JSON.stringify(A),s.text(i in A?A[i]:a)},!0),n("#exlg-user-com-input").val(i in A?A[i]:a)})}}o.forEach(r=>{let a=n(r),i=r.href.split("/").lastElem();a.hasClass("exlg-usercmt")||(a.addClass("exlg-usercmt"),i in A&&l(a,A[i]))})},e=>{let t=e.target.querySelectorAll('a[href^="/user"][target=_blank]');return{result:t.length>0,args:t}},()=>document.querySelectorAll('a[href^="/user"][target=_blank]'),`
.exlg-usercom-edit {
    transition: all .4s;
    opacity: 0;
}
.exlg-usercom-edit:hover {
    transition: all .4s;
    opacity: 0.8;
}
.exlg-usercom-tag {
    color: #8a7b7b;
    font-weight: lighter;
    font-size: .9em;
    margin-left: .3em;
    line-height: 1em;
    font-family: Consolas
}
`);c.reg_user_tab("user-intro-ins","用户首页_HTML_显示","main",null,null,()=>{n(".introduction > *").each((e,t,o=n(t))=>{let l=o.text(),[,,r,a]=l.match(/^(exlg.|%)([a-z]+):([^]+)$/)??[];if(!r)return;a=a.split(/(?<!!)%/g).map(s=>s.replace(/!%/g,"%"));let i=n(n(".user-action").children()[0]);switch(r){case"html":o.replaceWith(n(`<p exlg="exlg">${B.process(a[0])}</p>`));break;case"frame":o.replaceWith(U({type:"page",url:encodeURI(a[0]),confirm:!0},`width: ${a[1]}; height: ${a[2]};`));break;case"blog":if(i.text().trim()!=="个人博客")return;i.attr("href",a),o.remove();break}})},`
    iframe {
        border: none;
        display: block;
    }
    iframe::-webkit-scrollbar {
        display: none;
    }
`);var ne={SUBMITTED_PROBLEMS:0,PASSED_PROBLEMS:1},se=-1,de=ne.SUBMITTED_PROBLEMS,Y=-1,K=null,ee=null;c.reg_hook_new("user-problem-color","题目颜色数量和比较","@/user/[0-9]{0,}.*",{problem_compare:{ty:"boolean",strict:!0,dft:!0,info:["AC compare","AC题目比较"]}},({msto:e,args:t})=>{let o=[[191,191,191],[254,76,97],[243,156,17],[255,193,22],[82,196,26],[52,152,219],[157,61,207],[14,29,105]],l=async(a,i)=>{if(K===null){let d=await j(`/user/${O.uid}`);K=b.passedProblems,ee=new Set,d.currentData.passedProblems.forEach((g,p)=>ee.add(g.pid))}let s=0;i&&a[1].querySelectorAll("a").forEach((g,p)=>{p<K.length&&ee.has(K[p].pid)&&(s++,g.style.backgroundColor="rgba(82, 196, 26, 0.3)")}),n("#exlg-problem-count-1").html(`<span class="exlg-counter" exlg="exlg">${K.length} <> ${ee.size} : ${s}<i class="exlg-icon exlg-info" name="ta 的 &lt;&gt; 我的 : 相同"></i></span>`)},r=a=>`rgb(${o[a][0]}, ${o[a][1]}, ${o[a][2]})`;if(typeof t=="object"&&t.message===R.ADD_COMPARE){if(!e.problem_compare||b.user.uid===O.uid)return;l([114514,1919810],!1);return}t.forEach(a=>{if(a.target.href!=="javascript:void 0"&&(a.target.style.color=r([(a.board_id?b.passedProblems:b.submittedProblems)[a.position].difficulty]),a.board_id===ne.PASSED_PROBLEMS&&a.position===b.passedProblems.length-1||b.passedProblems.length===0&&a.board_id===ne.SUBMITTED_PROBLEMS&&a.position===b.submittedProblems.length-1)){n(".exlg-counter").remove();let i=a.target.parentNode.parentNode.parentNode.parentNode,s=[i.firstChild.childNodes[2],i.lastChild.childNodes[2]];for(let d=0;d<2;++d){let g=s[d],p=b[["submittedProblems","passedProblems"][d]];g.before(n(`<span id="exlg-problem-count-${d}" class="exlg-counter" exlg="exlg">${p.length}</span>`)[0])}if(!e.problem_compare||b.user.uid===O.uid)return;l(s,!0)}})},e=>{if(location.hash!=="#practice")return{result:!1,args:{message:R.NOT_AT_PRACTICE_PAGE}};if(!b.submittedProblems.length&&!b.passedProblems.length){if(e.target.className==="card padding-default")if(n(e.target).children(".problems").length){let a=b[["submittedProblems","passedProblems"][Y]];if(n(e.target.firstChild).after(`<span id="exlg-problem-count-${Y}" class="exlg-counter" exlg="exlg" style="margin-left: 5px">${a.length}</span>`),++Y>1)return{result:!0,args:{message:R.ADD_COMPARE}}}else n(e.target).children(".difficulty-tags").length&&(Y=0);return{result:!1,args:{message:R.NONE}}}if(!e.target.tagName)return{result:!1,args:{message:R.COMMENT_TAG}};if(e.target.tagName.toLowerCase()!=="a"||e.target.className!=="color-default"||e.target.href.indexOf("/problem/")===-1)return{result:!1,args:{message:R.NOT_A_PROBLEM_ELEMENT}};let t=a=>a?a.pid:void 0,o=e.target,l=[t(b.submittedProblems[0]),t(b.passedProblems[0])].indexOf(o.href.slice(33)),r=l!==-1;return{result:!0,args:[{onchange:r,board_id:r?de=l:de,position:r?se=0:++se,target:o}]}},()=>{if(!b.submittedProblems.length&&!b.passedProblems.length){n(".exlg-counter").remove();let e=n(".card.padding-default > .problems");for(let t=0;t<2;++t){let o=n(e[t]),l=b[["submittedProblems","passedProblems"][t]];o.before(`<span id="exlg-problem-count-${t}" class="exlg-counter" exlg="exlg">${l.length}</span>`)}return{message:R.ADD_COMPARE}}return[]},`
    .main > .card > h3 {
        display: inline-block;
    }
`);c.reg("virtual-participation","创建重现赛","@/contest/[0-9]*(#.*)?",{},()=>{if(b.contest.name.match("Virtual Participation")){let e=n(".items"),t=()=>{(location.hash||"#main")==="#problems"&&n(".pid").length!==0&&b.contest.startTime>oe(1e3)&&(n("a.title.color-default").on("click",()=>{v("比赛尚未开始, 请开始后再查看题目")}),n("a.title.color-default").removeAttr("href"))};e.on("click",t),t();return}if(b.contest.endTime>oe(1e3)){I("Contest has not started or ended.");return}n("<button id='exlg-vp' class='lfe-form-sz-middle'>重现比赛</button>").appendTo(n("div.operation")).click(async()=>{v(`<div>
                <p>设置「${b.contest.name}」的重现赛</p>
                <p>开始时间：<input type="date" id="vpTmDt"/> <input type="time" id="vpTmClk"/></p>
            </div><br>`,"创建重现赛",async()=>{let e=n("#vpTmDt")[0].value.split("-"),t=n("#vpTmClk")[0].value.split(":"),o=new Date(e[0],e[1]-1,e[2],t[0],t[1],0,0);o=o.getTime()/1e3;let l="",r="";n.each(b.contestProblems,(g,p)=>{g&&(l+=",",r+=","),l+='"'+p.problem.pid+'"',r+=`"${p.problem.pid}": ${p.problem.fullScore}`});let a=null,i=`{
                    "settings":{
                        "name": "Virtual Participation for ${b.contest.name}",
                        "description": ${JSON.stringify(b.contest.description)},
                        "visibilityType":5,
                        "invitationCodeType":1,
                        "ruleType":${b.contest.ruleType},
                        "startTime":${o},
                        "endTime":${o+b.contest.endTime-b.contest.startTime},
                        "rated":false,
                        "ratingGroup":null
                    },
                    "hostID":${O.uid}
                }`;a=await W("/fe/api/contest/new",i);let s=a.id.toString();switch(a.status??200){case 200:s=a.id.toString();break;default:E(`Failed to modify contest ${s} with status code ${a.status}.`)}a=null;try{a=await W(`/fe/api/contest/editProblem/${s}`,`{
                            "pids":[${l}],
                            "scores":{${r}}
                        }`)}catch{v("<p>本场比赛的题目不公开</p>","重现赛创建失败");return}let d=await j(`/contest/edit/${s}`);await W(`/fe/api/contest/join/${s}`,`{"code": "${d.currentData.contest.joinCode}"}`),v(`<p>邀请码: ${d.currentData.contest.joinCode}</p>
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
`);$("Exposing");Object.assign(x,{exlg:{mod:c,log:$,error:E,springboard:U,version_cmp:q,lg_alert:J,lg_content:j,register_badge:Q,TM_dat:{reload_dat:e=>(raw_dat=null,load_dat(e,{map:t=>{t.root=!t.rec,t.itmRoot=t.rec===2}})),type_dat,proxy_dat,load_dat,save_dat,clear_dat,raw_dat}},GM:{GM_info,GM_addStyle,GM_setClipboard,GM_xmlhttpRequest,GM_getValue,GM_setValue,GM_deleteValue,GM_listValues},$$:n,xss:B,marked});var ce=e=>{try{x.exlg.TM_dat.sto=x.exlg.TM_dat.reload_dat({...c.data,...D.data}),c.fake_sto=D.sto=x.exlg.TM_dat.sto}catch(t){if(e)J("存储代理加载失败，清存重试中……"),clear_dat(),ce(e-1);else throw J("失败次数过多，自闭中。这里建议联系开发人员呢。"),t}};ce(1);D.ready();c.preload();n(()=>{$("Launching"),c.execute()});})();
