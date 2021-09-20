const { src, dest } = require('gulp');
const concat = require('gulp-concat');
const header = require('gulp-header');
const webpack = require('webpack-stream');

const USER_JS_METADATA = `// ==UserScript==
// @name           extend-luogu
// @namespace      http://tampermonkey.net/
// @version        2.11.11
//
// @match          https://*.luogu.com.cn/*
// @match          https://*.luogu.org/*
// @match          https://www.bilibili.com/robots.txt?*
// @match          https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121
// @match          https://service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com/release/exlg-nextgen
// @match          https://service-otgstbe5-1305163805.sh.apigw.tencentcs.com/release/exlg-setting
// @match          https://extend-luogu.github.io/exlg-setting/*
// @match          http://localhost:1634/*
//
// @connect        tencentcs.com
// @connect        luogulo.gq
// @connect        bens.rotriw.com
//
// @require        https://cdn.luogu.com.cn/js/jquery-2.1.1.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/js-xss/0.3.3/xss.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/marked/2.0.1/marked.min.js
// @require        https://greasyfork.org/scripts/429255-tm-dat/code/TM%20dat.js?version=955951
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
`;

const SOURCES = [
    'src/utilities.js',
    'src/extend-luogu.js',
];

exports.default = function () {
    return src('src/extend-luogu.js')
        .pipe(webpack({
            mode: 'production',
            optimization: {
                minimize: false,
            },
        }))
        .pipe(concat('extend-luogu.user.js'))
        .pipe(header(USER_JS_METADATA))
        .pipe(dest('./'));
};