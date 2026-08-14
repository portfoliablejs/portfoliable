# Portfoliable maintainer guide

This repository is for maintainers working on the Portfoliable toolchain itself.

This is not the end-user manual. End users should follow the short guide in `create-portfoliable/templates/README.md`.

To get to know Portfoliable, please visit the official [Portfoliable website](https://www.portfoliable.js.org/)

## Table of contents

- [1. Project purpose](#1-project-purpose)
- [2. Key paths](#2-key-paths)
- [3. Local workflow](#3-local-workflow)
- [4. Runtime and template source-of-truth](#4-runtime-and-template-source-of-truth)
- [5. Thumbnail catalog maintenance](#5-thumbnail-catalog-maintenance)
- [6. Valence integration](#6-valence-integration)
- [7. Protected cases and security](#7-protected-cases-and-security)
- [8. Release and governance](#8-release-and-governance)
  - [8.1 Release policy](#81-release-policy)
  - [8.2 Release automation and CI/CD](#82-release-automation-and-cicd)
  - [8.3 Incident runbook](#83-incident-runbook)
  - [8.4 Maintainer quickstart](#84-maintainer-quickstart)
- [9. SEO and sharing rules](#9-seo-and-sharing-rules)
- [10. Required validation before merge](#10-required-validation-before-merge)

## 1. Project purpose

This monorepo contains the canonical Portfoliable implementation used by:

- the initializer package: `create-portfoliable`
- the generated consumer app runtime
- the template files copied into new projects
- the docs and release automation for the product

## 2. Key paths

- `create-portfoliable/` — initializer and generated app runtime
- `create-portfoliable/bin/` — initializer entrypoints
- `create-portfoliable/cli/` — runtime CLI dispatcher
- `create-portfoliable/src/` — runtime app logic and parser
- `create-portfoliable/scripts/` — validation, scaffolding, and release helpers
- `create-portfoliable/templates/` — files copied into generated portfolios
- `web/` — marketing and docs site for end users
- `.github/workflows/` — release and deployment automation

## 3. Local workflow

Install dependencies from the repo root:

```bash
npm install
```

Common maintainer commands:

```bash
npm run validate:content
npm run build
npm run preview
npm run smoke:initializer
npm run smoke:packed
npm run smoke:homeview
npm run verify:integration
```

## 4. Runtime and template source-of-truth

The canonical package implementation lives in `create-portfoliable/`, while the generated consumer app copies files from the templated source.

Important rule:

- do not treat the generated app as the canonical runtime source
- keep template files aligned with runtime behavior when the contract changes

## 5. Thumbnail catalog maintenance

Inspect supported device tuples:

```bash
npm run portfoliable-thumbnail-options
npm run portfoliable-thumbnail-options -- --full
npm run portfoliable-thumbnail-options -- --json
```

This writes the generated selector map under:

- `create-portfoliable/templates/src/content/thumbnail-options.generated.json`

Selector structure:

- `thumbBrand -> thumbCategory -> thumbModel -> thumbColor`

Maintainer considerations:

- normalize folder names and ignore generic wrapper labels such as `device`, `open`, `closed`, `with bands`, and `without bands`
- keep naming stable for selector consistency
- verify generated tuples before using them in case metadata

## 6. Valence integration

Maintainers may need to link or switch between local Valence work and the published npm package:

```bash
npm run valence:status
npm run valence:local
npm run valence:npm
```

Use these when validating new device assets or runtime UI changes that depend on local Valence edits.

## 7. Protected cases and security

Protected cases are supported through a server-side unlock flow. Do not put raw secrets in markdown files.

Use:

- `public/api/unlock-case.php`
- `public/api/password.config.json`
- `public/api/.htaccess`
- `scripts/generate-password-hash.mjs`

Security rules:

- keep password config outside git
- deny direct access via `.htaccess`
- keep unlock responses non-cacheable

## 8. Release and governance

Release automation and governance live in the repository root workflow and package orchestration logic:

- `.github/workflows/`
- `create-portfoliable/scripts/`

For product changes, update docs and behavior changes in the same PR.

### 8.1 Release policy

This repository defines normative release behavior for the `create-portfoliable` package.

Policy goals:

- deterministic semantic version selection from commit history
- reproducible package publish and tagging behavior
- minimal manual intervention during standard release flow
- security-first publishing with provenance and trusted identity

Scope of release decisions:

- release computation currently evaluates changes in `create-portfoliable/` as the canonical releasable package scope
- changes outside that scope may still pass CI but do not contribute to version bump decisions

Commit classification rules:

- major: header contains `!` or commit body contains `BREAKING CHANGE:`
- minor: `feat:`
- patch: `fix:`, `perf:`, `refactor:`, `chore:`, `docs:`, `style:`, `test:`, `build:`, `ci:`
- non-releasable: anything else that does not match recognized conventional commit patterns

Version selection algorithm:

1. resolve the latest relevant tag baseline
2. compute the commit range from baseline to current head
3. filter commits by release scope
4. classify each commit by release impact
5. select the highest impact level in range
6. skip release when no releasable commits remain

Priority ordering is:

1. major
2. minor
3. patch

Mutation rules during release:

- when release is approved and not dry-run, automation may update version metadata, prepend changelog content, create a release commit, create and push tags, and publish the npm package
- no mutation should occur when no releasable commit is present

Dry-run rules:

- dry-run mode must not write files, create commits, create tags, publish packages, or deploy Pages artifacts
- dry-run exists for planner and workflow verification only

Publishing rules:

- npm publishing must use trusted identity and provenance
- publish command includes `--provenance`
- long-lived credential strategies are discouraged by default
- publish and tagging only proceed after validation gates succeed

Required documentation updates for policy changes:

- any change to classification, scope logic, trigger semantics, actor gates, or publish sequencing requires synchronized documentation updates in this README and related maintainer guidance

Exception handling:

- explicit rationale
- bounded lifetime
- owner assignment
- removal plan after normalization

Exceptions are temporary and must not quietly redefine baseline policy.

### 8.2 Release automation and CI/CD

This repository uses a single package-release workflow for the npm package alongside a separate web deployment pipeline.

Automation objectives:

- preserve deterministic release decisions
- keep publishing secure with provenance
- minimize manual intervention
- provide observable outputs for triage and rollback analysis

Core implementation assets:

- workflow definition: `.github/workflows/release.yml`
- release planning logic: `create-portfoliable/scripts/release-orchestrator.mjs`

Trigger model:

- `push` to `main`
- `workflow_dispatch` with optional dry-run validation

Current job topology:

- release job: checkout full repo history and tags, install dependencies, validate/build, compute release plan, publish package, push commit and tags, create GitHub release
- Pages deploy job: separate web deployment flow only for web content

Orchestrator responsibilities:

- select baseline tag
- compute in-scope commit range
- classify commit semantics
- select highest release impact
- emit release metadata for workflow steps

When release conditions are met and run mode allows mutation, the orchestrator updates version metadata and changelog, then creates a release commit and tags.

Security model:

- workflow permission includes `id-token: write`
- npm publish command includes provenance flags
- trusted publisher mapping on npm must match owner, repo, and workflow identity

Token-based fallback should be avoided unless explicitly required for exceptional recovery.

Publishing transition status:

- `create-portfoliable@1.0.3` was published during migration while org-controlled trusted publishing was being aligned.
- starting with `1.0.4`, releases are expected to be published by the `portfoliablejs` trusted publisher mapping for `release.yml`.
- keep `1.0.3` available for compatibility; do not rewrite its history unless a security incident requires that action.
- local manual `npm publish` is incident-only and must not be used for normal releases.

Validation gates before release-affecting changes are merged:

```bash
npm run validate:content
npm run smoke:initializer
npm run smoke:packed
npm run smoke:homeview
npm run build
```

When an integration environment exists:

```bash
npm run verify:integration
```

Typical failure modes and signals:

1. no releasable commits
   - expected when no conventional releasable commit/scope is detected
2. npm `E404`
   - often reflects scope, trust mapping, or package access mismatch
3. npm `ENEEDAUTH`
   - indicates authentication drift from the trusted OIDC flow
4. push/tag failure
   - often permission or branch protection mismatch
5. skipped Pages deploy
   - usually dry-run behavior or failed upstream artifact stage

Observability and diagnostics:

- workflow URL and run ID
- job IDs and failing step stage
- orchestrator outputs (`released_any`, `released_package`, version/tag)
- npm error code and raw log context
- run mode (normal vs dry-run)
- actor and branch context

### 8.3 Incident runbook

This runbook is the operational guide for release and deployment incidents.

Incident goals:

1. restore safe delivery behavior quickly
2. preserve traceability for root cause analysis
3. avoid ad hoc manual mutations that obscure release history

Fixed triage order:

1. release planner outputs
2. npm publish logs
3. commit/tag push logs
4. GitHub release creation logs
5. Pages deployment logs

Immediate triage checklist:

- capture workflow run URL
- capture branch and actor identity
- capture run mode (normal or dry-run)
- capture orchestrator outputs
- capture first failing step and full error code or message

Symptom playbooks:

#### No releasable commits

Interpretation:

- planner likely behaved correctly and skipped mutation or publish

Checks:

1. commit messages follow conventional format
2. commit types are releasable under policy
3. commits touch release scope
4. baseline tag selection is correct

Recovery:

1. add a new releasable scoped commit
2. rerun through the normal workflow

#### npm E404 during publish

Interpretation:

- publish reached npm but mapping or access was rejected

Checks:

1. npm package scope and name are exact
2. trusted publisher mapping points to the correct owner, repository, and workflow
3. package access settings match publish intent

Recovery:

1. correct npm mapping or access settings
2. trigger release with a new releasable scoped commit

#### npm ENEEDAUTH

Interpretation:

- workflow authentication path diverged from trusted OIDC flow

Checks:

1. workflow has `id-token: write` permission
2. no conflicting token-based publish overrides exist
3. publish command retains provenance mode

Recovery:

1. restore OIDC-based publish path
2. rerun release with a fresh releasable commit

#### Commit or tag push failure

Checks:

1. branch protection allows automation action
2. workflow token has required permissions
3. actor gate conditions are satisfied

Recovery:

1. adjust permissions or gates safely
2. rerun workflow

#### GitHub release missing

Checks:

1. expected tag value exists
2. release creation step received a valid payload
3. API permissions are sufficient

Recovery:

1. correct upstream output or permissions issue
2. rerun workflow

#### Pages not updated

Checks:

1. run mode is not dry-run
2. artifact upload succeeded
3. deployment job condition evaluated true

Recovery:

1. resolve artifact or condition failure
2. rerun deployment path

Data to preserve during incidents:

- workflow URL and run ID
- orchestrator release outputs
- npm error code and relevant logs
- whether mutation steps executed
- remediation action taken

Recovery guardrails:

If publish failed after partial mutation:

1. fix the publish root cause first
2. avoid rewriting release history unless explicitly approved
3. create a new releasable scoped commit
4. allow the orchestrator to compute the next deterministic release step

Post-incident actions:

1. document root cause and contributing factors
2. identify detection and prevention improvements
3. update policy, automation, or runbook docs if behavior changes
4. add validation or checks that prevent recurrence

### 8.4 Maintainer quickstart

This is the shortest safe path to implement, validate, and ship changes in Portfoliable.

Preconditions:

1. ensure your branch is based on `main`
2. confirm Node.js `>=18`
3. run dependency installation from the repository root

```bash
npm install
```

Standard change workflow:

1. implement your change in the appropriate package path
2. run mandatory local validation gates
3. commit with conventional commit semantics
4. open a pull request with validation evidence
5. monitor release workflow outputs after merge

Normal maintainers should not run local `npm publish`; use the release workflow path so publish provenance and org ownership remain consistent.

Where to implement changes:

- runtime and initializer behavior: `create-portfoliable/`
- root maintainer forwarding only: `cli/` and root script wiring
- release planning and mutation logic: `create-portfoliable/scripts/release-orchestrator.mjs`
- CI behavior: `.github/workflows/release.yml`

Mandatory validation commands:

Run from the repository root:

```bash
npm run validate:content
npm run smoke:initializer
npm run smoke:packed
npm run smoke:homeview
npm run build
```

Integration validation when the environment supports it:

```bash
npm run verify:integration
```

Conventional commit requirements:

- major: `type!` or `BREAKING CHANGE:`
- minor: `feat:`
- patch: `fix:`, `perf:`, `refactor:`, `chore:`, `docs:`, `style:`, `test:`, `build:`, `ci:`

Non-conventional commits are non-releasable.

Fast failure diagnosis:

1. release planner outputs
2. npm publish step output
3. push/tag steps
4. GitHub release creation step
5. Pages deploy step

Why release may be skipped:

- no releasable commit in the current range
- commit did not match release path scope
- workflow executed in dry-run mode

Trusted publishing verification:

Verify npm trusted publisher mapping before deep debugging:

- package: `create-portfoliable`
- owner: `portfoliablejs`
- repository: `portfoliable`
- workflow file: `release.yml`

Pull request checklist:

- clear summary of behavior change
- explicit risk statement
- command output from local validation gates
- documentation updates for policy or automation changes

Escalation path:

When release behavior is inconsistent with policy:

1. capture workflow URL and planner outputs
2. open an issue with minimal reproducible details
3. link policy and automation docs sections under dispute
4. apply a fix in a scoped PR with dry-run verification first

## 9. SEO and sharing rules

Maintainer-oriented behavior notes:

- `socialImage` is the Open Graph and social card image, not the visible thumbnail image
- `visibility.web`, `visibility.crawlers`, and `visibility.ai` are separate exposure layers
- case routes, About routes, and home metadata must remain consistent with the current content contract

## 10. Required validation before merge

For runtime, parser, template, or release-impacting work, run:

```bash
npm run validate:content
npm run smoke:initializer
npm run smoke:packed
npm run smoke:homeview
npm run build
```

And when relevant:

```bash
npm run verify:integration
```

This README is for maintainers and contributors. The generated-app user manual is intentionally shorter and product-focused.

