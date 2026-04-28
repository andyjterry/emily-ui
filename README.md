# EmilyUI

A config-driven utility CSS framework. Define your brand once, generate the CSS.

**EmilyUI** is the ecosystem name. `emily-css` is the utility layer published on npm — it's both the package you install and the CLI you use to generate and purge CSS. More packages coming.

## Features

- **Works anywhere** - Generate static CSS and drop it into any project, no build pipeline required.
- **Config-driven** - Entire framework configured via `emily.config.json`
- **Utility-first** - Composable utilities for layout, spacing, typography and colour
- **Responsive ready** - All utilities work with responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
- **State variants** - `hover:`, `focus-visible:`, `active:`, `disabled:` built-in
- **Accessibility first** - WCAG 2.2 AA compliance in core utilities (focus rings, contrast, motion)
- **Purge system** - Remove unused CSS automatically for production

## Quick Start

### 1. Install

```bash
npm install emily-css
```

### 2. Create your config

```bash
npx emily-css init
```

This walks you through:

- Project name
- Brand colours (primary, secondary, success, warning, error, neutral)
- Font families
- Base spacing unit
- Source directory (used by the purge command)

It then generates `emily.config.json` and runs your first build automatically.

### 3. Link the CSS in your project

```html
<link rel="stylesheet" href="./dist/emily.css">
```

### 4. Use the utility classes

```html
<button class="px-4 py-2 rounded-md bg-primary-80 text-white hover:bg-primary-90 focus-visible:ring-2 focus-visible:ring-primary-50">
  Button
</button>
```

Colours, spacing and typography all come from your config.

### 5. Purge unused CSS for production

```bash
npx emily-css purge
```

Scans your template files, keeps only the utilities you actually use.

Output:
- `dist/emily.purged.css` - Purged CSS
- `dist/emily.purged.min.css` - Minified version

Use the purged file in production:

```html
<link rel="stylesheet" href="./dist/emily.purged.min.css">
```

## Commands

```bash
npx emily-css init     # Create emily.config.json and run first build
npx emily-css build    # Regenerate CSS after config changes
npx emily-css purge    # Remove unused utilities for production
npm test              # Run test suite (if working on EmilyUI itself)
```

## How Purge Works

EmilyUI scans your template files for class names and removes any utilities you are not using.

For example:

```html
<div class="p-4 bg-primary-80 rounded-lg">Content</div>
```

EmilyUI keeps `.p-4`, `.bg-primary-80`, `.rounded-lg` and removes everything else.

Supported file types: `.html`, `.twig`, `.njk`, `.liquid`, `.hbs`, `.jsx`, `.tsx`, `.vue`, `.php`, `.astro`, `.svelte`, `.blade.php` (configurable via `extensions` in `emily.config.json`)

**Note:** Class names must exist as plain text in your files. Dynamically constructed class names will not be detected:

```js
// This will be missed by purge:
const colour = 'primary-80'
const cls = `bg-${colour}`

// This will be detected:
const cls = 'bg-primary-80'
```

If you use dynamic classes, either keep them as plain strings or manually safelist them in your config.

## File Size

EmilyUI uses a purge-based approach (generate all utilities, then remove unused).

| | Unpurged | Purged |
|---|---|---|
| Tailwind v2 | 2.4-8MB | under 10KB |
| EmilyUI v1 | 1.1MB | 10-50KB |
| Tailwind v3/v4 (JIT) | generates on demand | - |

EmilyUI's unpurged file is roughly half the size of Tailwind v2. Post-purge sizes are comparable. JIT-style generation is planned for v2.

## File Structure

```
emily-css/
  ├── src/
  │   ├── index.js          - Main build script
  │   ├── generators.js     - Utility generation functions
  │   ├── purge.js          - Purge system
  │   ├── purge-cmd.js      - Purge CLI command
  │   └── init.js           - Interactive setup
  ├── dist/
  │   ├── emily.css         - Generated CSS
  │   ├── emily.min.css     - Minified CSS
  │   ├── emily.purged.css  - Purged CSS
  │   └── emily.purged.min.css
  ├── showcase.html         - Example components
  ├── emily.config.json     - Your config
  ├── package.json
  └── README.md
```

