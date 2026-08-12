# Versioning and release flow

Portfoliable has two separate delivery tracks: the npm package track and the web/docs track.

## Package versioning

The npm package follows conventional versioning:

- `major` for breaking changes
- `minor` for new backward-compatible features
- `patch` for fixes and smaller changes

This is the runtime and scaffold package release model.

## Web versioning

The website and docs can ship independently whenever:

- onboarding content changes
- docs navigation changes
- marketing copy improves
- product guidance is updated for end users

This prevents docs and runtime releases from becoming unnecessarily coupled.

## Recommended release practice

- keep package release work separate from website content work
- review docs changes in pull requests
- record meaningful user-facing changes in the changelog
- publish the web build through the dedicated web release workflow when merged

## Why this matters

Users usually care about the generated portfolio experience, not whether the package and docs site happened to ship in the same release window. Keeping these tracks independent makes the product easier to understand and easier to maintain.
