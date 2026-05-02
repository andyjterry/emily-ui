const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const chalk = require('chalk');
const { buildFullFramework, buildProductionCss, ensureFullFramework } = require('./index.js');
const { getAllFiles, extractClassNames } = require('./purge.js');

let isRunning = false;
let pendingRun = false;
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

function shouldIgnore(filePath) {
  const normalised = filePath.replace(/\\/g, '/');

  return [
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
  ].some(part => normalised.includes('/' + part) || normalised.startsWith(part));
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

function collectUsedClasses(sourceDir, config) {
  const files = getAllFiles(sourceDir, config.purge?.extensions);
  const usedClasses = new Set();

  for (const file of files) {
    if (shouldIgnore(file)) continue;

    try {
      const content = fs.readFileSync(file, 'utf8');
      extractClassNames(content).forEach(cls => usedClasses.add(cls));
    } catch {}
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
  const extra = classes.length > 8 ? ' +' + (classes.length - 8) + ' more' : '';

  return shown + extra;
}

function printSummary({ currentClasses, result, added, removed }) {
  const reduction = (((result.originalSize - result.outputSize) / result.originalSize) * 100).toFixed(1);
  const sizeKb = (result.outputSize / 1024).toFixed(1);
  const time = new Date().toLocaleTimeString();

  console.log(
    chalk.green('✓ ' + time + ' updated') +
    chalk.gray(' | ' + currentClasses.size + ' classes | ' + sizeKb + ' KB | ' + reduction + '% reduced')
  );

  if (!hasRunOnce) return;

  if (removed.length > 0) {
    console.log(chalk.red('− removed ' + removed.length + ' class' + (removed.length === 1 ? '' : 'es')) + chalk.gray(' (' + formatClassList(removed) + ')'));
  }

  if (added.length > 0) {
    console.log(chalk.green('+ added ' + added.length + ' class' + (added.length === 1 ? '' : 'es')) + chalk.gray(' (' + formatClassList(added) + ')'));
  }
}

function runProductionUpdate(filePath) {
  if (isRunning) {
    pendingRun = true;
    return;
  }

  isRunning = true;

  try {
    const config = readConfig();
    const sourceDir = config.purge?.sourceDir || '.';
    const isConfigChange = filePath && filePath.replace(/\\/g, '/').endsWith('emily.config.json');
    const cssPath = path.join(process.cwd(), 'dist/emily.css');

 if (isConfigChange) {
  runQuietly(() => buildFullFramework());
} else {
  runQuietly(() => ensureFullFramework());
}

    const result = runQuietly(() => buildProductionCss());
    const currentClasses = collectUsedClasses(sourceDir, config);
    const { added, removed } = getClassDiff(currentClasses);

    printSummary({ currentClasses, result, added, removed });

    hasRunOnce = true;
  } catch (error) {
    console.error('\n❌ EmilyUI watch failed');
    console.error(error.message);
  } finally {
    isRunning = false;

    if (pendingRun) {
      pendingRun = false;
      runProductionUpdate();
    }
  }
}

function getWatchPaths(config) {
  return [
    config.purge?.sourceDir || '.',
    'emily.config.json'
  ];
}

function queueUpdate(filePath) {
  if (filePath && shouldIgnore(filePath)) return;
  runProductionUpdate(filePath);
}

function runWatch() {
  const config = readConfig();
  const watchPaths = getWatchPaths(config);

  console.log('\n👀 EmilyUI is watching...');
  console.log(chalk.gray('   Watching:'));
  watchPaths.forEach(item => console.log(chalk.gray('   - ' + item)));

  runQuietly(() => ensureFullFramework());
  runProductionUpdate();

  const watcher = chokidar.watch(watchPaths, {
    ignored: shouldIgnore,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100
    }
  });

  watcher.on('change', queueUpdate);
  watcher.on('add', queueUpdate);
  watcher.on('unlink', queueUpdate);

  watcher.on('error', error => {
    console.error('\n❌ EmilyUI watcher error');
    console.error(error.message);
  });
}

runWatch();
