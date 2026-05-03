// ============================================================================
// UTILITY GENERATORS MODULE
// Organized by category, each function returns a string of CSS rules
// ============================================================================

// Helper function to escape special characters in class names
function escapeClassName(key) {
  return key.replace(/\./g, '\\.');
}

// Display & Visibility
function displayUtilities() {
  return `/* Display & Visibility */
.block { display: block; }
.inline { display: inline; }
.inline-block { display: inline-block; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.inline-grid { display: inline-grid; }
.hidden { display: none; }
.contents { display: contents; }
.visible { visibility: visible; }
.invisible { visibility: hidden; }

`;
}

// Sizing (Width & Height)
function sizingUtilities(spacing) {
  let css = `/* Sizing */\n`;

  // Width
  Object.entries(spacing).forEach(([key, value]) => {
    const escaped = escapeClassName(key);
    css += `.w-${escaped} { width: ${value}; }\n`;
  });

  // Height
  Object.entries(spacing).forEach(([key, value]) => {
    const escaped = escapeClassName(key);
    css += `.h-${escaped} { height: ${value}; }\n`;
  });

  // Full & screen
  css += `.w-full { width: 100%; }\n`;
  css += `.h-full { height: 100%; }\n`;
  css += `.w-screen { width: 100vw; }\n`;
  css += `.h-screen { height: 100vh; }\n`;

  // Min/Max
  css += `.min-w-0 { min-width: 0; }\n`;
  css += `.min-h-0 { min-height: 0; }\n`;
  css += `.min-h-screen { min-height: 100vh; }\n`;
  css += `.max-w-full { max-width: 100%; }\n`;
  css += `.max-h-full { max-height: 100%; }\n`;
  css += `.max-w-xs { max-width: 20rem; }\n`;
  css += `.max-w-sm { max-width: 24rem; }\n`;
  css += `.max-w-md { max-width: 28rem; }\n`;
  css += `.max-w-lg { max-width: 32rem; }\n`;
  css += `.max-w-xl { max-width: 36rem; }\n`;
  css += `.max-w-2xl { max-width: 42rem; }\n`;
  css += `.max-w-3xl { max-width: 48rem; }\n`;
  css += `.max-w-4xl { max-width: 56rem; }\n`;
  css += `.max-w-5xl { max-width: 64rem; }\n`;
  css += `.max-w-6xl { max-width: 72rem; }\n`;
  css += `.max-w-7xl { max-width: 80rem; }\n`;

  // Aspect ratio
  css += `.aspect-auto { aspect-ratio: auto; }\n`;
  css += `.aspect-square { aspect-ratio: 1; }\n`;
  css += `.aspect-video { aspect-ratio: 16 / 9; }\n`;
  css += `.aspect-3\/2 { aspect-ratio: 3 / 2; }\n`;
  css += `.aspect-4\/3 { aspect-ratio: 4 / 3; }\n`;
  css += `.aspect-16\/9 { aspect-ratio: 16 / 9; }\n`;

  css += `\n`;
  return css;
}

// Positioning
function positioningUtilities(spacing) {
  let css = `/* Positioning */\n`;

  css += `.static { position: static; }\n`;
  css += `.relative { position: relative; }\n`;
  css += `.absolute { position: absolute; }\n`;
  css += `.fixed { position: fixed; }\n`;
  css += `.sticky { position: sticky; }\n`;

  // Inset values
  Object.entries(spacing).forEach(([key, value]) => {
    const escaped = escapeClassName(key);
    css += `.top-${escaped} { top: ${value}; }\n`;
    css += `.right-${escaped} { right: ${value}; }\n`;
    css += `.bottom-${escaped} { bottom: ${value}; }\n`;
    css += `.left-${escaped} { left: ${value}; }\n`;
    css += `.inset-${escaped} { inset: ${value}; }\n`;
  });

  css += `.inset-auto { inset: auto; }\n`;

  // Z-index (semantic)
  const zIndices = {
    'auto': 'auto',
    '0': '0',
    '10': '10',
    '20': '20',
    '30': '30',
    '40': '40',
    '50': '50',
    'dropdown': '1000',
    'sticky': '1020',
    'fixed': '1030',
    'modal': '1040',
    'popover': '1060',
    'tooltip': '1070'
  };

  Object.entries(zIndices).forEach(([name, value]) => {
    css += `.z-${name} { z-index: ${value}; }\n`;
  });

  css += `\n`;
  return css;
}

