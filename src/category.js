import { log } from "./utils.js";

const category = {
    _: new Map(),

    reg: (name, description, alias, icon, unclosable) => {
        category._.set(name, {
            description, alias, icon, unclosable,
        });
    },

    alias: (name) => {
        const c = category._.get(name);
        return c ? c.alias : "";
    },

    register: () => {
        log("Registering categories");
        category.reg("core", "核心", "@", "bug_report", true);
        category.reg("module", "模块", "", "tunes", false);
        category.reg("admin", "管理模块", "!", "build", false);
        category.reg("chore", "定时任务", "^", "alarm", true);
        category.reg("component", "组件", "#", "widgets", true);
    },
};

category.register();
export default category;
