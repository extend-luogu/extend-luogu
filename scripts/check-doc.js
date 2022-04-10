import { readFileSync, readdirSync } from "fs"
import { join } from "path"

let mods = [], entl = {}
readFileSync("./src/all-modules.js", { encoding: "utf8" }).replaceAll("\r\n", "\n").split("\n")
    .filter(s => !s.startsWith("//"))
    .forEach(v => mods = mods.concat(readFileSync(join("src", v.match(/"[^"]+"$/g)[0].slice(1, -1)), { encoding: "utf8" })
        .match(/(^|\n)mod\.reg([^"]*".*?"){2}/g)
        .map(c => {
            let x = c.match(/"[^"]*"/g).map(t => t.slice(1, -1))
            entl[x[0]] = `- [${x[1]}](./${x[0]}.md)`
            return x[0]
        })))

let hsdm = []
readdirSync("./doc/module")
    .forEach(v => {
        let p = v.slice(0, -3)
        if (v !== "module.md") {
            if (!mods.some((m, i, a) => (p === m) && a.splice(i, 1))) {
                console.error(`error: unknown doc ${v}`)
                process.exit(1)
            }
            hsdm.push(p)
        }
    })
if (mods.length) {
    console.error(`error: no doc for mod[s]: ${mods.join(", ")}`)
    process.exit(1)
}

// Note: no modifications during check
// writeFileSync("./doc/module/module.md", "## 模块\n" + Object.entries(entl)
//     .sort(([ a, ], [ b, ]) => a.localeCompare(b))
//     .map(x => x[1].replaceAll("_", " "))
//     .join("\n"))

readFileSync("./doc/module/module.md", { encoding: "utf8" }).replaceAll("\r\n", "\n").split("\n")
    .filter(e => /\(/.test(e))
    .map(e => e.match(/]\(.*?\)/g)[0].slice(2, -1))
    .forEach(n => {
        let pos = hsdm.indexOf(n.slice(2, -3))
        if (pos === -1) {
            console.error(`error: unknown mod in module.md: ${n}`)
            process.exit(1)
        }
        hsdm.splice(pos, 1)
    })
if (hsdm.length) {
    console.error(`error: no doc for mod[s] in module.md: ${hsdm.join(", ")}`)
    process.exit(1)
}

// Check docs for components

let cdcs = readdirSync("./doc/component").map(s => s.slice(0, -3))
readdirSync("./src/components").forEach(s => {
    let tmp = cdcs.indexOf(s.slice(0, -3))
    if (tmp === -1) {
        console.error(`error: no doc for component ${s}`)
        process.exit(1)
    }
    cdcs.splice(tmp, 1)
})
if (cdcs.length) {
    console.error(`error: unknown doc[s]: ${cdcs.join(", ")}`)
    process.exit(1)
}