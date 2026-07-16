---
name: scan
description: Discovery-only pass over an existing codebase. Detects frameworks, dependencies, structure, naming patterns. Writes scan-report.md at repo root. Does NOT write .sdd/ files — use /bootstrap --scan for that.
---

Execute the /scan command defined in .sdd/workflow.md.

Read package manifests, directory structure, lint/format configs, and observable conventions. Produce scan-report.md at repo root with findings. Do not modify any .sdd/ file.