## Configuration

Edit `emily.config.json` to customise:

```json
{
  "name": "My Brand",
  "description": "Design system",

  "baseUnit": "8px",
  "baseFontSize": "16px",
  "fontFamily": "system-ui",

  "colours": {
    "primary": "#0077b6",
    "secondary": "#006d9e",
    "success": "#017f65",
    "warning": "#ffc107",
    "error": "#b20000",
    "neutral": "#6b7280"
  },

  "breakpoints": {
    "sm": "640px",
    "md": "768px",
    "lg": "1024px",
    "xl": "1280px",
    "2xl": "1536px"
  },

  "purge": {
    "sourceDir": "./src",
    "extensions": [".html", ".jsx", ".tsx", ".vue"]
  }
}
```

After editing, rebuild:

```bash
npx emily-css build
```

## Utilities

EmilyUI generates utilities across these categories:

- **Display** - block, inline, flex, grid, hidden
- **Spacing** - margin (`m-`), padding (`p-`), gap (`gap-`)
- **Sizing** - width (`w-`), height (`h-`), max-width, min-height
- **Positioning** - absolute, relative, fixed, sticky, top, right, bottom, left
- **Flexbox** - flex, flex-direction, justify-content, align-items, flex-wrap
- **Grid** - grid, grid-cols, grid-rows, grid-gap
- **Colours** - background (`bg-`), text, borders, accent for form controls
- **Typography** - font-size, font-weight, line-height, text-align
- **Borders** - border-width, border-style, border-colour, border-radius
- **Shadows** - box-shadow, text-shadow
- **Opacity** - opacity levels
- **Accessibility** - sr-only, focus-visible, motion-safe, forced-colors
- **State variants** - `hover:`, `focus-visible:`, `active:`, `disabled:`
- **Responsive variants** - `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

## Examples

### Button

```html
<button class="px-4 py-2 rounded-md bg-primary-80 text-white hover:bg-primary-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-50">
  Click me
</button>
```

### Responsive Card

```html
<div class="w-full md:w-96 p-4 md:p-6 rounded-lg bg-neutral-10 border-1 border-neutral-30 shadow-md">
  <h2 class="text-lg font-semibold text-neutral-90">Title</h2>
  <p class="mt-2 text-sm text-neutral-70">Content</p>
</div>
```

### Accessible Form Input

```html
<label for="email" class="block text-sm font-medium text-neutral-80">
  Email
</label>
<input
  id="email"
  type="email"
  class="mt-1 w-full px-3 py-2 border-1 border-neutral-40 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-50"
/>
```

## Accessibility

All utilities are built with WCAG 2.2 AA in mind:

- **Focus rings** - Focus-visible states include proper colour contrast
- **Colour contrast** - All colour scales meet AA contrast ratios
- **Motion** - `motion-safe` and `motion-reduce` utilities for users with vestibular disorders
- **Screen reader support** - `.sr-only` utility for screen-reader-only content
- **Forced colours** - Utilities respect Windows High Contrast mode

## Testing

```bash
npm test
```

66 automated tests covering colour generation, utilities, variants, config integrity, and build output. All passing.

## Troubleshooting

### Styles not applying?

1. Check the responsive prefix: `.md\:flex` not `.md:flex`
2. Verify class name spelling
3. Clear browser cache and rebuild: `npx emily-css build`

### File size too large?

```bash
npx emily-css purge
```

### Config not applying?

1. Edit `emily.config.json`
2. Run `npx emily-css build`
3. No cache invalidation needed

## CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/emily-css/dist/emily.css">
```

## Support

- Website: https://www.emilyui.com
- GitHub: https://github.com/andyjterry/emily-ui

## License

MIT
