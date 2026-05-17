'use strict';

const fs = require('fs');
const path = require('path');

function getConfigPath() {
  return path.join(process.cwd(), 'emily.config.json');
}

function getConfig() {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    console.error('\n  emily-css: No config found. Run "emily-css init" first.\n');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function getFullCssPath(config) {
  return path.join(process.cwd(), config.output?.fullCss || 'dist/emily.css');
}

function getProductionCssPath(config) {
  return path.join(process.cwd(), config.output?.css || 'dist/emily.min.css');
}

function getManifestSettings(config) {
  const manifestConfig = config.manifest;

  if (manifestConfig === true) {
    return { enabled: true, output: 'dist/emily.manifest.json' };
  }

  if (manifestConfig && typeof manifestConfig === 'object') {
    return {
      enabled: manifestConfig.enabled === true,
      output: manifestConfig.output || 'dist/emily.manifest.json',
    };
  }

  return { enabled: false, output: 'dist/emily.manifest.json' };
}

function getManifestOutputPath(config) {
  const manifestSettings = getManifestSettings(config);
  const outputPath = manifestSettings.output || 'dist/emily.manifest.json';

  return path.isAbsolute(outputPath)
    ? outputPath
    : path.join(process.cwd(), outputPath);
}

function getIntellisenseSettings(config) {
  const intellisenseConfig = config.intellisense;

  if (intellisenseConfig === true) {
    return { enabled: true, output: 'dist/emily.intellisense.json' };
  }

  if (intellisenseConfig && typeof intellisenseConfig === 'object') {
    return {
      enabled: intellisenseConfig.enabled === true,
      output: intellisenseConfig.output || 'dist/emily.intellisense.json',
    };
  }

  return { enabled: false, output: 'dist/emily.intellisense.json' };
}

function getIntellisenseOutputPath(config) {
  const intellisenseSettings = getIntellisenseSettings(config);
  const outputPath = intellisenseSettings.output || 'dist/emily.intellisense.json';

  return path.isAbsolute(outputPath)
    ? outputPath
    : path.join(process.cwd(), outputPath);
}

function ensureDirectoryForFile(filePath) {
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getSourceDir(config) {
  return config.purge?.sourceDir || '.';
}

module.exports = {
  getConfigPath,
  getConfig,
  getFullCssPath,
  getProductionCssPath,
  getManifestSettings,
  getManifestOutputPath,
  getIntellisenseSettings,
  getIntellisenseOutputPath,
  ensureDirectoryForFile,
  getSourceDir,
};
