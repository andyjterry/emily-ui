// new version


const fs = require('fs');
const path = require('path');


// ============================================================================
// COLOUR GENERATION
// ============================================================================
// Generate 10-shade colour scale using OKLCH (perceptually uniform colour space)
// OKLCH produces visually even steps across all hues — unlike HSL which creates
// muddy mid-tones on warm colours (yellows, greens, oranges).
//
// Conversion pipeline: Hex → sRGB → Linear RGB → OKLab → OKLCH → (modify L) → reverse
// No external dependencies. Maths from Björn Ottosson's OKLab specification.
//
// Input: #0077b6 → Output: { 10: '#...', 20: '#...', ..., 100: '#...' }

// sRGB component to linear light
function srgbToLinear(c) {
  const val = c / 255;
  return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
}

// Linear light component to sRGB (clamped to 0–255)
function linearToSrgb(c) {
  const clamped = Math.max(0, Math.min(1, c));
  const out = clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, out)) * 255);
}

// Hex string → OKLCH { l, c, h }
function hexToOklch(hex) {
  const r = srgbToLinear(parseInt(hex.slice(1, 3), 16));
  const g = srgbToLinear(parseInt(hex.slice(3, 5), 16));
  const b = srgbToLinear(parseInt(hex.slice(5, 7), 16));

  // Linear RGB → OKLab (M1 matrix then cube-root then M2 matrix)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L =  0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const a =  1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const bv = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

  // OKLab → OKLCH
  const C = Math.sqrt(a * a + bv * bv);
  const H = (Math.atan2(bv, a) * 180) / Math.PI;

  return { l: L, c: C, h: H < 0 ? H + 360 : H };
}

// OKLCH { l, c, h } → hex string
function oklchToHex(l, c, h) {
  // OKLCH → OKLab
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const bv = c * Math.sin(hRad);

  // OKLab → Linear RGB (M2 inverse then cube then M1 inverse)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * bv;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bv;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * bv;

  const lc = l_ * l_ * l_;
  const mc = m_ * m_ * m_;
  const sc = s_ * s_ * s_;

  const r =  4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const g = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const b = -0.0041960863 * lc - 0.7034186147 * mc + 1.7076147010 * sc;

  const rOut = linearToSrgb(r).toString(16).padStart(2, '0');
  const gOut = linearToSrgb(g).toString(16).padStart(2, '0');
  const bOut = linearToSrgb(b).toString(16).padStart(2, '0');

  return `#${rOut}${gOut}${bOut}`.toUpperCase();
}

function generateColourScale(baseHex) {
  const { l: baseL, c: baseC, h: baseH } = hexToOklch(baseHex);
  const scale = {};

  // Shade scale: 10 = near-white, 80 = exact input colour, 100 = near-black
  // Lightness targets in OKLCH (0–1 scale):
  //   shade 10 → L ≈ 0.97  (very light tint)
  //   shade 80 → L = baseL (exact input)
  //   shade 100 → L ≈ 0.15 (very dark tone)
  //
  // Chroma is preserved from the base colour throughout — hue is never shifted.
  // At extreme lightness values chroma is gently reduced to stay in sRGB gamut.

  const LIGHT_L = 0.97; // shade 10 lightness
  const DARK_L  = 0.15; // shade 100 lightness

  const steps = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  steps.forEach(step => {
    if (step === 80) {
      scale[step] = baseHex.toUpperCase();
      return;
    }

    let newL;
    if (step < 80) {
      // 10–70: interpolate from LIGHT_L down to baseL
      const t = (step / 80); // 0 → 1 as step goes 0 → 80
      newL = LIGHT_L - t * (LIGHT_L - baseL);
    } else {
      // 90–100: interpolate from baseL down to DARK_L
      const t = (step - 80) / 20; // 0 → 1 as step goes 80 → 100
      newL = baseL - t * (baseL - DARK_L);
    }

    // Reduce chroma slightly at extremes to avoid out-of-gamut clipping
    const chromaScale = 1 - Math.max(0, (newL - 0.90) / 0.07) * 0.5  // reduce near white
                          - Math.max(0, (0.25 - newL) / 0.10) * 0.5;  // reduce near black
    const newC = baseC * Math.max(0, chromaScale);

    scale[step] = oklchToHex(newL, newC, baseH);
  });

  return scale;
}

function generateAllColours(colourConfig) {
  const allColours = {};

  Object.entries(colourConfig).forEach(([name, baseHex]) => {
    allColours[name] = generateColourScale(baseHex);
  });

  return allColours;
}

// ============================================================================
// SPACING SCALE
// ============================================================================

function generateSpacing(baseUnit, scale) {
  // Spacing values are defined explicitly in emily.config.json under spacing.scale.
  // The baseUnit key in config is informational only — it documents the design intent
  // (e.g. "this system is based on 8px") but does not drive generation.
  return scale;
}

// ============================================================================
// FONT PRESETS
// ============================================================================

