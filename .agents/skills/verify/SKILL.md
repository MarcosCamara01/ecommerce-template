---
name: verify
description: Strict mechanical audit before /review. Read-only. Checks task completion, goal coverage, test suite, scope creep, pending CRs and gaps. Writes verify-report.md. Use after /spec-tasks finishes.
---

Execute the /verify command defined in .sdd/workflow.md.

Read-only mechanical audit. Check: all tasks marked complete, every goal has an artifact, every acceptance scenario has a passing test, full test suite green, no out-of-scope file changes, no unresolved /impl-gap entries, no pending CRs. Write specs/<feature>/verify-report.md. Do not modify code or specs.
