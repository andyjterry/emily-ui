# emilyCSS

**A config-driven design system generator for developers working in constrained or legacy environments.**

Define your brand in one JSON file and generate a production-ready, accessibility-first stylesheet in seconds.

## The Mental Model

emilyCSS is built for real-world systems like **Drupal, Power Pages, WordPress, static HTML**, and other environments where modern build pipelines often don't exist.

1. **Configure** — Define your brand colours, fonts, and spacing in `emily.config.json`
2. **Generate** — Run one command to produce a clean, optimized CSS file
3. **Deploy** — Link the stylesheet and copy production-ready components from the showcase

## Quick Start

### 1. Initialize

```bash
npx emily-css init
```

This creates your `emily.config.json`, walks you through your brand settings (colours, fonts, spacing, etc.), and runs your first build.

### 2. Link the CSS

```html
<link rel="stylesheet" href="./dist/emily.min.css">
```

### 3. Start Building

Use the generated utilities and browse the showcase for ready-to-copy components.

```bash
npx emily-css build     # Rebuild after config changes
npx emily-css watch     # Watch mode for development
```

## Core Features

- **Token-Driven Colours** — One hex per colour → balanced 10-shade scale using OKLCH
- **Predictable Spacing** — Everything scales from your baseUnit
- **Accessibility First** — Focus-visible rings, motion utilities, WCAG 2.2 AA colours
- **No Build Pipeline Required** — Just a static CSS file
- **Smart Purge** — Remove unused utilities for tiny production files
- **UI Starter Kit** — Copy-paste accessible components from showcase.html

## Commands

```bash
npx emily-css init     # Setup config + first build
npx emily-css build    # Regenerate CSS
npx emily-css watch    # Development watch mode
npx emily-css purge    # Remove unused styles for production
```

## How Purge Works

emilyCSS scans your templates for used class names and removes everything else.

Supported files: `.html`, `.php`, `.twig`, `.liquid`, `.jsx`, `.vue`, `.astro`, etc. (configurable).

**Important:** Dynamically constructed classes like `bg-${colour}` are not detected. Use static strings or add them to the safelist.

## File Size (Typical)

| State | Size |
|-------|------|
| Full build | ~1.1 MB |
| After purge | 10–50 KB |

## Configuration

Edit `emily.config.json`:

```json
{
  "name": "My Brand",
  "baseUnit": "8px",
  "fontFamily": {
    "heading": "lexend",
    "body": "inter"
  },
  "colours": {
    "primary": "#2563EB",
    "neutral": "#57534E"
  },
  "purge": {
    "content": ["./**/*.{html,php,jsx,tsx,vue}"]
  }
}
```

After changes: `npx emily-css build`

## Component Showcase

After your first build, open `showcase.html` in your browser. It contains production-ready, accessible components (buttons, forms, alerts, cards, etc.) built with your brand.

## EmilyUI vs emilyCSS

- **EmilyUI** — The broader brand / ecosystem
- **emilyCSS** — The current product (the emily-css npm package + CLI)

## Example Components

### Button

```html
<button class="px-6 py-3 rounded-lg bg-primary-80 text-white hover:bg-primary-90 focus-visible:ring-2 focus-visible:ring-primary-50 font-medium">
  Submit
</button>
```

### Responsive Card

```html
<div class="w-full md:w-96 p-6 rounded-xl bg-white border border-neutral-20 shadow-sm">
  <h2 class="text-2xl font-semibold text-neutral-90">Card Title</h2>
  <p class="mt-3 text-neutral-70">Content goes here.</p>
</div>
```

## Fonts

emilyCSS applies font stacks but does not include font files. Recommended approach:

```bash
npm install @fontsource/inter @fontsource/lexend
```

Then import the weights you need.

## Support

- **Website:** https://www.emilyui.com
- **GitHub:** https://github.com/andyjterry/emily-ui

## License

MIT