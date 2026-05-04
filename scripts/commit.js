#!/usr/bin/env node
'use strict'

const { execSync } = require('child_process')
const { prompt } = require('enquirer')
const chalk = require('chalk')

async function main() {
  // Show what's staged / unstaged
  const status = execSync('git status --short', { cwd: process.cwd() }).toString().trim()
  if (!status) {
    console.log(chalk.yellow('\n  Nothing to commit.\n'))
    process.exit(0)
  }

  console.log(chalk.bold('\n  emilyCSS commit\n'))
  console.log(chalk.dim('  Changed files:'))
  status.split('\n').forEach(line => console.log(chalk.dim(`    ${line}`)))
  console.log()

  // Stage everything or let git handle it
  const { stageAll } = await prompt({
    type: 'confirm',
    name: 'stageAll',
    message: 'Stage all changes? (git add -A)',
    initial: true,
  })

  if (stageAll) {
    execSync('git add -A', { cwd: process.cwd() })
  }

  // Commit type
  const { type } = await prompt({
    type: 'select',
    name: 'type',
    message: 'Commit type',
    choices: [
      { name: 'feat',     message: `feat      ${chalk.dim('— new feature or capability')}` },
      { name: 'fix',      message: `fix       ${chalk.dim('— bug fix')}` },
      { name: 'chore',    message: `chore     ${chalk.dim('— maintenance, deps, config')}` },
      { name: 'refactor', message: `refactor  ${chalk.dim('— restructure without behaviour change')}` },
      { name: 'docs',     message: `docs      ${chalk.dim('— documentation only')}` },
      { name: 'test',     message: `test      ${chalk.dim('— tests only')}` },
      { name: 'perf',     message: `perf      ${chalk.dim('— performance improvement')}` },
    ]
  })

  // Optional scope
  const { scope } = await prompt({
    type: 'input',
    name: 'scope',
    message: 'Scope (optional, e.g. purge / colours / watch)',
    initial: '',
  })

  // Breaking change?
  const { breaking } = await prompt({
    type: 'confirm',
    name: 'breaking',
    message: 'Breaking change?',
    initial: false,
  })

  // Commit message
  const { message } = await prompt({
    type: 'input',
    name: 'message',
    message: 'Commit message',
    validate: v => v.trim().length > 0 || 'Message is required',
  })

  // Build the full commit string
  const scopePart = scope.trim() ? `(${scope.trim()})` : ''
  const bangPart = breaking ? '!' : ''
  const fullMessage = `${type}${scopePart}${bangPart}: ${message.trim()}`

  console.log(chalk.dim(`\n  → ${fullMessage}\n`))

  const { confirm } = await prompt({
    type: 'confirm',
    name: 'confirm',
    message: 'Commit?',
    initial: true,
  })

  if (!confirm) {
    console.log(chalk.dim('\n  Aborted.\n'))
    process.exit(0)
  }

  execSync(`git commit -m "${fullMessage}"`, { cwd: process.cwd(), stdio: 'inherit' })

  console.log(chalk.green('\n  ✓ Committed'))
  console.log(chalk.dim('  Push manually when ready: git push\n'))
}

main().catch(err => {
  console.error(chalk.red('\n  Error:'), err.message)
  process.exit(1)
})
