# Security Policy

## Scope

This policy applies to security issues affecting:

- `@portfoliable/create`
- repository release workflows and automation

## Reporting a Vulnerability

Report vulnerabilities privately to repository maintainers. Do not publish exploit details in public issues, pull requests, or discussions before coordinated remediation.

Include the following details in your report:

1. affected package, component, and version
2. environment and prerequisites
3. exact reproduction steps
4. expected behavior vs actual behavior
5. impact assessment (confidentiality, integrity, availability)
6. proof-of-concept artifacts (sanitized)
7. suggested mitigation (if known)

## Coordinated Disclosure Expectations

- reporters should allow maintainers reasonable time to investigate and patch
- maintainers will communicate status updates during triage and remediation
- public disclosure should occur only after patch availability or explicit coordination

## Triage and Response Process

Maintainers follow this process:

1. acknowledge report receipt
2. validate reproducibility and impact
3. classify severity and affected surface
4. design and test remediation
5. release fixes through standard release automation
6. publish advisory details when appropriate

Response time depends on complexity and impact, but high-impact issues are prioritized.

## Severity Guidance

Severity is assessed using exploitability, user impact, and affected scope.

- Critical: widespread compromise or remote abuse with high impact
- High: substantial impact with practical exploitation
- Medium: constrained exploitation or moderate impact
- Low: limited impact or defense-in-depth issue

## Security Hardening Principles

- use trusted publishing with provenance for npm release operations
- avoid long-lived credential exposure in CI/CD
- keep secrets out of source control and logs
- minimize privileged workflow permissions
- preserve deterministic release flows to reduce supply-chain ambiguity

## Out-of-Scope Reports

The following are usually out of scope unless concrete user-impacting risk is shown:

- style-only concerns
- theoretical attacks without reproducible exploit path
- vulnerabilities in unsupported tooling outside this repository

## Security Patch Validation

When preparing a security fix, maintainers should run:

```bash
npm run validate:content
npm run smoke:initializer
npm run smoke:packed
npm run smoke:homeview
npm run build
```

Use additional integration validation if the fix changes runtime behavior.

## Credit and Attribution

When appropriate and with reporter consent, maintainers may acknowledge reporters in advisories or release notes.
