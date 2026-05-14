/**
 * EmilyUI — Test Suite
 * Tests core functions in isolation with explicit expected outcomes.
 * Run with: node tests/test.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync, spawnSync } = require('child_process');

// ─── Load modules ─────────────────────────────────────────────────────────────

const {
  buildFullFramework,
  hexToOklch,
  oklchToHex,
  generateColourScale,
  generateAllColours,
  generateSpacing,
  generateBorderUtilities,
  generateColourUtilities,
  generateTypographyUtilities,
  generateSpacingUtilities,
  addStateVariants,
  addAriaDataVariants,
  addResponsiveVariants,
  generateFlexboxUtilities,
  generateGridUtilities,
} = require('../src/index.js');

const { extractClassNames, purgeCSS } = require('../src/purge.js');
const { generateManifest } = require('../src/manifest.js');

const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../emily.config.json'), 'utf8')
);

// ─── Test runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗  ${name}`);
    console.log(`       ${err.message}`);
    failed++;
    failures.push({ name, message: err.message });
  }
}

function section(title) {
  console.log(`\n${title}`);
  console.log('─'.repeat(title.length));
}

function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emily-cli-test-'));
  fs.writeFileSync(
    path.join(tmpDir, 'package.json'),
    JSON.stringify(
      {
        name: 'emily-cli-test',
        version: '1.0.0',
        type: 'commonjs',
      },
      null,
      2,
    ),
  );

  return tmpDir;
}

function removeTempProject(tmpDir) {
  if (tmpDir && fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function getPackedFiles() {
  const packageRoot = path.join(__dirname, '..');

  const result = spawnSync('npm', ['pack', '--json', '--dry-run'], {
    cwd: packageRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  assert.strictEqual(result.status, 0, result.stderr);

  const parsed = JSON.parse(result.stdout);
  return parsed[0].files.map((file) => file.path);
}

function isolatedPurgeConfig(tmpDir) {
  return {
    ...config,
    purge: {
      sourceDir: tmpDir,
      sourceGlobs: [path.join(tmpDir, '**/*.{html,js,ts,jsx,tsx,vue}').replace(/\\/g, '/')],
      ignore: [],
      extensions: ['.html', '.js', '.ts', '.jsx', '.tsx', '.vue'],
    },
  };
}

function buildConfigWithManifest(manifestConfig) {
  const tmpConfig = JSON.parse(JSON.stringify(config));

  if (manifestConfig === undefined) {
    delete tmpConfig.manifest;
  } else {
    tmpConfig.manifest = manifestConfig;
  }

  return tmpConfig;
}

// ─── 1. Colour Generation ─────────────────────────────────────────────────────

section('1. Colour Generation');

test('hexToOklch returns valid L, C, H for #0077b6', () => {
  const { l, c, h } = hexToOklch('#0077b6');
  assert.ok(l >= 0 && l <= 1, `L should be 0–1, got ${l}`);
  assert.ok(c >= 0, `C (chroma) should be >= 0, got ${c}`);
  assert.ok(h >= 0 && h <= 360, `H should be 0–360, got ${h}`);
  // #0077b6 is a mid-lightness blue — L roughly 0.45–0.60
  assert.ok(l >= 0.40 && l <= 0.65, `Expected L ~0.52 for #0077b6, got ${l.toFixed(3)}`);
});

test('hexToOklch handles pure white #FFFFFF', () => {
  const { l, c } = hexToOklch('#FFFFFF');
  assert.ok(l > 0.99, `White L should be ~1.0, got ${l.toFixed(4)}`);
  assert.ok(c < 0.01, `White chroma should be ~0, got ${c.toFixed(4)}`);
});

test('hexToOklch handles pure black #000000', () => {
  const { l, c } = hexToOklch('#000000');
  assert.ok(l < 0.01, `Black L should be ~0, got ${l.toFixed(4)}`);
  assert.ok(c < 0.01, `Black chroma should be ~0, got ${c.toFixed(4)}`);
});

test('oklchToHex round-trips back to original colour', () => {
  const original = '#0077B6';
  const { l, c, h } = hexToOklch(original);
  const result = oklchToHex(l, c, h);
  assert.strictEqual(result, original, `Round-trip failed: got ${result}`);
});

test('generateColourScale returns exactly 10 shades', () => {
  const scale = generateColourScale('#0077b6');
  assert.strictEqual(Object.keys(scale).length, 10);
});

test('generateColourScale has shades 10–100 in steps of 10', () => {
  const scale = generateColourScale('#0077b6');
  const expected = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  expected.forEach(shade => {
    assert.ok(scale[shade] !== undefined, `Missing shade ${shade}`);
  });
});

test('generateColourScale shade 80 is exactly the input colour (uppercase)', () => {
  const scale = generateColourScale('#0077b6');
  assert.strictEqual(scale[80], '#0077B6');
});

test('generateColourScale shade 10 is lighter than shade 80', () => {
  const scale = generateColourScale('#0077b6');
  const l10 = hexToOklch(scale[10]).l;
  const l80 = hexToOklch(scale[80]).l;
  assert.ok(l10 > l80, `Shade 10 (${l10.toFixed(3)}) should be lighter than shade 80 (${l80.toFixed(3)})`);
});

test('generateColourScale shade 100 is darker than shade 80', () => {
  const scale = generateColourScale('#0077b6');
  const l100 = hexToOklch(scale[100]).l;
  const l80 = hexToOklch(scale[80]).l;
  assert.ok(l100 < l80, `Shade 100 (${l100.toFixed(3)}) should be darker than shade 80 (${l80.toFixed(3)})`);
});

test('generateColourScale all shades are valid hex strings', () => {
  const scale = generateColourScale('#0077b6');
  Object.entries(scale).forEach(([shade, hex]) => {
    assert.match(hex, /^#[0-9A-F]{6}$/,
      `Shade ${shade}: "${hex}" is not a valid uppercase hex colour`);
  });
});

test('generateAllColours produces a scale for each config colour', () => {
  const colours = generateAllColours(config.colours);
  const configColourCount = Object.keys(config.colours).length;
  assert.strictEqual(Object.keys(colours).length, configColourCount);
});

test('generateAllColours shade 80 matches config input for all colours', () => {
  const colours = generateAllColours(config.colours);
  Object.entries(config.colours).forEach(([name, hex]) => {
    assert.strictEqual(
      colours[name][80],
      hex.toUpperCase(),
      `${name} shade 80 should be ${hex.toUpperCase()}, got ${colours[name][80]}`
    );
  });
});

// ─── 2. Spacing ───────────────────────────────────────────────────────────────

section('2. Spacing');

test('generateSpacing returns an object with values for each scale key', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  assert.ok(Object.keys(spacing).length > 0);
});

test('generateSpacing preserves "0" key with 0px value', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  assert.strictEqual(spacing['0'], '0px');
});

test('generateSpacing includes "4" key', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  assert.ok(spacing['4'] !== undefined, 'Expected spacing["4"] to exist');
});

// ─── 3. Border Utilities ──────────────────────────────────────────────────────

section('3. Border Utilities');

test('generateBorderUtilities includes .rounded (bare class)', () => {
  const css = generateBorderUtilities(config);
  assert.ok(css.includes('.rounded {'), `Missing ".rounded {" in border utilities`);
});

test('generateBorderUtilities .rounded uses base radius from config', () => {
  const css = generateBorderUtilities(config);
  const baseRadius = config.spacing.borderRadius.base;
  assert.ok(
    css.includes(`.rounded { border-radius: ${baseRadius}; }`),
    `Expected .rounded to use config base radius "${baseRadius}"`
  );
});

test('generateBorderUtilities includes all config borderRadius names', () => {
  const css = generateBorderUtilities(config);
  Object.keys(config.spacing.borderRadius).forEach(name => {
    assert.ok(css.includes(`.rounded-${name} {`),
      `Missing .rounded-${name} in border utilities`);
  });
});

test('generateBorderUtilities includes border-l-4 (per-side width)', () => {
  const css = generateBorderUtilities(config);
  assert.ok(css.includes('.border-l-4 {'), `Missing ".border-l-4 {"`);
});

test('generateBorderUtilities generates widths from config.spacing.borderWidths', () => {
  const css = generateBorderUtilities(config);
  config.spacing.borderWidths.forEach(width => {
    if (width > 0) {
      assert.ok(css.includes(`.border-${width} {`),
        `Missing ".border-${width} {" - should come from config.spacing.borderWidths`);
    }
  });
});

test('generateBorderUtilities includes per-side variants for all config widths', () => {
  const css = generateBorderUtilities(config);
  const sides = ['t', 'r', 'b', 'l'];
  config.spacing.borderWidths.forEach(width => {
    sides.forEach(side => {
      assert.ok(css.includes(`.border-${side}-${width} {`),
        `Missing ".border-${side}-${width} {"`);
    });
  });
});

// ─── 4. Colour Utilities ──────────────────────────────────────────────────────

section('4. Colour Utilities');

test('generateColourUtilities includes bg-, text-, border-, accent- for each colour', () => {
  const colours = generateAllColours(config.colours);
  const css = generateColourUtilities(colours);
  const firstColour = Object.keys(colours)[0];
  ['bg', 'text', 'border', 'accent'].forEach(prefix => {
    assert.ok(
      css.includes(`.${prefix}-${firstColour}-80 {`),
      `Missing ".${prefix}-${firstColour}-80 {"`
    );
  });
});

test('generateColourUtilities includes bg-white', () => {
  const colours = generateAllColours(config.colours);
  const css = generateColourUtilities(colours);
  assert.ok(css.includes('.bg-white {'), 'Missing ".bg-white {"');
});

test('generateColourUtilities includes text-white', () => {
  const colours = generateAllColours(config.colours);
  const css = generateColourUtilities(colours);
  assert.ok(css.includes('.text-white {'), 'Missing ".text-white {"');
});

test('generateColourUtilities accent-brand-80 uses CSS variable', () => {
  const colours = generateAllColours(config.colours);
  const css = generateColourUtilities(colours);
  assert.ok(
    css.includes('.accent-brand-80 { accent-color: var(--color-brand-80); }'),
    'Missing correct accent-brand-80 rule — expected var(--color-brand-80)'
  );
});

// ─── 5. Typography Utilities ──────────────────────────────────────────────────

section('5. Typography Utilities');

test('generateTypographyUtilities includes text class for each config fontSize', () => {
  const css = generateTypographyUtilities(config);
  config.typography.fontSizes.forEach(size => {
    assert.ok(css.includes(`.text-${size.name} {`),
      `Missing ".text-${size.name} {"`);
  });
});

test('generateTypographyUtilities includes font-weight classes', () => {
  const css = generateTypographyUtilities(config);
  Object.keys(config.typography.fontWeights).forEach(weight => {
    assert.ok(css.includes(`.font-${weight} {`),
      `Missing ".font-${weight} {"`);
  });
});

test('generateTypographyUtilities includes text-left, text-center, text-right', () => {
  const css = generateTypographyUtilities(config);
  ['text-left', 'text-center', 'text-right'].forEach(cls => {
    assert.ok(css.includes(`.${cls} {`), `Missing ".${cls} {"`);
  });
});

// ─── 6. Spacing Utilities ─────────────────────────────────────────────────────

section('6. Spacing Utilities');

test('generateSpacingUtilities includes p-4', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const css = generateSpacingUtilities(spacing);
  assert.ok(css.includes('.p-4 {'), 'Missing ".p-4 {"');
});

