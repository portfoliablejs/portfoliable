# Contributing to create-portfoliable

Thank you for contributing.

## Scope

- Canonical runtime and initializer code lives in this folder.
- Root-level scripts are compatibility wrappers only.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Validate runtime:

```bash
npm run validate:content
npm run smoke:initializer
npm run smoke:packed
npm run build
```

## Commit conventions

Use Conventional Commit style.

- feat: new functionality
- fix: bug fix
- docs: documentation changes
- refactor: internal refactoring
- chore: maintenance changes
- ci: workflow and pipeline updates

## Pull request checklist

- Runtime checks pass.
- Changelog updates are included when needed.
- README and docs are updated for user-facing behavior changes.
- No unrelated formatting or file churn.

## Release notes

Runtime releases are generated from this package and tagged on the v0.x line.
