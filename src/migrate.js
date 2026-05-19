const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');

const { extractClassNames, getAllFiles } = require('./purge.js');
const { generateManifest } = require('./manifest.js');
const { normaliseClassForManifest, suggestClassName } = require('./doctor.js');
const { DEFAULT_EXTENSIONS } = require('./constants.js');
const { resolvePurgeConfig } = require('./purgeConfig.js');
const MIGRATION_DEFAULT_EXTENSIONS = [...DEFAULT_EXTENSIONS, '.mdx'];

const TAILWIND_MAPPINGS = {
  'text-gray-900': {
    replacement: 'text-neutral-90',
    aliases: ['text-zinc-900', 'text-slate-900', 'text-stone-900', 'text-neutral-900'],
    deprecated: false,
    metadata: { category: 'colour' },
  },
  'text-gray-700': {
    replacement: 'text-neutral-70',
    aliases: ['text-zinc-700', 'text-slate-700', 'text-stone-700', 'text-neutral-700'],
    deprecated: false,
    metadata: { category: 'colour' },
  },
  'text-gray-500': {
    replacement: 'text-neutral-50',
    aliases: ['text-zinc-500', 'text-slate-500', 'text-stone-500', 'text-neutral-500'],
    deprecated: false,
    metadata: { category: 'colour' },
  },
  'bg-gray-100': {
    replacement: 'bg-neutral-10',
    aliases: ['bg-zinc-100', 'bg-slate-100', 'bg-stone-100', 'bg-neutral-100'],
    deprecated: false,
    metadata: { category: 'background' },
  },
  'bg-gray-900': {
    replacement: 'bg-neutral-90',
    aliases: ['bg-zinc-900', 'bg-slate-900', 'bg-stone-900', 'bg-neutral-900'],
    deprecated: false,
    metadata: { category: 'background' },
  },
  'rounded-md': {
    replacement: 'rounded-md',
    aliases: [],
    deprecated: false,
    metadata: { category: 'radius' },
  },
  'rounded-lg': {
    replacement: 'rounded-lg',
    aliases: [],
    deprecated: false,
    metadata: { category: 'radius' },
  },
  'shadow-md': {
    replacement: 'shadow-md',
    aliases: [],
    deprecated: false,
    metadata: { category: 'shadow' },
  },
  flex: {
    replacement: 'flex',
    aliases: [],
    deprecated: false,
    metadata: { category: 'layout' },
  },
  grid: {
    replacement: 'grid',
    aliases: [],
    deprecated: false,
    metadata: { category: 'layout' },
  },
  hidden: {
    replacement: 'hidden',
    aliases: [],
    deprecated: false,
    metadata: { category: 'layout' },
  },
  block: {
    replacement: 'block',
    aliases: [],
    deprecated: false,
    metadata: { category: 'layout' },
  },
  'inline-block': {
    replacement: 'inline-block',
    aliases: [],
    deprecated: false,
    metadata: { category: 'layout' },
  },
};

const MIGRATION_MODE_SEMANTIC = 'semantic';
const MIGRATION_MODE_IMPORTED_PALETTES = 'imported-palettes';

const TAILWIND_COLOUR_UTILITY_PREFIXES = new Set([
  'text',
  'bg',
  'border',
  'accent',
  'fill',
  'stroke',
  'ring',
  'outline',
]);

const TAILWIND_COLOUR_PALETTES = new Set([
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
]);

const TAILWIND_SHADE_TO_EMILY_SHADE = {
  '50': '5',
  '100': '10',
  '200': '20',
  '300': '30',
  '400': '40',
  '500': '50',
  '600': '60',
  '700': '70',
  '800': '80',
  '900': '90',
  '950': '100',
};

const SINGLE_WORD_UTILITY_ALLOWLIST = new Set([
  'flex',
  'grid',
  'hidden',
  'block',
  'inline',
  'table',
  'contents',
  'flow',
  'container',
  'relative',
  'absolute',
  'fixed',
  'sticky',
  'static',
  'visible',
  'invisible',
  'uppercase',
  'lowercase',
  'capitalize',
  'truncate',
  'antialiased',
  'italic',
  'not-italic',
  'underline',
  'overline',
  'line-through',
]);

