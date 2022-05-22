const { defaultTheme } = require("@vuepress/theme-default");
const navbar = require("./configs/navbar.cjs");

module.exports = {
  lang: "zh-CN",
  title: "Exlg 文档",
  description: "Exlg 官方用户和开发文档",
  theme: defaultTheme({
    logo: "/images/logo.svg",
    repo: "extend-luogu/extend-luogu",
    docsDir: "docs",
    navbar,
  }),
};
