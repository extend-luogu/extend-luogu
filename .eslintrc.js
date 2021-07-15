module.exports = {
  env: {
    browser: true,
    es2021: true,
    greasemonkey: true,
    jquery: true
  },
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    "no-tabs": 0,
    "indent": [ 2, 4 ],
    "object-property-newline": 0,
    "no-multiple-empty-lines": [ 1, { max: 2, maxEOF: 1, maxBOF: 0 } ],
   
    "no-multi-spaces": 0,
    "key-spacing": 0,
    "space-before-function-paren": 0,

    "camelcase": 0,
    "spaced-comment": 0,
    "quotes": [ 1, "double", { allowTemplateLiterals: true } ],
    "quote-props": [ 1, "consistent-as-needed" ],
    "comma-dangle": 0,
    "no-sequences": 0,

    "no-var": 2,
    "one-var": 0,
    "no-unused-vars": 1,

    "no-case-declarations": 0,
    "no-fallthrough": 0,

    "array-bracket-spacing": 0,
    "template-curly-spacing": 0,
    "computed-property-spacing": [ 0, "always" ],
    "curly": 0,
    "brace-style": [ 2, "stroustrup", { allowSingleLine: true } ],

    "eqeqeq": [ 2, "always", { null: "ignore" } ],
    "no-mixed-operators": 0,
    "space-unary-ops": 0,
    "operator-linebreak": 0,

    "no-extend-native": 0,
  },
  globals: {
    marked: true,
    filterXSS: true
  }
}

