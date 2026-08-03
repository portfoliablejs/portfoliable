## [0.5.5](https://github.com/portfoliablejs/portfoliable/compare/v0.5.3...v0.5.5) (2026-08-03)

### Bug Fixes

* chore: finalize @portfoliable/create package contract and release metadata ([1f68628](https://github.com/portfoliablejs/portfoliable/commit/1f686282b7de2e91a74ab0a60241be21ae9b6a37))

## [0.5.3](https://github.com/portfoliablejs/portfoliable/compare/v0.5.2...v0.5.3) (2026-08-02)

### Bug Fixes

* fix(release): use root changelog path in orchestrator ([c437465](https://github.com/portfoliablejs/portfoliable/commit/c437465e0b486a8c003f2dce85d0a4b439c5f74c))
* docs: overhaul markdown and code comments across repo ([bf6c6e4](https://github.com/portfoliablejs/portfoliable/commit/bf6c6e4b91aee257b5f95f94deec3f469f48260c))

# Changelog

This changelog tracks runtime package and initializer changes for `@portfoliable/create`.

## Format

- Reverse chronological order.
- Entries grouped by Added, Changed, Fixed, Security.
- Version numbers map to npm published artifacts.

## [Unreleased]

### Added

- Expanded end-user manual for initializer and runtime CLI usage.
- Comprehensive troubleshooting and validation guidance.

### Changed

- Standardized documentation language around content contract and thumbnail catalog.
- Clarified separation between end-user consumer workflow and maintainer workflow.

### Fixed

- Initializer now derives generated `@portfoliable/create` dependency from package metadata instead of a stale hardcoded semver.
- Smoke coverage now verifies no-override scaffolding dependency version to prevent future release drift regressions.

### Security

- Reinforced trusted publishing assumptions and secure disclosure references.

## Historical Notes

Earlier entries remain valid as release artifacts evolve. Future release notes should include exact migration impact when contract or parser behavior changes.


