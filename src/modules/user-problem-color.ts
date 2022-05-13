import {
    $, lg_dat, lg_usr, lg_content, error,
} from "../utils.js";
import mod from "../core.js";
import { msg } from "../defs.js";
import css from "../resources/css/user-problem-color.css";

/*
const brds = {
    SUBMITTED_PROBLEMS: 0,
    PASSED_PROBLEMS: 1,
};
let last_ptr = -1,
    last_board = brds.SUBMITTED_PROBLEMS,
    cosflag = -1,
    ta = null,
    my = null;
// mod.reg_hook_new("user-problem-color", "题目颜色数量和比较", "@/user/[0-9]{0,}.*", {
    problem_compare: {
        ty: "boolean", strict: true, dft: true, info: ["AC compare", "AC 题目比较"],
    },
}, ({ msto, args }) => {
    if (typeof (args) === "object" && args.message === msg.PRIVATE_INFORMATION) {
        return; // Note: 用户开启完全隐私保护
    }
    const color = [
        [191, 191, 191],
        [254, 76, 97],
        [243, 156, 17],
        [255, 193, 22],
        [82, 196, 26],
        [52, 152, 219],
        [157, 61, 207],
        [14, 29, 105],
    ];
    const colorProblem = async ($prb, _flag) => {
        if (ta === null) {
            const content = await lg_content(`/user/${lg_usr.uid}`);
            ta = lg_dat.passedProblems;
            my = new Set();
            content.currentData.passedProblems.forEach((t, _) => my.add(t.pid));
        }
        let same = 0;
        if (_flag) {
            const ps = $prb[1];
            ps.querySelectorAll("a").forEach((p, d) => {
                if (d < ta.length && my.has(ta[d].pid)) { // Note: d 在某些情况下会达到 ta.length
                    same++;
                    p.style.backgroundColor = "rgba(82, 196, 26, 0.3)";
                }
            });
        }

        $("#exlg-problem-count-1").html(`<span class="exlg-counter" exlg="exlg">${ta.length} <> ${my.size} : ${same}`
            + `<i class="exlg-icon exlg-info" name="ta 的 &lt;&gt; 我的 : 相同"></i></span>`);
    };
    const getRGBColor = (id) => `rgb(${color[id][0]}, ${color[id][1]}, ${color[id][2]})`;
    if (typeof (args) === "object" && args.message === msg.ADD_COMPARE) {
        if ((!msto.problem_compare) || lg_dat.user.uid === lg_usr.uid) return;
        colorProblem([114514, 1919810], false);
        return;
    }
    args.forEach((arg) => {
        if (arg.target.href === "javascript:void 0") return;
        // if (! lg_dat[arg.board_id][arg.position])
        arg.target.style.setProperty("color", getRGBColor([(arg.board_id ? lg_dat.passedProblems : lg_dat.submittedProblems)[arg.position].difficulty]), "important");
        if ((arg.board_id === brds.PASSED_PROBLEMS && arg.position === lg_dat.passedProblems.length - 1)
            || (lg_dat.passedProblems.length === 0 && arg.board_id === brds.SUBMITTED_PROBLEMS && arg.position === lg_dat.submittedProblems.length - 1)) { // Note: 染色染到最后一个
            $(".exlg-counter").remove();
            const gf = arg.target.parentNode.parentNode.parentNode.parentNode;
            const $prb = [gf.firstChild.childNodes[2], gf.lastChild.childNodes[2]];

            for (let i = 0; i < 2; ++i) {
                const $ps = $prb[i];
                const my = lg_dat[["submittedProblems", "passedProblems"][i]];
                $ps.before($(`<span id="exlg-problem-count-${i}" class="exlg-counter" exlg="exlg">${my.length}</span>`)[0]);
            }

            if ((!msto.problem_compare) || lg_dat.user.uid === lg_usr.uid) return;
            colorProblem($prb, true);
        }
    });
}, (e) => {
    if (location.hash !== "#practice") return { result: false, args: { message: msg.NOT_AT_PRACTICE_PAGE } };
    if ((!lg_dat.submittedProblems.length) && !lg_dat.passedProblems.length) {
        if (e.target.className === "card padding-default") {
            if ($(e.target).children(".problems").length) {
                const my = lg_dat[["submittedProblems", "passedProblems"][cosflag]];
                $(e.target.firstChild).after(`<span id="exlg-problem-count-${cosflag}" class="exlg-counter" exlg="exlg" style="margin-left: 5px">${my.length}</span>`);
                if (++cosflag > 1) return { result: true, args: { message: msg.ADD_COMPARE } };
            } else if ($(e.target).children(".difficulty-tags").length) {
                cosflag = 0;
            }
        }
        return { result: false, args: { message: msg.NONE } };
    }
    if (!e.target.tagName) return { result: false, args: { message: msg.COMMENT_TAG } };
    if (e.target.tagName.toLowerCase() !== "a" || e.target.className !== "color-default" || e.target.href.indexOf("/problem/") === -1) return { result: false, args: { message: msg.NOT_A_PROBLEM_ELEMENT } };
    const gpid = (o) => (o ? o.pid : undefined);
    const tar = e.target;
    const _onc = [gpid(lg_dat.submittedProblems[0]), gpid(lg_dat.passedProblems[0])].indexOf(tar.href.slice(33));
    const _onchange = !(_onc === -1);
    if (_onchange) {
        last_board = _onc;
        last_ptr = 0;
    } else {
        last_ptr++;
    }
    return {
        result: true,
        args: [{
            onchange: _onchange,
            board_id: last_board,
            position: last_ptr,
            target: tar,
        }],
    };
}, () => {
    if (typeof lg_dat.submittedProblems === "undefined" || typeof lg_dat.passedProblems === "undefined") {
        // Note: 开启完全隐私保护
        return { message: msg.PRIVATE_INFORMATION };
    }
    if ((!lg_dat.submittedProblems.length) && !lg_dat.passedProblems.length) {
        $(".exlg-counter").remove();
        const $prb = $(".card.padding-default > .problems");
        for (let i = 0; i < 2; ++i) {
            const $ps = $($prb[i]);
            const my = lg_dat[["submittedProblems", "passedProblems"][i]];
            $ps.before(`<span id="exlg-problem-count-${i}" class="exlg-counter" exlg="exlg">${my.length}</span>`);
        }
        return { message: msg.ADD_COMPARE };
    }
    return [];
}, css, "module");
*/

