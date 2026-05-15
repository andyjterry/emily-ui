const MANIFEST_VERSION = '1.1.0';
const packageJson = require('../package.json');
const {
  DEFAULT_RESPONSIVE_VARIANTS,
  BASE_VARIANTS,
} = require('./constants.js');

function parseDeclarations(block) {
  const declarations = {};
  const declarationRegex = /([a-zA-Z-]+)\s*:\s*([^;]+)\s*;?/g;
  let firstProperty = null;
  let firstValue = null;
  let match;

  while ((match = declarationRegex.exec(block)) !== null) {
    const property = match[1].trim();
    const value = match[2].trim();
    declarations[property] = value;

    if (!firstProperty) {
      firstProperty = property;
      firstValue = value;
    }
  }

  return { declarations, firstProperty, firstValue };
}

function getTokenFromDeclarations(declarations) {
  const values = Object.values(declarations);

  for (const value of values) {
    const tokenMatch = value.match(/var\(\s*(--[a-zA-Z0-9-_]+)\s*(?:,[^)]+)?\)/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
  }

  return null;
}

function readLeadingClassSelector(selector) {
  if (!selector || !selector.startsWith('.')) return null;

  let classSelector = '.';

  for (let i = 1; i < selector.length; i++) {
    const char = selector[i];

    if (char === '\\' && i + 1 < selector.length) {
      classSelector += selector[i] + selector[i + 1];
      i++;
      continue;
    }

    if (
      char === ' ' ||
      char === '\t' ||
      char === '\n' ||
      char === '\r' ||
      char === ',' ||
      char === '>' ||
      char === '+' ||
      char === '~' ||
      char === ':' ||
      char === '['
    ) {
      break;
    }

    classSelector += char;
  }

  return classSelector.length > 1 ? classSelector : null;
}

function extractManifestClassSelectors(selector) {
  if (typeof selector !== 'string' || selector.trim().length === 0) {
    return [];
  }

  const classSelectors = [];
  const seen = new Set();
  const selectorParts = selector
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  selectorParts.forEach((part) => {
    const classSelector = readLeadingClassSelector(part);
    if (!classSelector) return;
    if (classSelector.includes('\\:')) return;

    const remainder = part.slice(classSelector.length).trimStart();

    // Expanded pseudo-state / pseudo-element and attribute selectors are not
    // base utilities in the manifest (for example .hover\:x:hover, .x[...]).
    if (
      remainder.startsWith(':') ||
      remainder.startsWith('::') ||
      remainder.startsWith('[')
    ) {
      return;
    }

    if (seen.has(classSelector)) return;
    seen.add(classSelector);
    classSelectors.push(classSelector);
  });

  return classSelectors;
}

