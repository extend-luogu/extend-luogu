import "./all-modules.js"
import "./load.js"
import { $, log } from "./utils.js"
import mod from "./core.js"

mod.preload()
$(() => {
    log("Launching")
    mod.execute()
})