import "./modules/benben.js"
import "./modules/code-block-ex.js"
import "./modules/dash.js"
import "./modules/dialog-board.js"
import "./modules/emoticon.js"
import "./modules/keyboard-cli.js"
import "./modules/original-difficulty.js"
import "./modules/rand-problem-ex.js"
import "./modules/rand-training-problem.js"
import "./modules/springboard.js"
import "./modules/tasklist-ex.js"
import "./modules/update.js"
import "./modules/user-intro-ins.js"
import "./modules/user-problem-color.js"

import "./load.js"
import { $, log } from "./utils.js"
import mod from "./core.js"

$(() => {
    log("Launching")
    mod.execute()
})