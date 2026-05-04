#!/usr/bin/env node
'use strict'

const { execSync } = require('child_process')
const { prompt } = require('enquirer')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const CHANGELOG_PATH = path.join(ROOT, '../emilyui-site/data/changelog.ts')
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

  // Write to changelog.ts if it exists
  const changelogExists = fs.existsSync(CHANGELOG_PATH)
  if (changelogExists) {
    const entry = buildEntry(newVersion, bumpType, title, parsed)
    prependToChangelog(CHANGELOG_PATH, entry)
    console.log(chalk.green(`  ✓ changelog.ts updated`))
  } else {
    console.log(chalk.yellow(`  ⚠ changelog.ts not found at expected path — skipping`))
    console.log(chalk.dim(`    Expected: ${CHANGELOG_PATH}`))
  }

  // Git commit + tag
  try {
    execSync(`git add "${PACKAGE_PATH}"`, { cwd: ROOT })
    if (changelogExists) {
      execSync(`git add "${CHANGELOG_PATH}"`, { cwd: ROOT })
    }
    execSync(`git commit -m "chore: release v${newVersion}"`, { cwd: ROOT, stdio: 'inherit' })
    execSync(`git tag v${newVersion}`, { cwd: ROOT })
    console.log(chalk.green(`  ✓ Committed and tagged v${newVersion}`))
  } catch (err) {
    console.log(chalk.yellow(`  ⚠ Git commit/tag failed — do it manually`))
    console.log(chalk.dim(`    git commit -m "chore: release v${newVersion}" && git tag v${newVersion}`))
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

function buildEntry(version, type, title, { added, fixed, changed, breaking }) {
  const lines = ['  {']
  lines.push(`    version: 'v${version}',`)
  lines.push(`    date: '${monthYear()}',`)
  lines.push(`    title: ${JSON.stringify(title)},`)
  lines.push(`    type: '${type}',`)

  if (added.length) {
    lines.push(`    added: [`)
    added.forEach(i => lines.push(`      ${JSON.stringify(i)},`))
    lines.push(`    ],`)
  }
  if (fixed.length) {
    lines.push(`    fixed: [`)
    fixed.forEach(i => lines.push(`      ${JSON.stringify(i)},`))
    lines.push(`    ],`)
  }
  if (changed.length) {
    lines.push(`    changed: [`)
    changed.forEach(i => lines.push(`      ${JSON.stringify(i)},`))
    lines.push(`    ],`)
  }
  if (breaking.length) {
    lines.push(`    breaking: [`)
    breaking.forEach(i => lines.push(`      ${JSON.stringify(i)},`))
    lines.push(`    ],`)
  }

  lines.push(`  },`)
  return lines.join('\n')
}

function prependToChangelog(filePath, entry) {
  let content = fs.readFileSync(filePath, 'utf8')
  const marker = 'export const changelog: ChangelogEntry[] = ['
  const idx = content.indexOf(marker)
  if (idx === -1) {
    throw new Error('Could not find changelog array in changelog.ts — check the file structure')
  }
  const insertAt = idx + marker.length
  content = content.slice(0, insertAt) + '\n' + entry + '\n' + content.slice(insertAt)
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
