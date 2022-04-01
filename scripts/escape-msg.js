import { readFileSync } from "fs"

process.stdout.write(JSON.stringify([
    readFileSync(process.argv[2], { encoding: "utf8" })
        .replace(/(\n|^)#[^\n]*/g, "")
        .trim()
]))