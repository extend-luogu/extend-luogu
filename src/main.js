import "./category.js";
import "./compo-core.js";
import "./all-modules.js";
import "./load.js";
import { $, log } from "./utils.js";
import queues from "./run-queue.js";

queues.preload.apply();
$(() => {
    log("Launching");
    queues.onload.apply();
});
