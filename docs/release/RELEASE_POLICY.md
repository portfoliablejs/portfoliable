# Release Policy

This document defines normative release behavior for Portfoliable.

## Policy Goals

- deterministic semantic version selection from commit history
- reproducible package publish and tagging behavior
- minimal manual intervention during standard release flow
- security-first publishing with provenance and trusted identity

## Scope of Release Decisions

Release computation currently evaluates changes in `create-portfoliable` as the canonical releasable package scope.

Changes outside release scope may pass CI and merge normally but do not contribute to version bump decisions.

## Commit Classification Rules

### Major

Release level is major when either condition is true:

- commit header contains `!`
- commit body contains `BREAKING CHANGE:`

### Minor

Release level is minor for:

- `feat:` commit type

### Patch

Release level is patch for:

- `fix:`
- `perf:`
- `refactor:`
- `chore:`
- `docs:`
- `style:`
- `test:`
- `build:`
- `ci:`

### Non-Releasable

Commits are non-releasable when they do not match recognized conventional commit patterns.

## Version Selection Algorithm

Release planner behavior:

1. resolve latest relevant tag baseline
2. compute commit range from baseline to current head
3. filter commits by release scope
4. classify each commit by release impact
5. select highest impact level in range
6. skip release when no releasable commits remain

Priority ordering is:

1. major
2. minor
3. patch

## Mutation Rules During Release

When release is approved and run is not dry-run, automation may:

- update package version metadata
- prepend changelog entry content
- create release commit
- create and push release tag(s)
- publish package artifact

No mutation should occur when no releasable commit is present.

## Dry-Run Rules

When dry-run mode is enabled, all mutation steps must be disabled.

Dry-run must not:

- write files
- create commits
- create tags
- publish to npm
- deploy Pages artifacts

Dry-run exists for planner and workflow behavior verification only.

## Publishing Rules

- npm publishing must use trusted identity and provenance
- package publish command includes `--provenance`
- long-lived credential strategies are discouraged by default
- publish and tagging only proceed after successful validation gates

## Required Documentation Updates for Policy Changes

Any change to classification, scope logic, trigger semantics, actor gates, or publish sequencing requires synchronized updates to:

1. `docs/release/RELEASE_POLICY.md`
2. `docs/release/RELEASE_AUTOMATION_AND_CICD.md`
3. `docs/release/INCIDENT_RUNBOOK.md` if diagnostics/recovery steps change

## Exception Handling

Operational exceptions may be used for external service outages or emergency remediation.

Exception requirements:

- explicit rationale
- bounded lifetime
- owner assignment
- removal plan after normalization

Exceptions are temporary and must not silently redefine baseline policy.
