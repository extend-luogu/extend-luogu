/* eslint-env node */

process.chdir("src")
const isdebug = require("minimist")(process.argv.slice(2)).debug
require("esbuild").buildSync({
    entryPoints: [ "main.js" ],
    outfile: `../dist/extend-luogu.${isdebug? "bundled" : "min"}.user.js`,
    banner: {
        js: require("fs").readFileSync("tm-headers.js", "utf8").replace("CUR_VER", process.env.npm_package_version) + "\n;",
    },
    bundle: true,
    minify: !isdebug,
    charset: "utf8",
})
console.log(`Build extend-luogu.${isdebug? "bundled" : "min"}.user.js successfully.`)
if (!isdebug)
    require("fs").copyFileSync("../dist/extend-luogu.min.user.js", "../extend-luogu.user.js")
process.exit()
