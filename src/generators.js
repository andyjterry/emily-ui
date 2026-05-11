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
.flow-root { display: flow-root; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.inline-grid { display: inline-grid; }
.contents { display: contents; }
.list-item { display: list-item; }
.hidden { display: none; }
.table { display: table; }
.inline-table { display: inline-table; }
.table-caption { display: table-caption; }
.table-cell { display: table-cell; }
.table-column { display: table-column; }
.table-column-group { display: table-column-group; }
.table-footer-group { display: table-footer-group; }
.table-header-group { display: table-header-group; }
.table-row-group { display: table-row-group; }
.table-row { display: table-row; }
.visible { visibility: visible; }
.invisible { visibility: hidden; }
.collapse { visibility: collapse; }
.float-start { float: inline-start; }
.float-end { float: inline-end; }
.float-right { float: right; }
.float-left { float: left; }
.float-none { float: none; }
.clear-start { clear: inline-start; }
.clear-end { clear: inline-end; }
.clear-left { clear: left; }
.clear-right { clear: right; }
.clear-both { clear: both; }
.clear-none { clear: none; }

`;
}

// Sizing (Width & Height)
function sizingUtilities(spacing) {
  let css = `/* Sizing */\n`;

  Object.entries(spacing).forEach(([key, value]) => {
    const escaped = escapeClassName(key);
    css += `.w-${escaped} { width: ${value}; }\n`;
    css += `.h-${escaped} { height: ${value}; }\n`;
    css += `.size-${escaped} { width: ${value}; height: ${value}; }\n`;
    css += `.min-w-${escaped} { min-width: ${value}; }\n`;
    css += `.min-h-${escaped} { min-height: ${value}; }\n`;
    css += `.max-w-${escaped} { max-width: ${value}; }\n`;
    css += `.max-h-${escaped} { max-height: ${value}; }\n`;
  });

  const fractions = {
    '1\\/2': '50%', '1\\/3': '33.333333%', '2\\/3': '66.666667%',
    '1\\/4': '25%', '2\\/4': '50%', '3\\/4': '75%',
    '1\\/5': '20%', '2\\/5': '40%', '3\\/5': '60%', '4\\/5': '80%',
    '1\\/6': '16.666667%', '2\\/6': '33.333333%', '3\\/6': '50%', '4\\/6': '66.666667%', '5\\/6': '83.333333%',
    '1\\/12': '8.333333%', '2\\/12': '16.666667%', '3\\/12': '25%', '4\\/12': '33.333333%', '5\\/12': '41.666667%', '6\\/12': '50%', '7\\/12': '58.333333%', '8\\/12': '66.666667%', '9\\/12': '75%', '10\\/12': '83.333333%', '11\\/12': '91.666667%'
  };

  Object.entries(fractions).forEach(([name, value]) => {
    css += `.w-${name} { width: ${value}; }\n`;
    css += `.h-${name} { height: ${value}; }\n`;
    css += `.size-${name} { width: ${value}; height: ${value}; }\n`;
  });

  css += `.w-auto { width: auto; }\n`;
  css += `.h-auto { height: auto; }\n`;
  css += `.size-auto { width: auto; height: auto; }\n`;
  css += `.w-full { width: 100%; }\n`;
  css += `.h-full { height: 100%; }\n`;
  css += `.size-full { width: 100%; height: 100%; }\n`;
  css += `.w-screen { width: 100vw; }\n`;
  css += `.h-screen { height: 100vh; }\n`;
  css += `.w-svw { width: 100svw; }\n`;
  css += `.h-svh { height: 100svh; }\n`;
  css += `.w-lvw { width: 100lvw; }\n`;
  css += `.h-lvh { height: 100lvh; }\n`;
  css += `.w-dvw { width: 100dvw; }\n`;
  css += `.h-dvh { height: 100dvh; }\n`;
  css += `.w-min { width: min-content; }\n`;
  css += `.w-max { width: max-content; }\n`;
  css += `.w-fit { width: fit-content; }\n`;
  css += `.h-min { height: min-content; }\n`;
  css += `.h-max { height: max-content; }\n`;
  css += `.h-fit { height: fit-content; }\n`;

  css += `.min-w-0 { min-width: 0; }\n`;
  css += `.min-w-full { min-width: 100%; }\n`;
  css += `.min-w-min { min-width: min-content; }\n`;
  css += `.min-w-max { min-width: max-content; }\n`;
  css += `.min-w-fit { min-width: fit-content; }\n`;
  css += `.min-h-0 { min-height: 0; }\n`;
  css += `.min-h-full { min-height: 100%; }\n`;
  css += `.min-h-screen { min-height: 100vh; }\n`;
  css += `.min-h-svh { min-height: 100svh; }\n`;
  css += `.min-h-lvh { min-height: 100lvh; }\n`;
  css += `.min-h-dvh { min-height: 100dvh; }\n`;
  css += `.min-h-min { min-height: min-content; }\n`;
  css += `.min-h-max { min-height: max-content; }\n`;
  css += `.min-h-fit { min-height: fit-content; }\n`;

  css += `.max-w-0 { max-width: 0; }\n`;
  css += `.max-w-none { max-width: none; }\n`;
  css += `.max-w-full { max-width: 100%; }\n`;
  css += `.max-w-min { max-width: min-content; }\n`;
  css += `.max-w-max { max-width: max-content; }\n`;
  css += `.max-w-fit { max-width: fit-content; }\n`;
  css += `.max-h-0 { max-height: 0; }\n`;
  css += `.max-h-full { max-height: 100%; }\n`;
  css += `.max-h-screen { max-height: 100vh; }\n`;
  css += `.max-h-svh { max-height: 100svh; }\n`;
  css += `.max-h-lvh { max-height: 100lvh; }\n`;
  css += `.max-h-dvh { max-height: 100dvh; }\n`;
  css += `.max-h-min { max-height: min-content; }\n`;
  css += `.max-h-max { max-height: max-content; }\n`;
  css += `.max-h-fit { max-height: fit-content; }\n`;

  const maxWidths = {
    xs: '20rem', sm: '24rem', md: '28rem', lg: '32rem', xl: '36rem',
    '2xl': '42rem', '3xl': '48rem', '4xl': '56rem', '5xl': '64rem',
    '6xl': '72rem', '7xl': '80rem', prose: '65ch', screen: '100vw',
    'screen-sm': '640px', 'screen-md': '768px', 'screen-lg': '1024px',
    'screen-xl': '1280px', 'screen-2xl': '1536px'
  };
  Object.entries(maxWidths).forEach(([name, value]) => {
    css += `.max-w-${name} { max-width: ${value}; }\n`;
  });

  css += `.aspect-auto { aspect-ratio: auto; }\n`;
  css += `.aspect-square { aspect-ratio: 1; }\n`;
  css += `.aspect-video { aspect-ratio: 16 / 9; }\n`;
  css += `.aspect-3\\/2 { aspect-ratio: 3 / 2; }\n`;
  css += `.aspect-4\\/3 { aspect-ratio: 4 / 3; }\n`;
  css += `.aspect-16\\/9 { aspect-ratio: 16 / 9; }\n`;

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

  Object.entries(spacing).forEach(([key, value]) => {
    const escaped = escapeClassName(key);
    css += `.top-${escaped} { top: ${value}; }\n`;
    css += `.right-${escaped} { right: ${value}; }\n`;
    css += `.bottom-${escaped} { bottom: ${value}; }\n`;
    css += `.left-${escaped} { left: ${value}; }\n`;
    css += `.inset-${escaped} { inset: ${value}; }\n`;
    css += `.inset-x-${escaped} { left: ${value}; right: ${value}; }\n`;
    css += `.inset-y-${escaped} { top: ${value}; bottom: ${value}; }\n`;
    if (value !== '0' && value !== '0px') {
      css += `.-top-${escaped} { top: -${value}; }\n`;
      css += `.-right-${escaped} { right: -${value}; }\n`;
      css += `.-bottom-${escaped} { bottom: -${value}; }\n`;
      css += `.-left-${escaped} { left: -${value}; }\n`;
      css += `.-inset-${escaped} { inset: -${value}; }\n`;
      css += `.-inset-x-${escaped} { left: -${value}; right: -${value}; }\n`;
      css += `.-inset-y-${escaped} { top: -${value}; bottom: -${value}; }\n`;
    }
  });

  css += `.inset-auto { inset: auto; }\n`;
  css += `.inset-x-auto { left: auto; right: auto; }\n`;
  css += `.inset-y-auto { top: auto; bottom: auto; }\n`;
  css += `.top-auto { top: auto; }\n`;
  css += `.right-auto { right: auto; }\n`;
  css += `.bottom-auto { bottom: auto; }\n`;
  css += `.left-auto { left: auto; }\n`;

  const zIndices = {
    'auto': 'auto', '0': '0', '10': '10', '20': '20', '30': '30', '40': '40', '50': '50',
    'dropdown': '1000', 'sticky': '1020', 'fixed': '1030', 'modal': '1040', 'popover': '1060', 'tooltip': '1070'
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
.overflow-clip { overflow: clip; }
.overflow-visible { overflow: visible; }
.overflow-scroll { overflow: scroll; }
.overflow-x-auto { overflow-x: auto; }
.overflow-x-hidden { overflow-x: hidden; }
.overflow-x-clip { overflow-x: clip; }
.overflow-x-visible { overflow-x: visible; }
.overflow-x-scroll { overflow-x: scroll; }
.overflow-y-auto { overflow-y: auto; }
.overflow-y-hidden { overflow-y: hidden; }
.overflow-y-clip { overflow-y: clip; }
.overflow-y-visible { overflow-y: visible; }
.overflow-y-scroll { overflow-y: scroll; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.text-ellipsis { text-overflow: ellipsis; }
.text-clip { text-overflow: clip; }
.line-clamp-none { overflow: visible; display: block; -webkit-box-orient: horizontal; -webkit-line-clamp: unset; }
.line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-4 { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-5 { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-6 { display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden; }

`;
}