// Font presets define the CSS font-family stack only.
// Loading the actual font files is the user's responsibility — link them in your HTML
// or use @fontsource packages in your build. emily-css does not generate @import rules
// for external CDNs so it stays self-contained and works offline.
// See docs: https://emilyui.com/docs/getting-started
const FONT_PRESETS = {
  'system': {
    stack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  'inter': {
    name: 'Inter',
    stack: '"Inter", system-ui, sans-serif',
  },
  'lexend': {
    name: 'Lexend',
    stack: '"Lexend", system-ui, sans-serif',
  },
  'georgia': {
    stack: 'Georgia, "Times New Roman", serif',
  },
  'dm-sans': {
    name: 'DM Sans',
    stack: '"DM Sans", system-ui, sans-serif',
  },
  'nunito': {
    name: 'Nunito',
    stack: '"Nunito", system-ui, sans-serif',
  },
  'atkinson': {
    name: 'Atkinson Hyperlegible',
    stack: '"Atkinson Hyperlegible", system-ui, sans-serif',
  },
  'mono': {
    stack: '"Menlo", "Monaco", "Courier New", monospace',
  },
};

function generateFontCSS(config) {
  // Support both legacy string format and new { heading, body } object format
  const fontConfig = config.fontFamily || 'system';
  let headingKey, bodyKey;

  if (typeof fontConfig === 'object') {
    headingKey = (fontConfig.heading || 'system').toLowerCase();
    bodyKey = (fontConfig.body || 'system').toLowerCase();
  } else {
    headingKey = fontConfig.toLowerCase();
    bodyKey = fontConfig.toLowerCase();
  }

  const headingPreset = FONT_PRESETS[headingKey] || FONT_PRESETS['system'];
  const bodyPreset = FONT_PRESETS[bodyKey] || FONT_PRESETS['system'];

  let fontFace = '';
  let bodyFont = '';

  bodyFont += `  body {\n    font-family: ${bodyPreset.stack};\n    font-synthesis: style;\n  }\n`;
  bodyFont += `  h1, h2, h3, h4, h5, h6 {\n    font-family: ${headingPreset.stack};\n  }\n`;

  return { fontFace, bodyFont };
}

// ============================================================================
// CSS VARIABLE GENERATION
// ============================================================================

function generateCSSVariables(colours, spacing, config) {
  let css = `:root {\n`;

  // Colour variables (full shade scale)
  Object.entries(colours).forEach(([colourName, shades]) => {
    Object.entries(shades).forEach(([shade, hex]) => {
      css += `  --color-${colourName}-${shade}: ${hex};\n`;
    });
  });

  // Semantic colour variables (single value, no shade scale)
  if (config.semanticColours) {
    Object.entries(config.semanticColours).forEach(([name, hex]) => {
      css += `  --color-${name}: ${hex};\n`;
    });
  }

  // Spacing variables
  Object.entries(spacing).forEach(([key, value]) => {
    css += `  --space-${key}: ${value};\n`;
  });

  // Font size variables with line-height
  config.typography.fontSizes.forEach(fontSize => {
    const sizeVal = parseInt(fontSize.value);
    css += `  --text-${fontSize.name}: ${fontSize.value};\n`;
    css += `  --leading-${fontSize.name}: ${fontSize.lineHeight};\n`;
  });

  // Font weight variables
  Object.entries(config.typography.fontWeights).forEach(([name, weight]) => {
    css += `  --font-weight-${name}: ${weight};\n`;
  });

  // Breakpoints
  Object.entries(config.breakpoints).forEach(([name, value]) => {
    css += `  --breakpoint-${name}: ${value};\n`;
  });

  // Shadows
  Object.entries(config.shadows).forEach(([name, shadow]) => {
    css += `  --shadow-${name}: ${shadow};\n`;
  });

  // Z-index
  Object.entries(config.zIndex).forEach(([name, value]) => {
    css += `  --z-${name}: ${value};\n`;
  });

  // Transitions
  css += `  --transition-duration: ${config.transitions.base};\n`;
  css += `  --transition-timing: ${config.transitions.timing};\n`;

  css += `}\n\n`;
  return css;
}

const {
  displayUtilities,
  sizingUtilities,
  positioningUtilities,
  overflowUtilities,
  opacityUtilities,
  transitionUtilities,
  transformUtilities,
  shadowUtilities,
  ringUtilities,
  objectUtilities,
  tableListUtilities,
  svgUtilities,
  formUtilities,
  verticalAlignUtilities,
  contentScrollUtilities,
  blendUtilities,
  cursorUtilities,
  accessibilityUtilities,
  containerUtilities,
  codeUtilities,
  animationUtilities,
  backdropUtilities,
  spaceUtilities,
  divideUtilities,
  backgroundUtilities,
  filterUtilities,
} = require('./generators');

// ============================================================================
// SPACING UTILITIES
// ============================================================================

function escapeClassName(key) {
  // Escape dots in class names for CSS (e.g., "0.5" becomes "0\.5")
  return key.replace(/\./g, '\\.');
}

function generateSpacingUtilities(spacing) {
  let css = `/* Spacing: Padding & Margin */\n`;

  // Padding
  Object.entries(spacing).forEach(([key, value]) => {
    const escaped = escapeClassName(key);
    css += `.p-${escaped} { padding: ${value}; }\n`;
    css += `.px-${escaped} { padding-left: ${value}; padding-right: ${value}; }\n`;
    css += `.py-${escaped} { padding-top: ${value}; padding-bottom: ${value}; }\n`;
    css += `.pt-${escaped} { padding-top: ${value}; }\n`;
    css += `.pr-${escaped} { padding-right: ${value}; }\n`;
    css += `.pb-${escaped} { padding-bottom: ${value}; }\n`;
    css += `.pl-${escaped} { padding-left: ${value}; }\n`;
    css += `.ps-${escaped} { padding-inline-start: ${value}; }\n`;
    css += `.pe-${escaped} { padding-inline-end: ${value}; }\n`;
  });

  // Margin
  Object.entries(spacing).forEach(([key, value]) => {
    const escaped = escapeClassName(key);
    css += `.m-${escaped} { margin: ${value}; }\n`;
    css += `.mx-${escaped} { margin-left: ${value}; margin-right: ${value}; }\n`;
    css += `.my-${escaped} { margin-top: ${value}; margin-bottom: ${value}; }\n`;
    css += `.mt-${escaped} { margin-top: ${value}; }\n`;
    css += `.mr-${escaped} { margin-right: ${value}; }\n`;
    css += `.mb-${escaped} { margin-bottom: ${value}; }\n`;
    css += `.ml-${escaped} { margin-left: ${value}; }\n`;
    css += `.ms-${escaped} { margin-inline-start: ${value}; }\n`;
    css += `.me-${escaped} { margin-inline-end: ${value}; }\n`;
  });

  // Margin auto
  css += `.mx-auto { margin-left: auto; margin-right: auto; }\n`;
  css += `.my-auto { margin-top: auto; margin-bottom: auto; }\n`;

  css += `\n`;
  return css;
}

// ============================================================================
// FLEXBOX UTILITIES
// ============================================================================

function generateFlexboxUtilities(spacing) {
  let css = `/* Flexbox */\n`;

  css += `.inline-flex { display: inline-flex; }\n`;

  // Direction
  css += `.flex-row { flex-direction: row; }\n`;
  css += `.flex-col { flex-direction: column; }\n`;
  css += `.flex-row-reverse { flex-direction: row-reverse; }\n`;
  css += `.flex-col-reverse { flex-direction: column-reverse; }\n`;

  // Wrap
  css += `.flex-wrap { flex-wrap: wrap; }\n`;
  css += `.flex-nowrap { flex-wrap: nowrap; }\n`;
  css += `.flex-wrap-reverse { flex-wrap: wrap-reverse; }\n`;

  // Flex shorthand
  css += `.flex-1 { flex: 1 1 0%; }\n`;
  css += `.flex-auto { flex: 1 1 auto; }\n`;
  css += `.flex-initial { flex: 0 1 auto; }\n`;
  css += `.flex-none { flex: none; }\n`;

  // Grow/shrink
  css += `.grow { flex-grow: 1; }\n`;
  css += `.grow-0 { flex-grow: 0; }\n`;
  css += `.shrink { flex-shrink: 1; }\n`;
  css += `.shrink-0 { flex-shrink: 0; }\n`;

  // Flex basis
  css += `.basis-auto { flex-basis: auto; }\n`;
  css += `.basis-full { flex-basis: 100%; }\n`;
  Object.entries(spacing).forEach(([key, value]) => {
    const escaped = escapeClassName(key);
    css += `.basis-${escaped} { flex-basis: ${value}; }\n`;
  });

  const fractions = {
    '1\\/2': '50%', '1\\/3': '33.333333%', '2\\/3': '66.666667%',
    '1\\/4': '25%', '2\\/4': '50%', '3\\/4': '75%',
    '1\\/5': '20%', '2\\/5': '40%', '3\\/5': '60%', '4\\/5': '80%',
    '1\\/6': '16.666667%', '2\\/6': '33.333333%', '3\\/6': '50%', '4\\/6': '66.666667%', '5\\/6': '83.333333%',
    '1\\/12': '8.333333%', '2\\/12': '16.666667%', '3\\/12': '25%', '4\\/12': '33.333333%', '5\\/12': '41.666667%', '6\\/12': '50%', '7\\/12': '58.333333%', '8\\/12': '66.666667%', '9\\/12': '75%', '10\\/12': '83.333333%', '11\\/12': '91.666667%'
  };
  Object.entries(fractions).forEach(([name, value]) => {
    css += `.basis-${name} { flex-basis: ${value}; }\n`;
  });

  // Order
  css += `.order-first { order: -9999; }\n`;
  css += `.order-last { order: 9999; }\n`;
  css += `.order-none { order: 0; }\n`;
  for (let i = 1; i <= 12; i++) {
    css += `.order-${i} { order: ${i}; }\n`;
  }

  // Justify (main axis)
  css += `.justify-normal { justify-content: normal; }\n`;
  css += `.justify-start { justify-content: flex-start; }\n`;
  css += `.justify-end { justify-content: flex-end; }\n`;
  css += `.justify-center { justify-content: center; }\n`;
  css += `.justify-between { justify-content: space-between; }\n`;
  css += `.justify-around { justify-content: space-around; }\n`;
  css += `.justify-evenly { justify-content: space-evenly; }\n`;
  css += `.justify-stretch { justify-content: stretch; }\n`;

  // Content alignment
  css += `.content-normal { align-content: normal; }\n`;
  css += `.content-center { align-content: center; }\n`;
  css += `.content-start { align-content: flex-start; }\n`;
  css += `.content-end { align-content: flex-end; }\n`;
  css += `.content-between { align-content: space-between; }\n`;
  css += `.content-around { align-content: space-around; }\n`;
  css += `.content-evenly { align-content: space-evenly; }\n`;
  css += `.content-baseline { align-content: baseline; }\n`;
  css += `.content-stretch { align-content: stretch; }\n`;

  // Items (cross axis)
  css += `.items-start { align-items: flex-start; }\n`;
  css += `.items-end { align-items: flex-end; }\n`;
  css += `.items-center { align-items: center; }\n`;
  css += `.items-baseline { align-items: baseline; }\n`;
  css += `.items-stretch { align-items: stretch; }\n`;

  // Self alignment
  css += `.self-auto { align-self: auto; }\n`;
  css += `.self-start { align-self: flex-start; }\n`;
  css += `.self-end { align-self: flex-end; }\n`;
  css += `.self-center { align-self: center; }\n`;
  css += `.self-stretch { align-self: stretch; }\n`;
  css += `.self-baseline { align-self: baseline; }\n`;

  // Place utilities
  css += `.place-content-center { place-content: center; }\n`;
  css += `.place-content-start { place-content: start; }\n`;
  css += `.place-content-end { place-content: end; }\n`;
  css += `.place-content-between { place-content: space-between; }\n`;
  css += `.place-content-around { place-content: space-around; }\n`;
  css += `.place-content-evenly { place-content: space-evenly; }\n`;
  css += `.place-content-baseline { place-content: baseline; }\n`;
  css += `.place-content-stretch { place-content: stretch; }\n`;
  css += `.place-items-start { place-items: start; }\n`;
  css += `.place-items-end { place-items: end; }\n`;
  css += `.place-items-center { place-items: center; }\n`;
  css += `.place-items-baseline { place-items: baseline; }\n`;
  css += `.place-items-stretch { place-items: stretch; }\n`;
  css += `.place-self-auto { place-self: auto; }\n`;
  css += `.place-self-start { place-self: start; }\n`;
  css += `.place-self-end { place-self: end; }\n`;
  css += `.place-self-center { place-self: center; }\n`;
  css += `.place-self-stretch { place-self: stretch; }\n`;

  css += `\n`;
  return css;
}

// ============================================================================
// GRID UTILITIES
// ============================================================================

function generateGridUtilities(spacing) {
  let css = `/* Grid */\n`;

  css += `.inline-grid { display: inline-grid; }\n`;

  css += `.grid-cols-none { grid-template-columns: none; }\n`;
  css += `.grid-cols-subgrid { grid-template-columns: subgrid; }\n`;
  for (let i = 1; i <= 12; i++) {
    css += `.grid-cols-${i} { grid-template-columns: repeat(${i}, minmax(0, 1fr)); }\n`;
  }

  css += `.grid-rows-none { grid-template-rows: none; }\n`;
  css += `.grid-rows-subgrid { grid-template-rows: subgrid; }\n`;
  for (let i = 1; i <= 12; i++) {
    css += `.grid-rows-${i} { grid-template-rows: repeat(${i}, minmax(0, 1fr)); }\n`;
  }

  for (let i = 1; i <= 12; i++) {
    css += `.col-span-${i} { grid-column: span ${i} / span ${i}; }\n`;
  }
  css += `.col-span-full { grid-column: 1 / -1; }\n`;
  css += `.col-auto { grid-column: auto; }\n`;
  for (let i = 1; i <= 13; i++) {
    css += `.col-start-${i} { grid-column-start: ${i}; }\n`;
    css += `.col-end-${i} { grid-column-end: ${i}; }\n`;
  }
  css += `.col-start-auto { grid-column-start: auto; }\n`;
  css += `.col-end-auto { grid-column-end: auto; }\n`;

  for (let i = 1; i <= 12; i++) {
    css += `.row-span-${i} { grid-row: span ${i} / span ${i}; }\n`;
  }
  css += `.row-span-full { grid-row: 1 / -1; }\n`;
  css += `.row-auto { grid-row: auto; }\n`;
  for (let i = 1; i <= 13; i++) {
    css += `.row-start-${i} { grid-row-start: ${i}; }\n`;
    css += `.row-end-${i} { grid-row-end: ${i}; }\n`;
  }
  css += `.row-start-auto { grid-row-start: auto; }\n`;
  css += `.row-end-auto { grid-row-end: auto; }\n`;

  css += `.grid-flow-row { grid-auto-flow: row; }\n`;
  css += `.grid-flow-col { grid-auto-flow: column; }\n`;
  css += `.grid-flow-dense { grid-auto-flow: dense; }\n`;
  css += `.grid-flow-row-dense { grid-auto-flow: row dense; }\n`;
  css += `.grid-flow-col-dense { grid-auto-flow: column dense; }\n`;

  css += `.auto-cols-auto { grid-auto-columns: auto; }\n`;
  css += `.auto-cols-min { grid-auto-columns: min-content; }\n`;
  css += `.auto-cols-max { grid-auto-columns: max-content; }\n`;
  css += `.auto-cols-fr { grid-auto-columns: minmax(0, 1fr); }\n`;
  css += `.auto-rows-auto { grid-auto-rows: auto; }\n`;
  css += `.auto-rows-min { grid-auto-rows: min-content; }\n`;
  css += `.auto-rows-max { grid-auto-rows: max-content; }\n`;
  css += `.auto-rows-fr { grid-auto-rows: minmax(0, 1fr); }\n`;

  Object.entries(spacing).forEach(([key, value]) => {
    const escaped = escapeClassName(key);
    css += `.gap-${escaped} { gap: ${value}; }\n`;
    css += `.gap-x-${escaped} { column-gap: ${value}; }\n`;
    css += `.gap-y-${escaped} { row-gap: ${value}; }\n`;
  });

  css += `\n`;
  return css;
}

// ============================================================================
// TYPOGRAPHY UTILITIES
// ============================================================================

function generateTypographyUtilities(config) {
  let css = `/* Typography */\n`;

  config.typography.fontSizes.forEach(fontSize => {
    css += `.text-${fontSize.name} { font-size: var(--text-${fontSize.name}); line-height: ${fontSize.lineHeight}; }\n`;
  });

  Object.entries(config.typography.fontWeights).forEach(([name, weight]) => {
    css += `.font-${name} { font-weight: ${weight}; }\n`;
  });

  css += `.italic { font-style: italic; }\n`;
  css += `.not-italic { font-style: normal; }\n`;

  css += `.text-left { text-align: left; }\n`;
  css += `.text-center { text-align: center; }\n`;
  css += `.text-right { text-align: right; }\n`;
  css += `.text-justify { text-align: justify; }\n`;
  css += `.text-start { text-align: start; }\n`;
  css += `.text-end { text-align: end; }\n`;

  css += `.whitespace-normal { white-space: normal; }\n`;
  css += `.whitespace-nowrap { white-space: nowrap; }\n`;
  css += `.whitespace-pre { white-space: pre; }\n`;
  css += `.whitespace-pre-line { white-space: pre-line; }\n`;
  css += `.whitespace-pre-wrap { white-space: pre-wrap; }\n`;
  css += `.whitespace-break-spaces { white-space: break-spaces; }\n`;
  css += `.text-wrap { text-wrap: wrap; }\n`;
  css += `.text-nowrap { text-wrap: nowrap; }\n`;
  css += `.text-balance { text-wrap: balance; }\n`;
  css += `.text-pretty { text-wrap: pretty; }\n`;
  css += `.break-normal { overflow-wrap: normal; word-break: normal; }\n`;
  css += `.break-words { overflow-wrap: break-word; }\n`;
  css += `.break-all { word-break: break-all; }\n`;
  css += `.break-keep { word-break: keep-all; }\n`;
  css += `.hyphens-none { hyphens: none; }\n`;
  css += `.hyphens-manual { hyphens: manual; }\n`;
  css += `.hyphens-auto { hyphens: auto; }\n`;

  css += `.leading-none { line-height: 1; }\n`;
  css += `.leading-tight { line-height: 1.25; }\n`;
  css += `.leading-snug { line-height: 1.375; }\n`;
  css += `.leading-normal { line-height: 1.5; }\n`;
  css += `.leading-relaxed { line-height: 1.625; }\n`;
  css += `.leading-loose { line-height: 2; }\n`;
  css += `.text-display { font-size: clamp(2.5rem, 6vw, 4rem); }\n`;

  css += `.tracking-tighter { letter-spacing: -0.05em; }\n`;
  css += `.tracking-tight { letter-spacing: -0.025em; }\n`;
  css += `.tracking-normal { letter-spacing: 0em; }\n`;
  css += `.tracking-wide { letter-spacing: 0.025em; }\n`;
  css += `.tracking-wider { letter-spacing: 0.05em; }\n`;
  css += `.tracking-widest { letter-spacing: 0.1em; }\n`;

  css += `.underline { text-decoration-line: underline; }\n`;
  css += `.overline { text-decoration-line: overline; }\n`;
  css += `.line-through { text-decoration-line: line-through; }\n`;
  css += `.no-underline { text-decoration-line: none; }\n`;
  css += `.decoration-solid { text-decoration-style: solid; }\n`;
  css += `.decoration-double { text-decoration-style: double; }\n`;
  css += `.decoration-dotted { text-decoration-style: dotted; }\n`;
  css += `.decoration-dashed { text-decoration-style: dashed; }\n`;
  css += `.decoration-wavy { text-decoration-style: wavy; }\n`;
  css += `.underline-offset-auto { text-underline-offset: auto; }\n`;
  [0, 1, 2, 4, 8].forEach(value => {
    css += `.underline-offset-${value} { text-underline-offset: ${value}px; }\n`;
  });
  css += `.decoration-auto { text-decoration-thickness: auto; }\n`;
  css += `.decoration-from-font { text-decoration-thickness: from-font; }\n`;
  [0, 1, 2, 4, 8].forEach(value => {
    css += `.decoration-${value} { text-decoration-thickness: ${value}px; }\n`;
  });

  css += `.normal-nums { font-variant-numeric: normal; }\n`;
  css += `.ordinal { font-variant-numeric: ordinal; }\n`;
  css += `.slashed-zero { font-variant-numeric: slashed-zero; }\n`;
  css += `.lining-nums { font-variant-numeric: lining-nums; }\n`;
  css += `.oldstyle-nums { font-variant-numeric: oldstyle-nums; }\n`;
  css += `.proportional-nums { font-variant-numeric: proportional-nums; }\n`;
  css += `.tabular-nums { font-variant-numeric: tabular-nums; }\n`;
  css += `.diagonal-fractions { font-variant-numeric: diagonal-fractions; }\n`;
  css += `.stacked-fractions { font-variant-numeric: stacked-fractions; }\n`;

  css += `.uppercase { text-transform: uppercase; }\n`;
  css += `.lowercase { text-transform: lowercase; }\n`;
  css += `.capitalize { text-transform: capitalize; }\n`;
  css += `.normal-case { text-transform: none; }\n`;

  css += `.font-sans { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }\n`;
  css += `.font-serif { font-family: Georgia, "Times New Roman", serif; }\n`;
  css += `.font-mono { font-family: "Menlo", "Monaco", "Courier New", monospace; }\n`;
  css += `.font-inter { font-family: "Inter", system-ui, sans-serif; }\n`;
  css += `.font-lexend { font-family: "Lexend", system-ui, sans-serif; }\n`;
  css += `.font-dm-sans { font-family: "DM Sans", system-ui, sans-serif; }\n`;
  css += `.font-nunito { font-family: "Nunito", system-ui, sans-serif; }\n`;
  css += `.font-atkinson { font-family: "Atkinson Hyperlegible", system-ui, sans-serif; }\n`;

  css += `\n`;
  return css;
}

// ============================================================================
// BORDER UTILITIES
// ============================================================================

function generateBorderUtilities(config) {
  let css = `/* Borders & Radius */\n`;

  const borderWidths = config.spacing.borderWidths || [0, 2, 4, 8];

  css += `.border { border-width: 1px; border-style: solid; }\n`;
  borderWidths.forEach(width => {
    css += `.border-${width} { border-width: ${width}px; }\n`;
  });

  const sides = {
    t: 'top', r: 'right', b: 'bottom', l: 'left',
    x: ['left', 'right'], y: ['top', 'bottom'],
    s: 'inline-start', e: 'inline-end'
  };

  Object.entries(sides).forEach(([side, value]) => {
    if (Array.isArray(value)) {
      css += `.border-${side} { border-${value[0]}-width: 1px; border-${value[1]}-width: 1px; border-${value[0]}-style: solid; border-${value[1]}-style: solid; }\n`;
    } else {
      css += `.border-${side} { border-${value}-width: 1px; border-${value}-style: solid; }\n`;
    }
  });

  borderWidths.forEach(width => {
    Object.entries(sides).forEach(([side, value]) => {
      if (Array.isArray(value)) {
        css += `.border-${side}-${width} { border-${value[0]}-width: ${width}px; border-${value[1]}-width: ${width}px; border-${value[0]}-style: solid; border-${value[1]}-style: solid; }\n`;
      } else {
        css += `.border-${side}-${width} { border-${value}-width: ${width}px; border-${value}-style: solid; }\n`;
      }
    });
  });

  css += `.border-solid { border-style: solid; }\n`;
  css += `.border-dashed { border-style: dashed; }\n`;
  css += `.border-dotted { border-style: dotted; }\n`;
  css += `.border-double { border-style: double; }\n`;
  css += `.border-hidden { border-style: hidden; }\n`;
  css += `.border-none { border-style: none; }\n`;
  css += `.border-transparent { border-color: transparent; }\n`;
  css += `.border-current { border-color: currentColor; }\n`;
  css += `.border-black { border-color: #000000; }\n`;
  css += `.border-white { border-color: #ffffff; }\n`;

  const baseRadius = config.spacing.borderRadius['base'] || '8px';
  css += `.rounded { border-radius: ${baseRadius}; }\n`;

  Object.entries(config.spacing.borderRadius).forEach(([name, value]) => {
    css += `.rounded-${name} { border-radius: ${value}; }\n`;
  });

  const radiusTargets = {
    t: ['top-left', 'top-right'], r: ['top-right', 'bottom-right'],
    b: ['bottom-right', 'bottom-left'], l: ['top-left', 'bottom-left'],
    tl: ['top-left'], tr: ['top-right'], br: ['bottom-right'], bl: ['bottom-left']
  };

  Object.entries(radiusTargets).forEach(([side, corners]) => {
    corners.forEach(corner => {
      css += `.rounded-${side} { border-${corner}-radius: ${baseRadius}; }\n`;
    });
  });

  Object.entries(config.spacing.borderRadius).forEach(([name, value]) => {
    Object.entries(radiusTargets).forEach(([side, corners]) => {
      corners.forEach(corner => {
        css += `.rounded-${side}-${name} { border-${corner}-radius: ${value}; }\n`;
      });
    });
  });

  css += `\n`;
  return css;
}

// ============================================================================
// BASE ELEMENT STYLES
// ============================================================================

function generateBaseStyles(config) {
  const baseStyles = config.baseStyles;
  if (!baseStyles || Object.keys(baseStyles).length === 0) return '';

  // Build a lookup map from font size name → CSS variable
  const fontSizeMap = {};
  (config.typography?.fontSizes || []).forEach(({ name }) => {
    fontSizeMap[name] = `var(--text-${name})`;
  });

  // Line height hints per size — keeps headings tighter than body text
  const lineHeightMap = {
    xs: '1.5', sm: '1.5', base: '1.6', lg: '1.6',
    xl: '1.5', '2xl': '1.4', '3xl': '1.35', '4xl': '1.3',
    '5xl': '1.15', '6xl': '1.1', '7xl': '1.05', '8xl': '1', '9xl': '1'
  };

  let css = '\n  /* Base element styles (from baseStyles in emily.config.json) */\n';
  Object.entries(baseStyles).forEach(([element, sizeKey]) => {
    const varRef = fontSizeMap[sizeKey];
    if (!varRef) return;
    const lh = lineHeightMap[sizeKey] || '1.5';
    css += `  ${element} { font-size: ${varRef}; line-height: ${lh}; }\n`;
  });

  return css;
}

// ============================================================================
// COLOUR UTILITIES
// ============================================================================

function generateColourUtilities(colours) {
  let css = `/* Colours: Background, Text, Borders, Accents */\n`;
  // Uses CSS custom properties rather than hardcoded hex so colour utilities
  // can be overridden via variable redefinition (e.g. dark mode, theme layers).
  // The hex values are still declared as --color-* tokens in @layer theme.

  Object.entries(colours).forEach(([colourName, shades]) => {
    // Background colours
    Object.entries(shades).forEach(([shade]) => {
      css += `.bg-${colourName}-${shade} { background-color: var(--color-${colourName}-${shade}); }\n`;
    });

    // Text colours
    Object.entries(shades).forEach(([shade]) => {
      css += `.text-${colourName}-${shade} { color: var(--color-${colourName}-${shade}); }\n`;
    });

    // Border colours
    Object.entries(shades).forEach(([shade]) => {
      css += `.border-${colourName}-${shade} { border-color: var(--color-${colourName}-${shade}); }\n`;
    });

    // Accent colours (for form elements like checkboxes, radio buttons)
    Object.entries(shades).forEach(([shade]) => {
      css += `.accent-${colourName}-${shade} { accent-color: var(--color-${colourName}-${shade}); }\n`;
    });
  });

  css += `.bg-white { background-color: #ffffff; }\n`;
  css += `.bg-transparent { background-color: transparent; }\n`;
  css += `.text-white { color: #ffffff; }\n`;

  css += `\n`;
  return css;
}

function generateSemanticColourUtilities(semanticColours) {
  if (!semanticColours) return '';
  let css = `/* Semantic colours: single value, no shade scale */\n`;
  Object.entries(semanticColours).forEach(([name]) => {
    css += `.bg-${name} { background-color: var(--color-${name}); }\n`;
    css += `.text-${name} { color: var(--color-${name}); }\n`;
    css += `.border-${name} { border-color: var(--color-${name}); }\n`;
    css += `.fill-${name} { fill: var(--color-${name}); }\n`;
  });
  css += `\n`;
  return css;
}

// ============================================================================
// DARK MODE VARIANTS
// ============================================================================
// Generates dark: prefixed versions of colour and appearance utilities only.
// Layout, spacing, and typography utilities don't change in dark mode —
// targeting only the utilities where dark mode actually makes a difference
// keeps the output lean and the purge step effective.
//
// Usage in HTML: class="bg-neutral-10 dark:bg-neutral-90 text-neutral-90 dark:text-neutral-10"
// Output:  @media (prefers-color-scheme: dark) { .dark\:bg-neutral-90 { background-color: ...; } }

function addDarkModeVariants(css) {
  // Match on CSS property, not class name prefix — avoids catching
  // structural utilities like text-xs (font-size) or text-left (text-align)
  // when we only want colour-related declarations.
  const colourProperties = [
    'background-color',
    'color',
    'border-color',
    'accent-color',
    'box-shadow',
    'opacity',
    'fill',
    'stroke',
    '--tw-ring-color',
    'outline-color',
  ];

  let darkRules = '';
  const lines = css.split('\n');

  lines.forEach(line => {
    if (line.startsWith('.') && line.includes('{') && line.includes('}')) {
      const className = line.split('{')[0].trim();

      // Only base utilities — skip anything already a variant (contains ':')
      if (className.includes(':')) return;

      // Only colour/appearance properties
      const isColourUtility = colourProperties.some(prop => line.includes(prop + ':'));
      if (!isColourUtility) return;

      const classWithoutDot = className.substring(1);
      const darkRule = line.replace(className, `.dark\\:${classWithoutDot}`);
      darkRules += '  ' + darkRule + '\n';
    }
  });

  if (!darkRules) return css;

  return css
    + `\n/* Dark mode variants — explicit override */\n[data-theme="dark"] {\n${darkRules}}\n`
    + `\n/* Dark mode variants — system preference (no override set) */\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${darkRules}  }\n}\n`;
}

// ============================================================================
// RESPONSIVE VARIANTS
// ============================================================================

function addResponsiveVariants(css, config) {
  let variantCss = css;

  Object.entries(config.breakpoints).forEach(([breakpointName, breakpointValue]) => {
    const mediaQuery = `@media (min-width: ${breakpointValue}) {\n`;
    let breakpointRules = '';

    // Extract all utility rules and add responsive prefix
    const lines = css.split('\n');
    lines.forEach(line => {
      if (line.startsWith('.') && line.includes('{')) {
        const className = line.split('{')[0].trim();
        const rule = line;
        // Skip variables and already responsive selectors
        if (!className.startsWith(':root') && !className.includes(':')) {
          const responsiveRule = rule.replace(className, `.${breakpointName}\\:${className.substring(1)}`);
          breakpointRules += '  ' + responsiveRule + '\n';
        }
      }
    });

    if (breakpointRules) {
      variantCss += mediaQuery + breakpointRules + '}\n\n';
    }
  });

  return variantCss;
}

// ============================================================================
// STATE VARIANTS
// ============================================================================
// Add pseudo-class variants for hover, focus-visible, active, disabled

function addStateVariants(css) {
  const states = [
    { name: 'hover', selector: ':hover' },
    { name: 'focus', selector: ':focus' },
    { name: 'focus-within', selector: ':focus-within' },
    { name: 'focus-visible', selector: ':focus-visible' },
    { name: 'active', selector: ':active' },
    { name: 'disabled', selector: ':disabled' }
  ];

  let variantCss = css;

  states.forEach(state => {
    let stateRules = '';

    // Extract all utility rules and add state prefix
    const lines = css.split('\n');
    lines.forEach(line => {
      if (line.startsWith('.') && line.includes('{')) {
        const className = line.split('{')[0].trim();
        // Skip variables, media queries, pseudo-elements, and state variants
        if (!className.startsWith(':root') && !className.includes('@') && !className.includes('::') && !className.includes(':')) {
          // Generate state variant: .hover\:block:hover { display: block; }
          // Remove leading dot from className, add state prefix with escaped colon
          const classWithoutDot = className.substring(1);
          const stateSelector = `.${state.name}\\:${classWithoutDot}${state.selector}`;
          const statefulRule = line.replace(className, stateSelector);
          stateRules += statefulRule + '\n';
        }
      }
    });

    if (stateRules) {
      variantCss += '\n/* State variant: ' + state.name + ' */\n' + stateRules;
    }
  });

  return variantCss;
}


// ============================================================================
// PATTERN COMPONENTS
// ============================================================================
// Composite classes that combine multiple utilities into named patterns.
// These live in @layer components so utilities always take precedence in the cascade.
// Gap values reference spacing variables generated from emily.config.json,
// with pixel fallbacks so they work even without the variables in scope.

function generatePatternComponents() {
  return `
  /* ---- Centering ---- */

  /* Full-viewport overlay centering — use for modals, lightboxes, toasts */
  .center-screen {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Transform-based centering within a relative/absolute parent */
  .center-absolute {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  /* ---- Reading / Prose ---- */

  /* Comfortable reading column — limits line length, centers the block */
  .prose {
    max-width: 65ch;
    margin-inline: auto;
  }

  /* ---- Composition ---- */

  /* Vertical stack with consistent gap — replaces manual margin chains */
  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--space-4, 1rem);
  }

  /* Horizontal grouping with wrapping — for tags, button rows, icon lists */
  .cluster {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4, 1rem);
    align-items: center;
  }

  /* ---- Layout ---- */

  /* Constrained width container — 1100px max, full-width on small screens */
  .width-container {
    width: 100%;
    max-width: 1100px;
    margin-inline: auto;
    padding-inline: var(--space-4, 1rem);
  }

  @media (min-width: 640px) {
    .width-container {
      padding-inline: var(--space-6, 1.5rem);
    }
  }

  @media (min-width: 1024px) {
    .width-container {
      padding-inline: var(--space-8, 2rem);
    }
  }

  @media (min-width: 1140px) {
    .width-container {
      padding-inline: 0;
    }
  }

  /* ---- Forms ---- */

  .field-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-2, 0.5rem);
    margin-bottom: var(--space-6, 1.5rem);
  }

  .field-container label {
    display: block;
    font-weight: var(--font-weight-semibold, 600);
    color: var(--color-neutral-90);
    font-size: var(--text-base, 16px);
    line-height: 1.4;
    margin-bottom: var(--space-1, 0.25rem);
  }

  fieldset {
    border: none;
    padding: 0;
    margin: 0 0 var(--space-6, 1.5rem);
  }

  fieldset legend {
    display: block;
    font-size: var(--text-lg, 18px);
    font-weight: var(--font-weight-semibold, 600);
    margin-bottom: var(--space-3, 0.75rem);
    color: var(--color-neutral-90);
    padding: 0;
  }

  .form-hint {
    font-size: var(--text-sm, 14px);
    color: var(--color-neutral-60);
    margin-bottom: var(--space-1, 0.25rem);
  }

  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="number"],
  input[type="tel"],
  input[type="url"],
  input[type="search"],
  input[type="date"],
  select,
  textarea {
    width: 100%;
    max-width: 100%;
    padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    border: 2px solid var(--color-neutral-30);
    border-radius: 8px;
    background-color: #ffffff;
    color: var(--color-neutral-90);
    font-family: inherit;
    font-size: var(--text-base, 16px);
    line-height: var(--leading-base, 1.6);
    appearance: none;
    transition: border-color 200ms ease, box-shadow 200ms ease;
  }

  select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right var(--space-2, 0.5rem) center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: var(--space-10, 2.5rem);
    cursor: pointer;
  }

  textarea {
    min-height: 120px;
    resize: vertical;
  }

  input[type="text"]:focus,
  input[type="email"]:focus,
  input[type="password"]:focus,
  input[type="number"]:focus,
  input[type="tel"]:focus,
  input[type="url"]:focus,
  input[type="search"]:focus,
  input[type="date"]:focus,
  select:focus,
  textarea:focus {
    outline: 2px solid var(--color-neutral-80);
    outline-offset: 3px;
    border-color: var(--color-neutral-80);
    box-shadow: 0 0 0 4px rgba(219, 39, 119, 0.1);
  }

  .checkbox-group,
  .radio-group {
    display: flex;
    align-items: center;
    gap: var(--space-3, 0.75rem);
    margin-bottom: var(--space-4, 1rem);
  }

  .checkbox-group label,
  .radio-group label {
    font-weight: var(--font-weight-normal, 400);
    margin-bottom: 0;
    cursor: pointer;
    font-size: var(--text-base, 16px);
  }

  input[type="checkbox"] {
    width: 1.5rem;
    height: 1.5rem;
    margin: 0;
    cursor: pointer;
    accent-color: var(--color-brand-80);
    flex-shrink: 0;
  }

  input[type="checkbox"]:focus {
    outline: 2px solid var(--color-neutral-80);
    outline-offset: 3px;
    box-shadow: 0 0 0 4px rgba(219, 39, 119, 0.1);
  }

  input[type="radio"] {
    width: 1.5rem;
    height: 1.5rem;
    margin: 0;
    border-radius: 50%;
    appearance: none;
    background-color: #ffffff;
    border: 2px solid var(--color-neutral-30);
    display: grid;
    place-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 200ms ease, border-color 200ms ease;
  }

  input[type="radio"]::before {
    content: "";
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    transform: scale(0);
    transition: 120ms transform ease-in-out;
    background-color: var(--color-brand-80);
  }

  input[type="radio"]:checked {
    border-color: var(--color-brand-80);
  }

  input[type="radio"]:checked::before {
    transform: scale(1);
  }

  input[type="radio"]:hover {
    background-color: var(--color-brand-10);
    border-color: var(--color-brand-80);
  }

  input[type="radio"]:focus {
    outline: 2px solid var(--color-neutral-80);
    outline-offset: 3px;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(219, 39, 119, 0.1);
  }

  input[aria-invalid="true"] {
    border-color: var(--color-error-80) !important;
    border-width: 3px;
  }

  .form-error-message {
    font-size: var(--text-sm, 14px);
    font-weight: var(--font-weight-bold, 700);
    color: var(--color-error-80);
    margin-top: var(--space-1, 0.25rem);
    display: block;
  }

  .error-summary {
    border: 4px solid var(--color-error-80);
    padding: var(--space-6, 1.5rem);
    margin-bottom: var(--space-8, 2rem);
    border-radius: 8px;
  }

  .error-summary ul {
    list-style: disc;
    padding-left: var(--space-5, 1.25rem);
  }

  .error-summary a {
    color: var(--color-error-80);
  }

  /* ---- Buttons ---- */

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-3, 0.75rem) var(--space-6, 1.5rem);
    font-weight: var(--font-weight-semibold, 600);
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease;
    border: 2px solid transparent;
    text-align: center;
    min-height: 3rem;
    font-size: var(--text-base, 16px);
    text-decoration: none;
    font-family: inherit;
    line-height: 1;
  }

  .btn-primary {
    background-color: var(--color-brand-80);
    color: #ffffff;
    border-color: transparent;
  }

  .btn-primary:hover {
    background-color: var(--color-brand-90);
  }

  .btn-primary:focus-visible {
    outline: 2px solid var(--color-neutral-80);
    outline-offset: 3px;
    box-shadow: 0 0 0 4px rgba(219, 39, 119, 0.1);
  }

  .btn-secondary {
    background-color: #ffffff;
    color: var(--color-accent-80);
    border-color: var(--color-accent-80);
  }

  .btn-secondary:hover {
    background-color: var(--color-accent-10);
    color: var(--color-accent-90);
    border-color: var(--color-accent-90);
  }

  .btn-secondary:focus-visible {
    outline: 2px solid var(--color-neutral-80);
    outline-offset: 3px;
    box-shadow: 0 0 0 4px rgba(219, 39, 119, 0.1);
  }

  .btn-ghost {
    background-color: transparent;
    color: var(--color-neutral-80);
    border-color: transparent;
  }

  .btn-ghost:hover {
    background-color: var(--color-neutral-10);
  }

  .btn-ghost:focus-visible {
    outline: 2px solid var(--color-neutral-80);
    outline-offset: 3px;
    box-shadow: 0 0 0 4px rgba(219, 39, 119, 0.1);
  }

  .btn-danger {
    background-color: var(--color-error-80);
    color: #ffffff;
    border-color: transparent;
  }

  .btn-danger:hover {
    background-color: var(--color-error-90);
  }

  .btn-danger:focus-visible {
    outline: 2px solid var(--color-neutral-80);
    outline-offset: 3px;
    box-shadow: 0 0 0 4px rgba(219, 39, 119, 0.1);
  }

  .btn-sm {
    padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
    font-size: var(--text-sm, 14px);
    min-height: 2.25rem;
  }

  .btn-lg {
    padding: var(--space-4, 1rem) var(--space-8, 2rem);
    font-size: var(--text-lg, 18px);
    min-height: 3.5rem;
  }
`;
}

// ============================================================================
// BUILD FUNCTION
// ============================================================================

// ============================================================================
// BUILD FUNCTION
// ============================================================================

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

function ensureDirectoryForFile(filePath) {
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getSourceDir(config) {
  return config.purge?.sourceDir || '.';
}

function buildFullFramework() {
  const config = getConfig();

  console.log('Building EmilyCSS full framework...');

  const colours = generateAllColours(config.colours);
  console.log(`✓ Generated ${Object.keys(colours).length} colour scales`);
  if (config.semanticColours) {
    console.log(`✓ Generated ${Object.keys(config.semanticColours).length} semantic colour tokens`);
  }

  const spacing = generateSpacing(config.baseUnit, config.spacing.scale);
  console.log(`✓ Generated ${Object.keys(spacing).length} spacing values`);

  const variablesCss = generateCSSVariables(colours, spacing, config);

  let utilityCss = '';
  utilityCss += displayUtilities();
  utilityCss += generateSpacingUtilities(spacing);
  utilityCss += generateFlexboxUtilities(spacing);
  utilityCss += generateGridUtilities(spacing);
  utilityCss += sizingUtilities(spacing);
  utilityCss += generateTypographyUtilities(config);
  utilityCss += generateBorderUtilities(config);
  utilityCss += generateColourUtilities(colours);
  utilityCss += generateSemanticColourUtilities(config.semanticColours);
  utilityCss += positioningUtilities(spacing);
  utilityCss += overflowUtilities();
  utilityCss += transformUtilities(spacing);
  utilityCss += shadowUtilities();
  utilityCss += ringUtilities(colours);
  utilityCss += objectUtilities();
  utilityCss += tableListUtilities();
  utilityCss += svgUtilities(colours);
  utilityCss += formUtilities();
  utilityCss += verticalAlignUtilities();
  utilityCss += contentScrollUtilities();
  utilityCss += opacityUtilities();
  utilityCss += transitionUtilities();
  utilityCss += blendUtilities();
  utilityCss += cursorUtilities();
  utilityCss += accessibilityUtilities();
  utilityCss += containerUtilities();
  utilityCss += codeUtilities();
  utilityCss += animationUtilities();
  utilityCss += backdropUtilities();
  utilityCss += spaceUtilities(spacing);
  utilityCss += divideUtilities(spacing, colours);
  utilityCss += backgroundUtilities();
  utilityCss += filterUtilities();

  utilityCss = addStateVariants(utilityCss);
  utilityCss = addDarkModeVariants(utilityCss);
  utilityCss = addResponsiveVariants(utilityCss, config);

  const { fontFace, bodyFont } = generateFontCSS(config);

  const fontLabel = typeof config.fontFamily === 'object'
    ? 'heading: ' + (config.fontFamily.heading || 'system') + ', body: ' + (config.fontFamily.body || 'system')
    : (config.fontFamily || 'system');

  console.log('✓ Font: ' + fontLabel);

  const baseCss = `
  /* Box sizing */
  *, *::before, *::after {
    box-sizing: border-box;
  }

  body, h1, h2, h3, h4, h5, h6, p,
  ul, ol, dl, dd, figure, blockquote,
  fieldset, textarea, pre {
    margin: 0;
    padding: 0;
  }

  ul, ol {
    list-style: none;
  }

  input, button, textarea, select {
    font: inherit;
  }

  img, picture, video, canvas, svg {
    display: block;
    max-width: 100%;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  p, h1, h2, h3, h4, h5, h6 {
    overflow-wrap: break-word;
  }

  /* Base heading scale */
  h1 {
    font-size: var(--text-4xl, 36px);
    line-height: var(--leading-4xl, 1.3);
    font-weight: var(--font-weight-bold, 700);
    margin-bottom: var(--space-6, 1.5rem);
  }

  h2 {
    font-size: var(--text-3xl, 30px);
    line-height: var(--leading-3xl, 1.4);
    font-weight: var(--font-weight-bold, 700);
    margin-bottom: var(--space-5, 1.25rem);
  }

  h3 {
    font-size: var(--text-2xl, 24px);
    line-height: var(--leading-2xl, 1.4);
    font-weight: var(--font-weight-semibold, 600);
    margin-bottom: var(--space-4, 1rem);
  }

  h4 {
    font-size: var(--text-xl, 20px);
    line-height: var(--leading-xl, 1.6);
    font-weight: var(--font-weight-semibold, 600);
    margin-bottom: var(--space-3, 0.75rem);
  }

  h5 {
    font-size: var(--text-lg, 18px);
    line-height: var(--leading-lg, 1.6);
    font-weight: var(--font-weight-medium, 500);
    margin-bottom: var(--space-3, 0.75rem);
  }

  h6 {
    font-size: var(--text-base, 16px);
    line-height: var(--leading-base, 1.6);
    font-weight: var(--font-weight-medium, 500);
    margin-bottom: var(--space-2, 0.5rem);
  }

  p {
    font-size: var(--text-base, 16px);
    line-height: var(--leading-base, 1.6);
    margin-bottom: var(--space-4, 1rem);
  }

  p:last-child {
    margin-bottom: 0;
  }

  code {
    font-family: "Menlo", "Monaco", "Courier New", monospace;
    font-size: 0.875em;
    background-color: #0d0c0b;
    color: #e6ffd2;
    padding: 0.125rem 0.4rem;
    border-radius: 4px;
    display: inline;
  }

  code.block {
    display: block;
    padding: 0.625rem 1rem;
    border-radius: 6px;
    font-size: 0.8125rem;
    line-height: 1.6;
  }

  pre {
    background-color: #0d0c0b;
    color: #e4e0db;
    padding: 1.25rem;
    border-radius: 0 0 6px;
    overflow-x: auto;
    font-family: "Menlo", "Monaco", "Courier New", monospace;
    font-size: 0.875rem;
    line-height: 1.7;
    border: 1px solid #2a2520;
  }

  pre code {
    background: none;
    padding: 0;
    border-radius: 0;
    color: inherit;
    font-size: inherit;
    font-family: inherit;
    display: inline;
  }
${bodyFont}`;

  let css = fontFace ? `${fontFace}\n` : '';
  css += `@layer theme, base, components, utilities;\n\n`;
  css += `@layer theme {\n${variablesCss}}\n\n`;

  const baseStylesCss = generateBaseStyles(config);
  css += `@layer base {${baseCss}${baseStylesCss}}\n\n`;
  css += `@layer components {\n${generatePatternComponents()}}\n\n`;
  css += `@layer utilities {\n${utilityCss}}\n`;

  const fullCssPath = getFullCssPath(config);

  ensureDirectoryForFile(fullCssPath);
  fs.writeFileSync(fullCssPath, css);

  console.log(`✓ Generated CSS: ${fullCssPath}`);
  console.log(`✓ File size: ${(css.length / 1024).toFixed(2)} KB (unminified)`);
  console.log('Full framework build complete');
}

function minify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s?\{/g, '{')
    .replace(/\s?\}/g, '}')
    .replace(/;\s/g, ';')
    .trim();
}

