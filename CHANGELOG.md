# Changelog

All notable changes to `emily-css` are documented here.

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
