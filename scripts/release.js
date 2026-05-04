#!/usr/bin/env node
'use strict'

const { execSync } = require('child_process')
const { prompt } = require('enquirer')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const CHANGELOG_PATH = path.join(ROOT, 'CHANGELOG.md')
const PACKAGE_PATH = path.join(ROOT, 'package.json')

async function main() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'))
  const currentVersion = pkg.version

  console.log(chalk.bold(`\n  emilyCSS release\n`))
  console.log(chalk.dim(`  Current version: v${currentVersion}`))

  // Get last git tag
  let lastTag = ''
  try {
    lastTag = execSync('git describe --tags --abbrev=0', {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe']
    }).toString().trim()
  } catch {
    // No tags yet — will use full log
  }

  // Get commits since last tag
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD'
  let rawCommits = []
  try {
    const log = execSync(`git log ${range} --pretty=format:"%s"`, { cwd: ROOT })
      .toString().trim()
    rawCommits = log.split('\n').filter(Boolean)
  } catch {
    rawCommits = []
  }

  if (rawCommits.length) {
    console.log(chalk.dim(`\n  Commits since ${lastTag || 'initial'}:`))
    rawCommits.forEach(c => console.log(chalk.dim(`    · ${c}`)))
  } else {
    console.log(chalk.yellow('\n  No commits found since last tag.'))
  }

  console.log()

  // Auto-parse commits into categories
  const parsed = parseCommits(rawCommits)

  // Version bump type
  const { bumpType } = await prompt({
    type: 'select',
    name: 'bumpType',
    message: 'Version bump',
    choices: [
      { name: 'patch', message: `patch   ${chalk.dim(bumpVersion(currentVersion, 'patch'))}` },
      { name: 'minor', message: `minor   ${chalk.dim(bumpVersion(currentVersion, 'minor'))}` },
      { name: 'major', message: `major   ${chalk.dim(bumpVersion(currentVersion, 'major'))}` },
    ]
  })

  const newVersion = bumpVersion(currentVersion, bumpType)

  // Release title
  const defaultTitle = rawCommits.find(c => /^feat/.test(c))?.replace(/^feat(\([^)]+\))?!?:\s*/, '') || ''
  const { title } = await prompt({
    type: 'input',
    name: 'title',
    message: 'Release title',
    initial: defaultTitle,
  })

  // Preview what will be written
  console.log(chalk.bold(`\n  v${newVersion} — ${title}\n`))
  if (parsed.added.length) {
    console.log(chalk.green('  Added'))
    parsed.added.forEach(i => console.log(`    ${chalk.green('+')} ${i}`))
  }
  if (parsed.fixed.length) {
    console.log(chalk.cyan('\n  Fixed'))
    parsed.fixed.forEach(i => console.log(`    ${chalk.cyan('·')} ${i}`))
  }
  if (parsed.changed.length) {
    console.log(chalk.dim('\n  Changed'))
    parsed.changed.forEach(i => console.log(`    ${chalk.dim('~')} ${i}`))
  }
  if (parsed.breaking.length) {
    console.log(chalk.red('\n  Breaking'))
    parsed.breaking.forEach(i => console.log(`    ${chalk.red('!')} ${i}`))
  }
  if (!parsed.added.length && !parsed.fixed.length && !parsed.changed.length) {
    console.log(chalk.dim('  (no categorised commits — you may want to add entries manually)'))
  }

  console.log()

  const { proceed } = await prompt({
    type: 'confirm',
    name: 'proceed',
    message: `Release v${newVersion} and update changelog?`,
    initial: true,
  })

  if (!proceed) {
    console.log(chalk.dim('\n  Aborted.\n'))
    process.exit(0)
  }

  // Bump version in package.json (no git tag yet)
  execSync(`npm version ${bumpType} --no-git-tag-version`, { cwd: ROOT, stdio: 'inherit' })
  console.log(chalk.green(`\n  ✓ package.json → v${newVersion}`))

  // Write CHANGELOG.md in the package root
  const entry = buildMarkdownEntry(newVersion, title, parsed)
  prependToChangelog(CHANGELOG_PATH, entry)
  console.log(chalk.green(`  ✓ CHANGELOG.md updated`))

  // Commit package.json + CHANGELOG.md, then tag
  try {
    execSync(`git add package.json CHANGELOG.md`, { cwd: ROOT })
    execSync(`git commit -m "chore: release v${newVersion}"`, { cwd: ROOT, stdio: 'inherit' })
    execSync(`git tag v${newVersion}`, { cwd: ROOT })
    console.log(chalk.green(`  ✓ Committed and tagged v${newVersion}`))
  } catch (err) {
    console.log(chalk.yellow(`  ⚠ Git commit/tag failed — do it manually`))
    console.log(chalk.dim(`    git add package.json CHANGELOG.md && git commit -m "chore: release v${newVersion}" && git tag v${newVersion}`))
  }

  console.log(chalk.dim(`\n  Push when ready:`))
  console.log(chalk.dim(`    git push && git push --tags\n`))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number)
  if (type === 'major') return `${major + 1}.0.0`
  if (type === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

function parseCommits(commits) {
  const added = [], fixed = [], changed = [], breaking = []

  for (const msg of commits) {
    const isBreaking = /!:/.test(msg) || /breaking change/i.test(msg)

    if (/^feat[(!:]/.test(msg)) {
      const desc = clean(msg, 'feat')
      added.push(desc)
      if (isBreaking) breaking.push(desc)
    } else if (/^fix[(!:]/.test(msg)) {
      const desc = clean(msg, 'fix')
      fixed.push(desc)
      if (isBreaking) breaking.push(desc)
    } else if (/^(chore|refactor|build|ci|perf|style|test)[(!:]/.test(msg)) {
      const desc = clean(msg, '[a-z]+')
      // Skip version bump commits
      if (!/^(release|bump|v?\d+\.\d+)/i.test(desc) && desc.length > 3) {
        changed.push(desc)
      }
    }
    // docs: commits deliberately excluded — not useful to end users
  }

  return { added, fixed, changed, breaking }
}

function clean(msg, prefix) {
  return msg.replace(new RegExp(`^${prefix}(\\([^)]+\\))?!?:\\s*`), '').trim()
}

function buildMarkdownEntry(version, title, { added, fixed, changed, breaking }) {
  const lines = []
  lines.push(`## v${version} — ${monthYear()}`)
  lines.push(``)
  lines.push(`**${title}**`)
  lines.push(``)

  if (breaking.length) {
    lines.push(`### Breaking changes`)
    breaking.forEach(i => lines.push(`- ${i}`))
    lines.push(``)
  }
  if (added.length) {
    lines.push(`### Added`)
    added.forEach(i => lines.push(`- ${i}`))
    lines.push(``)
  }
  if (fixed.length) {
    lines.push(`### Fixed`)
    fixed.forEach(i => lines.push(`- ${i}`))
    lines.push(``)
  }
  if (changed.length) {
    lines.push(`### Changed`)
    changed.forEach(i => lines.push(`- ${i}`))
    lines.push(``)
  }

  lines.push(`---`)
  lines.push(``)
  return lines.join('\n')
}

function prependToChangelog(filePath, entry) {
  const header = `# Changelog\n\nAll notable changes to \`emily-css\` are documented here.\n\n---\n\n`
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, header + entry, 'utf8')
    return
  }
  let content = fs.readFileSync(filePath, 'utf8')
  // Insert after the header block (first --- separator)
  const marker = '---\n\n'
  const idx = content.indexOf(marker)
  if (idx !== -1) {
    content = content.slice(0, idx + marker.length) + entry + content.slice(idx + marker.length)
  } else {
    content = header + entry + content
  }
  fs.writeFileSync(filePath, content, 'utf8')
}

function monthYear() {
  return new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })
}

// ─────────────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error(chalk.red('\n  Error:'), err.message)
  process.exit(1)
})
