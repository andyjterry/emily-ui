'use strict';

const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const {
  getConfig,
  getFullCssPath,
  getProductionCssPath,
} = require('./config.js');
const { resolvePurgeConfig } = require('./purgeConfig.js');

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function detectFramework(config) {
  if (config.framework) return config.framework;
  // fall back to output path heuristic
  const outputPath = typeof config.output === 'string' ? config.output : (config.output && config.output.path) || '';
  const out = outputPath.toLowerCase();
  if (out.includes('public')) return 'Nuxt / Vue / Next.js';
  return 'Static / Generic';
}

function getSourceGlobs(config) {
  return resolvePurgeConfig(config).sourceGlobs;
}

function countSourceFiles(globs) {
  try {
    return fg.sync(globs, { onlyFiles: true, unique: true }).length;
  } catch {
    return null;
  }
}

function info() {
  let config;
  try {
    config = getConfig();
  } catch (err) {
    console.error('emily-css info: could not load emily.config.json');
    console.error(err.message);
    process.exitCode = 1;
    return;
  }

  const packageJson = require(path.join(__dirname, '..', 'package.json'));
  const fullCssPath = getFullCssPath(config);
  const productionCssPath = getProductionCssPath(config);
  const globs = getSourceGlobs(config);
  const fileCount = countSourceFiles(globs);

  const fullSizeStr = fs.existsSync(fullCssPath)
    ? formatBytes(fs.statSync(fullCssPath).size)
    : 'not built';

  const prodSizeStr = fs.existsSync(productionCssPath)
    ? formatBytes(fs.statSync(productionCssPath).size)
    : 'not built';

  const colourNames = config.colours ? Object.keys(config.colours) : [];
  const semanticNames = config.semanticColours ? Object.keys(config.semanticColours) : [];
  const colourSummary = colourNames.length
    ? colourNames.join(', ') + (semanticNames.length ? ` + ${semanticNames.length} semantic` : '')
    : 'none';

  const fontConfig = config.fontFamily || {};
  const headingFont = typeof fontConfig === 'object' ? (fontConfig.heading || 'system') : fontConfig;
  const bodyFont   = typeof fontConfig === 'object' ? (fontConfig.body    || 'system') : fontConfig;

  const lines = [
    `emily-css v${packageJson.version}`,
    '',
    `  Project:      ${detectFramework(config)}`,
    `  Config:       emily.config.json`,
    `  Output:       ${path.relative(process.cwd(), fullCssPath)} (full)`,
    `                ${path.relative(process.cwd(), productionCssPath)} (production)`,
    `  CSS size:     ${fullSizeStr} (full)  /  ${prodSizeStr} (production)`,
    `  Source globs: ${globs.join(', ')}`,
    `  Files found:  ${fileCount !== null ? fileCount : 'unknown'}`,
    '',
    `  Colours:      ${colourSummary}`,
    `  Spacing:      ${config.spacing && config.spacing.scale ? Object.keys(config.spacing.scale).length : 0} steps`,
    `  Fonts:        ${headingFont} (heading), ${bodyFont} (body)`,
    '',
  ];

  console.log(lines.join('\n'));
}

module.exports = { info };
