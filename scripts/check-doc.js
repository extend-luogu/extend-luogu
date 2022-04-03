import { writeFileSync, readFileSync, readdirSync } from "fs"

let mods = [], entl = {}
readdirSync("./src/modules")
    .forEach(v => mods = mods.concat(readFileSync(`./src/modules/${v}`, { encoding: "utf8" })
        .match(/mod\.reg([^"]*".*?"){2}/g)
        .map(c => {
            let x = c.match(/"[^"]*"/g).map(t => t.slice(1, -1))
            entl[x[0]] = `- [${x[1]}](./${x[0]}.md)`
            return x[0]
        })))

readdirSync("./doc/module")
    .forEach(v => {
        let p = v.slice(0, -3)
        if (!mods.some((m, i, a) => (p === m) && a.splice(i, 1)) && v !== "module.md")
            console.warn(`warn: unknown doc ${v}`)
    })
if (!mods.length) {
    console.error(`error: no doc for mod[s] ${mods}`)
    process.exit(1)
}

writeFileSync("./doc/module/module.md", "## 模块\n" + Object.entries(entl)
    .sort(([a, ], [b, ]) => a.localeCompare(b))
    .map(x => x[1].replaceAll("_", " "))
    .join("\n"))