#!/usr/bin/env node

const path = require("path");

const command = process.argv[2];
const packageJson = require(path.join(__dirname, "..", "package.json"));

if (command === "init") {
  require("../src/init.js");
} else if (command === "build") {
  const { build } = require("../src/index.js");
  build({ keepFull: process.argv.includes("--keep-full") });
} else if (command === "watch") {
  require("../src/watch.js");
} else if (command === "showcase") {
  require("../src/showcase.js");
} else if (command === "version" || command === "--version" || command === "-v") {
  console.log(packageJson.version);
} else if (command === "help") {
  console.log(`
  emily-css — Config-driven CSS framework generator
  
  Commands:
    emily-css init        Set up a new project (interactive wizard)
    emily-css build       Generate production CSS to the configured output path
    emily-css watch       Dev mode: watch for changes and rebuild
    emily-css showcase    Launch the component showcase in your browser
    emily-css version     Show installed version
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
    emily-css build       Generate production CSS to the configured output path
    emily-css watch       Dev mode: rebuild on changes
    emily-css showcase    Browse components in your browser
    emily-css help        Full command reference

  Run emily-css help for more detail.
`);
}