function buildProductionCss() {
  const config = getConfig();
  const sourceDir = getSourceDir(config);
  const fullCssPath = getFullCssPath(config);
  const productionCssPath = getProductionCssPath(config);

  if (!fs.existsSync(fullCssPath)) {
    buildFullFramework();
  }

  const { purgeCSS } = require('./purge.js');
  const css = fs.readFileSync(fullCssPath, 'utf8');
  const purged = purgeCSS(css, sourceDir, config);
  const minified = minify(purged);

  ensureDirectoryForFile(productionCssPath);
  fs.writeFileSync(productionCssPath, minified);

  return {
    css,
    purged,
    minified,
    originalSize: Buffer.byteLength(css, 'utf8'),
    outputSize: Buffer.byteLength(minified, 'utf8'),
    outputPath: productionCssPath,
    fullCssPath,
  };
}

function isFrameworkStale() {
  const config = getConfig();
  const configPath = getConfigPath();
  const fullCssPath = getFullCssPath(config);

  if (!fs.existsSync(fullCssPath)) return true;
  if (!fs.existsSync(configPath)) return true;

  return fs.statSync(configPath).mtimeMs > fs.statSync(fullCssPath).mtimeMs;
}

function ensureFullFramework() {
  if (isFrameworkStale()) {
    buildFullFramework();
  }
}