// Opacity
function opacityUtilities() {
  const opacities = [0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100];
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
.shadow { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06); }
.shadow-md { box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06); }
.shadow-lg { box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05); }
.shadow-xl { box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04); }
.shadow-2xl { box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25); }
.shadow-inner { box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06); }

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
  css += `.outline-offset-0 { outline-offset: 0px; }\n`;
  css += `.outline-offset-1 { outline-offset: 1px; }\n`;
  css += `.outline-offset-2 { outline-offset: 2px; }\n`;
  css += `.outline-offset-4 { outline-offset: 4px; }\n`;
  css += `.outline-offset-8 { outline-offset: 8px; }\n`;

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
.caret-transparent { caret-color: transparent; }
.caret-current { caret-color: currentColor; }
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
.snap-start { scroll-snap-align: start; }
.snap-center { scroll-snap-align: center; }
.snap-end { scroll-snap-align: end; }
.snap-align-none { scroll-snap-align: none; }

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
.cursor-text { cursor: text; }
.cursor-move { cursor: move; }
.cursor-help { cursor: help; }
.cursor-not-allowed { cursor: not-allowed; }
.cursor-none { cursor: none; }
.cursor-context-menu { cursor: context-menu; }
.cursor-progress { cursor: progress; }
.cursor-cell { cursor: cell; }
.cursor-crosshair { cursor: crosshair; }
.cursor-vertical-text { cursor: vertical-text; }
.cursor-alias { cursor: alias; }
.cursor-copy { cursor: copy; }
.cursor-no-drop { cursor: no-drop; }
.cursor-grab { cursor: grab; }
.cursor-grabbing { cursor: grabbing; }
.cursor-all-scroll { cursor: all-scroll; }
.cursor-col-resize { cursor: col-resize; }
.cursor-row-resize { cursor: row-resize; }
.cursor-n-resize { cursor: n-resize; }
.cursor-e-resize { cursor: e-resize; }
.cursor-s-resize { cursor: s-resize; }
.cursor-w-resize { cursor: w-resize; }
.cursor-ne-resize { cursor: ne-resize; }
.cursor-nw-resize { cursor: nw-resize; }
.cursor-se-resize { cursor: se-resize; }
.cursor-sw-resize { cursor: sw-resize; }
.cursor-ew-resize { cursor: ew-resize; }
.cursor-ns-resize { cursor: ns-resize; }
.cursor-nesw-resize { cursor: nesw-resize; }
.cursor-nwse-resize { cursor: nwse-resize; }
.cursor-zoom-in { cursor: zoom-in; }
.cursor-zoom-out { cursor: zoom-out; }
.pointer-events-auto { pointer-events: auto; }
.pointer-events-none { pointer-events: none; }
.select-none { user-select: none; }
.select-text { user-select: text; }
.select-all { user-select: all; }
.select-auto { user-select: auto; }
.resize-none { resize: none; }
.resize { resize: both; }
.resize-x { resize: horizontal; }
.resize-y { resize: vertical; }
.touch-auto { touch-action: auto; }
.touch-none { touch-action: none; }
.touch-pan-x { touch-action: pan-x; }
.touch-pan-left { touch-action: pan-left; }
.touch-pan-right { touch-action: pan-right; }
.touch-pan-y { touch-action: pan-y; }
.touch-pan-up { touch-action: pan-up; }
.touch-pan-down { touch-action: pan-down; }
.touch-pinch-zoom { touch-action: pinch-zoom; }
.touch-manipulation { touch-action: manipulation; }
.isolate { isolation: isolate; }
.isolation-auto { isolation: auto; }
.will-change-auto { will-change: auto; }
.will-change-scroll { will-change: scroll-position; }
.will-change-contents { will-change: contents; }
.will-change-transform { will-change: transform; }

