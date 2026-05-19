'use strict';

const fs = require("fs");
const path = require("path");
const fg = require("fast-glob");
const { DEFAULT_EXTENSIONS, DEFAULT_PURGE_IGNORE } = require("./constants.js");
const { resolvePurgeConfig } = require("./purgeConfig.js");

function getAllFiles(dir, extensions = DEFAULT_EXTENSIONS) {
  const absoluteDir = path.isAbsolute(dir) ? dir : path.resolve(dir);
  const patterns = extensions.map((ext) => `**/*${ext}`);
  const ignore = DEFAULT_PURGE_IGNORE.map((d) => `**/${d}/**`);

  try {
    return fg.sync(patterns, {
      cwd: absoluteDir,
      ignore,
      onlyFiles: true,
      unique: true,
      absolute: true,
    });
  } catch (err) {
    console.warn(`Warning: Could not scan directory ${absoluteDir}: ${err.message}`);
    return [];
  }
}

function extractClassNames(content) {
  const classNames = new Set();

  function isLikelyClassToken(token) {
    if (!token || typeof token !== "string") return false;
    if (token.length > 120) return false;
    if (token.includes("://")) return false;
    if (token.startsWith(".") || token.startsWith("#") || token.startsWith("@")) return false;
    if (token.endsWith(":")) return false;
    if (/[(){};,`$]/.test(token)) return false;
    if (!/^[a-zA-Z0-9:#_./\-[\]]+$/.test(token)) return false;
    if (!/[a-zA-Z]/.test(token)) return false;

    return true;
  }

  function addClassToken(token) {
    if (!token) return;

    const cleaned = token.trim().replace(/^['"`]+|['"`]+$/g, "");
    if (!cleaned) return;
    if (!isLikelyClassToken(cleaned)) return;

    classNames.add(cleaned);
  }

  const classRegex = /(?:class|className)\s*=\s*(["'])([\s\S]*?)\1/g;
  let match;

  while ((match = classRegex.exec(content)) !== null) {
    const classes = match[2].split(/\s+/);
    classes.forEach(addClassToken);
  }

  const vueBindingRegex = /(?:\:class|v-bind:class)\s*=\s*(["'])([\s\S]*?)\1/g;
  const vueObjectKeyRegex = /['"`]([^'"`]+)['"`]\s*:/g;

  while ((match = vueBindingRegex.exec(content)) !== null) {
    const bindingContent = match[2];
    let keyMatch;

    while ((keyMatch = vueObjectKeyRegex.exec(bindingContent)) !== null) {
      addClassToken(keyMatch[1]);
    }
  }

  const templateStringRegex = /`([^`]+)`/g;

  while ((match = templateStringRegex.exec(content)) !== null) {
    const possibleClasses = match[1].split(/\s+/);

    possibleClasses.forEach((cls) => {
      const cleaned = cls.trim();
      if (!cleaned) return;
      if (!/[-:]/.test(cleaned)) return;
      addClassToken(cleaned);
    });
  }

  return classNames;
}

function extractBlocks(css) {
  const blocks = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < css.length; i++) {
    current += css[i];

    if (css[i] === "{") {
      depth++;
    } else if (css[i] === "}") {
      depth--;

      if (depth === 0) {
        blocks.push(current.trim());
        current = "";
      }
    }
  }

  if (current.trim()) {
    blocks.push(current.trim());
  }

  return blocks;
}

function purgeBlock(block, usedClasses) {
  if (
    block.startsWith(":root") ||
    block.startsWith("*,") ||
    block.startsWith("html") ||
    block.startsWith("body") ||
    block.startsWith("@layer theme,")
  ) {
    return block;
  }

  if (block.startsWith("@") && block.includes("{")) {
    const firstBrace = block.indexOf("{");
    const lastBrace = block.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) return block;

    const wrapperSignature = block.substring(0, firstBrace + 1);
    const innerContent = block.substring(firstBrace + 1, lastBrace);

    const innerBlocks = extractBlocks(innerContent);
    const purgedInner = innerBlocks
      .map((b) => purgeBlock(b, usedClasses))
      .filter((b) => b.trim() !== "")
      .join("\n  ");

    if (!purgedInner.trim()) return "";

    return `${wrapperSignature}\n  ${purgedInner}\n}`;
  }

  const selectorPart = block.split("{")[0];
  if (!selectorPart) return "";

  const cleanSelectorPart = selectorPart
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();

  const selectors = cleanSelectorPart.split(",").map((s) => s.trim());

  const isUsed = selectors.some((selector) => {
    if (!selector.includes(".")) return true;

    for (const used of usedClasses) {
      const escapedUsed = used
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/:/g, "\\\\:");

      const boundaryRegex = new RegExp(
        `\\.${escapedUsed}(?::[\\w\\-]+|\\[|[\\s,>+~]|$)`,
      );

      if (boundaryRegex.test(selector)) return true;
    }

    return false;
  });

  return isUsed ? block : "";
}

function getFilesForPurge(scanDir, config, extensions) {
  const resolvedPurgeConfig = resolvePurgeConfig(config);
  const sourceGlobs = resolvedPurgeConfig.sourceGlobs || [];

  if (sourceGlobs.length) {
    console.log(`\n🔍 Scanning using sourceGlobs`);
    sourceGlobs.forEach((glob) => console.log(`   - ${glob}`));
    console.log(`   Extensions: ${extensions.join(", ")}`);

    return fg.sync(sourceGlobs, {
      ignore: resolvedPurgeConfig.ignore || [],
      onlyFiles: true,
      unique: true,
    });
  }

  const fallbackScanDir = resolvedPurgeConfig.sourceDir || scanDir;

  console.log(`\n🔍 Scanning fallback directory: ${fallbackScanDir}`);
  console.log(`   Extensions: ${extensions.join(", ")}`);

  return getAllFiles(fallbackScanDir, extensions);
}

function printFileSummary(files, extensions) {
  const countsByExt = {};

  for (const ext of extensions) {
    countsByExt[ext] = 0;
  }

  for (const file of files) {
    const ext = extensions.find((e) => file.endsWith(e)) || "other";
    countsByExt[ext] = (countsByExt[ext] || 0) + 1;
  }

  const extSummary = Object.entries(countsByExt)
    .filter(([, count]) => count > 0)
    .map(([ext, count]) => `${count} ${ext}`)
    .join(", ");

  console.log(`   Found: ${files.length === 0 ? "no source files" : extSummary}`);
}

function purgeCSS(css, scanDir, config) {
  const resolvedPurgeConfig = resolvePurgeConfig(config);
  const extensions = resolvedPurgeConfig.extensions || DEFAULT_EXTENSIONS;
  const safelist = Array.isArray(resolvedPurgeConfig.safelist)
    ? resolvedPurgeConfig.safelist
    : [];
  const files = getFilesForPurge(scanDir, config, extensions);

  printFileSummary(files, extensions);

  if (files.length === 0) {
    console.warn(
      "   ⚠️  No template/source files found. Check your purge.sourceGlobs or purge.sourceDir.",
    );
    return css;
  }

  const usedClasses = new Set();

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf8");
      const classes = extractClassNames(content);
      classes.forEach((cls) => usedClasses.add(cls));
    } catch (err) {
      console.warn(`   ⚠️  Could not read ${file}: ${err.message}`);
    }
  }

  safelist.forEach((className) => usedClasses.add(className));

  console.log(`   Extracted ${usedClasses.size} unique class names`);
  if (safelist.length > 0) {
    console.log(`   Safelisted ${safelist.length} class names`);
  }

  const blocks = extractBlocks(css);
  const purgedBlocks = blocks
    .map((block) => purgeBlock(block, usedClasses))
    .filter((block) => block.trim() !== "");

  const purgedCss = purgedBlocks.join("\n\n");

  const beforeSize = (css.length / 1024).toFixed(2);
  const afterSize = (purgedCss.length / 1024).toFixed(2);
  const reduction = (((css.length - purgedCss.length) / css.length) * 100).toFixed(1);

  console.log(`\n📦 Purge results:`);
  console.log(`   Before: ${beforeSize} KB`);
  console.log(`   After:  ${afterSize} KB`);
  console.log(`   Reduction: ${reduction}%`);

  return purgedCss;
}

module.exports = {
  purgeCSS,
  getAllFiles,
  extractClassNames
};
