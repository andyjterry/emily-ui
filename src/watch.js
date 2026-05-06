const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
const chalk = require("chalk");
const fg = require("fast-glob");

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

function readConfig() {
  const configPath = path.join(process.cwd(), "emily.config.json");

  if (!fs.existsSync(configPath)) {
    console.error('\n  emily-css: No config found. Run "emily-css init" first.\n');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function normalisePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function shouldIgnore(filePath) {
  const normalised = normalisePath(filePath);

  return [
    "node_modules/",
    ".git/",
    ".nuxt/",
    ".next/",
    ".output/",
    "dist/",
    "build/",
    "coverage/",
    ".cache/",
    ".vite/",
  ].some((part) => normalised.includes("/" + part) || normalised.startsWith(part));
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
  const extensions = config.purge?.extensions || [
    ".html",
    ".htm",
    ".twig",
    ".njk",
    ".liquid",
    ".hbs",
    ".jsx",
    ".tsx",
    ".vue",
    ".php",
    ".astro",
    ".svelte",
    ".blade.php",
    ".jinja",
    ".jinja2",
    ".j2",
    ".md",
  ];

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

  for (const file of files) {
    if (shouldIgnore(file)) continue;

    try {
      const content = fs.readFileSync(file, "utf8");
      extractClassNames(content).forEach((cls) => usedClasses.add(cls));
    } catch {}
  }

  return usedClasses;
}

function getClassDiff(currentClasses) {
  const added = [...currentClasses].filter((cls) => !previousClasses.has(cls));
  const removed = [...previousClasses].filter((cls) => !currentClasses.has(cls));

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
  const reduction = (
    ((result.originalSize - result.outputSize) / result.originalSize) *
    100
  ).toFixed(1);

  const sizeKb = (result.outputSize / 1024).toFixed(1);
  const outputPath = result.outputPath
    ? path.relative(process.cwd(), result.outputPath)
    : "emily.min.css";

  const time = new Date().toLocaleTimeString();

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

  if (!hasRunOnce) return;

  if (removed.length > 0) {
    console.log(
      chalk.red(
        "− removed " +
          removed.length +
          " class" +
          (removed.length === 1 ? "" : "es"),
      ) + chalk.gray(" (" + formatClassList(removed) + ")"),
    );
  }

  if (added.length > 0) {
    console.log(
      chalk.green(
        "+ added " +
          added.length +
          " class" +
          (added.length === 1 ? "" : "es"),
      ) + chalk.gray(" (" + formatClassList(added) + ")"),
    );
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
  return [
    config.purge?.sourceDir || ".",
    "emily.config.json",
  ];
}

function queueUpdate(filePath) {
  if (filePath && shouldIgnore(filePath)) return;
  runProductionUpdate(filePath);
}

function runWatch() {
  const config = readConfig();
  const watchPaths = getWatchPaths(config);

  console.log("\n👀 EmilyUI is watching...");
console.log(chalk.gray("   Project: " + (config.purge?.projectType || "Unknown")));
console.log(chalk.gray("   Output:  " + (config.output?.css || "dist/emily.min.css")));
console.log(chalk.gray("   Watching:"));

watchPaths.forEach((item) => {
  console.log(chalk.gray("   - " + item));
});

  runQuietly(() => ensureFullFramework());
  runProductionUpdate();

  const watcher = chokidar.watch(watchPaths, {
    ignored: shouldIgnore,
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