test('generateSpacingUtilities includes mx-auto', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const css = generateSpacingUtilities(spacing);
  assert.ok(css.includes('.mx-auto {'), 'Missing ".mx-auto {"');
});

test('generateSpacingUtilities includes px- and py- variants', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const css = generateSpacingUtilities(spacing);
  assert.ok(css.includes('.px-4 {'), 'Missing ".px-4 {"');
  assert.ok(css.includes('.py-4 {'), 'Missing ".py-4 {"');
});

test('generateSpacingUtilities handles decimal keys like p-0.5', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const css = generateSpacingUtilities(spacing);
  assert.ok(
    css.includes('.p-0\\.5 {'),
    'Missing escaped decimal class ".p-0\\.5 {" — decimal spacing not properly escaped'
  );
});

// ─── 7. State Variants ────────────────────────────────────────────────────────

section('7. State Variants');

test('addStateVariants generates hover: prefix', () => {
  const base = '.bg-primary-80 { background-color: #0077B6; }\n';
  const result = addStateVariants(base);
  assert.ok(
    result.includes('.hover\\:bg-primary-80:hover {'),
    'Missing hover variant for bg-primary-80'
  );
});

test('addStateVariants generates focus-visible: prefix', () => {
  const base = '.ring-2 { box-shadow: 0 0 0 2px; }\n';
  const result = addStateVariants(base);
  assert.ok(
    result.includes('.focus-visible\\:ring-2:focus-visible {'),
    'Missing focus-visible variant for ring-2'
  );
});

test('addStateVariants generates active: prefix', () => {
  const base = '.scale-95 { transform: scale(0.95); }\n';
  const result = addStateVariants(base);
  assert.ok(
    result.includes('.active\\:scale-95:active {'),
    'Missing active variant for scale-95'
  );
});

test('addStateVariants generates disabled: prefix', () => {
  const base = '.opacity-50 { opacity: 0.5; }\n';
  const result = addStateVariants(base);
  assert.ok(
    result.includes('.disabled\\:opacity-50:disabled {'),
    'Missing disabled variant for opacity-50'
  );
});

test('addStateVariants does not double-process existing state variants', () => {
  const base = '.bg-primary-80 { background-color: #0077B6; }\n';
  const result = addStateVariants(base);
  // Should not produce .hover\:hover\:bg-... or similar double-prefixed classes
  assert.ok(
    !result.includes('hover\\:hover\\:'),
    'State variants being double-processed'
  );
});

// ─── 8. Responsive Variants ───────────────────────────────────────────────────

section('8. Responsive Variants');

test('addResponsiveVariants wraps rules in @media queries', () => {
  const base = '.flex { display: flex; }\n';
  const result = addResponsiveVariants(base, config);
  assert.ok(result.includes('@media (min-width:'), 'No @media query found');
});

test('addResponsiveVariants generates sm: prefix inside media query', () => {
  const base = '.flex { display: flex; }\n';
  const result = addResponsiveVariants(base, config);
  assert.ok(
    result.includes('.sm\\:flex {'),
    'Missing sm:flex in responsive variants'
  );
});

test('addResponsiveVariants generates a variant for each configured breakpoint', () => {
  const base = '.flex { display: flex; }\n';
  const result = addResponsiveVariants(base, config);
  Object.keys(config.breakpoints).forEach(bp => {
    // 2xl needs escaping in the test assertion
    const escaped = bp.replace('2', '2');
    assert.ok(
      result.includes(`@media (min-width: ${config.breakpoints[bp]})`),
      `Missing @media query for breakpoint ${bp}`
    );
  });
});

// ─── 9. Purge System ──────────────────────────────────────────────────────────

section('9. Purge System');

test('extractClassNames extracts classes from class="..." attribute', () => {
  const html = '<div class="flex items-center gap-4">test</div>';
  const classes = extractClassNames(html);
  assert.ok(classes.has('flex'), 'Missing "flex"');
  assert.ok(classes.has('items-center'), 'Missing "items-center"');
  assert.ok(classes.has('gap-4'), 'Missing "gap-4"');
});

test('extractClassNames handles variant classes like hover:bg-primary-80', () => {
  const html = '<button class="hover:bg-primary-80 focus-visible:ring-2">click</button>';
  const classes = extractClassNames(html);
  assert.ok(classes.has('hover:bg-primary-80'), 'Missing "hover:bg-primary-80"');
  assert.ok(classes.has('focus-visible:ring-2'), 'Missing "focus-visible:ring-2"');
});

test('extractClassNames handles responsive variants like md:flex', () => {
  const html = '<div class="md:flex lg:grid-cols-3">test</div>';
  const classes = extractClassNames(html);
  assert.ok(classes.has('md:flex'), 'Missing "md:flex"');
  assert.ok(classes.has('lg:grid-cols-3'), 'Missing "lg:grid-cols-3"');
});

test('extractClassNames handles decimal class names like p-0.5', () => {
  const html = '<div class="p-0.5 m-1.5">test</div>';
  const classes = extractClassNames(html);
  assert.ok(classes.has('p-0.5'), 'Missing "p-0.5"');
  assert.ok(classes.has('m-1.5'), 'Missing "m-1.5"');
});

test('purgeCSS keeps rules for classes that are used', () => {
  const css = '.flex { display: flex; }\n.hidden { display: none; }\n';
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emily-test-'));
  fs.writeFileSync(path.join(tmpDir, 'test.html'), '<div class="flex">test</div>');
  const result = purgeCSS(css, tmpDir, isolatedPurgeConfig(tmpDir));
  assert.ok(result.includes('.flex {'), 'Should keep .flex (it is used)');
  assert.ok(!result.includes('.hidden {'), 'Should remove .hidden (not used)');
  fs.rmSync(tmpDir, { recursive: true });
});

test('purgeCSS keeps hover variants when base class is used', () => {
  const css = '.bg-primary-80 { background-color: blue; }\n.hover\\:bg-primary-80:hover { background-color: blue; }\n';
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emily-test-'));
  fs.writeFileSync(path.join(tmpDir, 'test.html'), '<div class="hover:bg-primary-80">test</div>');
  const result = purgeCSS(css, tmpDir, config);
  assert.ok(result.includes('.hover\\:bg-primary-80:hover {'), 'Should keep hover variant when class is used in HTML');
  fs.rmSync(tmpDir, { recursive: true });
});

test('purgeCSS keeps focus-visible variants when class is used', () => {
  const css = '.ring-2 { box-shadow: 0 0 0 2px var(--ring-color, transparent); }\n.focus-visible\\:ring-2:focus-visible { box-shadow: 0 0 0 2px var(--ring-color, transparent); }\n';
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emily-test-'));
  fs.writeFileSync(path.join(tmpDir, 'test.html'), '<input class="focus-visible:ring-2">');
  const result = purgeCSS(css, tmpDir, config);
  assert.ok(result.includes('.focus-visible\\:ring-2:focus-visible {'), 'Should keep focus-visible variant when class is used in HTML');
  fs.rmSync(tmpDir, { recursive: true });
});

test('purgeCSS keeps aria-expanded variant when class is used', () => {
  const css = '.block { display: block; }\n.aria-expanded\\:block[aria-expanded="true"] { display: block; }\n';
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emily-aria-test-'));
  fs.writeFileSync(path.join(tmpDir, 'test.html'), '<button aria-expanded="true" class="aria-expanded:block"></button>');
  const result = purgeCSS(css, tmpDir, isolatedPurgeConfig(tmpDir));
  assert.ok(
    result.includes('.aria-expanded\\:block[aria-expanded="true"]'),
    'Should keep aria-expanded variant when class is used'
  );
  fs.rmSync(tmpDir, { recursive: true });
});

test('purgeCSS keeps data-open variant when class is used', () => {
  const css = '.flex { display: flex; }\n.data-open\\:flex[data-state="open"] { display: flex; }\n';
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emily-data-test-'));
  fs.writeFileSync(path.join(tmpDir, 'test.html'), '<div data-state="open" class="data-open:flex"></div>');
  const result = purgeCSS(css, tmpDir, isolatedPurgeConfig(tmpDir));
  assert.ok(
    result.includes('.data-open\\:flex[data-state="open"]'),
    'Should keep data-open variant when class is used'
  );
  fs.rmSync(tmpDir, { recursive: true });
});

test('purgeCSS returns full CSS when no HTML files found', () => {
  const css = '.flex { display: flex; }\n';
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emily-test-'));
  // No HTML files in dir
  const result = purgeCSS(css, tmpDir, config);
  assert.ok(result.includes('.flex {'), 'Should return full CSS when no HTML found');
  fs.rmSync(tmpDir, { recursive: true });
});

// ─── 10. Config Integrity ─────────────────────────────────────────────────────

section('10. Config Integrity');

test('config has required top-level keys', () => {
  const required = ['colours', 'spacing', 'typography', 'breakpoints', 'shadows'];
  required.forEach(key => {
    assert.ok(config[key] !== undefined, `Config missing required key: "${key}"`);
  });
});

test('config.colours has at least brand, success, error, neutral', () => {
  const required = ['brand', 'success', 'error', 'neutral'];
  required.forEach(colour => {
    assert.ok(config.colours[colour], `Config missing colour: "${colour}"`);
  });
});

test('config.colours all values are valid hex strings', () => {
  Object.entries(config.colours).forEach(([name, hex]) => {
    assert.match(hex, /^#[0-9A-Fa-f]{6}$/,
      `config.colours.${name} = "${hex}" is not a valid hex colour`);
  });
});

test('config.spacing.borderRadius has a "base" key', () => {
  assert.ok(
    config.spacing.borderRadius.base !== undefined,
    'config.spacing.borderRadius missing "base" key — .rounded will fail'
  );
});

test('config.spacing.borderWidths is a non-empty array', () => {
  assert.ok(
    Array.isArray(config.spacing.borderWidths) && config.spacing.borderWidths.length > 0,
    'config.spacing.borderWidths must be a non-empty array'
  );
});

test('config.typography.fontSizes is a non-empty array', () => {
  assert.ok(
    Array.isArray(config.typography.fontSizes) && config.typography.fontSizes.length > 0,
    'config.typography.fontSizes must be a non-empty array'
  );
});

test('config.typography.fontSizes each entry has name and value', () => {
  config.typography.fontSizes.forEach((size, i) => {
    assert.ok(size.name, `fontSizes[${i}] missing "name"`);
    assert.ok(size.value, `fontSizes[${i}] missing "value"`);
  });
});

test('config.breakpoints has sm, md, lg, xl', () => {
  ['sm', 'md', 'lg', 'xl'].forEach(bp => {
    assert.ok(config.breakpoints[bp], `config.breakpoints missing "${bp}"`);
  });
});

// ─── 11. Font CSS Generation ─────────────────────────────────────────────────

section('11. Font CSS Generation');

const { generateFontCSS } = require('../src/index.js');

test('object format: no @import generated — font loading is the user\'s responsibility', () => {
  const { fontFace } = generateFontCSS({ fontFamily: { heading: 'lexend', body: 'inter' } });
  assert.strictEqual(fontFace, '', 'Should produce no @import — emilyCSS does not load font files');
});

test('object format: no @import even when heading and body use the same font', () => {
  const { fontFace } = generateFontCSS({ fontFamily: { heading: 'inter', body: 'inter' } });
  const count = (fontFace.match(/@import/g) || []).length;
  assert.strictEqual(count, 0, 'Should have no @import');
});

