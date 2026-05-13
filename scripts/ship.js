#!/usr/bin/env node
'use strict'

const { spawnSync } = require('child_process')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs')

const ROOT = path.join(__dirname, '..')
const GIT_LOCK_PATH = path.join(ROOT, '.git', 'index.lock')

console.log(chalk.bold('\n  emilyCSS ship\n'))

// Pre-flight check: Ensure Git is not locked
if (fs.existsSync(GIT_LOCK_PATH)) {
  console.log(chalk.red.bold('  ⚠ Git index is locked.'))
  console.log(chalk.dim('  Another git process is running or a previous one crashed.'))
  console.log(chalk.yellow(`  Run: rm .git/index.lock`))
  console.log()
  process.exit(1)
}

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