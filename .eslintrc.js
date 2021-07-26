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
    "no-multiple-empty-lines": [ 2, { max: 2, maxEOF: 1, maxBOF: 0 } ],

    "no-multi-spaces": 0,
    "no-trailing-spaces": 2,
    "key-spacing": 0,
    "space-before-function-paren": 0,
    "space-unary-ops": [ 2, { words: true, nonwords: true } ],

    "camelcase": 0,
    "spaced-comment": 2,
    "semi": [ 2, "never" ],
    "quotes": [ 2, "double", { allowTemplateLiterals: true } ],
    "quote-props": [ 2, "consistent-as-needed" ],
    "comma-dangle": 0,
    "no-sequences": 0,

    "no-var": 2,
    "one-var": 0,
    "no-unused-vars": [ 2, { varsIgnorePattern: "^_" } ],

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

