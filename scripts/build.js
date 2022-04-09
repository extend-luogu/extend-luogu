import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { join, basename } from "path"
import { buildSync } from "esbuild"
import { execSync } from "child_process"
import parser from "minimist"

const tmpd = "_tmp",
    parg = parser(process.argv.slice(2)),
    minify = parg.m ?? !parg.b,
    outfn = join(parg.d ?? "build", parg.o ?? "extend-luogu.user.js")

if (parg.G) {
    writeFileSync("./src/all-modules.js", readdirSync("./src/modules").map(
        s => `import "./modules/${s}"`).join("\n"))
    ;(([ fn, val ]) => {
        if (!existsSync(fn))
            writeFileSync(fn, val)
    })([ "./src/resources/update-log.txt", "" ])
    execSync(`git add ./src/all-modules.js`)
}

let tmpcss = {}, trklist = []
const chk = dn => readdirSync(dn, { encoding: "utf8", withFileTypes: true }).forEach(fn => {
    let rfn = join(dn, fn.name)
    if (fn.isDirectory()) {
        mkdirSync(join(tmpd, rfn))
        return chk(rfn)
    }
    let ext = fn.name.match(/\.[^\.]*$/g)[0]
    if (ext === ".css")
        tmpcss[rfn.replace(/\.[^\.]*$/, "")] = rfn
    else
        cpSync(rfn, join(tmpd, rfn))
    if ([ ".css", ".html" ].includes(ext))
        trklist.push(join(tmpd, rfn))
})

if (existsSync(tmpd))
    rmSync(tmpd, { recursive: true, force: true })
mkdirSync(tmpd)
chk("src")
buildSync({
    entryPoints: tmpcss,
    outdir: tmpd,
    minify,
})
trklist.forEach(fn => writeFileSync(fn, readFileSync(fn, { encoding: "utf8" }).replace(/\n( {4})*/g, "")))

buildSync({
    entryPoints: [ join(tmpd, "./src/main.js") ],
    outfile: outfn,
    banner: {
        js: readFileSync("./src/resources/tm-headers.js", "utf8").replace("CUR_VER", process.env.npm_package_version) + "\n;",
    },
    loader: {
        ".css": "text"
    },
    bundle: true,
    charset: "utf8",
    minify
})
rmSync(tmpd, { recursive: true, force: true })
console.log(`Build ${basename(outfn)} successfully.`)

process.exit(0)