const UTILITY_PREFIX_ALLOWLIST = new Set([
  'bg',
  'text',
  'border',
  'outline',
  'accent',
  'fill',
  'stroke',
  'ring',
  'rounded',
  'shadow',
  'font',
  'leading',
  'tracking',
  'p',
  'px',
  'py',
  'pt',
  'pr',
  'pb',
  'pl',
  'm',
  'mx',
  'my',
  'mt',
  'mr',
  'mb',
  'ml',
  'w',
  'h',
  'min-w',
  'max-w',
  'min-h',
  'max-h',
  'gap',
  'space',
  'inset',
  'top',
  'right',
  'bottom',
  'left',
  'z',
  'order',
  'col',
  'row',
  'grid-cols',
  'grid-rows',
  'justify',
  'items',
  'content',
  'self',
  'place',
  'box',
  'object',
  'overflow',
  'overscroll',
  'divide',
  'cursor',
  'select',
  'transition',
  'duration',
  'delay',
  'ease',
  'scale',
  'rotate',
  'translate',
  'skew',
  'origin',
  'opacity',
  'basis',
  'grow',
  'shrink',
  'color-scheme',
  'field-sizing',
  'scrollbar',
]);

function hasUtilityLikeSyntax(className) {
  if (!className || typeof className !== 'string') {
    return false;
  }

  const variantSeparatorIndex = className.lastIndexOf(':');
  if (variantSeparatorIndex !== -1) {
    const baseClass = className.slice(variantSeparatorIndex + 1);
    if (!baseClass) {
      return false;
    }
    return hasUtilityLikeSyntax(baseClass);
  }

  if (className.startsWith('-')) {
    const baseClass = className.slice(1);
    return baseClass.length > 0 && hasUtilityLikeSyntax(baseClass);
  }

  if (SINGLE_WORD_UTILITY_ALLOWLIST.has(className)) {
    return true;
  }

  if (
    hasArbitraryValueSyntax(className) ||
    className.includes('/') ||
    className.includes('.') ||
    className.includes('_') ||
    /\d/.test(className)
  ) {
    return true;
  }

  const parts = className.split('-').filter(Boolean);

  if (parts.length >= 2) {
    const first = parts[0];
    const firstTwo = `${parts[0]}-${parts[1]}`;
    return UTILITY_PREFIX_ALLOWLIST.has(first) || UTILITY_PREFIX_ALLOWLIST.has(firstTwo);
  }

  return false;
}

function getConfigPath(options = {}) {
  return options.configPath || path.join(process.cwd(), 'emily.config.json');
}

