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
} else {
  console.log(`
emily-css - Config-driven CSS framework generator

Usage:
  emily-css init     Set up a new project
  emily-css build    Generate production CSS: dist/emily.min.css
  emily-css watch    Dev mode: rebuild full CSS only when needed
  emily-css purge    Advanced: manually purge unused utilities
`);
}