test('object format: sets body font-family on body element', () => {
  const { bodyFont } = generateFontCSS({ fontFamily: { heading: 'lexend', body: 'inter' } });
  assert.ok(bodyFont.includes('body {'), 'Missing body rule');
  assert.ok(bodyFont.includes('"Inter"'), 'Body should use Inter');
});

test('object format: sets heading font-family on h1-h6', () => {
  const { bodyFont } = generateFontCSS({ fontFamily: { heading: 'lexend', body: 'inter' } });
  assert.ok(bodyFont.includes('h1, h2, h3, h4, h5, h6'), 'Missing heading rule');
  assert.ok(bodyFont.includes('"Lexend"'), 'Headings should use Lexend');
});

test('string format: backwards compat — single font applied to both body and headings', () => {
  const { fontFace, bodyFont } = generateFontCSS({ fontFamily: 'inter' });
  assert.strictEqual(fontFace, '', 'Should produce no @import');
  assert.ok(bodyFont.includes('"Inter"'), 'Body should use Inter font stack');
  assert.ok(bodyFont.includes('h1, h2, h3, h4, h5, h6'), 'Missing heading rule');
});

test('no @import for any font preset', () => {
  const { fontFace } = generateFontCSS({ fontFamily: { heading: 'georgia', body: 'system' } });
  assert.strictEqual(fontFace, '', 'Should have no @import for any font preset');
});

// ─── 12. Build Output (integration) ──────────────────────────────────────────

section('12. Build Output (integration)');



const builtCss = fs.existsSync(path.join(__dirname, '../dist/emily.css'))
  ? fs.readFileSync(path.join(__dirname, '../dist/emily.css'), 'utf8')
  : null;

function requireBuild(name, fn) {
  if (!builtCss) {
    console.log(`  ⚠  ${name} (skipped — run npm run build first)`);
    return;
  }
  test(name, fn);
}

requireBuild('.rounded exists in built CSS', () => {
  assert.ok(builtCss.includes('.rounded {'),
    'Missing ".rounded {" in dist/emily.css — check generateBorderUtilities');
});

requireBuild('.border-l-4 exists in built CSS', () => {
  assert.ok(builtCss.includes('.border-l-4 {'), 'Missing ".border-l-4 {"');
});

requireBuild('.accent-brand-80 exists in built CSS', () => {
  assert.ok(builtCss.includes('.accent-brand-80 {'), 'Missing ".accent-brand-80 {"');
});

requireBuild('.sr-only exists in built CSS', () => {
  assert.ok(builtCss.includes('.sr-only {'), 'Missing ".sr-only {"');
});

requireBuild('hover:bg-brand-80 state variant exists', () => {
  assert.ok(
    builtCss.includes('.hover\\:bg-brand-80:hover {'),
    'Missing ".hover\\:bg-brand-80:hover {"'
  );
});

requireBuild('focus-visible:ring-2 state variant exists', () => {
  assert.ok(
    builtCss.includes('.focus-visible\\:ring-2:focus-visible {'),
    'Missing focus-visible:ring-2 variant'
  );
});

requireBuild('sm: responsive variant exists inside @media', () => {
  assert.ok(
    builtCss.includes('.sm\\:flex {'),
    'Missing ".sm\\:flex {" responsive variant'
  );
});

requireBuild('no --tw- variables in output', () => {
  assert.ok(
    !builtCss.includes('--tw-'),
    'Found --tw- variable — should be --emily- or removed'
  );
});

requireBuild('CSS variables block exists at top', () => {
  assert.ok(builtCss.includes(':root {'), 'Missing :root { CSS variables block');
});

requireBuild('all 6 colour backgrounds exist in built CSS', () => {
  Object.keys(config.colours).forEach(name => {
    assert.ok(
      builtCss.includes(`.bg-${name}-80 {`),
      `Missing ".bg-${name}-80 {" in built CSS`
    );
  });
});

// ─── 13. New Utilities ────────────────────────────────────────────────────────

// animationUtilities and backdropUtilities imported below via generators.js
const { overflowUtilities, sizingUtilities, positioningUtilities, displayUtilities, shadowUtilities, contentScrollUtilities, spaceUtilities, divideUtilities, backgroundUtilities, filterUtilities, opacityUtilities, cursorUtilities, ringUtilities, animationUtilities, backdropUtilities } = require('../src/generators.js');

section('13. New Utilities');

// Animations
test('animationUtilities includes @keyframes spin', () => {
  const css = animationUtilities();
  assert.ok(css.includes('@keyframes spin'), 'Missing @keyframes spin');
});

test('animationUtilities includes @keyframes ping', () => {
  const css = animationUtilities();
  assert.ok(css.includes('@keyframes ping'), 'Missing @keyframes ping');
});

test('animationUtilities includes @keyframes pulse', () => {
  const css = animationUtilities();
  assert.ok(css.includes('@keyframes pulse'), 'Missing @keyframes pulse');
});

test('animationUtilities includes @keyframes bounce', () => {
  const css = animationUtilities();
  assert.ok(css.includes('@keyframes bounce'), 'Missing @keyframes bounce');
});

test('animationUtilities includes .animate-spin', () => {
  const css = animationUtilities();
  assert.ok(css.includes('.animate-spin {'), 'Missing .animate-spin');
});

test('animationUtilities includes .animate-pulse', () => {
  const css = animationUtilities();
  assert.ok(css.includes('.animate-pulse {'), 'Missing .animate-pulse');
});

test('animationUtilities includes .animate-ping', () => {
  const css = animationUtilities();
  assert.ok(css.includes('.animate-ping {'), 'Missing .animate-ping');
});

test('animationUtilities includes .animate-bounce', () => {
  const css = animationUtilities();
  assert.ok(css.includes('.animate-bounce {'), 'Missing .animate-bounce');
});

test('animationUtilities includes .animate-none', () => {
  const css = animationUtilities();
  assert.ok(css.includes('.animate-none {'), 'Missing .animate-none');
});

// Backdrop filters
test('backdropUtilities includes .backdrop-blur-sm', () => {
  const css = backdropUtilities();
  assert.ok(css.includes('.backdrop-blur-sm {'), 'Missing .backdrop-blur-sm');
});

test('backdropUtilities includes .backdrop-blur-md', () => {
  const css = backdropUtilities();
  assert.ok(css.includes('.backdrop-blur-md {'), 'Missing .backdrop-blur-md');
});

test('backdropUtilities includes .backdrop-blur-xl', () => {
  const css = backdropUtilities();
  assert.ok(css.includes('.backdrop-blur-xl {'), 'Missing .backdrop-blur-xl');
});

test('backdropUtilities .backdrop-blur-md uses blur(12px)', () => {
  const css = backdropUtilities();
  assert.ok(
    css.includes('.backdrop-blur-md { backdrop-filter: blur(12px); }'),
    'backdrop-blur-md should use blur(12px)'
  );
});

// line-clamp-1
test('overflowUtilities includes .line-clamp-1', () => {
  const css = overflowUtilities();
  assert.ok(css.includes('.line-clamp-1 {'), 'Missing .line-clamp-1');
});

test('overflowUtilities line-clamp-1 uses -webkit-line-clamp: 1', () => {
  const css = overflowUtilities();
  assert.ok(
    css.includes('-webkit-line-clamp: 1;'),
    'line-clamp-1 should set -webkit-line-clamp: 1'
  );
});

// max-w-prose
test('sizingUtilities includes .max-w-prose', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const css = sizingUtilities(spacing);
  assert.ok(css.includes('.max-w-prose {'), 'Missing .max-w-prose');
});

test('sizingUtilities .max-w-prose uses 65ch', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const css = sizingUtilities(spacing);
  assert.ok(
    css.includes('.max-w-prose { max-width: 65ch; }'),
    'max-w-prose should be max-width: 65ch'
  );
});

// Scroll snap align
test('contentScrollUtilities includes .snap-start', () => {
  const css = contentScrollUtilities();
  assert.ok(css.includes('.snap-start {'), 'Missing .snap-start');
});

test('contentScrollUtilities includes .snap-center', () => {
  const css = contentScrollUtilities();
  assert.ok(css.includes('.snap-center {'), 'Missing .snap-center');
});

test('contentScrollUtilities includes .snap-end', () => {
  const css = contentScrollUtilities();
  assert.ok(css.includes('.snap-end {'), 'Missing .snap-end');
});

test('contentScrollUtilities snap-center uses scroll-snap-align: center', () => {
  const css = contentScrollUtilities();
  assert.ok(
    css.includes('.snap-center { scroll-snap-align: center; }'),
    'snap-center should use scroll-snap-align: center'
  );
});

// Build output checks for new utilities
requireBuild('.animate-spin exists in built CSS', () => {
  assert.ok(builtCss.includes('.animate-spin {'), 'Missing .animate-spin in built CSS');
});

requireBuild('@keyframes spin exists in built CSS', () => {
  assert.ok(builtCss.includes('@keyframes spin'), 'Missing @keyframes spin in built CSS');
});

requireBuild('.backdrop-blur-md exists in built CSS', () => {
  assert.ok(builtCss.includes('.backdrop-blur-md {'), 'Missing .backdrop-blur-md in built CSS');
});

requireBuild('.line-clamp-1 exists in built CSS', () => {
  assert.ok(builtCss.includes('.line-clamp-1 {'), 'Missing .line-clamp-1 in built CSS');
});

requireBuild('.max-w-prose exists in built CSS', () => {
  assert.ok(builtCss.includes('.max-w-prose {'), 'Missing .max-w-prose in built CSS');
});

requireBuild('.snap-center exists in built CSS', () => {
  assert.ok(builtCss.includes('.snap-center {'), 'Missing .snap-center in built CSS');
});


// ─── Section 14: Round 2 Utilities ───────────────────────────────────────────



// --- Opacity expanded scale ---
test('opacityUtilities includes .opacity-5', () => {
  const css = opacityUtilities();
  assert.ok(css.includes('.opacity-5 {'), 'Missing .opacity-5');
});

test('opacityUtilities includes .opacity-25', () => {
  const css = opacityUtilities();
  assert.ok(css.includes('.opacity-25 {'), 'Missing .opacity-25');
});

test('opacityUtilities includes .opacity-75', () => {
  const css = opacityUtilities();
  assert.ok(css.includes('.opacity-75 {'), 'Missing .opacity-75');
});

test('opacityUtilities includes .opacity-95', () => {
  const css = opacityUtilities();
  assert.ok(css.includes('.opacity-95 {'), 'Missing .opacity-95');
});

// --- Resize ---
test('cursorUtilities includes .resize-none', () => {
  const css = cursorUtilities();
  assert.ok(css.includes('.resize-none {'), 'Missing .resize-none');
});

test('cursorUtilities includes .resize-x', () => {
  const css = cursorUtilities();
  assert.ok(css.includes('.resize-x {'), 'Missing .resize-x');
});

test('cursorUtilities includes .resize-y', () => {
  const css = cursorUtilities();
  assert.ok(css.includes('.resize-y {'), 'Missing .resize-y');
});

test('cursorUtilities .resize-x uses resize: horizontal', () => {
  const css = cursorUtilities();
  assert.ok(
    css.includes('.resize-x { resize: horizontal; }'),
    'resize-x should use resize: horizontal'
  );
});

// --- Isolation ---
test('cursorUtilities includes .isolate', () => {
  const css = cursorUtilities();
  assert.ok(css.includes('.isolate {'), 'Missing .isolate');
});

test('cursorUtilities includes .isolation-auto', () => {
  const css = cursorUtilities();
  assert.ok(css.includes('.isolation-auto {'), 'Missing .isolation-auto');
});