function readConfig(options = {}) {
  if (options.config && typeof options.config === 'object') {
    return options.config;
  }

  const configPath = getConfigPath(options);
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function getManifestSettings(config) {
  const manifestConfig = config && config.manifest;

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

function getManifestOutputPath(config, options = {}) {
  if (options.manifestPath) {
    return path.isAbsolute(options.manifestPath)
      ? options.manifestPath
      : path.join(process.cwd(), options.manifestPath);
  }

  const manifestSettings = getManifestSettings(config || {});
  const outputPath = manifestSettings.output || 'dist/emily.manifest.json';

  return path.isAbsolute(outputPath)
    ? outputPath
    : path.join(process.cwd(), outputPath);
}

function getFullCssPath(config, options = {}) {
  if (options.cssPath) {
    return path.isAbsolute(options.cssPath)
      ? options.cssPath
      : path.join(process.cwd(), options.cssPath);
  }

  const outputPath = (config && config.output && config.output.fullCss) || 'dist/emily.css';
  return path.isAbsolute(outputPath)
    ? outputPath
    : path.join(process.cwd(), outputPath);
}

function createEmptyManifest() {
  return {
    version: 'unknown',
    generatedAt: new Date().toISOString(),
    utilities: [],
  };
}

function loadManifest(options = {}) {
  const warnings = [];

  if (options.manifest && Array.isArray(options.manifest.utilities)) {
    return { manifest: options.manifest, warnings };
  }

  const config = readConfig(options) || {};
  const manifestPath = getManifestOutputPath(config, options);

  if (fs.existsSync(manifestPath)) {
    try {
      return {
        manifest: JSON.parse(fs.readFileSync(manifestPath, 'utf8')),
        warnings,
      };
    } catch (error) {
      warnings.push(`Could not parse manifest at ${manifestPath}: ${error.message}`);
    }
  }

  const fullCssPath = getFullCssPath(config, options);

  if (fs.existsSync(fullCssPath)) {
    try {
      const css = fs.readFileSync(fullCssPath, 'utf8');
      return {
        manifest: generateManifest(css, config),
        warnings,
      };
    } catch (error) {
      warnings.push(`Could not generate manifest from CSS at ${fullCssPath}: ${error.message}`);
    }
  }

  warnings.push(
    'Manifest not found. Migration report will continue without full EmilyCSS support checks.',
  );

  return { manifest: createEmptyManifest(), warnings };
}

function buildManifestIndexes(manifest) {
  const utilities = Array.isArray(manifest && manifest.utilities) ? manifest.utilities : [];
  const utilitySet = new Set();
  const variantSet = new Set();

  utilities.forEach((utility) => {
    if (utility && utility.class) {
      utilitySet.add(utility.class);
    }

    const variants = Array.isArray(utility && utility.variants) ? utility.variants : [];
    variants.forEach((variant) => variantSet.add(variant));
  });

  return { utilitySet, variantSet };
}

function resolveTailwindMapping(className, mappingTable = TAILWIND_MAPPINGS) {
  if (!className || typeof className !== 'string') {
    return null;
  }

  if (mappingTable[className]) {
    return {
      source: className,
      ...mappingTable[className],
    };
  }

  const entries = Object.entries(mappingTable);

  for (const [sourceClass, entry] of entries) {
    const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
    if (aliases.includes(className)) {
      return {
        source: sourceClass,
        ...entry,
        matchedAlias: className,
      };
    }
  }

  return null;
}

function buildVariantClassName(variants, baseClass) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return baseClass;
  }

  return `${variants.join(':')}:${baseClass}`;
}

function getMigrationMode(options = {}) {
  return options.importColours === true
    ? MIGRATION_MODE_IMPORTED_PALETTES
    : MIGRATION_MODE_SEMANTIC;
}

function mapTailwindPaletteToEmilyPalette(paletteName, mode) {
  if (mode === MIGRATION_MODE_IMPORTED_PALETTES) {
    return paletteName;
  }

  const semanticPaletteRemap = {
    gray: 'neutral',
    slate: 'neutral',
    zinc: 'neutral',
    stone: 'neutral',
  };

  return semanticPaletteRemap[paletteName] || paletteName;
}

function parseTailwindColourClass(baseClass, mode) {
  if (!baseClass || typeof baseClass !== 'string') {
    return null;
  }

  const [baseWithoutOpacity, opacitySuffix] = baseClass.split('/');
  const match = baseWithoutOpacity.match(
    /^([a-z-]+)-([a-z][a-z0-9-]*)-(50|100|200|300|400|500|600|700|800|900|950)$/,
  );

  if (!match) {
    return null;
  }

  const utility = match[1];
  const tailwindPalette = match[2];
  const tailwindShade = match[3];

  if (!TAILWIND_COLOUR_UTILITY_PREFIXES.has(utility)) {
    return null;
  }
  if (!TAILWIND_COLOUR_PALETTES.has(tailwindPalette)) {
    return null;
  }

  const emilyShade = TAILWIND_SHADE_TO_EMILY_SHADE[tailwindShade];
  if (!emilyShade) {
    return null;
  }

  const emilyPalette = mapTailwindPaletteToEmilyPalette(tailwindPalette, mode);
  const emilyBaseClass = `${utility}-${emilyPalette}-${emilyShade}`;

  return {
    utility,
    tailwindPalette,
    tailwindShade,
    opacitySuffix: opacitySuffix || null,
    emilyPalette,
    emilyShade,
    emilyBaseClass,
  };
}

