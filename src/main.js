import "./modules/benben.js"
import "./modules/board.js"
import "./modules/code-block-ex.js"
import "./modules/dash.js"
import "./modules/discussion-save.js"
import "./modules/emoticon.js"
import "./modules/exlg-dialog-board.js"
import "./modules/keyboard-cli.js"
import "./modules/malicious-code-identifier.js"
import "./modules/misc.js"
import "./modules/original-difficulty.js"
import "./modules/rand-problem-ex.js"
import "./modules/rand-training-problem.js"
import "./modules/sponsor.js"
import "./modules/springboard.js"
import "./modules/tasklist-ex.js"
import "./modules/update.js"
import "./modules/user-comment.js"
import "./modules/user-intro-ins.js"
import "./modules/user-problem-color.js"
import "./modules/virtual-participation.js"
import "./modules/blog.js"

import "./load.js"
import { $, log } from "./utils.js"
import mod from "./core.js"

mod.preload()
$(() => {
    log("Launching")
    mod.execute()
})