// --- Will-change ---
test('cursorUtilities includes .will-change-auto', () => {
  const css = cursorUtilities();
  assert.ok(css.includes('.will-change-auto {'), 'Missing .will-change-auto');
});

test('cursorUtilities includes .will-change-transform', () => {
  const css = cursorUtilities();
  assert.ok(css.includes('.will-change-transform {'), 'Missing .will-change-transform');
});

// --- Outline offset ---
test('ringUtilities includes .outline-offset-2', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const colours = generateAllColours(config.colours);
  const css = ringUtilities(colours);
  assert.ok(css.includes('.outline-offset-2 {'), 'Missing .outline-offset-2');
});

test('ringUtilities includes .outline-offset-8', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const colours = generateAllColours(config.colours);
  const css = ringUtilities(colours);
  assert.ok(css.includes('.outline-offset-8 {'), 'Missing .outline-offset-8');
});

test('ringUtilities .outline-offset-4 uses 4px', () => {
  const colours = generateAllColours(config.colours);
  const css = ringUtilities(colours);
  assert.ok(
    css.includes('.outline-offset-4 { outline-offset: 4px; }'),
    'outline-offset-4 should use 4px'
  );
});

// --- Caret color ---
test('formUtilities includes .caret-transparent', () => {
  const { formUtilities: fu } = require('../src/generators.js');
  const css = fu();
  assert.ok(css.includes('.caret-transparent {'), 'Missing .caret-transparent');
});

test('formUtilities includes .caret-current', () => {
  const { formUtilities: fu } = require('../src/generators.js');
  const css = fu();
  assert.ok(css.includes('.caret-current {'), 'Missing .caret-current');
});

// --- Font variant numeric ---
test('generateTypographyUtilities includes .tabular-nums', () => {
  const css = generateTypographyUtilities(config);
  assert.ok(css.includes('.tabular-nums {'), 'Missing .tabular-nums');
});

test('generateTypographyUtilities includes .ordinal', () => {
  const css = generateTypographyUtilities(config);
  assert.ok(css.includes('.ordinal {'), 'Missing .ordinal');
});

test('generateTypographyUtilities includes .slashed-zero', () => {
  const css = generateTypographyUtilities(config);
  assert.ok(css.includes('.slashed-zero {'), 'Missing .slashed-zero');
});

test('generateTypographyUtilities .tabular-nums uses font-variant-numeric: tabular-nums', () => {
  const css = generateTypographyUtilities(config);
  assert.ok(
    css.includes('.tabular-nums { font-variant-numeric: tabular-nums; }'),
    'tabular-nums should use font-variant-numeric: tabular-nums'
  );
});

// --- Text underline offset ---
test('generateTypographyUtilities includes .underline-offset-2', () => {
  const css = generateTypographyUtilities(config);
  assert.ok(css.includes('.underline-offset-2 {'), 'Missing .underline-offset-2');
});

test('generateTypographyUtilities includes .underline-offset-auto', () => {
  const css = generateTypographyUtilities(config);
  assert.ok(css.includes('.underline-offset-auto {'), 'Missing .underline-offset-auto');
});

test('generateTypographyUtilities .underline-offset-4 uses text-underline-offset: 4px', () => {
  const css = generateTypographyUtilities(config);
  assert.ok(
    css.includes('.underline-offset-4 { text-underline-offset: 4px; }'),
    'underline-offset-4 should use text-underline-offset: 4px'
  );
});

// --- Space between ---
test('spaceUtilities generates .space-x-1', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const css = spaceUtilities(spacing);
  assert.ok(css.includes('.space-x-1 >'), 'Missing .space-x-1');
});

test('spaceUtilities generates .space-y-1', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const css = spaceUtilities(spacing);
  assert.ok(css.includes('.space-y-1 >'), 'Missing .space-y-1');
});

test('spaceUtilities includes .space-x-auto', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const css = spaceUtilities(spacing);
  assert.ok(css.includes('.space-x-auto >'), 'Missing .space-x-auto');
});

test('spaceUtilities uses > * + * selector', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const css = spaceUtilities(spacing);
  assert.ok(css.includes('> * + *'), 'space utilities should use > * + * selector');
});

test('spaceUtilities includes negative variant', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const css = spaceUtilities(spacing);
  assert.ok(css.includes('.-space-x-'), 'Missing negative space-x variant');
});

// --- Divide ---
test('divideUtilities includes .divide-x', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const colours = generateAllColours(config.colours);
  const css = divideUtilities(spacing, colours);
  assert.ok(css.includes('.divide-x >'), 'Missing .divide-x');
});

test('divideUtilities includes .divide-y', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const colours = generateAllColours(config.colours);
  const css = divideUtilities(spacing, colours);
  assert.ok(css.includes('.divide-y >'), 'Missing .divide-y');
});

test('divideUtilities includes .divide-x-2', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const colours = generateAllColours(config.colours);
  const css = divideUtilities(spacing, colours);
  assert.ok(css.includes('.divide-x-2 >'), 'Missing .divide-x-2');
});

test('divideUtilities includes .divide-solid', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const colours = generateAllColours(config.colours);
  const css = divideUtilities(spacing, colours);
  assert.ok(css.includes('.divide-solid >'), 'Missing .divide-solid');
});

test('divideUtilities includes colour variants', () => {
  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  const colours = generateAllColours(config.colours);
  const css = divideUtilities(spacing, colours);
  assert.ok(css.includes('.divide-brand-'), 'Missing .divide-brand-* colour variants');
});

// --- Background utilities ---
test('backgroundUtilities includes .bg-cover', () => {
  const css = backgroundUtilities();
  assert.ok(css.includes('.bg-cover {'), 'Missing .bg-cover');
});

test('backgroundUtilities includes .bg-contain', () => {
  const css = backgroundUtilities();
  assert.ok(css.includes('.bg-contain {'), 'Missing .bg-contain');
});

test('backgroundUtilities includes .bg-no-repeat', () => {
  const css = backgroundUtilities();
  assert.ok(css.includes('.bg-no-repeat {'), 'Missing .bg-no-repeat');
});

test('backgroundUtilities includes .bg-center', () => {
  const css = backgroundUtilities();
  assert.ok(css.includes('.bg-center {'), 'Missing .bg-center');
});

test('backgroundUtilities includes .bg-clip-text', () => {
  const css = backgroundUtilities();
  assert.ok(css.includes('.bg-clip-text {'), 'Missing .bg-clip-text');
});

test('backgroundUtilities includes .bg-fixed', () => {
  const css = backgroundUtilities();
  assert.ok(css.includes('.bg-fixed {'), 'Missing .bg-fixed');
});

// --- CSS Filters ---
test('filterUtilities includes .filter-none', () => {
  const css = filterUtilities();
  assert.ok(css.includes('.filter-none {'), 'Missing .filter-none');
});

test('filterUtilities includes .blur-sm', () => {
  const css = filterUtilities();
  assert.ok(css.includes('.blur-sm {'), 'Missing .blur-sm');
});

test('filterUtilities includes .brightness-100', () => {
  const css = filterUtilities();
  assert.ok(css.includes('.brightness-100 {'), 'Missing .brightness-100');
});

test('filterUtilities includes .grayscale', () => {
  const css = filterUtilities();
  assert.ok(css.includes('.grayscale {'), 'Missing .grayscale');
});

test('filterUtilities includes .invert', () => {
  const css = filterUtilities();
  assert.ok(css.includes('.invert {'), 'Missing .invert');
});

test('filterUtilities .blur-sm uses blur(4px)', () => {
  const css = filterUtilities();
  assert.ok(
    css.includes('.blur-sm { filter: blur(4px); }'),
    'blur-sm should use blur(4px)'
  );
});

test('filterUtilities includes .hue-rotate-90', () => {
  const css = filterUtilities();
  assert.ok(css.includes('.hue-rotate-90 {'), 'Missing .hue-rotate-90');
});

// Build output checks for Round 2 utilities
requireBuild('.space-x-4 exists in built CSS', () => {
  assert.ok(builtCss.includes('.space-x-4 >'), 'Missing .space-x-4 in built CSS');
});

requireBuild('.divide-x exists in built CSS', () => {
  assert.ok(builtCss.includes('.divide-x >'), 'Missing .divide-x in built CSS');
});

requireBuild('.bg-cover exists in built CSS', () => {
  assert.ok(builtCss.includes('.bg-cover {'), 'Missing .bg-cover in built CSS');
});

requireBuild('.blur-sm exists in built CSS', () => {
  assert.ok(builtCss.includes('.blur-sm {'), 'Missing .blur-sm in built CSS');
});

requireBuild('.tabular-nums exists in built CSS', () => {
  assert.ok(builtCss.includes('.tabular-nums {'), 'Missing .tabular-nums in built CSS');
});

requireBuild('.underline-offset-2 exists in built CSS', () => {
  assert.ok(builtCss.includes('.underline-offset-2 {'), 'Missing .underline-offset-2 in built CSS');
});

requireBuild('.opacity-25 exists in built CSS', () => {
  assert.ok(builtCss.includes('.opacity-25 {'), 'Missing .opacity-25 in built CSS');
});

requireBuild('.resize-x exists in built CSS', () => {
  assert.ok(builtCss.includes('.resize-x {'), 'Missing .resize-x in built CSS');
});

requireBuild('.will-change-transform exists in built CSS', () => {
  assert.ok(builtCss.includes('.will-change-transform {'), 'Missing .will-change-transform in built CSS');
});

requireBuild('.outline-offset-4 exists in built CSS', () => {
  assert.ok(builtCss.includes('.outline-offset-4 {'), 'Missing .outline-offset-4 in built CSS');
});


// ─── 15. Patch — New Utility Coverage ────────────────────────────────────────
//
// Tests for features added in the generators.js / index.js / init.js patches:
//   - Extended sizing (size-*, fractions, viewport units, min/max content)
//   - Negative & axis-based positioning
//   - Display extensions (flow-root, float, clear, table)
//   - Overflow extensions (clip, scroll, text-ellipsis)
//   - Extended shadows (xl, 2xl, inner)
//   - Extended cursors + touch-action
//   - Flex basis, order, content/place alignment
//   - Grid extensions (subgrid, expanded rows, flow, auto)
//   - Extended border sides (x, y, s, e)
//   - Per-side named border-radius
//   - New font families + normal-case
//   - Underline-offset-0 + decoration-0 (from array loops)
//   - 5xl–9xl font sizes in init defaults
// ─────────────────────────────────────────────────────────────────────────────

section('15. Patch — New Utility Coverage');

const testSpacing = generateSpacing('18px', config.spacing.scale);

// ── Display extensions ──────────────────────────────────────────────────────

test('displayUtilities includes flow-root', () => {
  const css = displayUtilities();
  assert.ok(css.includes('.flow-root { display: flow-root; }'), 'Missing .flow-root');
});

test('displayUtilities includes list-item', () => {
  const css = displayUtilities();
  assert.ok(css.includes('.list-item { display: list-item; }'), 'Missing .list-item');
});

test('displayUtilities includes table variants', () => {
  const css = displayUtilities();
  assert.ok(css.includes('.table { display: table; }'), 'Missing .table');
  assert.ok(css.includes('.table-cell { display: table-cell; }'), 'Missing .table-cell');
  assert.ok(css.includes('.inline-table { display: inline-table; }'), 'Missing .inline-table');
});

