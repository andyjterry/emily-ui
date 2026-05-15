'use strict'

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

module.exports = {
  formUtilities,
};
