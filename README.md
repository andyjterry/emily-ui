# emily-ui

A config-driven, utility-first CSS framework for developers in constrained environments. Define brand once (colours, fonts, spacing) → generate CSS → browse and copy production-ready components.

## Features

- **Config-driven** — Entire framework configured via `emily.config.json`
- **Utility-first** — 11,844 composable utilities covering layout, spacing, typography, colours, responsive variants, state variants
- **Responsive ready** — All utilities work with responsive prefixes (sm:, md:, lg:, xl:, 2xl:)
- **State variants** — hover, focus-visible, active, disabled states built-in
- **Accessibility first** — WCAG 2.2 AA compliance in core utilities (focus rings, contrast, motion)
- **Purge system** — Remove unused CSS automatically (97% file size reduction)
- **Framework-agnostic** — Works with Drupal, static HTML, Power Pages, Vue, Next.js, anything that accepts CSS
- **No build pipeline required** — Generate CSS, use it directly in your project

## Quick Start

### 1. Install
```bash
npm install emily-ui
emily-ui init
```

The `init` command guides you through:
- Project name
- Brand colours (primary, secondary, success, warning, error, neutral)
- Font families
- Base spacing unit

### 2. Build CSS
```bash
emily-ui build
```

Output:
- `dist/emily.css` — Full CSS (1.1 MB)
- `dist/emily.min.css` — Minified (1.04 MB)

### 2b. Run Tests (Optional)
```bash
npm test
```
*(Run from inside the emily-ui project folder)*

Automated validation of colour generation, utilities, variants, config integrity, and build output (66 tests, all passing). Tests confirm the generator works correctly; manual testing of real-world usage is still recommended before deploying to production.

### 3. Use Components
Open `showcase.html` in your browser to see 8 production components (button, input, textarea, select, checkbox, radio, card, alert). Copy the HTML, paste into your project.

### 4. Reduce File Size (Recommended for Production)
```bash
emily-ui build --purge ./src
```

Scans your HTML/templates for used classes, removes unused utilities. Typical reduction: 99%+ (1.1 MB → 10–50 KB).

Output:
- `dist/emily.purged.css` — Only utilities you use
- `dist/emily.purged.min.css` — Minified version

## File Size Comparison

Emily uses a purge-based approach (generate all utilities, then remove unused). Unpurged file size: ~1.1 MB.

For context:
- **Tailwind v2** (purge-based): 2.4–8MB unpurged → <10KB purged
- **Emily v1** (purge-based): 1.1MB unpurged → 10–50KB purged
- **Tailwind v3/v4** (JIT): Generates only what you use, no purge step needed

Emily's unpurged file is roughly half the size of Tailwind v2. For production, both frameworks achieve similar post-purge sizes. JIT-style on-demand generation is planned for Emily v2.

## File Structure

```
emily-ui/
  ├── src/
  │   ├── index.js          — Main build script
  │   ├── generators.js     — Utility generation functions
  │   ├── purge.js          — CSS purge system
  │   └── init.js           — Interactive config generator
  ├── dist/
  │   ├── emily.css         — Generated CSS
  │   ├── emily.min.css     — Minified CSS
  │   ├── emily.purged.css  — Purged CSS (with --purge flag)
  │   └── emily.purged.min.css
  ├── showcase.html         — Component browser
  ├── emily.config.json     — Framework configuration
  ├── package.json
  └── README.md
```

## Configuration

Edit `emily.config.json` to customize:

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
  
  "spacing": {
    "scale": { "0": "0px", "1": "0.25rem", ... },
    "borderRadius": { "sm": "4px", "base": "8px", "lg": "16px", ... }
  },
  
  "typography": {
    "fontWeights": { "light": 300, "normal": 400, ... },
    "fontSizes": [ { "name": "sm", "value": "14px" }, ... ]
  },
  
  "shadows": { ... },
  "transitions": { ... },
  "zIndex": { ... },
  "opacity": [ ... ],
  
  "purge": {
    "extensions": [".html", ".jsx", ".tsx", ".vue", ...]
  }
}
```

After editing, rebuild:
```bash
emily-ui build
```

## Utilities

Emily generates utilities across these categories:

- **Display** — block, inline, flex, grid, hidden
- **Spacing** — margin (m-), padding (p-), gap (gap-)
- **Sizing** — width (w-), height (h-), max-width, min-height
- **Positioning** — absolute, relative, fixed, sticky, top, right, bottom, left
- **Flexbox** — flex, flex-direction, justify-content, align-items, flex-wrap
- **Grid** — grid, grid-cols, grid-rows, grid-gap
- **Colours** — background (bg-), text, borders, accent for form controls
- **Typography** — font-size, font-weight, line-height, text-align
- **Borders** — border-width, border-style, border-colour, border-radius
- **Shadows** — box-shadow, text-shadow
- **Opacity** — opacity levels
- **Accessibility** — sr-only, focus-visible, motion-safe, forced-colors
- **State variants** — hover:, focus-visible:, active:, disabled:
- **Responsive variants** — sm:, md:, lg:, xl:, 2xl:

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

- **Focus rings** — Focus-visible states include proper colour contrast
- **Colour contrast** — All colour scales meet AA contrast ratios
- **Motion** — `motion-safe` and `motion-reduce` utilities for users with vestibular disorders
- **Semantic HTML** — Components use proper heading hierarchy and form labels
- **Screen reader support** — `.sr-only` utility for screen-reader-only content
- **Forced colours** — Utilities respect Windows High Contrast mode

## Known Limitations

These are post-v1 priorities:
- Arbitrary values (`w-[123px]`) — deferred to v2
- Extend system for custom utilities — deferred to v2
- Pattern utilities (Wrapper, Flow, Stack) — deferred to v2
- Watch mode / HMR — deferred to v2
- Pre-built component tier — deferred to v2

## Troubleshooting

### Styles not applying?
1. Check that responsive prefix is correct: `.md\:flex` not `.md:flex`
2. Verify class name spelling in HTML
3. Clear browser cache and rebuild CSS

### File size too large?
Use the purge system:
```bash
emily-ui build --purge ./src
```

### Config not applying?
1. Edit `emily.config.json`
2. Run `npm run build` to regenerate CSS
3. No cache invalidation needed (CSS is regenerated from scratch)

## CDN

Use emily-ui directly without npm via jsDelivr:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/emily-ui/dist/emily.css">
```

## Support

Open an issue or start a discussion on GitHub:
https://github.com/andyjterry/emily-ui

## License

MIT
