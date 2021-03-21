module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    "standard"
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    "quotes": [ 1, "double", { allowTemplateLiterals: true } ],
    "quote-props": [ 1, "consistent-as-needed" ],
    "array-bracket-spacing": 0,
    "no-tabs": 0,
    "indent": [ 2, 4 ],
    "no-mixed-operators": 0,
    "camelcase": 0,
    "one-var": 0,
    "template-curly-spacing": 0,
    "computed-property-spacing": [ 0, "always" ],
    "curly": 0,
    "space-unary-ops": 0,
    "operator-linebreak": 0,
    "comma-dangle": 0,
    "no-case-declarations": 0,
    "no-unused-vars": 1,
    "no-extend-native": 0,
    "object-property-newline": 0,
    "no-multiple-empty-lines": [ 1, { max: 2, maxEOF: 1, maxBOF: 0 } ],
    "brace-style": [ 2, "stroustrup", { allowSingleLine: true } ],
    "no-fallthrough": 0
  },
  globals: {
    unsafeWindow: true,
    jQuery: true,
    GM_info: true,
    GM_addStyle: true,
    marked: true
  }
}
