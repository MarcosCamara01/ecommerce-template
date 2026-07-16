---
name: spec-amend
description: Documented change-request mechanism for post-approval changes to a spec. Append a CR entry to specs/<feature>/amendments.md and stop for human approval before propagating any change. Use when an /impl-gap escalates or the user requests a spec change.
---

Execute the /spec-amend command defined in .sdd/workflow.md.

Usage: /spec-amend <feature> <change-summary>

A spec change after approval requires a Change Request. Create specs/<feature>/amendments.md from the template if missing, then append a CR entry with motive, requirement changes, plan changes, affected tasks, and status "Pending approval". Stop for explicit approval before propagating any change.
