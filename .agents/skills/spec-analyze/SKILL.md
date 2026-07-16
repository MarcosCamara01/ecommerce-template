---
name: spec-analyze
description: Cross-consistency analysis between requirements, plan, and tasks for a single spec. Checks goal-to-task coverage, plan-to-task coverage, scope creep. Writes analysis.md. Use before /verify when you suspect drift.
---

Execute the /spec-analyze command defined in .sdd/workflow.md.

Check: every G-ID referenced by at least one task; every "Components Affected" entry referenced by at least one task; any task lacking a goal reference (scope creep). Write specs/<feature>/analysis.md.
