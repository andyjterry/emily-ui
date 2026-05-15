'use strict'

function ringUtilities(colours) {
  let css = `/* Rings & Outlines */\n`;

  css += `.ring-0 { --ring-offset-width: 0px; --ring-offset-color: #fff; --ring-color: currentColor; box-shadow: 0 0 0 var(--ring-offset-width, 0px) var(--ring-offset-color, #fff), 0 0 0 var(--ring-offset-width, 0px) transparent; }\n`;
  css += `.ring-1 { --ring-offset-width: 0px; --ring-offset-color: #fff; --ring-color: currentColor; box-shadow: 0 0 0 var(--ring-offset-width, 0px) var(--ring-offset-color, #fff), 0 0 0 calc(1px + var(--ring-offset-width, 0px)) var(--ring-color, currentColor); }\n`;
  css += `.ring-2 { --ring-offset-width: 0px; --ring-offset-color: #fff; --ring-color: currentColor; box-shadow: 0 0 0 var(--ring-offset-width, 0px) var(--ring-offset-color, #fff), 0 0 0 calc(2px + var(--ring-offset-width, 0px)) var(--ring-color, currentColor); }\n`;

  css += `.ring-offset-0 { --ring-offset-width: 0px; }\n`;
  css += `.ring-offset-2 { --ring-offset-width: 2px; }\n`;
  css += `.ring-offset-4 { --ring-offset-width: 4px; }\n`;
  css += `.ring-offset-white { --ring-offset-color: #fff; }\n`;
  css += `.ring-offset-black { --ring-offset-color: #000; }\n`;

  // Ring colours
  Object.entries(colours).forEach(([colourName, shades]) => {
    Object.entries(shades).forEach(([shade]) => {
      css += `.ring-${colourName}-${shade} { --ring-color: var(--color-${colourName}-${shade}); }\n`;
      css += `.ring-offset-${colourName}-${shade} { --ring-offset-color: var(--color-${colourName}-${shade}); }\n`;
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

module.exports = {
  ringUtilities,
};
