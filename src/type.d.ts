declare module "*.svg" {
    const content: any;
    export default content;
}
declare module "*.css" {
    const content: any;
    export default content;
}
declare module "*.txt" {
    const content: any;
    export default content;
}

var filterXSS: typeof import("xss");