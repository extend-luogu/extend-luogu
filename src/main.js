import "./all-modules.js"
import "./load.js"
import { $, log } from "./utils.js"
import mod from "./core.js"
import compo from "./compo-core.js"

compo.ready()
mod.preload()
$(() => {
    log("Launching")
    mod.execute()
})