test('displayUtilities includes float utilities', () => {
  const css = displayUtilities();
  assert.ok(css.includes('.float-left { float: left; }'), 'Missing .float-left');
  assert.ok(css.includes('.float-right { float: right; }'), 'Missing .float-right');
  assert.ok(css.includes('.float-none { float: none; }'), 'Missing .float-none');
  assert.ok(css.includes('.float-start { float: inline-start; }'), 'Missing .float-start');
});

test('displayUtilities includes clear utilities', () => {
  const css = displayUtilities();
  assert.ok(css.includes('.clear-both { clear: both; }'), 'Missing .clear-both');
  assert.ok(css.includes('.clear-left { clear: left; }'), 'Missing .clear-left');
  assert.ok(css.includes('.clear-none { clear: none; }'), 'Missing .clear-none');
});

// ── Sizing extensions ───────────────────────────────────────────────────────

test('sizingUtilities generates size-* (combined width + height)', () => {
  const css = sizingUtilities(testSpacing);
  assert.ok(css.includes('.size-4 { width: 1rem; height: 1rem; }'), 'Missing .size-4');
});

test('sizingUtilities generates fractional widths', () => {
  const css = sizingUtilities(testSpacing);
  assert.ok(css.includes('.w-1\\/2 { width: 50%; }'), 'Missing .w-1/2');
  assert.ok(css.includes('.w-1\\/3 { width: 33.333333%; }'), 'Missing .w-1/3');
  assert.ok(css.includes('.w-2\\/3 { width: 66.666667%; }'), 'Missing .w-2/3');
  assert.ok(css.includes('.w-3\\/4 { width: 75%; }'), 'Missing .w-3/4');
});

test('sizingUtilities generates fractional heights', () => {
  const css = sizingUtilities(testSpacing);
  assert.ok(css.includes('.h-1\\/2 { height: 50%; }'), 'Missing .h-1/2');
  assert.ok(css.includes('.h-1\\/4 { height: 25%; }'), 'Missing .h-1/4');
});

test('sizingUtilities generates fractional size-*', () => {
  const css = sizingUtilities(testSpacing);
  assert.ok(css.includes('.size-1\\/2 { width: 50%; height: 50%; }'), 'Missing .size-1/2');
});

test('sizingUtilities generates viewport unit classes', () => {
  const css = sizingUtilities(testSpacing);
  assert.ok(css.includes('.w-svw { width: 100svw; }'), 'Missing .w-svw');
  assert.ok(css.includes('.h-svh { height: 100svh; }'), 'Missing .h-svh');
  assert.ok(css.includes('.w-dvw { width: 100dvw; }'), 'Missing .w-dvw');
  assert.ok(css.includes('.h-dvh { height: 100dvh; }'), 'Missing .h-dvh');
  assert.ok(css.includes('.w-lvw { width: 100lvw; }'), 'Missing .w-lvw');
  assert.ok(css.includes('.h-lvh { height: 100lvh; }'), 'Missing .h-lvh');
});

test('sizingUtilities generates min/max content sizing', () => {
  const css = sizingUtilities(testSpacing);
  assert.ok(css.includes('.w-min { width: min-content; }'), 'Missing .w-min');
  assert.ok(css.includes('.w-max { width: max-content; }'), 'Missing .w-max');
  assert.ok(css.includes('.w-fit { width: fit-content; }'), 'Missing .w-fit');
  assert.ok(css.includes('.h-min { height: min-content; }'), 'Missing .h-min');
  assert.ok(css.includes('.h-max { height: max-content; }'), 'Missing .h-max');
  assert.ok(css.includes('.h-fit { height: fit-content; }'), 'Missing .h-fit');
});

test('sizingUtilities generates size-auto and size-full', () => {
  const css = sizingUtilities(testSpacing);
  assert.ok(css.includes('.size-auto { width: auto; height: auto; }'), 'Missing .size-auto');
  assert.ok(css.includes('.size-full { width: 100%; height: 100%; }'), 'Missing .size-full');
});

test('sizingUtilities generates min-w fit/max/min content', () => {
  const css = sizingUtilities(testSpacing);
  assert.ok(css.includes('.min-w-fit { min-width: fit-content; }'), 'Missing .min-w-fit');
  assert.ok(css.includes('.min-w-max { min-width: max-content; }'), 'Missing .min-w-max');
  assert.ok(css.includes('.min-h-dvh { min-height: 100dvh; }'), 'Missing .min-h-dvh');
});

test('sizingUtilities generates max-h-screen and viewport variants', () => {
  const css = sizingUtilities(testSpacing);
  assert.ok(css.includes('.max-h-screen { max-height: 100vh; }'), 'Missing .max-h-screen');
  assert.ok(css.includes('.max-h-svh { max-height: 100svh; }'), 'Missing .max-h-svh');
  assert.ok(css.includes('.max-w-none { max-width: none; }'), 'Missing .max-w-none');
  assert.ok(css.includes('.max-w-fit { max-width: fit-content; }'), 'Missing .max-w-fit');
});

test('sizingUtilities generates per-spacing min-w/min-h/max-w/max-h', () => {
  const css = sizingUtilities(testSpacing);
  assert.ok(css.includes('.min-w-4 { min-width: 1rem; }'), 'Missing .min-w-4');
  assert.ok(css.includes('.min-h-4 { min-height: 1rem; }'), 'Missing .min-h-4');
  assert.ok(css.includes('.max-w-4 { max-width: 1rem; }'), 'Missing .max-w-4');
  assert.ok(css.includes('.max-h-4 { max-height: 1rem; }'), 'Missing .max-h-4');
});

// ── Positioning extensions ──────────────────────────────────────────────────

test('positioningUtilities generates inset-x-* and inset-y-*', () => {
  const css = positioningUtilities(testSpacing);
  assert.ok(css.includes('.inset-x-4 { left: 1rem; right: 1rem; }'), 'Missing .inset-x-4');
  assert.ok(css.includes('.inset-y-4 { top: 1rem; bottom: 1rem; }'), 'Missing .inset-y-4');
});

test('positioningUtilities generates negative positioning utilities', () => {
  const css = positioningUtilities(testSpacing);
  assert.ok(css.includes('.-top-4 { top: -1rem; }'), 'Missing .-top-4');
  assert.ok(css.includes('.-right-4 { right: -1rem; }'), 'Missing .-right-4');
  assert.ok(css.includes('.-bottom-4 { bottom: -1rem; }'), 'Missing .-bottom-4');
  assert.ok(css.includes('.-left-4 { left: -1rem; }'), 'Missing .-left-4');
  assert.ok(css.includes('.-inset-4 { inset: -1rem; }'), 'Missing .-inset-4');
});

test('positioningUtilities generates negative inset-x and inset-y', () => {
  const css = positioningUtilities(testSpacing);
  assert.ok(css.includes('.-inset-x-4 { left: -1rem; right: -1rem; }'), 'Missing .-inset-x-4');
  assert.ok(css.includes('.-inset-y-4 { top: -1rem; bottom: -1rem; }'), 'Missing .-inset-y-4');
});

test('positioningUtilities does not generate negative class for 0 value', () => {
  const css = positioningUtilities(testSpacing);
  assert.ok(!css.includes('.-top-0 {'), 'Should not have .-top-0 (zero has no negative)');
});

test('positioningUtilities generates auto positioning', () => {
  const css = positioningUtilities(testSpacing);
  assert.ok(css.includes('.top-auto { top: auto; }'), 'Missing .top-auto');
  assert.ok(css.includes('.right-auto { right: auto; }'), 'Missing .right-auto');
  assert.ok(css.includes('.bottom-auto { bottom: auto; }'), 'Missing .bottom-auto');
  assert.ok(css.includes('.left-auto { left: auto; }'), 'Missing .left-auto');
  assert.ok(css.includes('.inset-x-auto { left: auto; right: auto; }'), 'Missing .inset-x-auto');
  assert.ok(css.includes('.inset-y-auto { top: auto; bottom: auto; }'), 'Missing .inset-y-auto');
});

// ── Overflow extensions ─────────────────────────────────────────────────────

test('overflowUtilities includes overflow-clip', () => {
  const css = overflowUtilities();
  assert.ok(css.includes('.overflow-clip { overflow: clip; }'), 'Missing .overflow-clip');
});

test('overflowUtilities includes overflow-x/y clip, visible, scroll', () => {
  const css = overflowUtilities();
  assert.ok(css.includes('.overflow-x-clip { overflow-x: clip; }'), 'Missing .overflow-x-clip');
  assert.ok(css.includes('.overflow-x-visible { overflow-x: visible; }'), 'Missing .overflow-x-visible');
  assert.ok(css.includes('.overflow-x-scroll { overflow-x: scroll; }'), 'Missing .overflow-x-scroll');
  assert.ok(css.includes('.overflow-y-clip { overflow-y: clip; }'), 'Missing .overflow-y-clip');
  assert.ok(css.includes('.overflow-y-visible { overflow-y: visible; }'), 'Missing .overflow-y-visible');
  assert.ok(css.includes('.overflow-y-scroll { overflow-y: scroll; }'), 'Missing .overflow-y-scroll');
});

test('overflowUtilities includes text-ellipsis and text-clip', () => {
  const css = overflowUtilities();
  assert.ok(css.includes('.text-ellipsis { text-overflow: ellipsis; }'), 'Missing .text-ellipsis');
  assert.ok(css.includes('.text-clip { text-overflow: clip; }'), 'Missing .text-clip');
});

test('overflowUtilities includes line-clamp-none', () => {
  const css = overflowUtilities();
  assert.ok(css.includes('.line-clamp-none {'), 'Missing .line-clamp-none');
});

// ── Shadow extensions ───────────────────────────────────────────────────────

test('shadowUtilities includes shadow-xl', () => {
  const css = shadowUtilities();
  assert.ok(css.includes('.shadow-xl {'), 'Missing .shadow-xl');
});

test('shadowUtilities includes shadow-2xl', () => {
  const css = shadowUtilities();
  assert.ok(css.includes('.shadow-2xl {'), 'Missing .shadow-2xl');
});

test('shadowUtilities includes shadow-inner', () => {
  const css = shadowUtilities();
  assert.ok(css.includes('.shadow-inner { box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06); }'), 'Missing .shadow-inner');
});

test('shadowUtilities .shadow uses multi-layer value', () => {
  const css = shadowUtilities();
  assert.ok(
    css.includes('.shadow { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06); }'),
    'shadow should use multi-layer value'
  );
});

// ── Cursor + touch-action extensions ───────────────────────────────────────

test('cursorUtilities includes extended cursor types', () => {
  const css = cursorUtilities();
  assert.ok(css.includes('.cursor-grab { cursor: grab; }'), 'Missing .cursor-grab');
  assert.ok(css.includes('.cursor-grabbing { cursor: grabbing; }'), 'Missing .cursor-grabbing');
  assert.ok(css.includes('.cursor-zoom-in { cursor: zoom-in; }'), 'Missing .cursor-zoom-in');
  assert.ok(css.includes('.cursor-zoom-out { cursor: zoom-out; }'), 'Missing .cursor-zoom-out');
  assert.ok(css.includes('.cursor-none { cursor: none; }'), 'Missing .cursor-none');
  assert.ok(css.includes('.cursor-crosshair { cursor: crosshair; }'), 'Missing .cursor-crosshair');
  assert.ok(css.includes('.cursor-no-drop { cursor: no-drop; }'), 'Missing .cursor-no-drop');
  assert.ok(css.includes('.cursor-copy { cursor: copy; }'), 'Missing .cursor-copy');
});

