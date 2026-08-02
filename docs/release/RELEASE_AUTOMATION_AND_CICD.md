# Release Automation and CI/CD

This document describes how Portfoliable release automation is designed, executed, and diagnosed.

## Automation Objectives

- preserve deterministic release decisions
- keep publishing secure with provenance
- minimize manual intervention
- provide observable outputs for incident triage

## Core Implementation Assets

- workflow definition: `.github/workflows/release.yml`
- release planning logic: `create-portfoliable/scripts/release-orchestrator.mjs`

## Trigger Model

Release automation is expected to support:

- `push` to `main`
- `workflow_dispatch` for manual execution (including dry-run-style validation paths)

## Job Topology

### Release Job

Primary responsibilities:

1. checkout full repository history and tags
2. setup Node environment and install dependencies
3. run validation and smoke/build gates
4. execute release orchestrator
5. conditionally publish, commit, and tag based on orchestrator outputs

### Pages Deploy Job

Primary responsibilities:

1. consume prepared build artifact
2. deploy artifact to configured Pages target
3. skip deployment for dry-run or non-publish scenarios

## Orchestrator Responsibilities

The release orchestrator is responsible for:

- selecting baseline tag
- computing in-scope commit range
- classifying commit semantics
- selecting highest release impact
- emitting release metadata for downstream workflow steps

When release conditions are met and run mode allows mutation, orchestrator flow updates version/changelog and prepares release commit and tag outputs.

## Security Model

Publishing is built around trusted identity and provenance:

- workflow permission includes `id-token: write`
- npm publish command includes provenance flags
- trusted publisher mapping on npm must match owner/repository/workflow identity

Token-based fallback should be avoided unless explicitly required for exceptional recovery.

## Validation Gates

Before release-affecting changes are merged, execute:

```bash
npm run validate:content
npm run smoke:initializer
npm run smoke:packed
npm run smoke:homeview
npm run build
```

When integration environment exists, include:

```bash
npm run verify:integration
```

## Typical Failure Modes and Signals

1. no releasable commits
	- expected when no conventional releasable message/scope is detected
2. npm `E404`
	- often indicates scope, trust mapping, or package access mismatch
3. npm `ENEEDAUTH`
	- indicates authentication path drift from trusted OIDC flow
4. push/tag failure
	- often permission or branch protection mismatch
5. skipped Pages deploy
	- usually dry-run behavior or failed upstream artifact stage

## Observability and Diagnostics

Capture these artifacts for reliable incident analysis:

- workflow run URL
- job IDs and step-level failure stage
- orchestrator outputs (`released_any`, `released_package`, version/tag)
- npm error code and raw log context
- run mode (normal vs dry-run)
- actor and branch context

## Dry-Run Expectations

Dry-run execution should allow verification of release intent without mutable side effects.

Dry-run should never:

- write files
- create commits
- create tags
- publish npm artifacts
- deploy Pages

## Change Management Requirements

Any change to workflow conditionals, orchestrator semantics, or publish identity strategy requires:

1. policy update (`RELEASE_POLICY.md`)
2. automation doc update (this file)
3. incident runbook update when failure behavior changes
