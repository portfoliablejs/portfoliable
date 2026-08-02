# Documentation Index

This directory contains maintainership and release operations documentation for Portfoliable.

## What This Documentation Covers

- release governance rules
- automated release pipeline behavior
- incident diagnosis and remediation
- maintainer onboarding and execution checklists

## Primary Audience

- maintainers operating release workflows
- contributors changing runtime, release logic, or CI/CD
- responders triaging publish, tag, or deployment incidents

## Document Map

- [Maintainer Quickstart](release/MAINTAINER_QUICKSTART.md)
	- Fast operational path for routine change validation and release-safe contribution.
- [Release Policy](release/RELEASE_POLICY.md)
	- Normative rules for version classification, scope filtering, and mutation behavior.
- [Release Automation and CI/CD](release/RELEASE_AUTOMATION_AND_CICD.md)
	- Implementation-level details of workflow/job topology and trusted publishing behavior.
- [Incident Runbook](release/INCIDENT_RUNBOOK.md)
	- Symptom-first troubleshooting and recovery procedure.

## Recommended Reading Orders

### New Maintainer Path

1. Maintainer Quickstart
2. Release Policy
3. Incident Runbook

### Release Automation Owner Path

1. Release Automation and CI/CD
2. Release Policy
3. Incident Runbook
4. Root `CONTRIBUTING.md` and `SECURITY.md`

## Update Contract

Documentation updates are required in the same pull request whenever any of the following changes:

- release trigger semantics
- commit classification rules
- scope filtering behavior
- publish or provenance strategy
- failure handling and incident procedure

Keeping docs synchronized with behavior is a repository quality gate, not an optional task.
