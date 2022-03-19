/* eslint-env node */

process.chdir("src")
const parg = require("minimist")(process.argv.slice(2)),
    minify = parg.m ?? !parg.b,
    outfn = require("path").join("..", parg.d ?? "dist", parg.o ?? "extend-luogu.user.js")
require("esbuild").buildSync({
    entryPoints: [ "main.js" ],
    outfile: outfn,
    banner: {
        js: require("fs").readFileSync("resources/tm-headers.js", "utf8").replace("CUR_VER", process.env.npm_package_version) + "\n;",
    },
    bundle: true,
    charset: "utf8",
    minify
})
console.log(`Build ${require("path").basename(outfn)} successfully.`)
process.exit()
