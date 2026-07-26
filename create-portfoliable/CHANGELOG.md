## [0.1.9](https://github.com/portfoliablejs/portfoliable/compare/create-portfoliable-v0.1.7...create-portfoliable-v0.1.9) (2026-07-26)

### Bug Fixes

* fix(release): trusted-publisher auth and signed release artifacts ([e029ec8](https://github.com/portfoliablejs/portfoliable/commit/e029ec86c48b2fd90da48b04b543096ba675cf13))
* chore(release): @portfoliablejs/portfoliable@2.4.8, create-portfoliable@0.1.8 [skip ci] ([c7b20ef](https://github.com/portfoliablejs/portfoliable/commit/c7b20efbc0044292ec234fe75a70c7d01b116049))
* chore(release): replace semantic-release with native auto-versioning ([160fa84](https://github.com/portfoliablejs/portfoliable/commit/160fa84661de3d2ad8c0afcd76ac3610588896af))
* fix(release): set explicit angular preset for create-portfoliable ([4540f76](https://github.com/portfoliablejs/portfoliable/commit/4540f761bb8ae8b8b8edadf4fbab9b47d65e350e))
* fix: add changelog plugin to create-portfoliable release config ([798b16a](https://github.com/portfoliablejs/portfoliable/commit/798b16a3e9238dd26e67819d22f8407d648db9c2))
* chore: add semantic-release ([2aa7be5](https://github.com/portfoliablejs/portfoliable/commit/2aa7be5b3160d569f91769842616c34badc78cb6))

## [0.1.8](https://github.com/portfoliablejs/portfoliable/compare/create-portfoliable-v0.1.7...create-portfoliable-v0.1.8) (2026-07-26)

### Bug Fixes

* chore(release): replace semantic-release with native auto-versioning ([160fa84](https://github.com/portfoliablejs/portfoliable/commit/160fa84661de3d2ad8c0afcd76ac3610588896af))
* fix(release): set explicit angular preset for create-portfoliable ([4540f76](https://github.com/portfoliablejs/portfoliable/commit/4540f761bb8ae8b8b8edadf4fbab9b47d65e350e))
* fix: add changelog plugin to create-portfoliable release config ([798b16a](https://github.com/portfoliablejs/portfoliable/commit/798b16a3e9238dd26e67819d22f8407d648db9c2))
* chore: add semantic-release ([2aa7be5](https://github.com/portfoliablejs/portfoliable/commit/2aa7be5b3160d569f91769842616c34badc78cb6))

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


