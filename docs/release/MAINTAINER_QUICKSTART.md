# Maintainer Quickstart

This guide is the shortest safe path to implement, validate, and ship changes in Portfoliable.

## Preconditions

Before starting:

1. ensure your branch is based on `main`
2. confirm Node.js `>=18`
3. run dependency installation from repository root

```bash
npm install
```

## Standard Change Workflow

1. implement your change in the appropriate package path
2. run mandatory local validation gates
3. commit with conventional commit semantics
4. open pull request with validation evidence
5. monitor release workflow outputs after merge

## Where to Implement Changes

- runtime and initializer behavior: `create-portfoliable/`
- root compatibility forwarding only: `cli/` and root script wiring
- release planning and mutation logic: `create-portfoliable/scripts/release-orchestrator.mjs`
- CI behavior: `.github/workflows/release.yml`

## Mandatory Validation Commands

Run from repository root:

```bash
npm run validate:content
npm run smoke:initializer
npm run smoke:packed
npm run smoke:homeview
npm run build
```

Integration validation (when environment supports it):

```bash
npm run verify:integration
```

## Conventional Commit Requirements

Release automation classifies version bump from commit messages.

- major: `type!` or `BREAKING CHANGE:`
- minor: `feat:`
- patch: `fix:`, `perf:`, `refactor:`, `chore:`, `docs:`, `style:`, `test:`, `build:`, `ci:`

Non-conventional commits are non-releasable.

## Fast Failure Diagnosis

Use this order to reduce noise:

1. release planner outputs
2. npm publish step output
3. push/tag steps
4. GitHub release creation step
5. Pages deploy step

## Why Release May Be Skipped

Most common causes:

- no releasable commit in the current range
- commit did not match release path scope
- workflow executed with dry-run semantics

## Trusted Publishing Verification

Verify npm trusted publisher mapping before deep debugging:

- package: `@portfoliablejs/create-portfoliable`
- owner: `portfoliablejs`
- repository: `portfoliable`
- workflow file: `release.yml`

## Pull Request Checklist

- clear summary of behavior change
- explicit risk statement
- command output from local validation gates
- documentation updates for policy/automation changes

## Escalation Path

When release behavior is inconsistent with policy:

1. capture workflow URL and planner outputs
2. open issue with minimal reproducible details
3. link policy and automation docs sections under dispute
4. apply fix in a scoped PR with dry-run verification first
