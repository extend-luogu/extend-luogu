import "./category.js";
import "./all-modules.js";
import "./load.js";
import { $, log } from "./utils.js";
import mod from "./core.js";
import compo from "./compo-core.js";
import queues from "./run-queue.js";

mod.preload();
mod.execute_v2();

queues.preload.apply();
$(() => {
    log("Launching");
    compo.ready();
    mod.execute();
    queues.onload.apply();
});
