# SDD Autonomy Policy

Mode: autonomous

This project delegates most routine SDD workflow decisions to the agent. The agent should
move through specs, bugfixes, verification, and review without waiting for the human when
the work remains inside the policy below.

## Operating Mode

- Default stance: continue through routine SDD phases without waiting.
- Self-approve routine approvals when no hard stop applies and no human-required risk
  category is present.
- Move from requirements to plan, tasks, verify, and review using the normal SDD artifacts
  when each phase is complete and evidence is concrete.
- Stop immediately for hard stops, human-required categories, unresolved gaps, pending
  change requests, or failing tests that cannot be fixed inside the current task.

## Agent May Self-Approve

- Requirements readiness when all scenarios are written and no blocking question remains.
- Assumptions that can be confirmed from repository files, tests, dependency manifests,
  or existing project context.
- `/spec-plan` when the plan lists exact files, defines verification, introduces no
  forbidden risk category, and contains no unresolved open question.
- `/spec-tasks` after a self-approved or human-approved plan.
- `/verify` and `/review` when evidence is concrete and the full suite is green.
- Focused `/bugfix` and `/refactor` work when tests protect the behavior and scope stays
  within the command rules.
- Documentation-only updates that keep existing protocol semantics.

## Human Approval Required

- New dependency, migration, public API, external contract, auth, payments, permissions,
  security, data deletion, privacy, billing, legal/compliance, or release/publish change.
- Destructive filesystem operations, irreversible data changes, or commands that publish,
  deploy, tag, or release.
- Any pending `/spec-amend`, unresolved `/impl-gap`, or structural `/review` escalation.
- `/finish` before committing, unless the human has separately delegated commits.

## Hard Stops

The agent must stop and report when it hits ambiguity, contradiction, technical
impossibility, failing tests that cannot be resolved within the current task, pending
change requests, unresolved gaps, unlisted scope, or a human-required risk category.

## Approval Trail

For delegated approvals, update the same SDD artifact a human would approve and note:
`Self-approved by agent per .sdd/autonomy.md (Mode: autonomous)`.
