# Incident Runbook

This runbook is the operational response guide for release and deployment incidents in Portfoliable.

## Incident Goals

1. restore safe delivery behavior quickly
2. preserve traceability for root cause analysis
3. avoid ad hoc manual mutations that obscure release history

## Fixed Triage Order

Always inspect in this order:

1. release planner outputs
2. npm publish logs
3. commit/tag push logs
4. GitHub release creation logs
5. Pages deployment logs

This sequence prevents downstream symptoms from masking root causes.

## Immediate Triage Checklist

- capture workflow run URL
- capture branch and actor identity
- capture run mode (normal or dry-run)
- capture orchestrator outputs
- capture first failing step and full error code/message

## Symptom Playbooks

### Symptom: No Releasable Commits

Interpretation:

- planner likely behaved correctly and skipped mutation/publish

Checks:

1. commit messages follow conventional format
2. commit types are releasable under policy
3. commits touch release scope
4. baseline tag selection is correct

Recovery:

1. add a new releasable scoped commit
2. rerun through normal workflow

### Symptom: npm E404 During Publish

Interpretation:

- publish reached npm but mapping/access was rejected

Checks:

1. npm package scope/name exactness
2. trusted publisher mapping points to correct owner/repo/workflow
3. package access settings match publish intent

Recovery:

1. correct npm mapping/access settings
2. trigger release with a new releasable scoped commit

### Symptom: npm ENEEDAUTH

Interpretation:

- workflow authentication path diverged from trusted OIDC flow

Checks:

1. workflow has `id-token: write` permission
2. no conflicting token-based publish overrides
3. publish command retains provenance mode

Recovery:

1. restore OIDC-based publish path
2. rerun release with fresh releasable commit

### Symptom: Commit or Tag Push Failure

Checks:

1. branch protection allows automation action
2. workflow token has required permissions
3. actor gate conditions are satisfied

Recovery:

1. adjust permissions/gates safely
2. rerun workflow

### Symptom: GitHub Release Missing

Checks:

1. expected tag value exists
2. release creation step received valid payload
3. API permissions are sufficient

Recovery:

1. correct upstream output or permissions issue
2. rerun workflow

### Symptom: Pages Not Updated

Checks:

1. run mode is not dry-run
2. artifact upload succeeded
3. deployment job condition evaluated true

Recovery:

1. resolve artifact/condition failure
2. rerun deployment path

## Data to Preserve During Incidents

For every incident ticket, record:

- workflow URL and run ID
- orchestrator release outputs
- npm error code and relevant logs
- whether mutation steps executed
- remediation action taken

## Recovery Guardrails

If publish failed after partial mutation:

1. fix the publish root cause first
2. avoid rewriting release history unless explicitly approved
3. create a new releasable scoped commit
4. allow orchestrator to compute next deterministic release step

## Post-Incident Actions

1. document root cause and contributing factors
2. identify detection and prevention improvements
3. update policy/automation/runbook documentation if behavior changes
4. add validation or checks that prevent recurrence
