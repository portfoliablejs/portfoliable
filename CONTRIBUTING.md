# Contributing to Portfoliable

This document defines the expected workflow for safe, reviewable, release-compatible contributions.

## Scope

Applies to all code and documentation contributions across:

- repository root maintainer wiring
- runtime and initializer package (`create-portfoliable`)
- release automation and operations documentation

## Contribution Principles

1. Keep changes focused and intentional.
2. Keep behavior deterministic.
3. Preserve release and validation guarantees.
4. Update documentation in the same pull request when behavior changes.

## Environment Setup

From repository root:

```bash
npm install
```

Verify tooling:

```bash
node -v
npm -v
git --version
```

## Branching and Pull Requests

1. Synchronize before starting with `git pull --rebase origin main`.
2. Create a feature branch from `main`.
3. Keep branch history clean and scoped to one change theme.
4. Open a pull request with a precise summary, validation evidence, and impact statement.

The release workflow writes version and changelog commits back to `main`. After a release finishes, synchronize again with `git pull --rebase origin main` before pushing follow-up work. Workflow concurrency serializes automated releases, but it cannot rebase a developer's local branch.

Recommended pull request sections:

- Problem statement
- Implementation summary
- Risk assessment
- Validation output
- Docs updated

## Commit Message Requirements

Conventional commits are required for release planning.

Examples:

- `feat(cli): add structured output for thumbnail options`
- `fix(parser): reject duplicate case ids during validation`
- `docs(release): clarify trusted publishing prerequisites`

Release level mapping:

- `feat:` -> minor
- `fix:`, `perf:`, `refactor:`, `chore:`, `docs:`, `style:`, `test:`, `build:`, `ci:` -> patch
- `type!` or `BREAKING CHANGE:` -> major

Non-conventional commit messages are treated as non-releasable by automation.

## Required Validation

Run these commands from repository root before requesting review for runtime, parser, CLI, template, or release-impacting changes:

```bash
npm run validate:content
npm run smoke:initializer
npm run smoke:packed
npm run smoke:homeview
npm run build
```

Run integration verification when local consumer setup is available:

```bash
npm run verify:integration
```

## Content and Template Constraints

- Do not commit personal or production portfolio data into this repository.
- Keep markdown content contract compatible with parser expectations.
- Preserve canonical runtime behavior in `create-portfoliable`.
- Keep wrapper forwarding behavior in root package lightweight and stable.

## Documentation Requirements

Any change to release semantics, path scope filtering, CI conditions, or publish logic must update:

- the release policy and automation sections in `README.md`
- `create-portfoliable/README.md` when package identity or distribution behavior changes
- the incident runbook in `README.md` when failure modes or procedures change

## Review Expectations

Reviewers prioritize:

- behavioral correctness
- release safety
- rollback clarity
- testability and reproducibility

Avoid bundling unrelated style-only or broad refactor changes with release-critical modifications.

## Security and Responsible Disclosure

Do not open public issues with exploit details. Use `SECURITY.md` reporting guidance for vulnerability disclosure.

## License

By contributing, you agree your contributions are provided under the repository license.