test('cursorUtilities includes touch-action utilities', () => {
  const css = cursorUtilities();
  assert.ok(css.includes('.touch-auto { touch-action: auto; }'), 'Missing .touch-auto');
  assert.ok(css.includes('.touch-none { touch-action: none; }'), 'Missing .touch-none');
  assert.ok(css.includes('.touch-pan-x { touch-action: pan-x; }'), 'Missing .touch-pan-x');
  assert.ok(css.includes('.touch-manipulation { touch-action: manipulation; }'), 'Missing .touch-manipulation');
});

// ── Flexbox extensions ──────────────────────────────────────────────────────

test('generateFlexboxUtilities includes flex-initial', () => {
  const css = generateFlexboxUtilities(testSpacing);
  assert.ok(css.includes('.flex-initial { flex: 0 1 auto; }'), 'Missing .flex-initial');
});

test('generateFlexboxUtilities includes basis-auto and basis-full', () => {
  const css = generateFlexboxUtilities(testSpacing);
  assert.ok(css.includes('.basis-auto { flex-basis: auto; }'), 'Missing .basis-auto');
  assert.ok(css.includes('.basis-full { flex-basis: 100%; }'), 'Missing .basis-full');
});

test('generateFlexboxUtilities generates basis-* from spacing', () => {
  const css = generateFlexboxUtilities(testSpacing);
  assert.ok(css.includes('.basis-4 { flex-basis: 1rem; }'), 'Missing .basis-4');
  assert.ok(css.includes('.basis-8 { flex-basis: 2rem; }'), 'Missing .basis-8');
});

test('generateFlexboxUtilities generates fractional basis values', () => {
  const css = generateFlexboxUtilities(testSpacing);
  assert.ok(css.includes('.basis-1\\/2 { flex-basis: 50%; }'), 'Missing .basis-1/2');
  assert.ok(css.includes('.basis-1\\/3 { flex-basis: 33.333333%; }'), 'Missing .basis-1/3');
  assert.ok(css.includes('.basis-3\\/4 { flex-basis: 75%; }'), 'Missing .basis-3/4');
});

test('generateFlexboxUtilities includes order utilities', () => {
  const css = generateFlexboxUtilities(testSpacing);
  assert.ok(css.includes('.order-first { order: -9999; }'), 'Missing .order-first');
  assert.ok(css.includes('.order-last { order: 9999; }'), 'Missing .order-last');
  assert.ok(css.includes('.order-none { order: 0; }'), 'Missing .order-none');
  assert.ok(css.includes('.order-1 { order: 1; }'), 'Missing .order-1');
  assert.ok(css.includes('.order-12 { order: 12; }'), 'Missing .order-12');
});

test('generateFlexboxUtilities includes justify-normal and justify-stretch', () => {
  const css = generateFlexboxUtilities(testSpacing);
  assert.ok(css.includes('.justify-normal { justify-content: normal; }'), 'Missing .justify-normal');
  assert.ok(css.includes('.justify-stretch { justify-content: stretch; }'), 'Missing .justify-stretch');
});

test('generateFlexboxUtilities includes content-* (align-content) utilities', () => {
  const css = generateFlexboxUtilities(testSpacing);
  assert.ok(css.includes('.content-normal { align-content: normal; }'), 'Missing .content-normal');
  assert.ok(css.includes('.content-center { align-content: center; }'), 'Missing .content-center');
  assert.ok(css.includes('.content-between { align-content: space-between; }'), 'Missing .content-between');
  assert.ok(css.includes('.content-stretch { align-content: stretch; }'), 'Missing .content-stretch');
});

test('generateFlexboxUtilities includes self-baseline', () => {
  const css = generateFlexboxUtilities(testSpacing);
  assert.ok(css.includes('.self-baseline { align-self: baseline; }'), 'Missing .self-baseline');
});

test('generateFlexboxUtilities includes place-content utilities', () => {
  const css = generateFlexboxUtilities(testSpacing);
  assert.ok(css.includes('.place-content-center { place-content: center; }'), 'Missing .place-content-center');
  assert.ok(css.includes('.place-content-between { place-content: space-between; }'), 'Missing .place-content-between');
  assert.ok(css.includes('.place-content-stretch { place-content: stretch; }'), 'Missing .place-content-stretch');
});

test('generateFlexboxUtilities includes place-items utilities', () => {
  const css = generateFlexboxUtilities(testSpacing);
  assert.ok(css.includes('.place-items-center { place-items: center; }'), 'Missing .place-items-center');
  assert.ok(css.includes('.place-items-stretch { place-items: stretch; }'), 'Missing .place-items-stretch');
});

test('generateFlexboxUtilities includes place-self utilities', () => {
  const css = generateFlexboxUtilities(testSpacing);
  assert.ok(css.includes('.place-self-auto { place-self: auto; }'), 'Missing .place-self-auto');
  assert.ok(css.includes('.place-self-center { place-self: center; }'), 'Missing .place-self-center');
});

// ── Grid extensions ─────────────────────────────────────────────────────────

test('generateGridUtilities includes grid-cols-none and grid-cols-subgrid', () => {
  const css = generateGridUtilities(testSpacing);
  assert.ok(css.includes('.grid-cols-none { grid-template-columns: none; }'), 'Missing .grid-cols-none');
  assert.ok(css.includes('.grid-cols-subgrid { grid-template-columns: subgrid; }'), 'Missing .grid-cols-subgrid');
});

test('generateGridUtilities includes grid-rows-* utilities', () => {
  const css = generateGridUtilities(testSpacing);
  assert.ok(css.includes('.grid-rows-none { grid-template-rows: none; }'), 'Missing .grid-rows-none');
  assert.ok(css.includes('.grid-rows-subgrid { grid-template-rows: subgrid; }'), 'Missing .grid-rows-subgrid');
  assert.ok(css.includes('.grid-rows-3 { grid-template-rows: repeat(3, minmax(0, 1fr)); }'), 'Missing .grid-rows-3');
  assert.ok(css.includes('.grid-rows-12 { grid-template-rows: repeat(12, minmax(0, 1fr)); }'), 'Missing .grid-rows-12');
});

test('generateGridUtilities col-span goes up to 12', () => {
  const css = generateGridUtilities(testSpacing);
  assert.ok(css.includes('.col-span-12 {'), 'Missing .col-span-12');
});

test('generateGridUtilities includes col-auto and auto start/end', () => {
  const css = generateGridUtilities(testSpacing);
  assert.ok(css.includes('.col-auto { grid-column: auto; }'), 'Missing .col-auto');
  assert.ok(css.includes('.col-start-auto { grid-column-start: auto; }'), 'Missing .col-start-auto');
  assert.ok(css.includes('.col-end-auto { grid-column-end: auto; }'), 'Missing .col-end-auto');
});

test('generateGridUtilities row-span goes up to 12', () => {
  const css = generateGridUtilities(testSpacing);
  assert.ok(css.includes('.row-span-12 {'), 'Missing .row-span-12');
});

test('generateGridUtilities includes row-auto and auto start/end', () => {
  const css = generateGridUtilities(testSpacing);
  assert.ok(css.includes('.row-auto { grid-row: auto; }'), 'Missing .row-auto');
  assert.ok(css.includes('.row-start-auto { grid-row-start: auto; }'), 'Missing .row-start-auto');
  assert.ok(css.includes('.row-end-auto { grid-row-end: auto; }'), 'Missing .row-end-auto');
});

test('generateGridUtilities includes grid-flow utilities', () => {
  const css = generateGridUtilities(testSpacing);
  assert.ok(css.includes('.grid-flow-row { grid-auto-flow: row; }'), 'Missing .grid-flow-row');
  assert.ok(css.includes('.grid-flow-col { grid-auto-flow: column; }'), 'Missing .grid-flow-col');
  assert.ok(css.includes('.grid-flow-dense { grid-auto-flow: dense; }'), 'Missing .grid-flow-dense');
  assert.ok(css.includes('.grid-flow-row-dense { grid-auto-flow: row dense; }'), 'Missing .grid-flow-row-dense');
});

// ── Border extensions ───────────────────────────────────────────────────────

test('generateBorderUtilities includes border-x and border-y', () => {
  const css = generateBorderUtilities(config);
  assert.ok(css.includes('.border-x {'), 'Missing .border-x');
  assert.ok(css.includes('.border-y {'), 'Missing .border-y');
  assert.ok(css.includes('border-left-width: 1px'), 'border-x should set left width');
  assert.ok(css.includes('border-top-width: 1px'), 'border-y should set top width');
});

test('generateBorderUtilities includes border-s and border-e (logical)', () => {
  const css = generateBorderUtilities(config);
  assert.ok(css.includes('.border-s {'), 'Missing .border-s');
  assert.ok(css.includes('border-inline-start-width: 1px'), 'border-s should use inline-start');
  assert.ok(css.includes('.border-e {'), 'Missing .border-e');
  assert.ok(css.includes('border-inline-end-width: 1px'), 'border-e should use inline-end');
});

test('generateBorderUtilities includes border-x-2 and border-y-4', () => {
  const css = generateBorderUtilities(config);
  assert.ok(css.includes('.border-x-2 {'), 'Missing .border-x-2');
  assert.ok(css.includes('.border-y-4 {'), 'Missing .border-y-4');
});

test('generateBorderUtilities includes border-current, border-black, border-white', () => {
  const css = generateBorderUtilities(config);
  assert.ok(css.includes('.border-current { border-color: currentColor; }'), 'Missing .border-current');
  assert.ok(css.includes('.border-black { border-color: #111110; }'), 'Missing .border-black');
  assert.ok(css.includes('.border-white { border-color: #FAFAFA; }'), 'Missing .border-white');
});

test('generateBorderUtilities .border includes border-style: solid', () => {
  const css = generateBorderUtilities(config);
  assert.ok(
    css.includes('.border { border-width: 1px; border-style: solid; }'),
    '.border should include border-style: solid'
  );
});

test('generateBorderUtilities generates per-side rounded with named radii', () => {
  const css = generateBorderUtilities(config);
  // rounded-t-sm should set both top corners
  assert.ok(css.includes('.rounded-t-sm {'), 'Missing .rounded-t-sm');
  assert.ok(css.includes('.rounded-br-lg {'), 'Missing .rounded-br-lg');
  assert.ok(css.includes('.rounded-tl-full {'), 'Missing .rounded-tl-full');
});

// ── Typography extensions ───────────────────────────────────────────────────

test('generateTypographyUtilities includes font-dm-sans', () => {
  const css = generateTypographyUtilities(config);
  assert.ok(css.includes('.font-dm-sans { font-family: "DM Sans"'), 'Missing .font-dm-sans');
});

test('generateTypographyUtilities includes font-nunito', () => {
  const css = generateTypographyUtilities(config);
  assert.ok(css.includes('.font-nunito { font-family: "Nunito"'), 'Missing .font-nunito');
});

test('generateTypographyUtilities includes font-atkinson', () => {
  const css = generateTypographyUtilities(config);
  assert.ok(css.includes('.font-atkinson { font-family: "Atkinson Hyperlegible"'), 'Missing .font-atkinson');
});

test('generateTypographyUtilities includes normal-case', () => {
  const css = generateTypographyUtilities(config);
  assert.ok(css.includes('.normal-case { text-transform: none; }'), 'Missing .normal-case');
});

test('generateTypographyUtilities includes underline-offset-0', () => {
  const css = generateTypographyUtilities(config);
  assert.ok(css.includes('.underline-offset-0 { text-underline-offset: 0px; }'), 'Missing .underline-offset-0');
});

