## [1.2.1](https://github.com/portfoliablejs/portfoliable/compare/v1.2.0...v1.2.1) (2026-08-14)

### Bug Fixes

* fix: restore npm readme and maintainer identity ([1c31530](https://github.com/portfoliablejs/portfoliable/commit/1c315307f57d879c8b74710e1841a0cd6ede0519))

## [1.2.0](https://github.com/portfoliablejs/portfoliable/compare/v1.1.0...v1.2.0) (2026-08-14)

### Features

* feat(create): migrate create command and trusted release workflow ([d4361db](https://github.com/portfoliablejs/portfoliable/commit/d4361db8fcb85b8983238997fbb7840079c5a5da))

## [1.1.0](https://github.com/portfoliablejs/portfoliable/compare/v1.0.3...v1.1.0) (2026-08-12)

### Features

* feat(create): make npm create portfoliable canonical ([408aea3](https://github.com/portfoliablejs/portfoliable/commit/408aea3a33c8ba3aa8d3afdcf3398bc7b88b2780))

## [1.0.3](https://github.com/portfoliablejs/portfoliable/compare/v1.0.2...v1.0.3) (2026-08-12)

> Transition note: `1.0.3` was published during the move to org-controlled trusted publishing. `1.0.4+` is the expected baseline for releases published via the `portfoliablejs` trusted workflow.

### Bug Fixes

* chore(create): rename package to create-portfoliable and trim web trigger ([575322d](https://github.com/portfoliablejs/portfoliable/commit/575322d85c3fcc0ce02dfcdedcfd88652f3f7751))

## [1.0.2](https://github.com/portfoliablejs/portfoliable/compare/v1.0.1...v1.0.2) (2026-08-12)

### Bug Fixes

* chore(release): migrate create and consumers to @portfoliablejs scope ([859c21c](https://github.com/portfoliablejs/portfoliable/commit/859c21c53230f0d0e328d31a11882bcb1e57e483))

## [1.0.1](https://github.com/portfoliablejs/portfoliable/compare/v1.0.0-alpha...v1.0.1) (2026-08-12)

### Bug Fixes

* test(smoke): align starter-case markers with template-case ([91f2c46](https://github.com/portfoliablejs/portfoliable/commit/91f2c46743db14b9849b290f54eb8ead5102b766))
* chore(deps): align valence to @portfoliablejs/valence@^1.0.1 ([752a699](https://github.com/portfoliablejs/portfoliable/commit/752a69967a76ca2a2133c9ef1dcd3d163500be1a))
* chore: migrate valence dependency to @portfoliable scope ([3f4949d](https://github.com/portfoliablejs/portfoliable/commit/3f4949df3786afc912b3fb1ef5ffab388664c30d))
* fix: remove valence styles subpath import causing build export error ([4049987](https://github.com/portfoliablejs/portfoliable/commit/40499876c1fc5f3c5dc011f4e3a963c74c49d988))

## [0.7.0](https://github.com/portfoliablejs/portfoliable/compare/v0.6.0...v0.7.0) (2026-08-03)

### Features

* feat(case-view): stabilize toc and navigator interactions ([8dac465](https://github.com/portfoliablejs/portfoliable/commit/8dac4659f183d42a0c86c5d6fd500962ce6522ce))

## [0.6.0](https://github.com/portfoliablejs/portfoliable/compare/v0.5.5...v0.6.0) (2026-08-03)

### Bug Fixes

* fix(create): derive runtime dependency from package version ([ababb56](https://github.com/portfoliablejs/portfoliable/commit/ababb564a25386e926b8f7bf4669fa13c30bfa7e))

## [0.5.5](https://github.com/portfoliablejs/portfoliable/compare/v0.5.3...v0.5.5) (2026-08-03)

### Bug Fixes

* chore: finalize @portfoliablejs/create-portfoliable package contract and release metadata ([1f68628](https://github.com/portfoliablejs/portfoliable/commit/1f686282b7de2e91a74ab0a60241be21ae9b6a37))

## [0.5.3](https://github.com/portfoliablejs/portfoliable/compare/v0.5.2...v0.5.3) (2026-08-02)

### Bug Fixes

* fix(release): use root changelog path in orchestrator ([c437465](https://github.com/portfoliablejs/portfoliable/commit/c437465e0b486a8c003f2dce85d0a4b439c5f74c))
* docs: overhaul markdown and code comments across repo ([bf6c6e4](https://github.com/portfoliablejs/portfoliable/commit/bf6c6e4b91aee257b5f95f94deec3f469f48260c))

# Changelog

This changelog tracks runtime package and initializer changes for `create-portfoliable`.

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
- Locked release policy to organization-controlled trusted publishing for `1.0.4+` while keeping `1.0.3` available for compatibility.

### Fixed

- Initializer now derives generated `create-portfoliable` dependency from package metadata instead of a stale hardcoded semver.
- Smoke coverage now verifies no-override scaffolding dependency version to prevent future release drift regressions.

### Security

- Reinforced trusted publishing assumptions and secure disclosure references.

## Historical Notes

Earlier entries remain valid as release artifacts evolve. Future release notes should include exact migration impact when contract or parser behavior changes.









