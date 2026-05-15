'use strict'

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

function containerUtilities() {
  return `/* Container Queries */
.container-type-inline { container-type: inline-size; }
.container-type-size { container-type: size; }
.container-type-normal { container-type: normal; }
.container-name-none { container-name: none; }

`;
}

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
  css += `.divide-white > * + * { border-color: #FAFAFA; }\n`;
  css += `.divide-black > * + * { border-color: #111110; }\n`;
  css += `.divide-transparent > * + * { border-color: transparent; }\n`;
  css += `\n`;
  return css;
}

module.exports = {
  objectUtilities,
  tableListUtilities,
  verticalAlignUtilities,
  contentScrollUtilities,
  containerUtilities,
  spaceUtilities,
  divideUtilities,
};