test('generateTypographyUtilities includes decoration-0', () => {
  const css = generateTypographyUtilities(config);
  assert.ok(css.includes('.decoration-0 { text-decoration-thickness: 0px; }'), 'Missing .decoration-0');
});

// ── Init defaults ───────────────────────────────────────────────────────────

test('init default config includes 5xl–9xl font sizes', () => {
  const initJs = fs.readFileSync(path.join(__dirname, '../src/init.js'), 'utf-8');
  ['5xl', '6xl', '7xl', '8xl', '9xl'].forEach(size => {
    assert.ok(initJs.includes(`"${size}"`), `Missing "${size}" in init defaults`);
  });
});

test('init default config includes xl and 2xl font size names', () => {
  const initJs = fs.readFileSync(path.join(__dirname, '../src/init.js'), 'utf-8');
  assert.ok(initJs.includes('"xl"'), 'Missing "xl" font size in init defaults');
  assert.ok(initJs.includes('"2xl"'), 'Missing "2xl" font size in init defaults');
  assert.ok(initJs.includes('"3xl"'), 'Missing "3xl" font size in init defaults');
});

test('init default shadows include xl, 2xl, and inner', () => {
  const initJs = fs.readFileSync(path.join(__dirname, '../src/init.js'), 'utf-8');
  assert.ok(initJs.includes('"xl"'), 'Missing shadow xl in init defaults');
  assert.ok(initJs.includes('"2xl"'), 'Missing shadow 2xl in init defaults');
  assert.ok(initJs.includes("inner:"), 'Missing shadow inner in init defaults');
});

// ─── 16. CLI / Package Robustness ─────────────────────────────────────────────

section('16. CLI / Package Robustness');

test('CLI version command returns package version', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const output = execSync('node bin/emilyui.js version', {
    cwd: path.join(__dirname, '..'),
  }).toString().trim();

  assert.strictEqual(output, pkg.version);
});

test('CLI --version returns package version', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const output = execSync('node bin/emilyui.js --version', {
    cwd: path.join(__dirname, '..'),
  }).toString().trim();

  assert.strictEqual(output, pkg.version);
});

test('CLI -v returns package version', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const output = execSync('node bin/emilyui.js -v', {
    cwd: path.join(__dirname, '..'),
  }).toString().trim();

  assert.strictEqual(output, pkg.version);
});

test('unknown CLI command shows usage without crashing', () => {
  const result = spawnSync('node', ['bin/emilyui.js', 'buidl'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
  });

  assert.strictEqual(result.status, 0);
  assert.ok(result.stdout.includes('Usage:'), 'Expected usage text for unknown command');
});

test('npm pack includes bundled showcase template', () => {
  const files = getPackedFiles();

  assert.ok(
    files.includes('templates/showcase.html'),
    'npm package should include templates/showcase.html',
  );
});

test('npm pack does not include node_modules', () => {
  const files = getPackedFiles();

  assert.ok(
    !files.some((file) => file.startsWith('node_modules/')),
    'npm package should not include node_modules',
  );
});

test('npm pack does not include old tarballs', () => {
  const files = getPackedFiles();

  assert.ok(
    !files.some((file) => /^emily-css-\d+\.\d+\.\d+\.tgz$/.test(file)),
    'npm package should not include old .tgz files',
  );
});

test('showcase template exists locally', () => {
  const showcasePath = path.join(__dirname, '../templates/showcase.html');
  assert.ok(fs.existsSync(showcasePath), 'Missing templates/showcase.html');
});

test('showcase template links to emily.min.css', () => {
  const showcasePath = path.join(__dirname, '../templates/showcase.html');
  const html = fs.readFileSync(showcasePath, 'utf8');

  assert.ok(
    html.includes('emily.min.css'),
    'showcase.html should reference emily.min.css',
  );
});

test('missing emily.config.json gives useful build error', () => {
  const tmpDir = createTempProject();

  try {
    const result = spawnSync('node', [path.join(__dirname, '../bin/emilyui.js'), 'build'], {
      cwd: tmpDir,
      encoding: 'utf8',
    });

    const combinedOutput = `${result.stdout}\n${result.stderr}`;

    assert.notStrictEqual(result.status, 0, 'Build should fail without emily.config.json');
    assert.ok(
      combinedOutput.includes('No config found') ||
        combinedOutput.includes('emily-css init'),
      'Expected useful missing config message',
    );
  } finally {
    removeTempProject(tmpDir);
  }
});

