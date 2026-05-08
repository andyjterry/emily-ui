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

  // Note: .flex is already generated in displayUtilities(), removed duplicate here
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

  // Grow/shrink
  css += `.flex-1 { flex: 1 1 0%; }\n`;
  css += `.flex-auto { flex: 1 1 auto; }\n`;
  css += `.flex-none { flex: none; }\n`;
  css += `.grow { flex-grow: 1; }\n`;
  css += `.grow-0 { flex-grow: 0; }\n`;
  css += `.shrink { flex-shrink: 1; }\n`;
  css += `.shrink-0 { flex-shrink: 0; }\n`;

  // Justify (main axis)
  css += `.justify-start { justify-content: flex-start; }\n`;
  css += `.justify-end { justify-content: flex-end; }\n`;
  css += `.justify-center { justify-content: center; }\n`;
  css += `.justify-between { justify-content: space-between; }\n`;
  css += `.justify-around { justify-content: space-around; }\n`;
  css += `.justify-evenly { justify-content: space-evenly; }\n`;

  // Items (cross axis)
  css += `.items-start { align-items: flex-start; }\n`;
  css += `.items-end { align-items: flex-end; }\n`;
  css += `.items-center { align-items: center; }\n`;
  css += `.items-baseline { align-items: baseline; }\n`;
  css += `.items-stretch { align-items: stretch; }\n`;

  // Self alignment
  css += `.self-start { align-self: flex-start; }\n`;
  css += `.self-end { align-self: flex-end; }\n`;
  css += `.self-center { align-self: center; }\n`;
  css += `.self-stretch { align-self: stretch; }\n`;
  css += `.self-auto { align-self: auto; }\n`;

  css += `\n`;
  return css;
}

// ============================================================================
// GRID UTILITIES
// ============================================================================

function generateGridUtilities(spacing) {
  let css = `/* Grid */\n`;

  // Note: .grid is already generated in displayUtilities(), removed duplicate here
  css += `.inline-grid { display: inline-grid; }\n`;

  // Grid columns
  for (let i = 1; i <= 12; i++) {
    css += `.grid-cols-${i} { grid-template-columns: repeat(${i}, minmax(0, 1fr)); }\n`;
  }

  // Column span
  for (let i = 1; i <= 12; i++) {
    css += `.col-span-${i} { grid-column: span ${i} / span ${i}; }\n`;
  }
  css += `.col-span-full { grid-column: 1 / -1; }\n`;

  // Column start/end
  for (let i = 1; i <= 13; i++) {
    css += `.col-start-${i} { grid-column-start: ${i}; }\n`;
    css += `.col-end-${i} { grid-column-end: ${i}; }\n`;
  }

  // Row span
  for (let i = 1; i <= 6; i++) {
    css += `.row-span-${i} { grid-row: span ${i} / span ${i}; }\n`;
  }
  css += `.row-span-full { grid-row: 1 / -1; }\n`;

  // Row start/end
  for (let i = 1; i <= 6; i++) {
    css += `.row-start-${i} { grid-row-start: ${i}; }\n`;
    css += `.row-end-${i} { grid-row-end: ${i}; }\n`;
  }

  // Auto flow
  css += `.auto-cols-auto { grid-auto-columns: auto; }\n`;
  css += `.auto-cols-fr { grid-auto-columns: minmax(0, 1fr); }\n`;
  css += `.auto-rows-auto { grid-auto-rows: auto; }\n`;
  css += `.auto-rows-fr { grid-auto-rows: minmax(0, 1fr); }\n`;

  // Gap
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

  // Font sizes
  config.typography.fontSizes.forEach(fontSize => {
    css += `.text-${fontSize.name} { font-size: var(--text-${fontSize.name}); line-height: ${fontSize.lineHeight}; }\n`;
  });

  // Font weights
  Object.entries(config.typography.fontWeights).forEach(([name, weight]) => {
    css += `.font-${name} { font-weight: ${weight}; }\n`;
  });

  // Text alignment
  css += `.text-left { text-align: left; }\n`;
  css += `.text-center { text-align: center; }\n`;
  css += `.text-right { text-align: right; }\n`;
  css += `.text-justify { text-align: justify; }\n`;

  // Text wrapping (.truncate lives in overflowUtilities in generators.js — not duplicated here)
  css += `.whitespace-nowrap { white-space: nowrap; }\n`;
  css += `.whitespace-normal { white-space: normal; }\n`;
  css += `.break-words { word-break: break-word; }\n`;
  css += `.break-all { word-break: break-all; }\n`;

  // Line height
  css += `.leading-tight { line-height: 1.2; }\n`;
  css += `.leading-normal { line-height: 1.5; }\n`;
  css += `.leading-relaxed { line-height: 1.75; }\n`;

  // Letter spacing
  css += `.tracking-tighter { letter-spacing: -0.05em; }\n`;
  css += `.tracking-tight { letter-spacing: -0.02em; }\n`;
  css += `.tracking-normal { letter-spacing: 0em; }\n`;
  css += `.tracking-wide { letter-spacing: 0.02em; }\n`;
  css += `.tracking-wider { letter-spacing: 0.05em; }\n`;
  css += `.tracking-widest { letter-spacing: 0.1em; }\n`;

  // Text decoration
  css += `.underline { text-decoration: underline; }\n`;
  css += `.no-underline { text-decoration: none; }\n`;
  css += `.line-through { text-decoration: line-through; }\n`;
  css += `.underline-offset-auto { text-underline-offset: auto; }\n`;
  css += `.underline-offset-1 { text-underline-offset: 1px; }\n`;
  css += `.underline-offset-2 { text-underline-offset: 2px; }\n`;
  css += `.underline-offset-4 { text-underline-offset: 4px; }\n`;
  css += `.underline-offset-8 { text-underline-offset: 8px; }\n`;
  css += `.decoration-auto { text-decoration-thickness: auto; }\n`;
  css += `.decoration-from-font { text-decoration-thickness: from-font; }\n`;
  css += `.decoration-1 { text-decoration-thickness: 1px; }\n`;
  css += `.decoration-2 { text-decoration-thickness: 2px; }\n`;
  css += `.decoration-4 { text-decoration-thickness: 4px; }\n`;

  // Font variant numeric
  css += `.normal-nums { font-variant-numeric: normal; }\n`;
  css += `.ordinal { font-variant-numeric: ordinal; }\n`;
  css += `.slashed-zero { font-variant-numeric: slashed-zero; }\n`;
  css += `.lining-nums { font-variant-numeric: lining-nums; }\n`;
  css += `.oldstyle-nums { font-variant-numeric: oldstyle-nums; }\n`;
  css += `.proportional-nums { font-variant-numeric: proportional-nums; }\n`;
  css += `.tabular-nums { font-variant-numeric: tabular-nums; }\n`;
  css += `.diagonal-fractions { font-variant-numeric: diagonal-fractions; }\n`;
  css += `.stacked-fractions { font-variant-numeric: stacked-fractions; }\n`;

  // Text transform
  css += `.uppercase { text-transform: uppercase; }\n`;
  css += `.lowercase { text-transform: lowercase; }\n`;
  css += `.capitalize { text-transform: capitalize; }\n`;

  // Font family utilities
  css += `.font-sans { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }\n`;
  css += `.font-serif { font-family: Georgia, "Times New Roman", serif; }\n`;
  css += `.font-mono { font-family: "Menlo", "Monaco", "Courier New", monospace; }\n`;
  css += `.font-inter { font-family: "Inter", system-ui, sans-serif; }\n`;
  css += `.font-lexend { font-family: "Lexend", system-ui, sans-serif; }\n`;

  css += `\n`;
  return css;
}

