process.chdir("src")

import { existsSync, readFileSync, writeFileSync } from "fs"
import { join, basename } from "path"
import { buildSync } from "esbuild"
import parser from "minimist"

;(([fn, val]) => {
    if (!existsSync(fn))
        writeFileSync(fn, val)
})(["./resources/update-log.js", "export default ``"])

const parg = parser(process.argv.slice(2)),
    minify = parg.m ?? !parg.b,
    outfn = join(parg.d ?? "build", parg.o ?? "extend-luogu.user.js")
buildSync({
    entryPoints: [ "./src/main.js" ],
    outfile: outfn,
    banner: {
        js: readFileSync("resources/tm-headers.js", "utf8").replace("CUR_VER", process.env.npm_package_version) + "\n;",
    },
    bundle: true,
    charset: "utf8",
    minify
})
console.log(`Build ${basename(outfn)} successfully.`)
process.exit(0)
