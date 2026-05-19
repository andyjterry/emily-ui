'use strict';

const fs = require('fs');
const path = require('path');
const { DEFAULT_EXTENSIONS, DEFAULT_PURGE_IGNORE } = require('./constants.js');

const LEGACY_STATIC_GENERIC_GLOB = './**/*.{html,htm,twig,njk,liquid,hbs,php,astro,svelte,vue,js,ts}';

const PROJECT_PURGE_PRESETS = {
  Nuxt: {
    sourceDir: '.',
    sourceGlobs: [
      './components/**/*.{vue,js,ts}',
      './pages/**/*.vue',
      './layouts/**/*.vue',
      './app.vue',
    ],
  },
  'Next.js': {
    sourceDir: '.',
    sourceGlobs: [
      './app/**/*.{js,jsx,ts,tsx}',
      './pages/**/*.{js,jsx,ts,tsx}',
      './components/**/*.{js,jsx,ts,tsx}',
      './src/**/*.{js,jsx,ts,tsx}',
    ],
  },
  React: {
    sourceDir: './src',
    sourceGlobs: [
      './src/**/*.{js,jsx,ts,tsx,html}',
      './components/**/*.{js,jsx,ts,tsx}',
      './public/**/*.html',
    ],
  },
  'Vue/Vite': {
    sourceDir: './src',
    sourceGlobs: [
      './src/**/*.{vue,js,jsx,ts,tsx,html}',
      './index.html',
    ],
  },
  Astro: {
    sourceDir: './src',
    sourceGlobs: [
      './src/**/*.{astro,html,md,mdx,js,jsx,ts,tsx,vue,svelte}',
    ],
  },
  Drupal: {
    sourceDir: '.',
    sourceGlobs: [
      './web/themes/custom/**/*.{twig,js,ts}',
      './templates/**/*.html.twig',
      './components/**/*.twig',
      './**/*.theme',
    ],
  },
  'Static/Generic': {
    sourceDir: '.',
    sourceGlobs: [
      './**/*.{html,htm,twig,njk,liquid,hbs,php,astro,svelte,vue,blade.php,jinja,jinja2,j2}',
    ],
  },
};

function unique(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function readPackageJson(cwd) {
  const packagePath = path.join(cwd, 'package.json');
  if (!fs.existsSync(packagePath)) return null;

  try {
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch {
    return null;
  }
}

function hasDependency(packageJson, dependencyName) {
  if (!packageJson) return false;

  return Boolean(
    packageJson.dependencies?.[dependencyName] ||
    packageJson.devDependencies?.[dependencyName],
  );
}

function detectProjectType(cwd = process.cwd()) {
  const packageJson = readPackageJson(cwd);

  if (
    fs.existsSync(path.join(cwd, 'nuxt.config.ts')) ||
    fs.existsSync(path.join(cwd, 'nuxt.config.js')) ||
    hasDependency(packageJson, 'nuxt')
  ) {
    return 'Nuxt';
  }

  if (hasDependency(packageJson, 'next')) {
    return 'Next.js';
  }

  if (hasDependency(packageJson, 'react')) {
    return 'React';
  }

  if (
    hasDependency(packageJson, 'vue') ||
    fs.existsSync(path.join(cwd, 'vite.config.ts')) ||
    fs.existsSync(path.join(cwd, 'vite.config.js'))
  ) {
    return 'Vue/Vite';
  }

  if (
    hasDependency(packageJson, 'astro') ||
    fs.existsSync(path.join(cwd, 'astro.config.mjs'))
  ) {
    return 'Astro';
  }

  let rootFiles = [];
  try {
    rootFiles = fs.readdirSync(cwd);
  } catch {
    return 'Static/Generic';
  }

  const hasDrupalInfoFile = rootFiles.some((file) => file.endsWith('.info.yml'));

  if (
    hasDrupalInfoFile ||
    fs.existsSync(path.join(cwd, 'web/core'))
  ) {
    return 'Drupal';
  }

  return 'Static/Generic';
}

function normaliseGlob(glob) {
  return String(glob || '').replace(/\\/g, '/').trim();
}

function isLegacyStaticGenericGlob(sourceGlobs) {
  if (!Array.isArray(sourceGlobs) || sourceGlobs.length !== 1) return false;
  const [onlyGlob] = sourceGlobs.map(normaliseGlob);
  return onlyGlob === LEGACY_STATIC_GENERIC_GLOB;
}

function resolvePurgeConfig(config = {}, options = {}) {
  const purge = config.purge || {};
  const cwd = options.cwd || process.cwd();
  const detectedProjectType = detectProjectType(cwd);
  const projectType = purge.projectType || detectedProjectType;
  const preset = PROJECT_PURGE_PRESETS[projectType] || PROJECT_PURGE_PRESETS['Static/Generic'];

  const configuredSourceGlobs = Array.isArray(purge.sourceGlobs)
    ? purge.sourceGlobs.filter(Boolean)
    : [];

  let sourceGlobs = configuredSourceGlobs.length > 0
    ? configuredSourceGlobs
    : preset.sourceGlobs;

  if (projectType === 'Static/Generic' && isLegacyStaticGenericGlob(sourceGlobs)) {
    sourceGlobs = preset.sourceGlobs;
  }

  const sourceDir = purge.sourceDir || preset.sourceDir || '.';

  return {
    projectType,
    sourceDir,
    sourceGlobs,
    ignore: unique([...DEFAULT_PURGE_IGNORE, ...(purge.ignore || [])]),
    extensions: Array.isArray(purge.extensions) && purge.extensions.length > 0
      ? purge.extensions
      : DEFAULT_EXTENSIONS,
  };
}

module.exports = {
  PROJECT_PURGE_PRESETS,
  LEGACY_STATIC_GENERIC_GLOB,
  detectProjectType,
  resolvePurgeConfig,
};