// Overflow & Clipping
function overflowUtilities() {
  return `/* Overflow & Clipping */
.overflow-auto { overflow: auto; }
.overflow-hidden { overflow: hidden; }
.overflow-visible { overflow: visible; }
.overflow-scroll { overflow: scroll; }
.overflow-x-auto { overflow-x: auto; }
.overflow-x-hidden { overflow-x: hidden; }
.overflow-y-auto { overflow-y: auto; }
.overflow-y-hidden { overflow-y: hidden; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-4 { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-5 { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-6 { display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden; }

`;
}

// Opacity
function opacityUtilities() {
  const opacities = [0, 5, 10, 25, 50, 75, 90, 95, 100];
  let css = `/* Opacity */\n`;

  opacities.forEach(op => {
    css += `.opacity-${op} { opacity: ${op / 100}; }\n`;
  });

  css += `\n`;
  return css;
}

// Transitions & Transforms
function transitionUtilities() {
  return `/* Transitions */
.transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-none { transition-property: none; }
.transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-opacity { transition-property: opacity; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.duration-75 { transition-duration: 75ms; }
.duration-100 { transition-duration: 100ms; }
.duration-150 { transition-duration: 150ms; }
.duration-200 { transition-duration: 200ms; }
.duration-300 { transition-duration: 300ms; }
.duration-500 { transition-duration: 500ms; }
.duration-700 { transition-duration: 700ms; }
.duration-1000 { transition-duration: 1000ms; }
.ease-linear { transition-timing-function: linear; }
.ease-in { transition-timing-function: cubic-bezier(0.4, 0, 1, 1); }
.ease-out { transition-timing-function: cubic-bezier(0, 0, 0.2, 1); }
.ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
.delay-75 { transition-delay: 75ms; }
.delay-100 { transition-delay: 100ms; }
.delay-150 { transition-delay: 150ms; }
.delay-200 { transition-delay: 200ms; }
.delay-300 { transition-delay: 300ms; }
.delay-500 { transition-delay: 500ms; }

`;
}

// Transforms
function transformUtilities(spacing) {
  let css = `/* Transforms */\n`;

  css += `.transform { transform: translateZ(0); }\n`;
  css += `.transform-gpu { transform: translate3d(0, 0, 0); }\n`;
  css += `.transform-none { transform: none; }\n`;

  // Translate
  Object.entries(spacing).forEach(([key, value]) => {
    const escaped = escapeClassName(key);
    css += `.translate-x-${escaped} { transform: translateX(${value}); }\n`;
    css += `.translate-y-${escaped} { transform: translateY(${value}); }\n`;
    css += `.-translate-x-${escaped} { transform: translateX(-${value}); }\n`;
    css += `.-translate-y-${escaped} { transform: translateY(-${value}); }\n`;
  });

  // Rotate
  const rotations = [0, 1, 2, 3, 6, 12, 45, 90, 180];
  rotations.forEach(deg => {
    css += `.rotate-${deg} { transform: rotate(${deg}deg); }\n`;
    if (deg > 0) css += `.-rotate-${deg} { transform: rotate(-${deg}deg); }\n`;
  });

  // Scale
  const scales = [0, 50, 75, 90, 95, 100, 110, 125, 150];
  scales.forEach(scale => {
    css += `.scale-${scale} { transform: scale(${scale / 100}); }\n`;
  });

  // Skew
  const skews = [0, 1, 2, 3];
  skews.forEach(sk => {
    css += `.skew-x-${sk} { transform: skewX(${sk}deg); }\n`;
    css += `.skew-y-${sk} { transform: skewY(${sk}deg); }\n`;
  });

  // Transform origin
  css += `.origin-center { transform-origin: center; }\n`;
  css += `.origin-top { transform-origin: top; }\n`;
  css += `.origin-top-right { transform-origin: top right; }\n`;
  css += `.origin-right { transform-origin: right; }\n`;
  css += `.origin-bottom-right { transform-origin: bottom right; }\n`;
  css += `.origin-bottom { transform-origin: bottom; }\n`;
  css += `.origin-bottom-left { transform-origin: bottom left; }\n`;
  css += `.origin-left { transform-origin: left; }\n`;
  css += `.origin-top-left { transform-origin: top left; }\n`;

  css += `\n`;
  return css;
}