function inferCategory(className, property) {
  if (
    className === 'prose' ||
    className === 'prose-emily' ||
    className === 'center-screen' ||
    className === 'center-absolute' ||
    className === 'field-container' ||
    className === 'form-hint' ||
    className === 'form-error-message' ||
    className === 'error-summary' ||
    className === 'btn' ||
    className === 'btn-primary' ||
    className === 'btn-secondary' ||
    className === 'btn-ghost' ||
    className === 'btn-danger' ||
    className === 'btn-sm' ||
    className === 'btn-lg' ||
    className === 'code-window' ||
    className === 'code-title-bar' ||
    className === 'code-dot' ||
    className === 'code-dot-red' ||
    className === 'code-dot-yellow' ||
    className === 'code-dot-green' ||
    className === 'code-filename' ||
    className.startsWith('token-')
  ) {
    return 'component';
  }

  if (className.startsWith('text-')) {
    return property === 'color' ? 'colour' : 'typography';
  }

  if (
    className.startsWith('font-') ||
    className.startsWith('leading-') ||
    className.startsWith('tracking-') ||
    className.startsWith('list-') 
  ) {
    return 'typography';
  }

  if (className.startsWith('bg-')) return 'background';

  if (
    className === 'border' ||
    className.startsWith('border-') ||
    className.startsWith('divide-') ||
    className === 'outline' ||
    className.startsWith('outline-') ||
    className === 'ring' ||
    className.startsWith('ring-')
  ) {
    return 'border';
  }

  if (
    className.startsWith('p-') ||
    className.startsWith('px-') ||
    className.startsWith('py-') ||
    className.startsWith('pt-') ||
    className.startsWith('pr-') ||
    className.startsWith('pb-') ||
    className.startsWith('pl-') ||
    className.startsWith('m-') ||
    className.startsWith('mx-') ||
    className.startsWith('my-') ||
    className.startsWith('mt-') ||
    className.startsWith('mr-') ||
    className.startsWith('mb-') ||
    className.startsWith('ml-') ||
    className.startsWith('gap-') ||
    className.startsWith('space-') ||
    className.startsWith('inset-') ||
    className.startsWith('top-') ||
    className.startsWith('right-') ||
    className.startsWith('bottom-') ||
    className.startsWith('left-')
  ) {
    return 'spacing';
  }

  if (
    className.startsWith('w-') ||
    className.startsWith('h-') ||
    className.startsWith('min-w-') ||
    className.startsWith('max-w-') ||
    className.startsWith('min-h-') ||
    className.startsWith('max-h-') ||
    className.startsWith('size-')
  ) {
    return 'sizing';
  }

  if (
    className === 'flex' ||
    className === 'grid' ||
    className === 'block' ||
    className === 'inline' ||
    className === 'inline-block' ||
    className === 'inline-flex' ||
    className === 'hidden' ||
    className === 'container' ||
    className === 'relative' ||
    className === 'absolute' ||
    className === 'fixed' ||
    className === 'sticky' ||
    className === 'static'
  ) {
    return 'layout';
  }

  if (
    className.startsWith('items-') ||
    className.startsWith('justify-') ||
    className.startsWith('content-') ||
    className.startsWith('self-') ||
    className.startsWith('place-') ||
    className.startsWith('order-') ||
    className.startsWith('col-') ||
    className.startsWith('row-')
  ) {
    return 'layout';
  }

  if (className === 'rounded' || className.startsWith('rounded-')) return 'radius';
  if (className === 'shadow' || className.startsWith('shadow-')) return 'shadow';

  if (
    className.startsWith('opacity-') ||
    className.startsWith('blur-') ||
    className.startsWith('backdrop-') ||
    className === 'filter' ||
    className === 'grayscale' ||
    className.startsWith('saturate-') ||
    className.startsWith('brightness-') ||
    className.startsWith('contrast-')
  ) {
    return 'effects';
  }

  if (
    className === 'transition' ||
    className.startsWith('transition-') ||
    className.startsWith('duration-') ||
    className.startsWith('ease-') ||
    className.startsWith('delay-') ||
    className.startsWith('animate-')
  ) {
    return 'motion';
  }

  if (
    className === 'sr-only' ||
    className === 'not-sr-only' ||
    className === 'focus-ring' ||
    className === 'skip-to-content' ||
    className === 'js-hidden' ||
    className === 'no-js'
  ) {
    return 'accessibility';
  }

  if (
    className === 'input' ||
    className === 'select' ||
    className === 'textarea' ||
    className === 'checkbox' ||
    className === 'radio' ||
    className === 'stack' ||
    className === 'cluster' ||
    className === 'width-container'
  ) {
    return 'component';
  }

  return 'utility';
}

function normalizeClassName(selector) {
  return selector.slice(1).replace(/\\(.)/g, '$1');
}

function getVariants(config) {
  const breakpoints =
    config &&
    config.breakpoints &&
    typeof config.breakpoints === 'object' &&
    Object.keys(config.breakpoints).length > 0
      ? Object.keys(config.breakpoints)
      : DEFAULT_RESPONSIVE_VARIANTS;

  return [...BASE_VARIANTS, ...breakpoints];
}

function generateManifest(css, config = {}) {
  const manifest = {
    schemaVersion: '1',
    package: packageJson.name || 'emily-css',
    version: packageJson.version || '0.0.0',
    manifestVersion: MANIFEST_VERSION,
    generatedAt: new Date().toISOString(),
    utilities: [],
  };

  if (typeof css !== 'string' || css.length === 0) {
    return manifest;
  }

  const variants = getVariants(config);
  const cleanedCss = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let ruleMatch;

  while ((ruleMatch = ruleRegex.exec(cleanedCss)) !== null) {
    const selector = ruleMatch[1].trim();
    const declarationBlock = ruleMatch[2].trim();
    const classSelectors = extractManifestClassSelectors(selector);
    if (classSelectors.length === 0) continue;

    const { declarations, firstProperty, firstValue } = parseDeclarations(declarationBlock);
    if (!firstProperty) continue;

    classSelectors.forEach((classSelector) => {
      const className = normalizeClassName(classSelector);

      manifest.utilities.push({
        class: className,
        category: inferCategory(className, firstProperty),
        property: firstProperty,
        value: firstValue,
        token: getTokenFromDeclarations(declarations),
        declarations,
        variants,
        source: 'generated-css',
      });
    });
  }

  return manifest;
}

module.exports = {
  generateManifest,
};
