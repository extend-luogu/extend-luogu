/* eslint-env node */
const fs = require("fs")
require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
}).question("Inquiring version: ", ver => {
    fs.writeFileSync("../dist/extend-luogu.min.js", `${fs.readFileSync("tm-headers.js", "utf8").replace("CUR_VER", ver)}
;${require("esbuild").buildSync({
        entryPoints: [ "main.js" ],
        bundle: true,
        minify: true,
        charset: "utf8",
        write: false,
    }).outputFiles[0].text
        .replace(/(\n|  +)/g, "")
}`)
    // console.log("Build extend-luogu.min.js successfully.")
    process.exit()
})