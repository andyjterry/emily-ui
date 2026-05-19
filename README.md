# emilyCSS

Token-first, framework-agnostic CSS generation for teams that want predictable utilities without adopting a full app framework.

## What emilyCSS is

emilyCSS lets you define design tokens in `emily.config.json` and generate static CSS you can use anywhere: HTML, Drupal, WordPress, Power Pages, React, Vue, and other environments.

## Why teams use it

- Token-first utility generation from your own colours, spacing, typography, and motion settings
- Framework-agnostic output (`dist/emily.css` and `dist/emily.min.css`)
- Accessibility-focused utility coverage (focus rings, visually-hidden helpers, motion-aware variants)
- Tooling support with manifest and IntelliSense JSON generation
- CommonJS package with Node 18+ compatibility

## Install and basic workflow

```bash
npm install emily-css
npx emily-css init
npx emily-css build
npx emily-css watch
```

Link production CSS in your project:

```html
<link rel="stylesheet" href="./dist/emily.min.css">
```

## Core commands

```bash
npx emily-css init
npx emily-css build
npx emily-css build --profile
npx emily-css watch
npx emily-css info
npx emily-css doctor
npx emily-css migrate
npx emily-css migrate --import-colours
npx emily-css manifest
npx emily-css showcase
npx emily-css help
npx emily-css version
```

Equivalent npm scripts (when added by `emily-css init`):

```bash
npm run emily:build
npm run emily:watch
npm run emily:doctor
npm run emily:migrate
npm run emily:info
npm run emily:manifest
npm run emily:showcase
npm run emily:version
npm run emily:help
```

## Doctor and migrate

- `doctor` checks for unknown EmilyCSS classes and variants.
- `doctor` now also reports non-failing accessibility warnings (for example obvious focus-removal or same-token text/background patterns).
- `migrate` is report-only and helps plan Tailwind-to-Emily migrations without modifying files.
- For best migrate accuracy, generate the full framework/manifest first (`emily-css build --keep-full` or enable `manifest: true`).

## Manifest and IntelliSense JSON

Enable machine-readable outputs when needed:

```json
{
  "manifest": true,
  "intellisense": {
    "enabled": true,
    "output": "dist/emily.intellisense.json"
  }
}
```

Generated files:

- `dist/emily.manifest.json`
- `dist/emily.intellisense.json`

These files are intended for tooling, audits, and editor integrations. A VSCode extension is not required for generation.

## Minimal configuration example

```json
{
  "name": "My Brand",
  "fontFamily": {
    "heading": "atkinson",
    "body": "inter"
  },
  "colours": {
    "brand": "#0077B6",
    "accent": "#0EA5E9",
    "neutral": "#57534E",
    "success": "#0F766E",
    "error": "#B91C1C"
  },
  "manifest": true,
  "intellisense": true
}
```

## Notes on compatibility

- Package format: CommonJS
- Runtime support: Node 18+
- ESM-only major upgrades are intentionally avoided where they would break compatibility

## License

MIT
