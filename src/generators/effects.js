'use strict'

function opacityUtilities() {
  const opacities = [0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100];
  let css = `/* Opacity */\n`;

  opacities.forEach(op => {
    css += `.opacity-${op} { opacity: ${op / 100}; }\n`;
  });

  css += `\n`;
  return css;
}

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

module.exports = {
  opacityUtilities,
  transitionUtilities,
  shadowUtilities,
  blendUtilities,
  cursorUtilities,
  filterUtilities,
  backdropUtilities,
};
