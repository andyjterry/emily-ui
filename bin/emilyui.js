#!/usr/bin/env node

const command = process.argv[2];

if (command === "init") {
  require("../src/init.js");
} else if (command === "build") {
  const { build } = require("../src/index.js");
  build();
} else if (command === "purge") {
  require("../src/purge-cmd.js");
} else if (command === "watch") {
  require("../src/watch.js");
} else {
  console.log(`
emily-css - Config-driven CSS framework generator

Usage:
  emily-css init     Set up a new project
  emily-css build    Generate emily.css from your config
  emily-css purge    Remove unused utilities for production
  emily-css watch    Watch files and rebuild CSS during development
`);
}
