const fs = require("fs");
const path = require("path");
const fg = require("fast-glob");
const { extractClassNames } = require("./purge.js");
const { ensureFullFramework, generateManifest } = require("./index.js");
const { DEFAULT_EXTENSIONS } = require("./constants.js");

function getConfigPath() {
  return path.join(process.cwd(), "emily.config.json");
}

function getConfig() {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    console.error('\n  emily-css: No config found. Run "emily-css init" first.\n');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function getFullCssPath(config) {
  return path.join(process.cwd(), config.output?.fullCss || "dist/emily.css");
}

function getManifestSettings(config) {
  const manifestConfig = config.manifest;

  if (manifestConfig === true) {
    return { enabled: true, output: "dist/emily.manifest.json" };
  }

  if (manifestConfig && typeof manifestConfig === "object") {
    return {
      enabled: manifestConfig.enabled === true,
      output: manifestConfig.output || "dist/emily.manifest.json",
    };
  }

  return { enabled: false, output: "dist/emily.manifest.json" };
}

function getManifestOutputPath(config) {
  const manifestSettings = getManifestSettings(config);
  const outputPath = manifestSettings.output || "dist/emily.manifest.json";

  return path.isAbsolute(outputPath)
    ? outputPath
    : path.join(process.cwd(), outputPath);
}

function normaliseClassForManifest(className) {
  if (!className || typeof className !== "string") {
    return { original: className, baseClass: "", variants: [], variant: null };
  }

  const parts = className.split(":").filter(Boolean);

  if (parts.length <= 1) {
    return {
      original: className,
      baseClass: className,
      variants: [],
      variant: null,
    };
  }

  const baseClass = parts[parts.length - 1];
  const variants = parts.slice(0, -1);

  return {
    original: className,
    baseClass,
    variants,
    variant: variants.join(":"),
  };
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

function findClosest(target, candidates) {
  if (!target || candidates.length === 0) return null;

  let best = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const distance = levenshtein(target, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
      if (distance === 0) break;
    }
  }

  const threshold = Math.max(2, Math.floor(target.length / 3));
  return bestDistance <= threshold ? best : null;
}

function suggestClassName(className, utilitySet, variantSet) {
  const utilityList = Array.isArray(utilitySet) ? utilitySet : Array.from(utilitySet);
  const variantList = Array.isArray(variantSet) ? variantSet : Array.from(variantSet);
  const parsed = normaliseClassForManifest(className);

  if (!parsed.variants.length) {
    return findClosest(parsed.baseClass, utilityList);
  }

  const correctedVariants = parsed.variants.map((variant) => {
    if (variantSet.has(variant)) return variant;
    return findClosest(variant, variantList) || variant;
  });

  const correctedBase = utilitySet.has(parsed.baseClass)
    ? parsed.baseClass
    : findClosest(parsed.baseClass, utilityList);

  if (!correctedBase) return null;

  const rebuilt = correctedVariants.length
    ? `${correctedVariants.join(":")}:${correctedBase}`
    : correctedBase;

  return rebuilt === className ? null : rebuilt;
}

function getFilesToScan(config) {
  const extensions = config?.purge?.extensions || DEFAULT_EXTENSIONS;
  const ignore = config?.purge?.ignore || [];

  if (config?.purge?.sourceGlobs && config.purge.sourceGlobs.length > 0) {
    return fg.sync(config.purge.sourceGlobs, {
      ignore,
      onlyFiles: true,
      unique: true,
    });
  }

  const sourceDir = config?.purge?.sourceDir || ".";
  const scanDir = path.isAbsolute(sourceDir)
    ? sourceDir
    : path.join(process.cwd(), sourceDir);
  const patterns = extensions.map((ext) => `**/*${ext}`);

  return fg.sync(patterns, {
    cwd: scanDir,
    ignore,
    onlyFiles: true,
    unique: true,
    absolute: true,
  });
}

function loadManifest(config, css) {
  const manifestSettings = getManifestSettings(config);
  const manifestOutputPath = getManifestOutputPath(config);

  if (manifestSettings.enabled && fs.existsSync(manifestOutputPath)) {
    return JSON.parse(fs.readFileSync(manifestOutputPath, "utf8"));
  }

  return generateManifest(css, config);
}

function doctor() {
  const config = getConfig();

  ensureFullFramework();

  const fullCssPath = getFullCssPath(config);
  if (!fs.existsSync(fullCssPath)) {
    console.error("\nEmilyCSS doctor could not locate generated CSS.\n");
    return { ok: false, issues: [], exitCode: 1 };
  }

  const css = fs.readFileSync(fullCssPath, "utf8");
  const manifest = loadManifest(config, css);
  const utilities = manifest.utilities || [];
  const utilitySet = new Set(utilities.map((utility) => utility.class));
  const variantSet = new Set();

  utilities.forEach((utility) => {
    (utility.variants || []).forEach((variant) => variantSet.add(variant));
  });

  const files = getFilesToScan(config);
  const issues = [];
  const suggestionCache = new Map();

  files.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const classes = extractClassNames(content);

      classes.forEach((className) => {
        const parsed = normaliseClassForManifest(className);
        const unknownVariants = parsed.variants.filter((variant) => !variantSet.has(variant));
        const knownBase = utilitySet.has(parsed.baseClass);

        if (unknownVariants.length === 0 && knownBase) {
          return;
        }

        if (!suggestionCache.has(className)) {
          suggestionCache.set(className, suggestClassName(className, utilitySet, variantSet));
        }

        issues.push({
          file: filePath,
          className,
          reason: unknownVariants.length > 0 ? "unknown-variant" : "unknown-class",
          unknownVariants,
          suggestion: suggestionCache.get(className),
        });
      });
    } catch (error) {
      // Keep parity with purge behaviour: unreadable files are skipped.
    }
  });

  if (issues.length === 0) {
    console.log("✓ EmilyCSS doctor found no class issues");
    return { ok: true, issues: [], exitCode: 0 };
  }

  console.log(`EmilyCSS doctor found ${issues.length} issue${issues.length === 1 ? "" : "s"}\n`);

  issues.forEach((issue) => {
    console.log(path.relative(process.cwd(), issue.file));
    if (issue.reason === "unknown-variant") {
      console.log(`  Unknown variant in class: ${issue.className}`);
    } else {
      console.log(`  Unknown class: ${issue.className}`);
    }
    if (issue.suggestion) {
      console.log(`  Did you mean: ${issue.suggestion}?`);
    }
    console.log("");
  });

  console.log("Run `emily-css build` after fixing classes.");
  return { ok: false, issues, exitCode: 1 };
}

module.exports = {
  doctor,
  normaliseClassForManifest,
  suggestClassName,
};