function isSemanticColourMapping(mapping) {
  const category = mapping && mapping.metadata && mapping.metadata.category;
  return category === 'colour' || category === 'background';
}

function hasArbitraryValueSyntax(baseClass) {
  return typeof baseClass === 'string' && /\[[^\]]+\]/.test(baseClass);
}

function buildImportedPalettesConfigBlock(importedPalettes) {
  if (!Array.isArray(importedPalettes) || importedPalettes.length === 0) {
    return null;
  }

  const grouped = {};

  importedPalettes.forEach((entry) => {
    if (!grouped[entry.emilyPalette]) {
      grouped[entry.emilyPalette] = new Set();
    }
    grouped[entry.emilyPalette].add(entry.tailwindPalette);
  });

  const lines = ['importedPalettes: {'];

  Object.keys(grouped)
    .sort()
    .forEach((emilyPalette) => {
      const sources = Array.from(grouped[emilyPalette]).sort();
      if (sources.length === 1) {
        lines.push(`  ${emilyPalette}: "tailwind-${sources[0]}",`);
      } else {
        const aliases = sources.map((source) => `"${source}"`).join(', ');
        lines.push(`  ${emilyPalette}: { source: "tailwind", aliases: [${aliases}] },`);
      }
    });

  lines.push('}');
  return lines.join('\n');
}

