#!/usr/bin/env node

const command = process.argv[2];

if (command === "init") {
  require("../src/init.js");
} else if (command === "build") {
  const { build } = require("../src/index.js");
  build({ keepFull: process.argv.includes("--keep-full") });
} else if (command === "purge") {
  require("../src/purge-cmd.js");
} else if (command === "watch") {
  require("../src/watch.js");
} else if (command === "showcase") {
  require("../src/showcase.js");
} else if (command === "help") {
  console.log(`
  emily-css — Config-driven CSS framework generator
  
  Commands:
    emily-css init        Set up a new project (interactive wizard)
    emily-css build       Generate production CSS to dist/emily.min.css
    emily-css watch       Dev mode: watch for config changes and rebuild
    emily-css purge       Scan project files and remove unused utilities
    emily-css showcase    Launch the component showcase in your browser
    emily-css help        Show this help text
  
  npm scripts (added by init):
    npm run emily:build      Same as emily-css build
    npm run emily:watch      Same as emily-css watch
    npm run emily:showcase   Same as emily-css showcase
    npm run emily:help       Same as emily-css help
  
  Docs: https://emilyui.dev
`);
} else {
  console.log(`
  emily-css — Config-driven CSS framework generator

  Usage:
    emily-css init        Set up a new project
    emily-css build       Generate production CSS
    emily-css watch       Dev mode: rebuild on changes
    emily-css purge       Remove unused utilities
    emily-css showcase    Browse components in your browser
    emily-css help        Full command reference

  Run emily-css help for more detail.
`);
}
