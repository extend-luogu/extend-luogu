class RunQueue {
    constructor() {
        this.fq = [];
    }

    push(...fn) {
        this.fq = this.fq.concat(fn);
    }

    apply() {
        this.fq.forEach((f) => f());
    }
}
const queues = Object.fromEntries(["onload", "preload"].map((e) => ([e, new RunQueue()])));

export default queues;
