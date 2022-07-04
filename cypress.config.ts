import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    chromeWebSecurity: false,
    defaultCommandTimeout: 200,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