`;
}

// Accessibility
function accessibilityUtilities() {
  return `/* Accessibility */
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
.not-sr-only { position: static; width: auto; height: auto; padding: 0; margin: 0; overflow: visible; clip: auto; white-space: normal; }
.focus-visible:focus { outline: 2px solid currentColor; outline-offset: 2px; }
.focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }

/* Touch target — WCAG 2.2 SC 2.5.8 minimum 24x24px hit area */
.touch-target { position: relative; }
.touch-target::before { content: ''; position: absolute; top: 50%; left: 50%; width: max(100%, 24px); height: max(100%, 24px); transform: translate(-50%, -50%); }

/* Skip link — reveals on focus for keyboard/AT users */
.skip-link { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
.skip-link:focus { position: fixed; top: 1rem; left: 1rem; z-index: 1070; width: auto; height: auto; padding: 0.75rem 1.25rem; background-color: #ffffff; color: #000000; font-weight: 700; text-decoration: underline; border: 2px solid currentColor; border-radius: 4px; clip: auto; white-space: normal; }

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

// Animations
function animationUtilities() {
  return `/* Animations — keyframes */
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}
@keyframes pulse {
  50% { opacity: 0.5; }
}
@keyframes bounce {
  0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
  50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
}

/* Animations — utilities */
.animate-none { animation: none; }
.animate-spin { animation: spin 1s linear infinite; }
.animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.animate-bounce { animation: bounce 1s infinite; }

`;
}


// Backdrop Filters
function backdropUtilities() {
  return `/* Backdrop Filters */
.backdrop-blur-none { backdrop-filter: blur(0); }
.backdrop-blur-sm { backdrop-filter: blur(4px); }
.backdrop-blur { backdrop-filter: blur(8px); }
.backdrop-blur-md { backdrop-filter: blur(12px); }
.backdrop-blur-lg { backdrop-filter: blur(16px); }
.backdrop-blur-xl { backdrop-filter: blur(24px); }
.backdrop-blur-2xl { backdrop-filter: blur(40px); }

`;
}

// Space Between
function spaceUtilities(spacing) {
  let css = `/* Space Between */\n`;
  Object.entries(spacing).forEach(([key, value]) => {
    const escaped = key.replace(/\./g, '\\.');
    css += `.space-x-${escaped} > * + * { margin-left: ${value}; }\n`;
    css += `.space-y-${escaped} > * + * { margin-top: ${value}; }\n`;
    css += `.-space-x-${escaped} > * + * { margin-left: -${value}; }\n`;
    css += `.-space-y-${escaped} > * + * { margin-top: -${value}; }\n`;
  });
  css += `.space-x-auto > * + * { margin-left: auto; }\n`;
  css += `.space-y-auto > * + * { margin-top: auto; }\n`;
  css += `\n`;
  return css;
}

// Divide
function divideUtilities(spacing, colours) {
  let css = `/* Divide */\n`;
  // Widths
  css += `.divide-x > * + * { border-left-width: 1px; border-left-style: solid; }\n`;
  css += `.divide-y > * + * { border-top-width: 1px; border-top-style: solid; }\n`;
  css += `.divide-x-0 > * + * { border-left-width: 0px; }\n`;
  css += `.divide-y-0 > * + * { border-top-width: 0px; }\n`;
  css += `.divide-x-2 > * + * { border-left-width: 2px; border-left-style: solid; }\n`;
  css += `.divide-y-2 > * + * { border-top-width: 2px; border-top-style: solid; }\n`;
  css += `.divide-x-4 > * + * { border-left-width: 4px; border-left-style: solid; }\n`;
  css += `.divide-y-4 > * + * { border-top-width: 4px; border-top-style: solid; }\n`;
  // Styles
  css += `.divide-solid > * + * { border-style: solid; }\n`;
  css += `.divide-dashed > * + * { border-style: dashed; }\n`;
  css += `.divide-dotted > * + * { border-style: dotted; }\n`;
  css += `.divide-none > * + * { border-style: none; }\n`;
  // Colours
  Object.entries(colours).forEach(([colourName, shades]) => {
    Object.entries(shades).forEach(([shade]) => {
      css += `.divide-${colourName}-${shade} > * + * { border-color: var(--color-${colourName}-${shade}); }\n`;
    });
  });
  css += `.divide-white > * + * { border-color: #ffffff; }\n`;
  css += `.divide-black > * + * { border-color: #000000; }\n`;
  css += `.divide-transparent > * + * { border-color: transparent; }\n`;
  css += `\n`;
  return css;
}

// Background Utilities
function backgroundUtilities() {
  return `/* Background */
.bg-fixed { background-attachment: fixed; }
.bg-local { background-attachment: local; }
.bg-scroll { background-attachment: scroll; }
.bg-clip-border { background-clip: border-box; }
.bg-clip-padding { background-clip: padding-box; }
.bg-clip-content { background-clip: content-box; }
.bg-clip-text { -webkit-background-clip: text; background-clip: text; }
.bg-repeat { background-repeat: repeat; }
.bg-no-repeat { background-repeat: no-repeat; }
.bg-repeat-x { background-repeat: repeat-x; }
.bg-repeat-y { background-repeat: repeat-y; }
.bg-repeat-round { background-repeat: round; }
.bg-repeat-space { background-repeat: space; }
.bg-auto { background-size: auto; }
.bg-cover { background-size: cover; }
.bg-contain { background-size: contain; }
.bg-center { background-position: center; }
.bg-top { background-position: top; }
.bg-bottom { background-position: bottom; }
.bg-left { background-position: left; }
.bg-right { background-position: right; }
.bg-left-top { background-position: left top; }
.bg-left-bottom { background-position: left bottom; }
.bg-right-top { background-position: right top; }
.bg-right-bottom { background-position: right bottom; }

`;
}

// CSS Filters
function filterUtilities() {
  return `/* Filters */
.filter-none { filter: none; }
.blur-none { filter: blur(0); }
.blur-sm { filter: blur(4px); }
.blur { filter: blur(8px); }
.blur-md { filter: blur(12px); }
.blur-lg { filter: blur(16px); }
.blur-xl { filter: blur(24px); }
.brightness-0 { filter: brightness(0); }
.brightness-50 { filter: brightness(.5); }
.brightness-75 { filter: brightness(.75); }
.brightness-90 { filter: brightness(.9); }
.brightness-100 { filter: brightness(1); }
.brightness-110 { filter: brightness(1.1); }
.brightness-125 { filter: brightness(1.25); }
.brightness-150 { filter: brightness(1.5); }
.brightness-200 { filter: brightness(2); }
.contrast-0 { filter: contrast(0); }
.contrast-50 { filter: contrast(.5); }
.contrast-75 { filter: contrast(.75); }
.contrast-100 { filter: contrast(1); }
.contrast-125 { filter: contrast(1.25); }
.contrast-150 { filter: contrast(1.5); }
.contrast-200 { filter: contrast(2); }
.grayscale-0 { filter: grayscale(0); }
.grayscale { filter: grayscale(100%); }
.invert-0 { filter: invert(0); }
.invert { filter: invert(100%); }
.sepia-0 { filter: sepia(0); }
.sepia { filter: sepia(100%); }
.saturate-0 { filter: saturate(0); }
.saturate-50 { filter: saturate(.5); }
.saturate-100 { filter: saturate(1); }
.saturate-150 { filter: saturate(1.5); }
.saturate-200 { filter: saturate(2); }
.hue-rotate-0 { filter: hue-rotate(0deg); }
.hue-rotate-15 { filter: hue-rotate(15deg); }
.hue-rotate-30 { filter: hue-rotate(30deg); }
.hue-rotate-60 { filter: hue-rotate(60deg); }
.hue-rotate-90 { filter: hue-rotate(90deg); }
.hue-rotate-180 { filter: hue-rotate(180deg); }
.-hue-rotate-30 { filter: hue-rotate(-30deg); }
.-hue-rotate-60 { filter: hue-rotate(-60deg); }
.-hue-rotate-90 { filter: hue-rotate(-90deg); }

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
  codeUtilities,
  animationUtilities,
  backdropUtilities,
  spaceUtilities,
  divideUtilities,
  backgroundUtilities,
  filterUtilities,
};
