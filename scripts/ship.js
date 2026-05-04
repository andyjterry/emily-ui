#!/usr/bin/env node
'use strict'

const { spawnSync } = require('child_process')
const chalk = require('chalk')
const path = require('path')

const ROOT = path.join(__dirname, '..')

console.log(chalk.bold('\n  emilyCSS ship\n'))
console.log(chalk.dim('  This will run commit, then release + publish.'))
console.log(chalk.dim('  Both steps are interactive — work through them in order.\n'))

// Step 1: commit
console.log(chalk.bold('  Step 1 — Commit\n'))
const commitResult = spawnSync('node', [path.join(__dirname, 'commit.js')], {
  stdio: 'inherit',
  cwd: ROOT,
})

if (commitResult.status !== 0) {
  console.log(chalk.yellow('\n  Commit step exited early. Release skipped.\n'))
  process.exit(commitResult.status || 1)
}

// Step 2: release + publish
console.log(chalk.bold('\n  Step 2 — Release + Publish\n'))
const releaseResult = spawnSync('node', [path.join(__dirname, 'release.js')], {
  stdio: 'inherit',
  cwd: ROOT,
})

if (releaseResult.status !== 0) {
  console.log(chalk.yellow('\n  Release step exited with an error.\n'))
  process.exit(releaseResult.status || 1)
}
