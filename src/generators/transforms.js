'use strict'

function escapeClassName(key) {
  return key.replace(/\./g, '\\.');
}

function transformUtilities(spacing) {
  let css = `/* Transforms */\n`;
  const composedTransform = 'translate(var(--translate-x, 0), var(--translate-y, 0)) rotate(var(--rotate, 0)) skewX(var(--skew-x, 0)) skewY(var(--skew-y, 0)) scaleX(var(--scale-x, 1)) scaleY(var(--scale-y, 1))';

  css += `.transform { transform: translateZ(0); }\n`;
  css += `.transform-gpu { transform: translate3d(0, 0, 0); }\n`;
  css += `.transform-none { transform: none; }\n`;

  // Translate
  Object.entries(spacing).forEach(([key, value]) => {
    const escaped = escapeClassName(key);
    css += `.translate-x-${escaped} { --translate-x: ${value}; transform: ${composedTransform}; }\n`;
    css += `.translate-y-${escaped} { --translate-y: ${value}; transform: ${composedTransform}; }\n`;
    css += `.-translate-x-${escaped} { --translate-x: -${value}; transform: ${composedTransform}; }\n`;
    css += `.-translate-y-${escaped} { --translate-y: -${value}; transform: ${composedTransform}; }\n`;
  });

  // Rotate
  const rotations = [0, 1, 2, 3, 6, 12, 45, 90, 180];
  rotations.forEach(deg => {
    css += `.rotate-${deg} { --rotate: ${deg}deg; transform: ${composedTransform}; }\n`;
    if (deg > 0) css += `.-rotate-${deg} { --rotate: -${deg}deg; transform: ${composedTransform}; }\n`;
  });

  // Scale
  const scales = [0, 50, 75, 90, 95, 100, 110, 125, 150];
  scales.forEach(scale => {
    css += `.scale-${scale} { --scale-x: ${scale / 100}; --scale-y: ${scale / 100}; transform: ${composedTransform}; }\n`;
  });

  // Skew
  const skews = [0, 1, 2, 3];
  skews.forEach(sk => {
    css += `.skew-x-${sk} { --skew-x: ${sk}deg; transform: ${composedTransform}; }\n`;
    css += `.skew-y-${sk} { --skew-y: ${sk}deg; transform: ${composedTransform}; }\n`;
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

module.exports = {
  transformUtilities,
};