test('purgeCSS uses isolated temp sourceGlobs for used classes', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emily-purge-test-'));

  try {
    fs.writeFileSync(path.join(tmpDir, 'test.html'), '<div class="flex">test</div>');

    const css = '.flex { display: flex; }\n.hidden { display: none; }\n';
    const result = purgeCSS(css, tmpDir, isolatedPurgeConfig(tmpDir));

    assert.ok(result.includes('.flex {'), 'Should keep .flex from temp fixture');
    assert.ok(!result.includes('.hidden {'), 'Should remove .hidden from temp fixture');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('purgeCSS returns full CSS when isolated sourceGlobs find no files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emily-purge-empty-'));

  try {
    const css = '.flex { display: flex; }\n';
    const result = purgeCSS(css, tmpDir, isolatedPurgeConfig(tmpDir));

    assert.ok(result.includes('.flex {'), 'Should return full CSS when no source files found');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('extractClassNames extracts React className attributes', () => {
  const jsx = '<div className="flex items-center gap-4">test</div>';
  const classes = extractClassNames(jsx);

  assert.ok(classes.has('flex'), 'Missing flex from className');
  assert.ok(classes.has('items-center'), 'Missing items-center from className');
  assert.ok(classes.has('gap-4'), 'Missing gap-4 from className');
});

test('extractClassNames extracts simple template string classes', () => {
  const js = 'const button = `px-4 py-2 bg-primary-80 text-white`;';
  const classes = extractClassNames(js);

  assert.ok(classes.has('px-4'), 'Missing px-4 from template string');
  assert.ok(classes.has('py-2'), 'Missing py-2 from template string');
  assert.ok(classes.has('bg-primary-80'), 'Missing bg-primary-80 from template string');
  assert.ok(classes.has('text-white'), 'Missing text-white from template string');
});

test('shipped JS files contain no null bytes', () => {
  const filesToCheck = [
    '../src/index.js',
    '../src/init.js',
    '../src/purge.js',
    '../src/watch.js',
    '../src/showcase.js',
    '../src/generators.js',
    '../bin/emilyui.js',
  ];

  filesToCheck.forEach((relativeFile) => {
    const filePath = path.join(__dirname, relativeFile);
    const content = fs.readFileSync(filePath);
    const nullByteCount = content.filter((byte) => byte === 0).length;

    assert.strictEqual(nullByteCount, 0, `${relativeFile} contains null bytes`);
  });
});

// ─── 17. Softened Plain Colours, prose-emily, Focus Helpers ──────────────────

section('17. Softened Plain Colours, prose-emily, Focus Helpers');

const { accessibilityUtilities: a11yUtils, svgUtilities: svgUtils, divideUtilities: divUtils } = require('../src/generators.js');

test('generateColourUtilities uses #FAFAFA for bg-white', () => {
  const colours = generateAllColours(config.colours);
  const css = generateColourUtilities(colours);
  assert.ok(css.includes('.bg-white { background-color: #FAFAFA; }'), 'bg-white should use #FAFAFA');
});

test('generateColourUtilities uses #111110 for bg-black', () => {
  const colours = generateAllColours(config.colours);
  const css = generateColourUtilities(colours);
  assert.ok(css.includes('.bg-black { background-color: #111110; }'), 'bg-black should use #111110');
});

test('generateColourUtilities uses #111110 for text-black', () => {
  const colours = generateAllColours(config.colours);
  const css = generateColourUtilities(colours);
  assert.ok(css.includes('.text-black { color: #111110; }'), 'text-black should use #111110');
});

test('generateColourUtilities includes text-transparent', () => {
  const colours = generateAllColours(config.colours);
  const css = generateColourUtilities(colours);
  assert.ok(css.includes('.text-transparent { color: transparent; }'), 'Missing .text-transparent');
});

test('generateBorderUtilities uses #FAFAFA for border-white', () => {
  const css = generateBorderUtilities(config);
  assert.ok(css.includes('.border-white { border-color: #FAFAFA; }'), 'border-white should use #FAFAFA');
});

test('generateBorderUtilities uses #111110 for border-black', () => {
  const css = generateBorderUtilities(config);
  assert.ok(css.includes('.border-black { border-color: #111110; }'), 'border-black should use #111110');
});

test('svgUtilities includes fill-white with #FAFAFA', () => {
  const colours = generateAllColours(config.colours);
  const css = svgUtils(colours);
  assert.ok(css.includes('.fill-white { fill: #FAFAFA; }'), 'fill-white should use #FAFAFA');
});

test('svgUtilities includes stroke-black with #111110', () => {
  const colours = generateAllColours(config.colours);
  const css = svgUtils(colours);
  assert.ok(css.includes('.stroke-black { stroke: #111110; }'), 'stroke-black should use #111110');
});

test('prose-emily is present in generatePatternComponents', () => {
  const { generatePatternComponents } = require('../src/index.js');
  // prose-emily is inside the function — test via built output or string check
  // We'll confirm via the function source instead
  const src = require('fs').readFileSync(require('path').join(__dirname, '../src/index.js'), 'utf8');
  assert.ok(src.includes('.prose-emily'), 'Missing .prose-emily in src/index.js');
});

test('accessibilityUtilities includes .sr-only-focusable', () => {
  const css = a11yUtils();
  assert.ok(css.includes('.sr-only-focusable:not(:focus):not(:focus-within)'), 'Missing .sr-only-focusable');
});

test('accessibilityUtilities includes .focus-ring:focus-visible', () => {
  const css = a11yUtils();
  assert.ok(css.includes('.focus-ring:focus-visible'), 'Missing .focus-ring:focus-visible');
});

test('accessibilityUtilities includes .focus-ring-inset:focus-visible', () => {
  const css = a11yUtils();
  assert.ok(css.includes('.focus-ring-inset:focus-visible'), 'Missing .focus-ring-inset:focus-visible');
});

test('accessibilityUtilities includes .focus-ring-none:focus-visible', () => {
  const css = a11yUtils();
  assert.ok(css.includes('.focus-ring-none:focus-visible'), 'Missing .focus-ring-none:focus-visible');
});

// ─── 18. ARIA & Data-State Variants ──────────────────────────────────────────

section('18. ARIA & Data-State Variants');
test('addAriaDataVariants generates aria-expanded: prefix with attribute selector', () => {
  const base = '.block { display: block; }\n';
  const result = addAriaDataVariants(base);
  assert.ok(
    result.includes('.aria-expanded\\:block[aria-expanded="true"] { display: block; }'),
    'Missing aria-expanded:block variant'
  );
});

test('addAriaDataVariants generates aria-selected: prefix with attribute selector', () => {
  const base = '.bg-brand-80 { background-color: var(--color-brand-80); }\n';
  const result = addAriaDataVariants(base);
  assert.ok(
    result.includes('.aria-selected\\:bg-brand-80[aria-selected="true"]'),
    'Missing aria-selected:bg-brand-80 variant'
  );
});

test('addAriaDataVariants generates aria-current: uses aria-current="page" selector', () => {
  const base = '.font-bold { font-weight: 700; }\n';
  const result = addAriaDataVariants(base);
  assert.ok(
    result.includes('.aria-current\\:font-bold[aria-current="page"]'),
    'Missing aria-current:font-bold variant with page selector'
  );
});

test('addAriaDataVariants generates aria-disabled: prefix with attribute selector', () => {
  const base = '.opacity-50 { opacity: 0.5; }\n';
  const result = addAriaDataVariants(base);
  assert.ok(
    result.includes('.aria-disabled\\:opacity-50[aria-disabled="true"]'),
    'Missing aria-disabled:opacity-50 variant'
  );
});

test('addAriaDataVariants generates data-open: with data-state="open" selector', () => {
  const base = '.block { display: block; }\n';
  const result = addAriaDataVariants(base);
  assert.ok(
    result.includes('.data-open\\:block[data-state="open"]'),
    'Missing data-open:block variant'
  );
});

test('addAriaDataVariants generates data-closed: with data-state="closed" selector', () => {
  const base = '.hidden { display: none; }\n';
  const result = addAriaDataVariants(base);
  assert.ok(
    result.includes('.data-closed\\:hidden[data-state="closed"]'),
    'Missing data-closed:hidden variant'
  );
});

test('addAriaDataVariants does not process existing state variant lines', () => {
  const base = '.block { display: block; }\n';
  const withState = addStateVariants(base);
  const result = addAriaDataVariants(withState);
  assert.ok(
    !result.includes('aria-expanded\\:hover\\:'),
    'ARIA variants are being applied to existing state variant lines'
  );
});

test('addAriaDataVariants produces all 6 variant types for a single utility', () => {
  const base = '.flex { display: flex; }\n';
  const result = addAriaDataVariants(base);
  const expected = [
    'aria-expanded\\:flex[aria-expanded="true"]',
    'aria-selected\\:flex[aria-selected="true"]',
    'aria-current\\:flex[aria-current="page"]',
    'aria-disabled\\:flex[aria-disabled="true"]',
    'data-open\\:flex[data-state="open"]',
    'data-closed\\:flex[data-state="closed"]',
  ];
  expected.forEach(selector => {
    assert.ok(result.includes(selector), 'Missing variant: ' + selector);
  });
});

test('addAriaDataVariants preserves original CSS rules unchanged', () => {
  const base = '.block { display: block; }\n';
  const result = addAriaDataVariants(base);
  assert.ok(
    result.startsWith('.block { display: block; }'),
    'Original CSS rule was modified or removed'
  );
});

// ─── 19. Utility Manifest ────────────────────────────────────────────────────

section('19. Utility Manifest');

test('generateManifest exists and returns an object with utilities', () => {
  assert.strictEqual(typeof generateManifest, 'function');
  const manifest = generateManifest('.p-4 { padding: 1rem; }');
  assert.ok(manifest && typeof manifest === 'object', 'Manifest should be an object');
  assert.ok(Array.isArray(manifest.utilities), 'Manifest utilities should be an array');
  assert.ok(manifest.utilities.length > 0, 'Manifest utilities should not be empty');
});

test('generateManifest maps text-brand-80 to colour with token and declarations', () => {
  const css = '.text-brand-80 { color: var(--color-brand-80); }\n';
  const manifest = generateManifest(css);
  const entry = manifest.utilities.find((utility) => utility.class === 'text-brand-80');

  assert.ok(entry, 'Expected text-brand-80 utility in manifest');
  assert.strictEqual(entry.category, 'colour');
  assert.strictEqual(entry.property, 'color');
  assert.strictEqual(entry.value, 'var(--color-brand-80)');
  assert.strictEqual(entry.token, '--color-brand-80');
  assert.deepStrictEqual(entry.declarations, { color: 'var(--color-brand-80)' });
});

test('generateManifest categorizes p-4 as spacing and btn as component', () => {
  const css = '.p-4 { padding: var(--space-4); }\n.btn { display: inline-flex; }\n';
  const manifest = generateManifest(css);
  const spacing = manifest.utilities.find((utility) => utility.class === 'p-4');
  const component = manifest.utilities.find((utility) => utility.class === 'btn');

  assert.ok(spacing, 'Expected p-4 utility in manifest');
  assert.ok(component, 'Expected btn utility in manifest');
  assert.strictEqual(spacing.category, 'spacing');
  assert.strictEqual(component.category, 'component');
});

test('generateManifest skips expanded variant selectors', () => {
  const css = [
    '.text-brand-80 { color: var(--color-brand-80); }',
    '.hover\\:text-brand-80:hover { color: var(--color-brand-80); }',
    '.focus-within\\:text-brand-80:focus-within { color: var(--color-brand-80); }',
    '.md\\:p-4 { padding: var(--space-4); }',
    '.dark .dark\\:text-brand-80 { color: var(--color-brand-80); }',
  ].join('\n');
  const manifest = generateManifest(css);
  const classes = manifest.utilities.map((utility) => utility.class);

  assert.ok(classes.includes('text-brand-80'), 'Expected base class to remain');
  assert.ok(!classes.includes('hover:text-brand-80'), 'Hover-expanded selector should be skipped');
  assert.ok(!classes.includes('focus-within:text-brand-80'), 'Focus-within-expanded selector should be skipped');
  assert.ok(!classes.includes('md:p-4'), 'Responsive-expanded selector should be skipped');
  assert.ok(!classes.includes('dark:text-brand-80'), 'Dark-expanded selector should be skipped');
});

test('generateManifest uses fallback responsive variants only when config breakpoints are missing', () => {
  const manifest = generateManifest('.p-4 { padding: 1rem; }');
  const entry = manifest.utilities.find((utility) => utility.class === 'p-4');
  const fallback = ['sm', 'md', 'lg', 'xl', '2xl'];

  assert.ok(entry, 'Expected p-4 utility in manifest');
  fallback.forEach((variant) => {
    assert.ok(entry.variants.includes(variant), `Expected fallback variant ${variant}`);
  });
});

test('generateManifest uses custom config breakpoints instead of fallback breakpoints', () => {
  const manifest = generateManifest('.p-4 { padding: 1rem; }', {
    breakpoints: {
      tablet: '768px',
      desktop: '1024px',
    },
  });
  const entry = manifest.utilities.find((utility) => utility.class === 'p-4');

  assert.ok(entry, 'Expected p-4 utility in manifest');
  assert.ok(entry.variants.includes('tablet'), 'Expected custom tablet breakpoint variant');
  assert.ok(entry.variants.includes('desktop'), 'Expected custom desktop breakpoint variant');
  ['sm', 'md', 'lg', 'xl', '2xl'].forEach((fallbackVariant) => {
    assert.ok(
      !entry.variants.includes(fallbackVariant),
      `Should not include fallback breakpoint ${fallbackVariant} when config breakpoints exist`,
    );
  });
});

test('generateManifest includes all expected base variants', () => {
  const manifest = generateManifest('.p-4 { padding: 1rem; }');
  const entry = manifest.utilities.find((utility) => utility.class === 'p-4');
  const expectedBaseVariants = [
    'hover',
    'focus',
    'focus-within',
    'focus-visible',
    'active',
    'disabled',
    'motion-reduce',
    'motion-safe',
    'aria-expanded',
    'aria-selected',
    'aria-current',
    'aria-disabled',
    'data-open',
    'data-closed',
    'dark',
    'forced-colors',
  ];

  assert.ok(entry, 'Expected p-4 utility in manifest');
  expectedBaseVariants.forEach((variant) => {
    assert.ok(entry.variants.includes(variant), `Missing base variant ${variant}`);
  });
});

test('generateManifest categorizes rounded, shadow, border, outline, and ring correctly', () => {
  const css = [
    '.rounded { border-radius: 0.25rem; }',
    '.shadow { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); }',
    '.border { border-width: 1px; }',
    '.outline { outline-style: solid; }',
    '.ring { box-shadow: 0 0 0 1px currentColor; }',
  ].join('\n');
  const manifest = generateManifest(css);

  const expected = {
    rounded: 'radius',
    shadow: 'shadow',
    border: 'border',
    outline: 'border',
    ring: 'border',
  };

  Object.entries(expected).forEach(([className, category]) => {
    const entry = manifest.utilities.find((utility) => utility.class === className);
    assert.ok(entry, `Expected ${className} utility in manifest`);
    assert.strictEqual(entry.category, category, `Expected ${className} to be category ${category}`);
  });
});

test('generateManifest categorizes prose, btn-primary, form-hint, and code-window as components', () => {
  const css = [
    '.prose { max-width: 65ch; }',
    '.btn-primary { background-color: var(--color-brand-80); }',
    '.form-hint { color: var(--color-neutral-60); }',
    '.code-window { background-color: #111110; }',
  ].join('\n');
  const manifest = generateManifest(css);
  const classes = ['prose', 'btn-primary', 'form-hint', 'code-window'];

  classes.forEach((className) => {
    const entry = manifest.utilities.find((utility) => utility.class === className);
    assert.ok(entry, `Expected ${className} utility in manifest`);
    assert.strictEqual(entry.category, 'component', `Expected ${className} to be category component`);
  });
});

test('buildFullFramework does not generate manifest by default', () => {
  const tmpDir = createTempProject();
  const originalCwd = process.cwd();

  try {
    fs.writeFileSync(
      path.join(tmpDir, 'emily.config.json'),
      JSON.stringify(buildConfigWithManifest(undefined), null, 2),
    );
    process.chdir(tmpDir);
    buildFullFramework();

    const manifestPath = path.join(tmpDir, 'dist', 'emily.manifest.json');
    assert.ok(!fs.existsSync(manifestPath), 'Manifest should not be generated by default');
  } finally {
    process.chdir(originalCwd);
    removeTempProject(tmpDir);
  }
});

test('buildFullFramework generates manifest when manifest: true', () => {
  const tmpDir = createTempProject();
  const originalCwd = process.cwd();

  try {
    fs.writeFileSync(
      path.join(tmpDir, 'emily.config.json'),
      JSON.stringify(buildConfigWithManifest(true), null, 2),
    );
    process.chdir(tmpDir);
    buildFullFramework();

    const manifestPath = path.join(tmpDir, 'dist', 'emily.manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'Manifest should be generated when manifest: true');
  } finally {
    process.chdir(originalCwd);
    removeTempProject(tmpDir);
  }
});

test('buildFullFramework supports custom manifest output path', () => {
  const tmpDir = createTempProject();
  const originalCwd = process.cwd();

  try {
    fs.writeFileSync(
      path.join(tmpDir, 'emily.config.json'),
      JSON.stringify(
        buildConfigWithManifest({
          enabled: true,
          output: 'dist/custom/emily.manifest.json',
        }),
        null,
        2,
      ),
    );
    process.chdir(tmpDir);
    buildFullFramework();

    const customPath = path.join(tmpDir, 'dist', 'custom', 'emily.manifest.json');
    assert.ok(fs.existsSync(customPath), 'Manifest should be generated at custom output path');
  } finally {
    process.chdir(originalCwd);
    removeTempProject(tmpDir);
  }
});

// \u2500\u2500\u2500 Results \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const total = passed + failed;
console.log('\n' + '\u2550'.repeat(40));
console.log('Results: ' + passed + '/' + total + ' passed');

if (failed > 0) {
  console.log('\nFailed tests:');
  failures.forEach(f => console.log('  \u2717 ' + f.name + '\n    ' + f.message));
  process.exit(1);
} else {
  console.log('\nAll tests passed \u2713');
  process.exit(0);
}
