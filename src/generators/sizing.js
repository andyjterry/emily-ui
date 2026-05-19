'use strict'

function escapeClassName(key) {
  return key.replace(/\./g, '\\.');
}

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
  css += `.max-h-none { max-height: none; }\n`;
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

module.exports = {
  sizingUtilities,
};
