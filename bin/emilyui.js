#!/usr/bin/env node

const command = process.argv[2];

if (command === "init") {
  require("../src/init.js");
} else if (command === "build") {
  require("../src/index.js");
} else {
  console.log(`
emily-ui — Config-driven CSS framework generator

Usage:
  emily-ui init     Set up a new project
  emily-ui build    Generate emily.css from your existing config
`);
}