// ============================================================================
// BORDER UTILITIES
// ============================================================================

function generateBorderUtilities(config) {
  let css = `/* Borders & Radius */\n`;

  // Border widths from config
  const borderWidths = config.spacing.borderWidths || [0, 2, 4, 8];

  // Border width
  css += `.border { border-width: 1px; }\n`;
  borderWidths.forEach(width => {
    css += `.border-${width} { border-width: ${width}px; }\n`;
  });

  // Border sides (default 1px + widths)

  ['t', 'r', 'b', 'l'].forEach(side => {
    css += `.border-${side} { border-${side === 't' ? 'top' : side === 'r' ? 'right' : side === 'b' ? 'bottom' : 'left'}-width: 1px; }\n`;
  });

  borderWidths.forEach(width => {
    ['t', 'r', 'b', 'l'].forEach(side => {
      const sideMap = { t: 'top', r: 'right', b: 'bottom', l: 'left' };
      css += `.border-${side}-${width} { border-${sideMap[side]}-width: ${width}px; }\n`;
    });
  });

  // Border style
  css += `.border-solid { border-style: solid; }\n`;
  css += `.border-dashed { border-style: dashed; }\n`;
  css += `.border-dotted { border-style: dotted; }\n`;
  css += `.border-double { border-style: double; }\n`;
  css += `.border-none { border-style: none; }\n`;

  // Border radius (base)
  const baseRadius = config.spacing.borderRadius['base'] || '8px';
  css += `.rounded { border-radius: ${baseRadius}; }\n`;

  // Border radius (named)
  Object.entries(config.spacing.borderRadius).forEach(([name, value]) => {
    css += `.rounded-${name} { border-radius: ${value}; }\n`;
  });

  // Border radius per side
  css += `.rounded-t { border-top-left-radius: ${baseRadius}; border-top-right-radius: ${baseRadius}; }\n`;
  css += `.rounded-b { border-bottom-left-radius: ${baseRadius}; border-bottom-right-radius: ${baseRadius}; }\n`;
  css += `.rounded-l { border-top-left-radius: ${baseRadius}; border-bottom-left-radius: ${baseRadius}; }\n`;
  css += `.rounded-r { border-top-right-radius: ${baseRadius}; border-bottom-right-radius: ${baseRadius}; }\n`;
  css += `.rounded-tl { border-top-left-radius: ${baseRadius}; }\n`;
  css += `.rounded-tr { border-top-right-radius: ${baseRadius}; }\n`;
  css += `.rounded-bl { border-bottom-left-radius: ${baseRadius}; }\n`;
  css += `.rounded-br { border-bottom-right-radius: ${baseRadius}; }\n`;

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
    xl: '1.5', '2xl': '1.4', '3xl': '1.35', '4xl': '1.3'
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

  Object.entries(colours).forEach(([colourName, shades]) => {
    // Background colours
    Object.entries(shades).forEach(([shade, hex]) => {
      css += `.bg-${colourName}-${shade} { background-color: ${hex}; }\n`;
    });

    // Text colours
    Object.entries(shades).forEach(([shade, hex]) => {
      css += `.text-${colourName}-${shade} { color: ${hex}; }\n`;
    });

    // Border colours
    Object.entries(shades).forEach(([shade, hex]) => {
      css += `.border-${colourName}-${shade} { border-color: ${hex}; }\n`;
    });

    // Accent colours (for form elements like checkboxes, radio buttons)
    Object.entries(shades).forEach(([shade, hex]) => {
      css += `.accent-${colourName}-${shade} { accent-color: ${hex}; }\n`;
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
    border-radius: 6px;
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
  addStateVariants,
  addResponsiveVariants,
  generateFontCSS,
  codeUtilities,
};