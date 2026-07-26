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
