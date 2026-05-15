const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
const chalk = require("chalk");
const fg = require("fast-glob");
const {
  DEFAULT_PURGE_IGNORE,
  DEFAULT_EXTENSIONS,
} = require("./constants.js");

const {
  buildFullFramework,
  buildProductionCss,
  ensureFullFramework,
} = require("./index.js");

const { extractClassNames } = require("./purge.js");

let isRunning = false;
let pendingRun = false;
let previousClasses = new Set();
let hasRunOnce = false;
let activeIgnoreList = DEFAULT_PURGE_IGNORE;

function readConfig() {
  const configPath = path.join(process.cwd(), "emily.config.json");

  if (!fs.existsSync(configPath)) {
    console.error(
      '\n  emily-css: No config found. Run "emily-css init" first.\n',
    );
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function normalisePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function normaliseIgnoreEntry(entry) {
  return normalisePath(String(entry || ""))
    .replace(/^\.\/+/, "")
    .replace(/^\/+|\/+$/g, "");
}

function shouldIgnore(filePath, ignoreList = DEFAULT_PURGE_IGNORE) {
  if (!filePath) return false;

  const normalised = normalisePath(filePath);
  const normalisedIgnoreList = (Array.isArray(ignoreList) ? ignoreList : DEFAULT_PURGE_IGNORE)
    .map(normaliseIgnoreEntry)
    .filter(Boolean);

  return normalisedIgnoreList.some(
    (entry) =>
      normalised === entry ||
      normalised.startsWith(entry + "/") ||
      normalised.includes("/" + entry + "/") ||
      normalised.endsWith("/" + entry),
  );
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

function getScanFiles(config) {
  const sourceGlobs = config.purge?.sourceGlobs;

  if (sourceGlobs && sourceGlobs.length) {
    return fg.sync(sourceGlobs, {
      ignore: config.purge?.ignore || [],
      onlyFiles: true,
      unique: true,
    });
  }

  const sourceDir = config.purge?.sourceDir || ".";
  const extensions = config.purge?.extensions || DEFAULT_EXTENSIONS;

  return fg.sync(
    extensions.map((ext) => `${sourceDir.replace(/\/$/, "")}/**/*${ext}`),
    {
      ignore: config.purge?.ignore || [],
      onlyFiles: true,
      unique: true,
    },
  );
}

function collectUsedClasses(config) {
  const files = getScanFiles(config);
  const usedClasses = new Set();
  const ignoreList = config.purge?.ignore || DEFAULT_PURGE_IGNORE;

  for (const file of files) {
    if (shouldIgnore(file, ignoreList)) continue;

    try {
      const content = fs.readFileSync(file, "utf8");
      extractClassNames(content).forEach((cls) => usedClasses.add(cls));
    } catch {}
  }

  return usedClasses;
}

function getClassDiff(currentClasses) {
  const added = [...currentClasses].filter((cls) => !previousClasses.has(cls));
  const removed = [...previousClasses].filter(
    (cls) => !currentClasses.has(cls),
  );

  previousClasses = new Set(currentClasses);

  return { added, removed };
}

function formatClassList(classes) {
  if (classes.length === 0) return "";

  const shown = classes.slice(0, 8).join(", ");
  const extra = classes.length > 8 ? " +" + (classes.length - 8) + " more" : "";

  return shown + extra;
}

function printSummary({ currentClasses, result, added, removed }) {
  const reduction =
    currentClasses.size === 0
      ? "100.0"
      : (
          ((result.originalSize - result.outputSize) / result.originalSize) *
          100
        ).toFixed(1);

  const sizeKb =
    currentClasses.size === 0 ? "0.0" : (result.outputSize / 1024).toFixed(1);

  const outputPath = result.outputPath
    ? path.relative(process.cwd(), result.outputPath)
    : "emily.min.css";

  const time = new Date().toLocaleTimeString();

  if (hasRunOnce && removed.length > 0) {
    console.log(
      chalk.red(
        "− removed " +
          removed.length +
          " class" +
          (removed.length === 1 ? "" : "es"),
      ) + chalk.gray(" (" + formatClassList(removed) + ")"),
    );
  }

  if (hasRunOnce && added.length > 0) {
    console.log(
      chalk.green(
        "+ added " + added.length + " class" + (added.length === 1 ? "" : "es"),
      ) + chalk.gray(" (" + formatClassList(added) + ")"),
    );
  }

  console.log(
    chalk.green("✓ " + time + " updated") +
      chalk.gray(
        " | " +
          currentClasses.size +
          " classes | " +
          sizeKb +
          " KB | " +
          reduction +
          "% reduced | " +
          outputPath,
      ),
  );
}

function runProductionUpdate(filePath) {
  if (isRunning) {
    pendingRun = true;
    return;
  }

  isRunning = true;

  try {
    const config = readConfig();
    activeIgnoreList = config.purge?.ignore || DEFAULT_PURGE_IGNORE;
    const normalisedFilePath = filePath ? normalisePath(filePath) : "";
    const isConfigChange = normalisedFilePath.endsWith("emily.config.json");

    if (isConfigChange) {
      runQuietly(() => buildFullFramework());
    } else {
      runQuietly(() => ensureFullFramework());
    }

    const result = runQuietly(() => buildProductionCss());
    const currentClasses = collectUsedClasses(config);
    const { added, removed } = getClassDiff(currentClasses);

    printSummary({ currentClasses, result, added, removed });

    hasRunOnce = true;
  } catch (error) {
    console.error("\n❌ EmilyUI watch failed");
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
  return [config.purge?.sourceDir || ".", "emily.config.json"];
}

function queueUpdate(filePath) {
  if (filePath && shouldIgnore(filePath, activeIgnoreList)) return;
  runProductionUpdate(filePath);
}

function runWatch() {
  const config = readConfig();
  activeIgnoreList = config.purge?.ignore || DEFAULT_PURGE_IGNORE;
  const watchPaths = getWatchPaths(config);

  console.log("");
  console.log(chalk.cyan("👀 EmilyUI is watching..."));
  console.log(
    chalk.gray("   Project: " + (config.purge?.projectType || "Unknown")),
  );
  console.log(
    chalk.gray("   Output:  " + (config.output?.css || "dist/emily.min.css")),
  );
  console.log(chalk.gray("   Watching:"));

  watchPaths.forEach((item) => {
    console.log(chalk.gray("   - " + item));
  });

  runQuietly(() => ensureFullFramework());
  runProductionUpdate();

  const watcher = chokidar.watch(watchPaths, {
    ignored: (filePath) => shouldIgnore(filePath, activeIgnoreList),
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,
      pollInterval: 100,
    },
  });

  watcher.on("change", queueUpdate);
  watcher.on("add", queueUpdate);
  watcher.on("unlink", queueUpdate);

  watcher.on("error", (error) => {
    console.error("\n❌ EmilyUI watcher error");
    console.error(error.message);
  });
}

runWatch();