// Shadows
function shadowUtilities() {
  return `/* Shadows */
.shadow-none { box-shadow: none; }
.shadow-sm { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }
.shadow { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
.shadow-md { box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); }
.shadow-lg { box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15); }

`;
}

// Rings & Outlines (Focus states)
function ringUtilities(colours) {
  let css = `/* Rings & Outlines */\n`;

  css += `.ring-0 { box-shadow: 0 0 0 0px var(--ring-color, transparent); }\n`;
  css += `.ring-1 { box-shadow: 0 0 0 1px var(--ring-color, transparent); }\n`;
  css += `.ring-2 { box-shadow: 0 0 0 2px var(--ring-color, transparent); }\n`;

  css += `.ring-offset-0 { --ring-offset-width: 0px; }\n`;
  css += `.ring-offset-2 { --ring-offset-width: 2px; }\n`;
  css += `.ring-offset-4 { --ring-offset-width: 4px; }\n`;

  // Ring colours
  Object.entries(colours).forEach(([colourName, shades]) => {
    Object.entries(shades).forEach(([shade]) => {
      css += `.ring-${colourName}-${shade} { --ring-color: var(--color-${colourName}-${shade}); }\n`;
    });
  });

  css += `.outline-none { outline: 2px solid transparent; outline-offset: 2px; }\n`;
  css += `.outline { outline: 1px solid currentColor; }\n`;
  css += `.outline-0 { outline-width: 0; }\n`;
  css += `.outline-1 { outline-width: 1px; }\n`;
  css += `.outline-2 { outline-width: 2px; }\n`;

  css += `\n`;
  return css;
}

// Object Fit & Position
function objectUtilities() {
  return `/* Object Fit & Position */
.object-contain { object-fit: contain; }
.object-cover { object-fit: cover; }
.object-fill { object-fit: fill; }
.object-none { object-fit: none; }
.object-scale-down { object-fit: scale-down; }
.object-center { object-position: center; }
.object-top { object-position: top; }
.object-bottom { object-position: bottom; }
.object-left { object-position: left; }
.object-right { object-position: right; }
.object-top-left { object-position: top left; }
.object-top-right { object-position: top right; }
.object-bottom-left { object-position: bottom left; }
.object-bottom-right { object-position: bottom right; }

`;
}

// Tables & Lists
function tableListUtilities() {
  return `/* Tables & Lists */
.border-collapse { border-collapse: collapse; }
.border-separate { border-collapse: separate; }
.table-auto { table-layout: auto; }
.table-fixed { table-layout: fixed; }
.caption-top { caption-side: top; }
.caption-bottom { caption-side: bottom; }
.list-none { list-style-type: none; }
.list-disc { list-style-type: disc; }
.list-decimal { list-style-type: decimal; }
.list-inside { list-style-position: inside; }
.list-outside { list-style-position: outside; }

`;
}

