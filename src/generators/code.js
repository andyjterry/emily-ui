'use strict'

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

module.exports = {
  codeUtilities,
};
