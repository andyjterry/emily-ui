# Changelog

All notable changes to `emily-css` are documented here.

---

## v1.2.2 — May 2026

### Added
- Added IntelliSense JSON generation via `intellisense` config output (`dist/emily.intellisense.json` by default).
- Added build profiling via `emily-css build --profile` with coarse timing buckets.
- Added initial accessibility warnings to `emily-css doctor` (focus removal, same token text/background, and `cursor-pointer` on non-interactive elements).
- Added documentation stubs in `docs/` for installation, configuration, variants, accessibility, doctor, migrate, manifest, and IntelliSense.

### Changed
- Stabilised manifest schema metadata with explicit `schemaVersion`, package name, and package version fields.
- Improved purge class extraction for complex variant patterns and safer junk filtering.
- Updated README to reflect current product direction and command surface.

### Notes
- EmilyCSS remains CommonJS-compatible and continues to support Node 16+.
- ESM-only dependency major upgrades remain intentionally deferred for compatibility.

---

## v1.2.1 — May 2026

### Changed
- Refactored utility generators into smaller internal modules.
- Kept `src/generators.js` as a compatibility shim so existing imports continue to work.
- Moved shared defaults into `src/constants.js`.
- Updated watch mode so configured purge ignore rules are respected consistently.
- Improved release hardening and package output checks.

### Fixed
- Kept dependency versions on CommonJS-compatible majors to support Node 16+.
- Avoided ESM-only dependency upgrades that would break the current CommonJS CLI.

### Dependency compatibility
EmilyCSS intentionally stays on CommonJS-compatible dependency majors for now:

- `chalk@4`
- `ora@5`
- `boxen@5`
- `chokidar@4`

Newer major versions are ESM-focused and may require newer Node versions. EmilyCSS currently supports Node 16+ and CommonJS.

---

## v1.2.0-alpha.0 — May 2026

### Added
- Report-only Tailwind-to-EmilyCSS migration command: `emily-css migrate`.
- Default semantic migration mode for design-token aligned suggestions.
- Imported palette mode via `emily-css migrate --import-colours` for visual parity mapping suggestions.
- Detection and reporting for arbitrary value utilities during migration analysis.

### Notes
- Migration in this alpha is analysis-only. No source files are modified by `migrate`.

---

## v1.1.1 — May 2026

### Added
- Utility manifest generation for future tooling, doctor checks, migration support, and editor integrations.

---

## v1.1.0 — May 2026

### Added
- Added `emily-css doctor`, a manifest-powered project checker that scans configured source files and reports unknown EmilyCSS classes with suggestions.
- Added variant-aware class validation for responsive, state, ARIA, data-state, motion, dark, and forced-colours variants.

---

## v1.2.1 — May 2026

**Refactor utility generators into modules**

---
## v1.2.1 — May 2026

**updated the full system to be more efficient**

### Added
- updated the full system to be more efficient

### Changed
- updated release logic

---
## v1.1.1 — May 2026

**updated changes and added**

### Added
- updted changes

---
## v1.1.0 — May 2026

**add utility manifest generation): chore: release v1.1.0**

### Added
- add utility manifest generation): chore: release v1.1.0

---
## v1.0.29 — May 2026

**added json manifest for future use**

### Added
- added json manifest for future use

---
## v1.0.28 — May 2026

**added new utilities**

### Changed
- added new utilties and tests

---
## v1.0.27 — May 2026

**colour system redesign — brand/accent tokens + semantic colours (v1.0.23)**

### Added
- colour system redesign — brand/accent tokens + semantic colours (v1.0.23)

### Changed
- updated utilties and new showcase

---
# Changelog

All notable changes to `emily-css` are documented here.

---

## v1.0.26 — May 2026

**Expand utility coverage and typography scale**

### Added
- Expand utility coverage and typography scale

---
## v1.0.26 — May 2026

**Colour utilities now variable-based; fix grey text on dark surfaces**

### Fixed
- `generateColourUtilities` now emits `var(--color-*)` references instead of hardcoded hex values for all `text-*`, `bg-*`, `border-*`, and `accent-*` utilities. Consistent with how semantic colours and ring/fill/stroke utilities already worked. Enables theme-layer overrides without specificity hacks.
- Homepage "How it works" cards: `text-neutral-80` / `text-neutral-40` on `bg-dark` produced near-invisible text in light mode (contrast ~2.3:1). Fixed to `text-neutral-10` / `text-neutral-30` — matches the pattern used by the hero and CTA banner.
- Removed erroneous backslash in `h-2\.5` HTML class strings in `index.vue` (rendered fine via Vue template compilation, but confusing and inconsistent).
- Stripped null bytes from `pages/index.vue` (6) and `package.json` (339) in `emilyui-site`.

### Changed
- `tests/test.js`: updated `accent-brand-80` assertion to expect `var(--color-brand-80)` rather than hardcoded hex, matching the new generation behaviour.

---

## v1.0.25 — May 2026

**updaed colour**

### Fixed
- change colour on code

---
## v1.0.24 — May 2026

**colour system redesign — brand/accent tokens + semantic colours (v1.0.23)**

