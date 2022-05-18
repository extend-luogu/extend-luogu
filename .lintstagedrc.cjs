const prettier = "prettier --write";
const eslint = "eslint --fix";
const markdownlint = "markdownlint-cli2-fix";

module.exports = {
  "*.{js,mjs,cjs}": [prettier, eslint],
  "*.{yml,yaml,json}": [prettier],
  "*.md": [prettier, markdownlint],
};