function isLikelyUtilityClass(className) {
  if (!className || typeof className !== 'string') return false;
  if (/\s/.test(className)) return false;
  if (className.length > 120) return false;
  if (className.startsWith('--')) return false;
  if (className.startsWith(':')) return false;
  if (className.startsWith('.') || className.startsWith('#') || className.startsWith('@')) return false;
  if (className.endsWith(':')) return false;
  if (className.includes('://')) return false;
  if (/[;()={},`]/.test(className)) return false;
  if (!/[a-zA-Z]/.test(className)) return false;
  if (!/^[a-zA-Z0-9:#_./\-[\]]+$/.test(className)) return false;

/*
 * Ignore obvious prose / JS expressions
 */
if (/[.]+$/.test(className)) return false;
if (/^\[[^\]:]+\]$/.test(className)) return false;
if (/^[a-zA-Z]+\.[a-zA-Z0-9_$]+$/.test(className)) return false;
  if (/^[a-z]+$/.test(className) && !SINGLE_WORD_UTILITY_ALLOWLIST.has(className)) return false;
  if (!hasUtilityLikeSyntax(className) && !SINGLE_WORD_UTILITY_ALLOWLIST.has(className)) return false;

  return true;
}

function migrateClasses(input, options = {}) {
  const mode = getMigrationMode(options);

  const report = {
    found: [],
    supported: [],
    knownTailwind: [],
    unsupported: [],
    arbitraryValueUtilities: [],
    suggestions: [],
    replacements: [],
    importedPaletteMappings: [],
    importedPalettes: [],
    warnings: [],
  };

  if (typeof input !== 'string') {
    report.warnings.push('migrateClasses expected a string input; received non-string content.');
    return report;
  }

  const classSet = extractClassNames(input);
  const found = Array.from(classSet).filter(isLikelyUtilityClass);

  report.found = found;

  const { manifest, warnings } = loadManifest(options);
  report.warnings.push(...warnings);

  const { utilitySet, variantSet } = buildManifestIndexes(manifest);

  for (const className of found) {
    const parsed = normaliseClassForManifest(className);
    const variants = parsed.variants || [];
    const isArbitraryValueClass = hasArbitraryValueSyntax(parsed.baseClass);
    const hasUnknownVariant = variants.some((variant) => !variantSet.has(variant));
    const isSupported = utilitySet.has(parsed.baseClass) && !hasUnknownVariant;

    if (isSupported) {
      report.supported.push(className);
    }

    const parsedTailwindColour = parseTailwindColourClass(parsed.baseClass, mode);
    const mapping = resolveTailwindMapping(parsed.baseClass, options.mappingTable || TAILWIND_MAPPINGS);
    const shouldUseImportedPaletteMapping =
      mode === MIGRATION_MODE_IMPORTED_PALETTES && !!parsedTailwindColour;
    const effectiveSemanticMapping =
      shouldUseImportedPaletteMapping && isSemanticColourMapping(mapping) ? null : mapping;

    if (isArbitraryValueClass) {
      report.arbitraryValueUtilities.push(className);
      if (!isSupported) {
        report.unsupported.push(className);
      }
      continue;
    }

    if (shouldUseImportedPaletteMapping) {
      const suggestedClass = buildVariantClassName(variants, parsedTailwindColour.emilyBaseClass);

      report.importedPaletteMappings.push({
        from: className,
        to: suggestedClass,
        utility: parsedTailwindColour.utility,
        tailwindPalette: parsedTailwindColour.tailwindPalette,
        tailwindShade: parsedTailwindColour.tailwindShade,
        emilyPalette: parsedTailwindColour.emilyPalette,
        emilyShade: parsedTailwindColour.emilyShade,
        hasOpacitySuffix: parsedTailwindColour.opacitySuffix !== null,
      });

      report.importedPalettes.push({
        tailwindPalette: parsedTailwindColour.tailwindPalette,
        emilyPalette: parsedTailwindColour.emilyPalette,
      });
    }

    if (effectiveSemanticMapping) {
      report.knownTailwind.push(className);

      const replacementClass = buildVariantClassName(variants, effectiveSemanticMapping.replacement);
      const hasChange = replacementClass !== className;

      if (hasChange) {
        report.replacements.push({
          from: className,
          to: replacementClass,
          source: effectiveSemanticMapping.source,
          matchedAlias: effectiveSemanticMapping.matchedAlias || null,
          deprecated: effectiveSemanticMapping.deprecated === true,
          metadata: effectiveSemanticMapping.metadata || {},
        });

        report.suggestions.push({
          className,
          suggestion: replacementClass,
          reason: 'tailwind-mapping',
        });
      }
    } else if (shouldUseImportedPaletteMapping) {
      const replacementClass = buildVariantClassName(variants, parsedTailwindColour.emilyBaseClass);

      report.knownTailwind.push(className);
      report.replacements.push({
        from: className,
        to: replacementClass,
        source: `${parsedTailwindColour.utility}-${parsedTailwindColour.tailwindPalette}-${parsedTailwindColour.tailwindShade}`,
        matchedAlias: null,
        deprecated: false,
        metadata: {
          category: 'imported-palette-colour',
          emilyPalette: parsedTailwindColour.emilyPalette,
          emilyShade: parsedTailwindColour.emilyShade,
          hasOpacitySuffix: parsedTailwindColour.opacitySuffix !== null,
        },
      });
      report.suggestions.push({
        className,
        suggestion: replacementClass,
        reason: 'imported-palette-mapping',
      });
    }

    if (!isSupported && !effectiveSemanticMapping) {
      if (shouldUseImportedPaletteMapping) {
        continue;
      }

      report.unsupported.push(className);

      if (utilitySet.size > 0) {
        const suggestion = suggestClassName(className, utilitySet, variantSet);
        if (suggestion) {
          report.suggestions.push({
            className,
            suggestion,
            reason: 'closest-emily-class',
          });
        }
      }
    }
  }

  report.found.sort();
  report.supported.sort();
  report.knownTailwind.sort();
  report.unsupported.sort();
  report.arbitraryValueUtilities.sort();
  report.importedPalettes = dedupeBy(
    report.importedPalettes,
    (item) => `${item.tailwindPalette}->${item.emilyPalette}`,
  );
  report.importedPaletteMappings = dedupeBy(
    report.importedPaletteMappings,
    (item) => `${item.from}->${item.to}`,
  );

  return report;
}

function getFilesToScan(config, options = {}) {
  const resolvedPurgeConfig = resolvePurgeConfig(config || {});
  const extensions = Array.from(
    new Set([...(resolvedPurgeConfig.extensions || MIGRATION_DEFAULT_EXTENSIONS), '.mdx']),
  );
  const ignore = resolvedPurgeConfig.ignore || [];

  if (options.sourceGlobs && options.sourceGlobs.length > 0) {
    return fg.sync(options.sourceGlobs, {
      ignore,
      onlyFiles: true,
      unique: true,
      absolute: true,
    });
  }

  if (resolvedPurgeConfig.sourceGlobs && resolvedPurgeConfig.sourceGlobs.length > 0) {
    return fg.sync(resolvedPurgeConfig.sourceGlobs, {
      ignore,
      onlyFiles: true,
      unique: true,
      absolute: true,
    });
  }

  const sourceDir =
    options.sourceDir ||
    resolvedPurgeConfig.sourceDir ||
    '.';

  const scanDir = path.isAbsolute(sourceDir)
    ? sourceDir
    : path.join(process.cwd(), sourceDir);

  if (!fs.existsSync(scanDir)) {
    return [];
  }

  return getAllFiles(scanDir, extensions);
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function generateMigrationReport(options = {}) {
  const config = readConfig(options) || {};
  const manifestResult = loadManifest({ ...options, config });
  const files = getFilesToScan(config, options);

  const aggregate = {
    found: new Set(),
    supported: new Set(),
    knownTailwind: new Set(),
    unsupported: new Set(),
    arbitraryValueUtilities: new Set(),
    suggestions: [],
    replacements: [],
    importedPaletteMappings: [],
    importedPalettes: [],
    warnings: [...manifestResult.warnings],
  };

  if (files.length === 0) {
    aggregate.warnings.push('No source files found for migration scan.');
  }

  const fileReports = [];

  files.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const report = migrateClasses(content, {
        ...options,
        config,
        manifest: manifestResult.manifest,
      });

      report.found.forEach((className) => aggregate.found.add(className));
      report.supported.forEach((className) => aggregate.supported.add(className));
      report.knownTailwind.forEach((className) => aggregate.knownTailwind.add(className));
      report.unsupported.forEach((className) => aggregate.unsupported.add(className));
      report.arbitraryValueUtilities.forEach((className) => aggregate.arbitraryValueUtilities.add(className));
      aggregate.suggestions.push(...report.suggestions);
      aggregate.replacements.push(...report.replacements);
      aggregate.importedPaletteMappings.push(...report.importedPaletteMappings);
      aggregate.importedPalettes.push(...report.importedPalettes);
      aggregate.warnings.push(...report.warnings);

      fileReports.push({
        file: filePath,
        report,
      });
    } catch (error) {
      aggregate.warnings.push(`Could not read ${filePath}: ${error.message}`);
    }
  });

  return {
    files,
    fileReports,
    found: Array.from(aggregate.found).sort(),
    supported: Array.from(aggregate.supported).sort(),
    knownTailwind: Array.from(aggregate.knownTailwind).sort(),
    unsupported: Array.from(aggregate.unsupported).sort(),
    arbitraryValueUtilities: Array.from(aggregate.arbitraryValueUtilities).sort(),
    suggestions: dedupeBy(aggregate.suggestions, (item) => `${item.className}->${item.suggestion}`),
    replacements: dedupeBy(aggregate.replacements, (item) => `${item.from}->${item.to}`),
    importedPaletteMappings: dedupeBy(
      aggregate.importedPaletteMappings,
      (item) => `${item.from}->${item.to}`,
    ),
    importedPalettes: dedupeBy(
      aggregate.importedPalettes,
      (item) => `${item.tailwindPalette}->${item.emilyPalette}`,
    ),
    importedPalettesConfig:
      options.importColours === true
        ? buildImportedPalettesConfigBlock(
            dedupeBy(
              aggregate.importedPalettes,
              (item) => `${item.tailwindPalette}->${item.emilyPalette}`,
            ),
          )
        : null,
    warnings: Array.from(new Set(aggregate.warnings)),
  };
}

module.exports = {
  migrateClasses,
  loadManifest,
  generateMigrationReport,
};
