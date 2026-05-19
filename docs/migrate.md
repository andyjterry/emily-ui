# Migrate

## Purpose
`emily-css migrate` is a report-only scanner for planning Tailwind-to-Emily migrations.
It does not modify source files.

## Basic workflow

1. Build EmilyCSS first so migrate can use full utility metadata:

```bash
npx emily-css build --keep-full
```

2. Run migrate:

```bash
npx emily-css migrate
npx emily-css migrate --import-colours
```

## What the report includes

- Supported classes (already available in EmilyCSS)
- Known Tailwind mappings and suggested replacements
- Unsupported utilities
- Arbitrary-value utilities (reported separately for manual review)

## Notes

- `--import-colours` helps when you want palette-faithful migration suggestions.
- Utility-family detection includes prefixes such as `transition-*`, `overscroll-*`, `box-*`, `color-scheme-*`, `field-sizing-*`, and `scrollbar-*`.
