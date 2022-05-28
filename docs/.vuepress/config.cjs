const { defaultTheme } = require("@vuepress/theme-default");
const { searchPlugin } = require("@vuepress/plugin-search");
const navbar = require("./configs/navbar.cjs");
const sidebar = require("./configs/sidebar.cjs");

module.exports = {
  lang: "zh-CN",
  title: "Exlg 文档",
  description: "Exlg 官方用户和开发文档",
  theme: defaultTheme({
    logo: "/images/logo.svg",
    repo: "extend-luogu/extend-luogu",
    docsDir: "docs",
    navbar,
    sidebar,
  }),
  plugins: [
    searchPlugin({
      locales: {
        "/": {
          placeholder: "搜索文档",
        },
      },
      isSearchable: (page) => page.path !== "/",
      getExtraFields: (page) => page.frontmatter.tags ?? [],
    }),
  ],
};
