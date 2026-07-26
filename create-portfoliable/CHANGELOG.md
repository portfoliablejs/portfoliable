## [0.1.8](https://github.com/portfoliablejs/portfoliable/compare/create-portfoliable-v0.1.7...create-portfoliable-v0.1.8) (2026-07-26)

### Bug Fixes

* chore(release): replace semantic-release with native auto-versioning ([14edb78](https://github.com/portfoliablejs/portfoliable/commit/14edb78ebaf5c9533085619af864f12d0ae86e00))
* fix(release): set explicit angular preset for create-portfoliable ([cde3eb3](https://github.com/portfoliablejs/portfoliable/commit/cde3eb37093be3f5daa86834cee763485094f207))
* fix: add changelog plugin to create-portfoliable release config ([8c4ec88](https://github.com/portfoliablejs/portfoliable/commit/8c4ec885694c3523f80399917417bf08713567f4))
* chore: add semantic-release ([2dec090](https://github.com/portfoliablejs/portfoliable/commit/2dec090bad598b710f14825b8d13f8f227ecc03b))

# Changelog

All notable changes to this initializer are documented in this file.

## [0.1.7] - 2026-07-24

### Changed
- Starter gallery mockups now vary across Thumbnail component device categories (mobile, tablet, desktop, wearable) using bundled local frame assets.

### Fixed
- Removed regression where all starter cases were forced to a single iPhone 12 frame.
- Ensured starter frame assets map directly to real Thumbnail component mockup files, avoiding legacy placeholder device combinations.

## [0.1.6] - 2026-07-24

### Added
- Automatic preview launch after `npm create portfoliable@latest` finishes installing dependencies.
- A clearer starter command list in the initializer output.
- A new generated case scaffold command: `npm run portfoliable-scaffold-case`.
- Multiple markdown case files and valence-backed device frame fallbacks in generated starter projects.

### Fixed
- Generated projects now ship local `src/assets/devices/**` frame files so thumbnails render without relying on deep `@portfoliablejs/valence/src/...` imports.
- Markdown case loading now uses markdown files as the single source of truth, with loader-level frame defaults for the 4 starter cases.
- Starter docs now call out the correct initializer command (`npm create ...`, not `npm run create ...`).

### Changed
- Generated starter projects now include a markdown-first content folder under `src/content/cases/`.
- Starter docs now point users to the case markdown files and command list.

## [0.1.5] - 2026-07-24

### Added
- Initial public initializer package release.