function build(options = {}) {
  ensureFullFramework();

  const config = getConfig();
  const fullCssPath = getFullCssPath(config);
  const result = buildProductionCss();

  console.log('✓ Generated production CSS: ' + path.relative(process.cwd(), result.outputPath));
  console.log('✓ File size: ' + (result.outputSize / 1024).toFixed(2) + ' KB');

  if (!options.keepFull && fs.existsSync(fullCssPath)) {
    try {
      fs.unlinkSync(fullCssPath);
      console.log('Removed ' + path.relative(process.cwd(), fullCssPath) + ' for production build.');
    } catch (error) {
      // Windows FUSE: cannot always delete files cleanly, non-fatal.
    }
  }

  console.log('Build complete');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  build({ keepFull: args.includes('--keep-full') });
}

module.exports = {
  build,
  buildFullFramework,
  buildProductionCss,
  ensureFullFramework,
  hexToOklch,
  oklchToHex,
  generateColourScale,
  generateAllColours,
  generateSpacing,
  generateBorderUtilities,
  generateColourUtilities,
  generateSemanticColourUtilities,
  generateTypographyUtilities,
  generateSpacingUtilities,
  generateFlexboxUtilities,
  generateGridUtilities,
  addStateVariants,
  addResponsiveVariants,
  generateFontCSS,
  codeUtilities,
};