// Note: 先摆了，到时候 UI 之类的也要改
mod.reg_v2({
    name: "user-problem-color",
    info: "题目颜色数量和比较",
    path: "@/user/[0-9]{0,}.*",
    cate: "module",
}, {
    problem_compare: {
        ty: "boolean", strict: true, dft: true, info: ["AC compare", "AC 题目比较"], migration: true,
    },
}, (handler) => {
    const brds = {
        SUBMITTED_PROBLEMS: 0,
        PASSED_PROBLEMS: 1,
    };
    /*
    const color = [
        [191, 191, 191],
        [254, 76, 97],
        [243, 156, 17],
        [255, 193, 22],
        [82, 196, 26],
        [52, 152, 219],
        [157, 61, 207],
        [14, 29, 105],
    ];
    */
    let isPriv;
    let my_loader;

    let last_ptr = -1,
        last_board = brds.SUBMITTED_PROBLEMS,
        cosflag = -1;

    handler.preload({
        name: "compare-problem",
        info: "比较通过的题目",
    }, null, ({ gsto }) => {
        isPriv = (typeof lg_dat.submittedProblems === "undefined" || typeof lg_dat.passedProblems === "undefined");
        if (gsto.problem_compare && !isPriv) {
            my_loader = new Promise((resolve) => {
                lg_content(`/user/${lg_usr.uid}`).then((content) => {
                    resolve(new Set(content.currentData.passedProblems.map(e => e.pid)));
                }).catch((e) => {
                    error(e);
                });
            });
        }
    });

    handler.hook({
        name: "problem-color",
        info: "题目颜色",
    }, null, ({ gsto, args }) => {
        if (isPriv) {
            return; // Note: 用户开启完全隐私保护
        }
        // const getRGBColor = (id) => `rgb(${color[id][0]}, ${color[id][1]}, ${color[id][2]})`;
        args.forEach((arg) => {
            if (arg.target.href === "javascript:void 0") return;
            // if (! lg_dat[arg.board_id][arg.position])
            // arg.target.style.setProperty("color", getRGBColor([(arg.board_id ? lg_dat.passedProblems : lg_dat.submittedProblems)[arg.position].difficulty]), "important");
            arg.target.classList.add(`p${(arg.board_id ? lg_dat.passedProblems : lg_dat.submittedProblems)[arg.position].difficulty}`);
            if ((arg.board_id === brds.PASSED_PROBLEMS && arg.position === lg_dat.passedProblems.length - 1)
                || (lg_dat.passedProblems.length === 0 && arg.board_id === brds.SUBMITTED_PROBLEMS && arg.position === lg_dat.submittedProblems.length - 1)) { // Note: 染色染到最后一个
                $(".exlg-counter").remove();
                const gf = arg.target.parentNode.parentNode.parentNode.parentNode;
                const $prb = [gf.firstChild.childNodes[2], gf.lastChild.childNodes[2]];

                for (let i = 0; i < 2; ++i) {
                    const $ps = $prb[i];
                    const my = lg_dat[["submittedProblems", "passedProblems"][i]];
                    $ps.before($(`<span id="exlg-problem-count-${i}" class="exlg-counter" exlg="exlg">${my.length}</span>`)[0]);
                }

                if ((!gsto.problem_compare) || lg_dat.user.uid === lg_usr.uid) return;
                my_loader.then((my) => {
                    let same = 0;
                    const ps = $prb[1],
                        ta = lg_dat.passedProblems;
                    ps.querySelectorAll("a").forEach((p, d) => {
                        if (d < ta.length && my.has(ta[d].pid)) { // Note: d 在某些情况下会达到 ta.length
                            same++;
                            p.style.backgroundColor = "rgba(82, 196, 26, 0.3)";
                        }
                    });

                    $("#exlg-problem-count-1").html(`<span class="exlg-counter" exlg="exlg">${ta.length} <> ${my.size} : ${same}`
                + `<i class="exlg-icon exlg-info" name="ta 的 &lt;&gt; 我的 : 相同"></i></span>`);
                });
            }
        });
    }, (e) => {
        if (location.hash !== "#practice") return { result: false };
        if ((!lg_dat.submittedProblems.length) && !lg_dat.passedProblems.length) {
            if (e.target.className === "card padding-default") {
                if ($(e.target).children(".problems").length) {
                    const my = lg_dat[["submittedProblems", "passedProblems"][cosflag]];
                    $(e.target.firstChild).after(`<span id="exlg-problem-count-${cosflag}" class="exlg-counter" exlg="exlg" style="margin-left: 5px">${my.length}</span>`);
                    if (++cosflag > 1) return { result: true, args: { message: msg.ADD_COMPARE } };
                } else if ($(e.target).children(".difficulty-tags").length) {
                    cosflag = 0;
                }
            }
            return { result: false, args: { message: msg.NONE } };
        }
        if (e.target.tagName.toLowerCase() !== "a" || e.target.className !== "color-default" || !e.target.pathname.startsWith("/problem/")) return { result: false };
        const tar = e.target,
            _onc = [lg_dat.submittedProblems[0]?.pid, lg_dat.passedProblems[0]?.pid].indexOf(tar.href.slice(33)),
            _onchange = !(_onc === -1);
        if (_onchange) {
            last_board = _onc;
            last_ptr = 0;
        } else {
            last_ptr++;
        }
        return {
            result: true,
            args: [{
                onchange: _onchange,
                board_id: last_board,
                position: last_ptr,
                target: tar,
            }],
        };
    });
}, css);
