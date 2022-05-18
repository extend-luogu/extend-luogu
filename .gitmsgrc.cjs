// prettier-ignore
module.exports = {
    debug: false,
    itemTy: (o) => o.concat("MHDUC".split("")),
    checker: {
        header: (N) => {
            if (/^[a-z]/.test(N)) {
                throw new Error("Header should not start with a lowercase letter");
            }
        },
    },
};
