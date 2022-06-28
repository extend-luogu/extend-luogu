// ==UserScript==
// @name           extend-luogu
// @namespace      http://tampermonkey.net/
// @description    Make luogu more powerful.
// @description:zh 使洛谷拥有更多功能
// @icon           https://raw.fastgit.org/extend-luogu/extend-luogu/main/favicon.ico
// @icon64         https://exlg.cc/img/logo.png
// @homepage       https://exlg.cc
// @version        CUR_VER
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
// @connect        xn--fx-ex2c330n.ml
// @connect        bens.rotriw.com
// @connect        codeforces.com
// @connect        codeforces.ml
// @connect        codeforc.es
// @connect        kenkoooo.com
// @connect        api.github.com
// @connect        exlg.piterator.com
// @connect        luogu-captcha-bypass.piterator.com
// @connect        exlgcs.jin-dan.site
// @connect        localhost
//
// @require        https://cdn.luogu.com.cn/js/jquery-2.1.1.min.js
//
// @resource       colorpicker https://extend-luogu.github.io/exlg-color-picker/dist/xncolorpicker.min.js
// @resource       colorpicker_old https://www.jq22.com/demo/xncolorpicker-main202101270059/dist/xncolorpicker.min.js
// @resource       pickr_resource https://unpkg.com/@simonwep/pickr@1.8.2/dist/pickr.min.js
// @resource       pickr_resource_css https://unpkg.com/@simonwep/pickr@1.8.2/dist/themes/nano.min.css
// @resource       roboto https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap
// @resource       material_icons https://fonts.googleapis.com/icon?family=Material+Icons
// @resource       material_icons_outlined https://fonts.googleapis.com/icon?family=Material+Icons+Outlined
//
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_listValues
// @grant          GM_setClipboard
// @grant          GM_xmlhttpRequest
// @grant          GM_getResourceText
// @grant          unsafeWindow
// ==/UserScript==
