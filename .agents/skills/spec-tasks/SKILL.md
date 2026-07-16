---
name: spec-tasks
description: Execute an approved technical plan as atomic tasks, one at a time. Use after spec-plan is approved. Follows TDD: write test first (red), implement until green, run full suite.
---

Execute the /spec-tasks command defined in .sdd/workflow.md.

Then read the approved specs/<feature>/2-plan.md and execute tasks one at a time. Write the test first (red), implement until green, run the full suite, then move to the next task.

If a task is blocked by ambiguity, contradiction, or technical impossibility, STOP and run /impl-gap — never improvise. If the gap requires changing the spec, escalate to /spec-amend.