### Added
- colour system redesign — brand/accent tokens + semantic colours (v1.0.23)

---
## v1.0.23 — May 2026

**Colour system redesign: brand/accent naming + semantic colour tokens**

### Changed
- Renamed `primary` colour token to `brand`, `secondary` to `accent` across config, utilities, and showcase
- `btn-primary` and `btn-secondary` are now explicit separate colour tokens (no longer aliases)
- Default config generated by `emily-css init` updated to reflect new naming

### Added
- `semanticColours` config key: single-value colour tokens with no shade scale
- `generateSemanticColourUtilities()`: generates `bg-dark`, `text-dark`, `border-dark`, `fill-dark` etc.
- Semantic colour utilities automatically pick up `hover:`, `focus:`, `dark:`, and responsive variants
- Default config includes `dark: "#1A1A1A"` and `light: "#FAFAFA"` as semantic colour examples

---


## v1.0.22 — May 2026

**· Improve purge extraction and package robustness tests**

---
## v1.0.21 — May 2026

**"Include bundled showcase template**

---
## v1.0.20 — May 2026

**replace folder structure template to tempalates**

### Fixed
- replace folder structure template to tempalates

---
## v1.0.19 — May 2026

**Add framework-aware output paths and bundled showcase template**

---
## v1.0.18 — May 2026

****

### Changed
- added more utitlies as a code block

---
## v1.0.17 — May 2026

**added new utilties, and added component patterns**

### Added
- added new utilties, and added component patterns

---
## v1.0.16 — May 2026

**feat: add Round 2 utility set — 156/156 tests passing**

### Added
- feat: add Round 2 utility set — 156/156 tests passing

---
## v1.0.15 — May 2026

**updated readme**

---
## v1.0.14 — May 2026

**updated readme**

### Changed
- updated readme

---
## v1.0.13 — May 2026

**added functionality to commit to github and then push to npm release**

### Added
- added functionality to commit to github and then push to npm release

---
## v1.0.12 — May 2026

****

---
## v1.0.11 — May 2026

****

---
## v1.0.10 — May 2026

**Changelog automation**

### Added
- Release script (`npm run release`) — reads git log, prompts for version bump, writes CHANGELOG.md, commits and tags automatically

---

## v1.0.9 — May 2026

**Showcase server + code block utilities**

### Added
- Showcase server — run `npm run emily:showcase` to browse components on localhost:3456
- Code block utilities (`.code-window`, `.token-*`) in generated CSS — VSCode Dark+ style syntax highlighting
- `pre`/`code` base styles added to `@layer base`

---

## v1.0.8 — May 2026

**Watch mode + build pipeline**

### Added
- Watch mode — `npx emily-css watch` rebuilds CSS automatically on config change
- Build + purge can now be chained in a single pipeline
- npm scripts wired into `package.json` during `npx emily-css init`

### Changed
- `init.js` provides a more guided setup experience with clearer prompts
- `bin/emilyui.js` updated to correctly route `watch`/`build`/`purge` subcommands

---

## v1.0.7 — April 2026

**Purge regex fix**

### Fixed
- Purge crashed when class names contained regex metacharacters (`[`, `]`, `(`, `)`, `{`, `}`, etc). Previously only `:` and `.` were escaped — now uses full metacharacter escaping

---

## v1.0.6 — April 2026

**Dist + font cleanup**

### Changed
- `dist/` and `fonts/` directories removed from git tracking

### Breaking changes
- If you were pulling `dist/emily.css` directly from GitHub, run `npx emily-css build` locally instead

---

## v1.0.5 — April 2026

**Split font system**

### Added
- Separate heading and body font config — `fontFamily.heading` and `fontFamily.body` are now independent
- Google Fonts CDN integration — fonts loaded via `@import` in generated CSS
- Font-specific tests added to test suite

### Changed
- Bundled font files removed from the npm package
- `emily.config.json` updated with split `fontFamily` structure

### Breaking changes
- If your config has `fontFamily` as a single string, update it to `{ "heading": "...", "body": "..." }`

---

## v1.0.3 — April 2026

**Package size reduction**

### Changed
- Demo CSS removed from the published npm package

---

## v1.0.2 — April 2026

**Package distribution fix**

### Added
- `.npmignore` added — controls which files are included in the published package
- `dist` files explicitly declared in `package.json` `files` array

### Fixed
- Unnecessary files (tests, src, docs) were being included in the npm tarball

---

## v1.0.1 — April 2026

**CLI rename fix**

### Fixed
- Internal references to old `emily-ui` CLI name updated to `emily-css`

### Breaking changes
- If you had scripts referencing `npx emily-ui`, update them to `npx emily-css`

---

## v1.0.0 — April 2026

**Initial release**

### Added
- 11,844 utility classes generated from `emily.config.json`
- OKLCH colour scale generation — one hex in, 10-shade scale out
- Responsive variants (`sm:` `md:` `lg:` `xl:` `2xl:`)
- State variants (`hover:` `focus-visible:` `active:` `disabled:` `dark:`)
- Purge system — strips unused classes, ~97% file size reduction
- Interactive setup wizard (`npx emily-css init`)
- 72 tests, all passing

---
