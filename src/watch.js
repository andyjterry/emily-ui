const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const chalk = require('chalk');
const { build } = require('./index.js');
const { purgeCSS, getAllFiles, extractClassNames } = require('./purge.js');

let isRunning = false;
let pendingRun = false;
let debounceTimer = null;
let previousClasses = new Set();
let hasRunOnce = false;

function readConfig() {
  const configPath = path.join(process.cwd(), 'emily.config.json');

  if (!fs.existsSync(configPath)) {
    console.error('\n  emily-css: No config found. Run "emily-css init" first.\n');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function minify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s?\{/g, '{')
    .replace(/\s?\}/g, '}')
    .replace(/;\s/g, ';')
    .trim();
}

function runQuietly(fn) {
  const originalLog = console.log;
  const originalWarn = console.warn;

  console.log = () => {};
  console.warn = () => {};

  try {
    return fn();
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
  }
}

function shouldIgnore(filePath) {
  const normalised = filePath.replace(/\\/g, '/');

  const ignoredParts = [
    'node_modules/',
    '.git/',
    '.nuxt/',
    '.next/',
    '.output/',
    'dist/',
    'build/',
    'coverage/',
    '.cache/',
    '.vite/'
  ];

  return ignoredParts.some(part =>
    normalised.includes(`/${part}`) || normalised.startsWith(part)
  );
}

function collectUsedClasses(sourceDir, config) {
  const extensions = config?.purge?.extensions || [
    '.html',
    '.htm',
    '.twig',
    '.njk',
    '.liquid',
    '.hbs',
    '.jsx',
    '.tsx',
    '.vue',
    '.php',
    '.astro',
    '.svelte',
    '.blade.php',
    '.jinja',
    '.jinja2',
    '.j2',
    '.md'
  ];

  const files = getAllFiles(sourceDir, extensions);
  const usedClasses = new Set();

  for (const file of files) {
    if (shouldIgnore(file)) continue;

    try {
      const content = fs.readFileSync(file, 'utf8');
      const classes = extractClassNames(content);
      classes.forEach(cls => usedClasses.add(cls));
    } catch {
      // Ignore unreadable files in watch mode.
    }
  }

  return usedClasses;
}

function getClassDiff(currentClasses) {
  const added = [...currentClasses].filter(cls => !previousClasses.has(cls));
  const removed = [...previousClasses].filter(cls => !currentClasses.has(cls));

  previousClasses = new Set(currentClasses);

  return { added, removed };
}

function formatClassList(classes) {
  if (classes.length === 0) return '';

  const shown = classes.slice(0, 8).join(', ');
  const extra = classes.length > 8 ? ` +${classes.length - 8} more` : '';

  return `${shown}${extra}`;
}

function printSummary({ currentClasses, css, purged, added, removed }) {
  const originalSize = Buffer.byteLength(css, 'utf8');
  const purgedSize = Buffer.byteLength(purged, 'utf8');
  const reduction = (((originalSize - purgedSize) / originalSize) * 100).toFixed(1);
  const sizeKb = (purgedSize / 1024).toFixed(1);
  const time = new Date().toLocaleTimeString();

  console.log(
    chalk.green(`✓ ${time} updated`) +
    chalk.gray(` | ${currentClasses.size} classes | ${sizeKb} KB | ${reduction}% reduced`)
  );

  if (!hasRunOnce) return;

  if (removed.length > 0) {
    console.log(
      chalk.red(`− removed ${removed.length} class${removed.length === 1 ? '' : 'es'}`) +
      chalk.gray(` (${formatClassList(removed)})`)
    );
  }

  if (added.length > 0) {
    console.log(
      chalk.green(`+ added ${added.length} class${added.length === 1 ? '' : 'es'}`) +
      chalk.gray(` (${formatClassList(added)})`)
    );
  }
}

function runBuildAndPurge() {
  if (isRunning) {
    pendingRun = true;
    return;
  }

  isRunning = true;

  try {
    const config = readConfig();
    const sourceDir = config.purge?.sourceDir || '.';

    runQuietly(() => build());

    const cssPath = path.join(process.cwd(), 'dist/emily.css');

    if (!fs.existsSync(cssPath)) {
      console.error('\n  emily-css: No CSS found after build.\n');
      return;
    }

    const css = fs.readFileSync(cssPath, 'utf8');
    const purged = runQuietly(() => purgeCSS(css, sourceDir, config));
    const minified = minify(purged);

    fs.writeFileSync(path.join(process.cwd(), 'dist/emily.purged.css'), purged);
    fs.writeFileSync(path.join(process.cwd(), 'dist/emily.purged.min.css'), minified);

    const currentClasses = collectUsedClasses(sourceDir, config);
    const { added, removed } = getClassDiff(currentClasses);

    printSummary({
      currentClasses,
      css,
      purged,
      added,
      removed
    });

    hasRunOnce = true;
  } catch (error) {
    console.error('\n❌ EmilyUI watch failed');
    console.error(error.message);
  } finally {
    isRunning = false;

    if (pendingRun) {
      pendingRun = false;
      queueBuildAndPurge();
    }
  }
}

function queueBuildAndPurge(filePath) {
  if (filePath && shouldIgnore(filePath)) {
    return;
  }

  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    runBuildAndPurge();
  }, 500);
}

function getWatchPaths(config) {
  const purge = config.purge || {};

  return [
    purge.sourceDir || '.',
    'emily.config.json'
  ];
}

function runWatch() {
  const config = readConfig();
  const watchPaths = getWatchPaths(config);

  console.log('\n👀 EmilyUI is watching...');
  console.log(chalk.gray('   Watching:'));
  watchPaths.forEach(item => console.log(chalk.gray(`   - ${item}`)));

  runBuildAndPurge();

  const watcher = chokidar.watch(watchPaths, {
    ignored: shouldIgnore,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });

  watcher.on('change', queueBuildAndPurge);
  watcher.on('add', queueBuildAndPurge);
  watcher.on('unlink', queueBuildAndPurge);

  watcher.on('error', error => {
    console.error('\n❌ EmilyUI watcher error');
    console.error(error.message);
  });
}

runWatch();