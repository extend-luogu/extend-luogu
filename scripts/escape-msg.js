/* eslint-env node */

process.stdout.write(
    readFileSync(process.argv[2], { encoding: "utf8" })
        .replace(/(\n|^)#[^\n]*/g, "")
        .trim()
        .replace(/\n/g, "\\n")
)