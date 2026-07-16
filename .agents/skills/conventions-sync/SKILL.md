---
name: conventions-sync
description: Refresh .sdd/conventions.md from current project state. Preserves sections marked `<!-- manual -->`. Shows diff for approval before writing. Use when the project's stack or patterns drift from documented conventions.
---

Execute the /conventions-sync command defined in .sdd/workflow.md.

Scan packages, structure, lint/format configs, ORM/router. Preserve manual sections verbatim; regenerate auto-sections. Present diff and STOP for approval before writing.
