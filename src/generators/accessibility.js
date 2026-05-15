'use strict'

function accessibilityUtilities() {
  return `/* Accessibility */
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
.not-sr-only { position: static; width: auto; height: auto; padding: 0; margin: 0; overflow: visible; clip: auto; white-space: normal; }
.sr-only-focusable:not(:focus):not(:focus-within) { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
.focus-ring:focus-visible { outline: 2px solid var(--color-brand-80); outline-offset: 2px; }
.focus-ring-inset:focus-visible { outline: 2px solid var(--color-brand-80); outline-offset: -2px; }
.focus-ring-none:focus-visible { outline: none; }
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

module.exports = {
  accessibilityUtilities,
};
