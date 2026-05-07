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
  addResponsiveVariants,
} = require('../src/index.js');

const { extractClassNames, purgeCSS } = require('../src/purge.js');

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

test('generateColourUtilities accent-brand-80 uses correct hex', () => {
  const colours = generateAllColours(config.colours);
  const css = generateColourUtilities(colours);
  const brandHex = config.colours.brand.toUpperCase();
  assert.ok(
    css.includes(`.accent-brand-80 { accent-color: ${brandHex}; }`),
    `Missing correct accent-brand-80 rule`
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
const { overflowUtilities, sizingUtilities, contentScrollUtilities, spaceUtilities, divideUtilities, backgroundUtilities, filterUtilities, opacityUtilities, cursorUtilities, ringUtilities, animationUtilities, backdropUtilities } = require('../src/generators.js');

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


// ─── 15. CLI / Package Robustness ─────────────────────────────────────────────

section('15. CLI / Package Robustness');

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

// ─── Results ──────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n${'═'.repeat(40)}`);
console.log(`Results: ${passed}/${total} passed`);

if (failed > 0) {
  console.log(`\nFailed tests:`);
  failures.forEach(f => console.log(`  ✗ ${f.name}\n    ${f.message}`));
  process.exit(1);
} else {
  console.log(`\nAll tests passed ✓`);
  process.exit(0);
}