// SVG Utilities
function svgUtilities(colours) {
  let css = `/* SVG */\n`;

  css += `.fill-current { fill: currentColor; }\n`;
  css += `.stroke-current { stroke: currentColor; }\n`;
  css += `.stroke-0 { stroke-width: 0; }\n`;
  css += `.stroke-1 { stroke-width: 1; }\n`;
  css += `.stroke-2 { stroke-width: 2; }\n`;

  // Fill colours
  Object.entries(colours).forEach(([colourName, shades]) => {
    Object.entries(shades).forEach(([shade]) => {
      css += `.fill-${colourName}-${shade} { fill: var(--color-${colourName}-${shade}); }\n`;
    });
  });

  // Stroke colours
  Object.entries(colours).forEach(([colourName, shades]) => {
    Object.entries(shades).forEach(([shade]) => {
      css += `.stroke-${colourName}-${shade} { stroke: var(--color-${colourName}-${shade}); }\n`;
    });
  });

  css += `\n`;
  return css;
}

// Forms
function formUtilities() {
  return `/* Forms */
.appearance-none { appearance: none; }
.placeholder-transparent::placeholder { color: transparent; }
.placeholder-current::placeholder { color: currentColor; }
.autofill\\:bg-transparent:autofill { background-color: transparent !important; }
.autofill\\:text-current:autofill { color: currentColor !important; }
.accent-current { accent-color: currentColor; }
.checked\\:bg-current:checked { background-color: currentColor; }
.indeterminate\\:bg-current:indeterminate { background-color: currentColor; }
.default\\:ring-0:default { box-shadow: 0 0 0 0px transparent; }
.disabled\\:opacity-50:disabled { opacity: 0.5; }
.enabled\\:opacity-100:enabled { opacity: 1; }
.read-only\\:bg-gray-100:read-only { background-color: rgb(243, 244, 246); }

`;
}

// Vertical Align
function verticalAlignUtilities() {
  return `/* Vertical Align */
.align-baseline { vertical-align: baseline; }
.align-top { vertical-align: top; }
.align-middle { vertical-align: middle; }
.align-bottom { vertical-align: bottom; }
.align-text-top { vertical-align: text-top; }
.align-text-bottom { vertical-align: text-bottom; }
.align-sub { vertical-align: sub; }
.align-super { vertical-align: super; }

`;
}

// Content Visibility & Scroll
function contentScrollUtilities() {
  return `/* Content Visibility & Scroll */
.content-normal { content-visibility: normal; }
.content-hidden { content-visibility: hidden; }
.content-auto { content-visibility: auto; }
.scroll-auto { scroll-behavior: auto; }
.scroll-smooth { scroll-behavior: smooth; }
.scroll-m-0 { scroll-margin: 0; }
.snap-none { scroll-snap-type: none; }
.snap-x { scroll-snap-type: x var(--emily-scroll-snap-strictness); }
.snap-y { scroll-snap-type: y var(--emily-scroll-snap-strictness); }
.snap-both { scroll-snap-type: both var(--emily-scroll-snap-strictness); }
.snap-mandatory { --emily-scroll-snap-strictness: mandatory; }
.snap-proximity { --emily-scroll-snap-strictness: proximity; }

`;
}

// Blend Modes
function blendUtilities() {
  return `/* Blend Modes */
.mix-normal { mix-blend-mode: normal; }
.mix-multiply { mix-blend-mode: multiply; }
.mix-screen { mix-blend-mode: screen; }
.mix-overlay { mix-blend-mode: overlay; }
.mix-darken { mix-blend-mode: darken; }
.mix-lighten { mix-blend-mode: lighten; }
.mix-color-dodge { mix-blend-mode: color-dodge; }
.mix-color-burn { mix-blend-mode: color-burn; }
.mix-hard-light { mix-blend-mode: hard-light; }
.mix-soft-light { mix-blend-mode: soft-light; }
.mix-difference { mix-blend-mode: difference; }
.mix-exclusion { mix-blend-mode: exclusion; }
.mix-hue { mix-blend-mode: hue; }
.mix-saturation { mix-blend-mode: saturation; }
.mix-color { mix-blend-mode: color; }
.mix-luminosity { mix-blend-mode: luminosity; }

`;
}

