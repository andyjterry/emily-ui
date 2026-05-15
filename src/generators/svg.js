'use strict'

function svgUtilities(colours) {
  let css = `/* SVG */\n`;

  css += `.fill-current { fill: currentColor; }\n`;
  css += `.stroke-current { stroke: currentColor; }\n`;
  css += `.fill-white { fill: #FAFAFA; }\n`;
  css += `.fill-black { fill: #111110; }\n`;
  css += `.fill-transparent { fill: transparent; }\n`;
  css += `.stroke-white { stroke: #FAFAFA; }\n`;
  css += `.stroke-black { stroke: #111110; }\n`;
  css += `.stroke-transparent { stroke: transparent; }\n`;
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

module.exports = {
  svgUtilities,
};
