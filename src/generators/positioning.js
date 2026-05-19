'use strict'

function escapeClassName(key) {
  return key.replace(/\./g, '\\.');
}

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
  css += `.inset-full { inset: 100%; }\n`;
  css += `.inset-x-full { left: 100%; right: 100%; }\n`;
  css += `.inset-y-full { top: 100%; bottom: 100%; }\n`;
  css += `.top-full { top: 100%; }\n`;
  css += `.right-full { right: 100%; }\n`;
  css += `.bottom-full { bottom: 100%; }\n`;
  css += `.left-full { left: 100%; }\n`;
  css += `.-inset-full { inset: -100%; }\n`;
  css += `.-inset-x-full { left: -100%; right: -100%; }\n`;
  css += `.-inset-y-full { top: -100%; bottom: -100%; }\n`;
  css += `.-top-full { top: -100%; }\n`;
  css += `.-right-full { right: -100%; }\n`;
  css += `.-bottom-full { bottom: -100%; }\n`;
  css += `.-left-full { left: -100%; }\n`;
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

module.exports = {
  positioningUtilities,
};