// Cursors & Interactions
function cursorUtilities() {
  return `/* Cursors & Interactions */
.cursor-auto { cursor: auto; }
.cursor-default { cursor: default; }
.cursor-pointer { cursor: pointer; }
.cursor-wait { cursor: wait; }
.cursor-not-allowed { cursor: not-allowed; }
.cursor-move { cursor: move; }
.cursor-text { cursor: text; }
.cursor-help { cursor: help; }
.pointer-events-auto { pointer-events: auto; }
.pointer-events-none { pointer-events: none; }
.select-none { user-select: none; }
.select-text { user-select: text; }
.select-all { user-select: all; }
.select-auto { user-select: auto; }

`;
}

// Accessibility
function accessibilityUtilities() {
  return `/* Accessibility */
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
.not-sr-only { position: static; width: auto; height: auto; padding: 0; margin: 0; overflow: visible; clip: auto; white-space: normal; }
.focus-visible:focus { outline: 2px solid currentColor; outline-offset: 2px; }
.focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .motion-reduce\\:transition-none { transition-property: none; }
  .motion-reduce\\:animate-none { animation: none; }
}
@media (prefers-reduced-motion: no-preference) {
  .motion-safe\\:transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
}
@media (forced-colors: active) {
  .forced-colors\\:outline { outline: 1px solid CanvasText; }
  .forced-colors\\:outline-1 { outline: 1px solid CanvasText; }
  .forced-colors\\:forced-color-adjust-none { forced-color-adjust: none; }
}

`;
}

// Container Queries (Forward-looking)
function containerUtilities() {
  return `/* Container Queries */
@supports (container-type: inline-size) {
  .container-type-inline { container-type: inline-size; }
  @container (min-width: 20rem) { .cq-xs\\: { /* utilities */ } }
  @container (min-width: 28rem) { .cq-sm\\: { /* utilities */ } }
  @container (min-width: 36rem) { .cq-md\\: { /* utilities */ } }
  @container (min-width: 48rem) { .cq-lg\\: { /* utilities */ } }
}

`;
}

// ============================================================================
// CODE BLOCK UTILITIES
// ============================================================================
// Styles pre/code elements to look like a VSCode Dark+ editor out of the box.
// All colours are fixed VSCode Dark+ values — not config-driven, because code
// editor chrome should always look like a code editor regardless of brand.
function codeUtilities() {
  return `/* Code — window chrome */
.code-window { border-radius: 8px; overflow: hidden; border: 1px solid #3c3c3c; }
.code-title-bar { background-color: #2d2d2d; padding: 0.5rem 1rem; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #3c3c3c; }
.code-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.code-dot-red { background-color: #ff5f57; }
.code-dot-yellow { background-color: #ffbd2e; }
.code-dot-green { background-color: #28c840; }
.code-filename { font-family: "Menlo", "Monaco", "Courier New", monospace; font-size: 0.85rem; color: white; margin-left: 0.5rem; }

/* Code — VSCode Dark+ token colours */
.token-tag { color: #569cd6; }
.token-attr { color: #9cdcfe; }
.token-string { color: #ce9178; }
.token-number { color: #b5cea8; }
.token-variant { color: #4ec9b0; }
.token-utility { color: #dcdcaa; }
.token-colour { color: #6a9955; }
.token-comment { color: #6a9955; opacity: 0.75; font-style: italic; }
.token-keyword { color: #c586c0; }
.token-operator { color: #d4d4d4; }
.token-line-number { color: #858585; user-select: none; padding-right: 1rem; display: inline-block; min-width: 2rem; text-align: right; }

`;
}

module.exports = {
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
  codeUtilities
};
