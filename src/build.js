/* eslint-env node */

process.chdir("src")

const
    { existsSync, readFileSync, writeFileSync } = require("fs"),
    { join, basename } = require("path")

;(([fn, val]) => {
    if (!existsSync(fn))
        writeFileSync(fn, val)
})(["./resources/update-log.js", "export default ``"])

const parg = require("minimist")(process.argv.slice(2)),
    minify = parg.m ?? !parg.b,
    outfn = join("..", parg.d ?? "dist", parg.o ?? "extend-luogu.user.js")
require("esbuild").buildSync({
    entryPoints: [ "main.js" ],
    outfile: outfn,
    banner: {
        js: readFileSync("resources/tm-headers.js", "utf8").replace("CUR_VER", process.env.npm_package_version) + "\n;",
    },
    bundle: true,
    charset: "utf8",
    minify
})
console.log(`Build ${basename(outfn)} successfully.`)
process.exit()
