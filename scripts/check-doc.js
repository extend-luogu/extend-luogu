import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const readlines = (filename) => readFileSync(filename, "utf-8").replace(/\r/g, "").split("\n").filter((i) => i.trim());

let mods = [];
const entl = {};
readlines("./src/all-modules.js")
    .filter((s) => !s.startsWith("//") && s.trim())
    .forEach((v) => mods = mods.concat(readFileSync(join("src", v.match(/"[^"]+";$/g)[0].slice(1, -2)), { encoding: "utf8" })
        .match(/(^|\n)mod\.reg([^"]*".*?"){2}/g)
        .map((c) => {
            const x = c.match(/"[^"]*"/g).map((t) => t.slice(1, -1));
            entl[x[0]] = `- [${x[1]}](./${x[0]}.md)`;
            return x[0];
        })));

const hsdm = [];
readdirSync("./doc/module")
    .forEach((v) => {
        const p = v.slice(0, -3);
        if (v !== "module.md") {
            if (!mods.some((m, i, a) => (p === m) && a.splice(i, 1))) {
                console.error(`error: unknown doc ${v}`);
                process.exit(1);
            }
            hsdm.push(p);
        }
    });
if (mods.length) {
    console.error(`error: no doc for mod[s]: ${mods.join(", ")}`);
    process.exit(1);
}

// Note: no modifications during check
// writeFileSync("./doc/module/module.md", "## 模块\n" + Object.entries(entl)
//     .sort(([ a, ], [ b, ]) => a.localeCompare(b))
//     .map(x => x[1].replaceAll("_", " "))
//     .join("\n"))

readlines("./doc/module/module.md")
    .filter((e) => /\(/.test(e))
    .map((e) => e.match(/]\(.*?\)/g)[0].slice(2, -1))
    .forEach((n) => {
        const pos = hsdm.indexOf(n.slice(2, -3));
        if (pos === -1) {
            console.error(`error: unknown mod in module.md: ${n}`);
            process.exit(1);
        }
        hsdm.splice(pos, 1);
    });
if (hsdm.length) {
    console.error(`error: no doc for mod[s] in module.md: ${hsdm.join(", ")}`);
    process.exit(1);
}

// Check docs for components

const cdcs = readdirSync("./doc/component").map((s) => s.slice(0, -3));
readdirSync("./src/components").forEach((s) => {
    const tmp = cdcs.indexOf(s.slice(0, -3));
    if (tmp === -1) {
        console.error(`error: no doc for component ${s}`);
        process.exit(1);
    }
    cdcs.splice(tmp, 1);
});
if (cdcs.length - 1) {
    console.error(`error: unknown doc[s]: ${cdcs.join(", ")}`);
    process.exit(1);
}
