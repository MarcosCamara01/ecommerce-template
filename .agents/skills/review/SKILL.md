---
name: review
description: Lighter human-touch final pass after /verify reports green. Writes review-report.md with qualitative findings; mechanical checks live in /verify.
---

Execute the /review command defined in .sdd/workflow.md.

Read the implementation qualitatively. Surface unclear naming, leaky abstractions, copy-paste smell, and comments that lie. Write `specs/<feature>/review-report.md` with findings, follow-ups, or escalation; do not enforce mechanical checks (that is /verify's job). If a structural issue is found, record `Result: ESCALATED` and escalate to /spec-amend.
