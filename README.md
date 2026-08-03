# Portfoliable Monorepo

This repository contains the source for the Portfoliable toolchain.

## npm Package

- Package: [@portfoliable/create](https://www.npmjs.com/package/@portfoliable/create)
- Latest: [npm version](https://img.shields.io/npm/v/%40portfoliable%2Fcreate)
- Create command: `npm create @portfoliable`

## Repository Purpose

The repository is organized around one canonical npm package:

1. `@portfoliable/create`.

The repository root still provides maintainer script entrypoints, but the published product contract is the `@portfoliable/create` package.

## Audience

This document is maintainer-focused.

If you are an end user creating a portfolio project, use the dedicated manual at `create-portfoliable/README.md`.

## Architecture Overview

### Packages


- `@portfoliable/create`
	- Initializer exposed by `npm create @portfoliable`.
	- Runtime CLI used by generated consumer apps.
	- Canonical implementation for dev, build, preview, content validation, and scaffolding.

### Key Repository Paths

- `cli/` - repository-level command forwarding.
- `create-portfoliable/bin/` - initializer executable.
- `create-portfoliable/cli/` - runtime CLI command dispatcher.
- `create-portfoliable/scripts/` - validation, smoke, integration, and release helper scripts.
- `create-portfoliable/src/` - runtime app shell, parser, and case loading logic.
- `docs/release/` - release governance, automation details, and incident runbooks.

## Prerequisites

- Node.js `>=18`.
- npm available in shell.
- Git with tag and full-history support for release work.

Check local environment:

```bash
node -v
npm -v
git --version
```

## Local Setup

Install repository dependencies from the root:

```bash
npm install
```

The root `postinstall` installs dependencies in `create-portfoliable`.

## Daily Maintainer Commands

Run from repository root unless noted:

```bash
npm run validate:content
npm run build
npm run preview
```

Smoke and integration gates:

```bash
npm run smoke:initializer
npm run smoke:packed
npm run smoke:homeview
npm run verify:integration
```

## Script Forwarding Model

The repository root forwards to `create-portfoliable` via `npm --prefix ./create-portfoliable ...`.

Examples:

- `npm run build` (root) forwards to `create-portfoliable` build.
- `npm run validate:content` (root) forwards to runtime validation.
- `npm run portfoliable` (root) forwards to runtime dev command.

This allows maintainers to keep one canonical implementation while still using repository-root shortcuts during development.

## Release and Governance

- Release workflow implementation: `.github/workflows/release.yml`.
- Release planner and mutation logic: `create-portfoliable/scripts/release-orchestrator.mjs`.
- Policy source of truth: `docs/release/RELEASE_POLICY.md`.
- Incident procedure: `docs/release/INCIDENT_RUNBOOK.md`.

## Validation Expectations Before Merge

For runtime, parser, template, or release-impacting changes, run:

```bash
npm run validate:content
npm run smoke:initializer
npm run smoke:packed
npm run smoke:homeview
npm run build
```

Run integration verification when available:

```bash
npm run verify:integration
```

## Repository Constraints

- Keep this repository template-oriented and runtime/tooling-oriented.
- Do not commit personal production portfolio data.
- Keep content contract validation in the workflow for markdown case files.
- Update documentation in the same pull request as behavior changes.

## End-User Manual

End users should use `create-portfoliable/README.md` for full setup and usage instructions after running:

```bash
npm create @portfoliable
```

## Related Documents

- `CONTRIBUTING.md`
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`
- `docs/README.md`

`CHANGELOG.md` and `LICENSE` are intentionally maintained as canonical history and legal references.
