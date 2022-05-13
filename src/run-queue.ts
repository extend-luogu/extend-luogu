class Queue extends Array {
    apply() {
        this.forEach((f) => f());
    }
}
const queues = {
    onload: new Queue(),
    preload: new Queue(),
};

export default queues;
