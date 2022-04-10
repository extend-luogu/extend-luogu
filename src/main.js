import "./category.js"
import "./all-modules.js"
import "./load.js"
import { $, log } from "./utils.js"
import mod from "./core.js"
import compo from "./compo-core.js"

mod.preload()
$(() => {
    log("Launching")
    compo.ready()
    mod.execute()
})