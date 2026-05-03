/**
 * EmilyUI — Test Suite
 * Tests core functions in isolation with explicit expected outcomes.
 * Run with: node tests/test.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

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

test('generateColourUtilities accent-primary-80 uses correct hex', () => {
  const colours = generateAllColours(config.colours);
  const css = generateColourUtilities(colours);
  const primaryHex = config.colours.primary.toUpperCase();
  assert.ok(
    css.includes(`.accent-primary-80 { accent-color: ${primaryHex}; }`),
    `Missing correct accent-primary-80 rule`
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
  const result = purgeCSS(css, tmpDir, config);
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

test('config.colours has at least primary, success, error, neutral', () => {
  const required = ['primary', 'success', 'error', 'neutral'];
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

requireBuild('.accent-primary-80 exists in built CSS', () => {
  assert.ok(builtCss.includes('.accent-primary-80 {'), 'Missing ".accent-primary-80 {"');
});

requireBuild('.sr-only exists in built CSS', () => {
  assert.ok(builtCss.includes('.sr-only {'), 'Missing ".sr-only {"');
});

requireBuild('hover:bg-primary-80 state variant exists', () => {
  assert.ok(
    builtCss.includes('.hover\\:bg-primary-80:hover {'),
    'Missing ".hover\\:bg-primary-80:hover {"'
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
