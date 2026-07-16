---
name: impl-gap
description: Formal stop-and-report channel when /spec-tasks hits an ambiguity, contradiction, or technical impossibility. Append a GAP entry to specs/<feature>/impl-gaps.md and wait for direction. Never improvise a fix.
---

Execute the /impl-gap command defined in .sdd/workflow.md.

Usage: /impl-gap <feature>

STOP execution. Create specs/<feature>/impl-gaps.md from the template if missing, then append a GAP entry with current task, problem, impact, proposed resolution, action required, and resolution placeholder. Wait for human direction. If the gap requires changing the spec, escalate to /spec-amend.
